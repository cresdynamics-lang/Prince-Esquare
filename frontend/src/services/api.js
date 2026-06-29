import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000,
});

const requestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `fe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const CUSTOMER_ONLY_PREFIXES = ['/cart', '/orders', '/checkout', '/profile', '/wishlist'];

const isCustomerApiRoute = (url = '') =>
  CUSTOMER_ONLY_PREFIXES.some((prefix) => url.startsWith(prefix));

API.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = config.headers['X-Request-Id'] || requestId();
  const { token, isSeller, user } = useAuthStore.getState();
  const isStaffToken = isSeller || user?.accountType === 'pos';
  const skipStaffToken = isStaffToken && isCustomerApiRoute(config.url || '');

  if (token && !skipStaffToken) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    try {
      const raw =
        sessionStorage.getItem('prince-esquire-auth') ||
        localStorage.getItem('prince-esquire-auth');
      const authStorage = raw ? JSON.parse(raw) : null;
      const stored = authStorage?.state?.token;
      if (stored) config.headers.Authorization = `Bearer ${stored}`;
      // eslint-disable-next-line no-unused-vars
    } catch (_) { /* empty */ }
  }
  if (import.meta.env.DEV && import.meta.env.VITE_LOG_API_REQUESTS === 'true') {
    // eslint-disable-next-line no-console
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    // 401 = session expired; 403 = role mismatch (e.g. seller hitting admin-only API) Ã¢â‚¬â€ don't kick sellers out
    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hadToken = Boolean(useAuthStore.getState().token);
      // Only redirect when an existing session expired Ã¢â‚¬â€ not during login attempts
      if (path.startsWith('/admin') && path !== '/admin/login' && hadToken) {
        useAuthStore.getState().logout();
        window.location.href = '/admin/login';
      }
    }
    if (status === 429 && typeof window !== 'undefined') {
      const backendMsg = error.response?.data?.message;
      const retryAfter = error.response?.headers?.['retry-after'];
      const msg =
        backendMsg ||
        (retryAfter
          ? `Too many requests. Try again in ${retryAfter} seconds.`
          : 'Too many requests. Please wait a moment and try again.');
      error.rateLimited = true;
      error.userMessage = msg;
    }
    return Promise.reject(error);
  }
);

// Ã¢â€â‚¬Ã¢â€â‚¬ AUTH Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/profile'),
  updateProfile: (data) => API.put('/profile', data),
  updatePassword: (data) => API.patch('/profile/password', data),
  getAddresses: () => API.get('/profile/addresses'),
};

export const productAPI = {
  list: (params) => API.get('/products', { params }),
  featured: () => API.get('/products/featured'),
  getBySlug: (slug) => API.get(`/products/${encodeURIComponent(slug)}`),
  related: (productId) => API.get(`/products/${productId}/related`),
};

export const catalogueAPI = {
  get: (params) => API.get('/catalogue', { params }),
  ads: () => API.get('/catalogue/ads'),
};

export const cartAPI = {
  get: () => API.get('/cart'),
  addItem: (body) => API.post('/cart/items', body),
  updateItem: (itemId, body) => API.patch(`/cart/items/${itemId}`, body),
  removeItem: (itemId) => API.delete(`/cart/items/${itemId}`),
  clear: () => API.delete('/cart/clear'),
};

export const orderAPI = {
  create: (body) => API.post('/orders', body),
  createGuest: (body) => API.post('/orders/guest', body),
  getCheckout: (id, email) => API.get(`/orders/checkout/${id}`, { params: email ? { email } : {} }),
  getMyOrders: () => API.get('/orders/my-orders'),
  getOne: (id) => API.get(`/orders/${id}`),
};

export const paymentAPI = {
  stkPush: (body) => API.post('/payments/stk-push', body),
};

export const adminAuthAPI = {
  login: (data) => API.post('/admin/auth/login', data),
  logout: () => API.post('/admin/auth/logout'),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ DASHBOARD / ANALYTICS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminAnalyticsAPI = {
  getStats: () => API.get('/admin/dashboard/stats'),
  getSalesChart: (params) => API.get('/admin/dashboard/sales-chart', { params }),
  getTopProducts: () => API.get('/admin/dashboard/top-products'),
  getLowStock: () => API.get('/admin/dashboard/low-stock'),
  getOrderReport: () => API.get('/admin/reports/orders'),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ ORDERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminOrderAPI = {
  getAll: (params) => API.get('/admin/orders', { params }),
  getOne: (id) => API.get(`/admin/orders/${id}`),
  exportCsv: () => API.get('/admin/orders/export', { responseType: 'blob' }),
  updateStatus: (id, status) => API.patch(`/admin/orders/${id}/status`, { status }),
  updatePayment: (id, payment_status) => API.patch(`/admin/orders/${id}/payment`, { payment_status }),
  cancel: (id) => API.patch(`/admin/orders/${id}/cancel`),
  refund: (id) => API.post(`/admin/orders/${id}/refund`),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ PRODUCTS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminProductAPI = {
  getAll: (params) => API.get('/admin/products', { params }),
  create: (data) => API.post('/admin/products', data),
  update: (id, data) => API.put(`/admin/products/${id}`, data),
  patchFlags: (id, data) => API.patch(`/admin/products/${id}/flags`, data),
  bulkAction: (data) => API.post('/admin/products/bulk', data),
  remove: (id) => API.delete(`/admin/products/${id}`),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ CATEGORIES (public GET, admin mutate) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminCategoryAPI = {
  getAll: () => API.get('/categories'),               // public endpoint
  create: (data) => API.post('/admin/categories', data),
  update: (id, data) => API.put(`/admin/categories/${id}`, data),
  remove: (id) => API.delete(`/admin/categories/${id}`),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ BRANDS (public GET, admin mutate) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminBrandAPI = {
  getAll: () => API.get('/brands'),                   // public endpoint
  create: (data) => API.post('/admin/brands', data),
  update: (id, data) => API.put(`/admin/brands/${id}`, data),
  remove: (id) => API.delete(`/admin/brands/${id}`),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ CUSTOMERS & STAFF Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminCustomerAPI = {
  getAll: (params) => API.get('/admin/customers/all', { params }),
  getCustomers: () => API.get('/admin/customers/all', { params: { role: 'customer' } }),
  getAdmins: () => API.get('/admin/customers/all', { params: { role: 'admin' } }),
  getStaff: () => API.get('/admin/customers/all', { params: { role: 'staff' } }),
  getOne: (id) => API.get(`/admin/customers/${id}`),
  updateStatus: (id, status) => API.patch(`/admin/customers/${id}/status`, { is_active: status }),
  createStaff: (data) => API.post('/admin/customers/staff', data),
  updateStaff: (id, data) => API.patch(`/admin/customers/staff/${id}`, data),
  updateStaffPermissions: (id, permissions) =>
    API.patch(`/admin/customers/staff/${id}/permissions`, { permissions }),
  deleteStaff: (id) => API.delete(`/admin/customers/staff/${id}`),
  createAdmin: (data) => API.post('/admin/customers/admin', data),
  updateAdmin: (id, data) => API.patch(`/admin/customers/admin/${id}`, data),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ FRONTEND Ã¢â‚¬â€œ BANNERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const bannerAPI = {
  getAll: () => API.get('/banners'),
  getHomepageData: () => API.get('/homepage'),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ COUPONS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminCouponAPI = {
  getAll: () => API.get('/admin/coupons'),
  create: (data) => API.post('/admin/coupons', data),
  update: (id, data) => API.put(`/admin/coupons/${id}`, data),
  remove: (id) => API.delete(`/admin/coupons/${id}`),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ BANNERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminBannerAPI = {
  getAll: () => API.get('/admin/banners'),
  create: (data) => API.post('/admin/banners', data),
  update: (id, data) => API.put(`/admin/banners/${id}`, data),
  remove: (id) => API.delete(`/admin/banners/${id}`),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ NEWSLETTER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminNewsletterAPI = {
  getSubscribers: () => API.get('/newsletter/admin/subscribers'),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ REVIEWS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminReviewAPI = {
  getAll: () => API.get('/admin/reviews'),
  approve: (id) => API.patch(`/admin/reviews/${id}/approve`),
  remove: (id) => API.delete(`/admin/reviews/${id}`),
};

export const adminSettingsAPI = {
  get: () => API.get('/admin/settings'),
  update: (data) => API.put('/admin/settings', data),
};

export const adminUploadAPI = {
  upload: (formData) => API.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ ADMIN Ã¢â‚¬â€œ INVENTORY Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const adminInventoryAPI = {
  // Shops
  getShops: () => API.get('/admin/inventory/shops'),
  createShop: (data) => API.post('/admin/inventory/shops', data),
  updateShop: (id, data) => API.put(`/admin/inventory/shops/${id}`, data),
  deleteShop: (id) => API.delete(`/admin/inventory/shops/${id}`),

  // Stock movements
  setOpeningStock: (data) => API.post('/admin/inventory/opening-stock', data),
  recordSales: (data) => API.post('/admin/inventory/sales', data),
  recordStockIn: (data) => API.post('/admin/inventory/stock-in', data),
  recordStockOut: (data) => API.post('/admin/inventory/stock-out', data),
  transfer: (data) => API.post('/admin/inventory/transfer', data),

  // Reports
  getSummary: (params) => API.get('/admin/inventory/summary', { params }),
  getMovements: (params) => API.get('/admin/inventory/movements', { params }),
  getCurrentStock: (params) => API.get('/admin/inventory/current-stock', { params }),
  getTransfers: () => API.get('/admin/inventory/transfers'),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ POS AUTH Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const posAuthAPI = {
  login: (data) => API.post('/auth/pos/login', data),
};

// Ã¢â€â‚¬Ã¢â€â‚¬ POS TERMINAL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const posAPI = {
  searchProducts: (params = {}) => {
    const p = typeof params === 'string' ? { search: params } : params;
    return API.get('/pos/products', { params: p });
  },
  createSale: (body) => API.post('/pos/sale', body),
  listSales: (params) => API.get('/pos/sales', { params }),
  voidSale: (id, body) => API.patch(`/pos/sales/${id}/void`, body),
  clockIn: () => API.post('/shifts/clock-in'),
  clockOut: () => API.post('/shifts/clock-out'),
  getCurrentShift: () => API.get('/shifts/my/current'),
  getShiftSummary: () => API.get('/shifts/my/summary'),
};

export const inventoryAPI = {
  stockIn: (body) => API.post('/inventory/stock-in', body),
  stockOut: (body) => API.post('/inventory/stock-out', body),
  bulkStockIn: (body) => API.post('/inventory/stock-in/bulk', body),
  bulkStockOut: (body) => API.post('/inventory/stock-out/bulk', body),
  receiveAtStore: (body) => API.post('/inventory/store-receive', body),
  closeDay: () => API.post('/inventory/close-day'),
  dailySheet: (date) => API.get('/inventory/daily-sheet', { params: { date } }),
  movements: (params) => API.get('/inventory/movements', { params }),
  stockLevels: (params) => API.get('/inventory/stock-levels', { params }),
  categoryPieces: (params) => API.get('/inventory/category-pieces', { params }),
  categorySummary: () => API.get('/inventory/category-summary'),
  stockTake: (body) => API.post('/inventory/stock-take', body),
  storeStockTake: (body) => API.post('/inventory/store-stock-take', body),
  exportStockTake: (params) =>
    API.get('/inventory/export-stock-take', { params, responseType: 'blob' }),
  exportMasterStock: (params) =>
    API.get('/inventory/export-master-stock', { params, responseType: 'blob' }),
  importStockTake: (file, { location = 'shop' } = {}) => {
    const form = new FormData();
    form.append('file', file);
    form.append('location', location);
    return API.post('/inventory/import-stock-take', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importMasterStock: (file, { date } = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (date) form.append('date', date);
    return API.post('/inventory/import-master-stock', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadStockTakeTemplate: (location = 'both') =>
    API.get('/inventory/template', {
      params: { type: 'stock-take', ...(location === 'both' ? {} : { location }) },
      responseType: 'blob',
    }),
  downloadMasterStockTemplate: () =>
    API.get('/inventory/template', { params: { type: 'master' }, responseType: 'blob' }),
  updateThreshold: (id, body) => API.patch(`/inventory/products/${id}/threshold`, body),
  publishToWebsite: (id, body) => API.post(`/inventory/products/${id}/publish`, body),
  unpublishFromWebsite: (id) => API.post(`/inventory/products/${id}/unpublish`),
  createItem: (body) => API.post('/inventory/products', body),
  getProductDetail: (id) => API.get(`/inventory/products/${id}`),
  saveProductDetails: (id, body) => API.put(`/inventory/products/${id}/details`, body),
  syncFromWebsite: (id) => API.post(`/inventory/products/${id}/sync-website`),
  seedDemo: () => API.post('/inventory/seed-demo'),
  syncAlignment: () => API.post('/inventory/sync-alignment'),
  ensureWebsiteLinks: () => API.post('/inventory/ensure-website-links'),
  downloadCatalogTemplate: () =>
    API.get('/inventory/template', { params: { type: 'catalog' }, responseType: 'blob' }),
  exportProductCatalog: (category) =>
    API.get('/inventory/export-catalog', { params: category ? { category } : {}, responseType: 'blob' }),
  importExcel: (file, { date, mode = 'full' } = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (date) form.append('date', date);
    if (mode) form.append('mode', mode);
    return API.post('/inventory/import-excel', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportStock: (date) =>
    API.get('/inventory/export-stock', { params: { date }, responseType: 'blob' }),
  exportVariantStock: (category) =>
    API.get('/inventory/export-variant-stock', { params: category ? { category } : {}, responseType: 'blob' }),
  importVariantStock: (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('/inventory/import-variant-stock', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  variantStockSummary: (params) => API.get('/inventory/variant-stock-summary', { params }),
  downloadVariantTemplate: () =>
    API.get('/inventory/template', { params: { type: 'variants' }, responseType: 'blob' }),
  downloadTemplate: () => API.get('/inventory/template', { responseType: 'blob' }),
};

export const shiftsAPI = {
  list: (params) => API.get('/shifts', { params }),
  getOne: (id) => API.get(`/shifts/${id}`),
};

export const sellersAPI = {
  list: () => API.get('/sellers'),
  create: (body) => API.post('/sellers', body),
  toggle: (id) => API.patch(`/sellers/${id}/toggle`),
  sales: (id, params) => API.get(`/sellers/${id}/sales`, { params }),
};

export const reportsAPI = {
  dailySales: (params) => API.get('/reports/daily-sales', { params, responseType: 'blob' }),
  stockReport: (params) => API.get('/reports/stock-report', { params, responseType: 'blob' }),
  stockMovements: (params) => API.get('/reports/stock-movements', { params, responseType: 'blob' }),
  shiftReport: (params) => API.get('/reports/shift-report', { params, responseType: 'blob' }),
  lowStock: (params) => API.get('/reports/low-stock', { params, responseType: 'blob' }),
  endOfDay: (params) => API.get('/reports/end-of-day', { params, responseType: 'blob' }),
};

/** Download Excel report with auth token */
export const downloadReport = async (fetcher, filename, params = {}) => {
  const res = await fetcher(params);
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const posSettingsAPI = {
  get: () => API.get('/settings'),
  getTerminal: () => API.get('/settings/terminal'),
  update: (body) => API.patch('/settings', body),
};

export const posAdminAPI = {
  getOverview: (config) => API.get('/pos-admin/overview', config),
  forceCloseShift: (shiftId) => API.post(`/shifts/${shiftId}/force-close`),
  auditLog: (params) => API.get('/pos-admin/audit-log', { params }),
};

export const onlineSaleAPI = {
  record: (body) =>
    API.post('/pos/online-sale', body, {
      headers: { 'x-internal-key': import.meta.env.VITE_INTERNAL_KEY },
    }),
};

export default API;
