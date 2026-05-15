import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Inject JWT from persisted Zustand store on every request
API.interceptors.request.use((config) => {
  try {
    const authStorage = JSON.parse(localStorage.getItem('prince-esquire-auth'));
    const token = authStorage?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ── AUTH ──────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data) => API.post('/auth/register', data),
  login:     (data) => API.post('/auth/login', data),
  getProfile:()     => API.get('/profile'),
};

export const productAPI = {
  list: (params) => API.get('/products', { params }),
  featured: () => API.get('/products/featured'),
  getBySlug: (slug) => API.get(`/products/${encodeURIComponent(slug)}`),
  related: (productId) => API.get(`/products/${productId}/related`),
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
  getOne: (id) => API.get(`/orders/${id}`),
};

export const paymentAPI = {
  stkPush: (body) => API.post('/payments/stk-push', body),
};

export const adminAuthAPI = {
  login:  (data) => API.post('/admin/auth/login', data),
  logout: ()     => API.post('/admin/auth/logout'),
};

// ── ADMIN – DASHBOARD / ANALYTICS ────────────────────────────────────
export const adminAnalyticsAPI = {
  getStats:      () => API.get('/admin/dashboard/stats'),
  getSalesChart: () => API.get('/admin/dashboard/sales-chart'),
  getTopProducts:() => API.get('/admin/dashboard/top-products'),
  getLowStock:   () => API.get('/admin/dashboard/low-stock'),
  getOrderReport:() => API.get('/admin/reports/orders'),
};

// ── ADMIN – ORDERS ────────────────────────────────────────────────────
export const adminOrderAPI = {
  getAll:         (params) => API.get('/admin/orders', { params }),
  getOne:         (id)     => API.get(`/admin/orders/${id}`),
  updateStatus:   (id, status)  => API.patch(`/admin/orders/${id}/status`, { status }),
  updatePayment:  (id, status)  => API.patch(`/admin/orders/${id}/payment`, { status }),
  refund:         (id)     => API.post(`/admin/orders/${id}/refund`),
};

// ── ADMIN – PRODUCTS ──────────────────────────────────────────────────
export const adminProductAPI = {
  getAll:   (params) => API.get('/admin/products', { params }),
  create:   (data)   => API.post('/admin/products', data),
  update:   (id, data) => API.put(`/admin/products/${id}`, data),
  remove:   (id)     => API.delete(`/admin/products/${id}`),
};

// ── ADMIN – CATEGORIES (public GET, admin mutate) ─────────────────────
export const adminCategoryAPI = {
  getAll:  ()          => API.get('/categories'),               // public endpoint
  create:  (data)      => API.post('/admin/categories', data),
  update:  (id, data)  => API.put(`/admin/categories/${id}`, data),
  remove:  (id)        => API.delete(`/admin/categories/${id}`),
};

// ── ADMIN – BRANDS (public GET, admin mutate) ─────────────────────────
export const adminBrandAPI = {
  getAll:  ()          => API.get('/brands'),                   // public endpoint
  create:  (data)      => API.post('/admin/brands', data),
  update:  (id, data)  => API.put(`/admin/brands/${id}`, data),
  remove:  (id)        => API.delete(`/admin/brands/${id}`),
};

// ── ADMIN – CUSTOMERS ────────────────────────────────────────────────
export const adminCustomerAPI = {
  getAll:        (params) => API.get('/admin/customers/all', { params }),
  getOne:        (id)     => API.get(`/admin/customers/${id}`),
  updateStatus:  (id, status) => API.patch(`/admin/customers/${id}/status`, { is_active: status }),
};


// ── ADMIN – COUPONS ───────────────────────────────────────────────────
export const adminCouponAPI = {
  getAll:  ()          => API.get('/admin/coupons'),
  create:  (data)      => API.post('/admin/coupons', data),
  update:  (id, data)  => API.put(`/admin/coupons/${id}`, data),
  remove:  (id)        => API.delete(`/admin/coupons/${id}`),
};

// ── ADMIN – BANNERS ───────────────────────────────────────────────────
export const adminBannerAPI = {
  getAll:  ()          => API.get('/admin/banners'),
  create:  (data)      => API.post('/admin/banners', data),
  update:  (id, data)  => API.put(`/admin/banners/${id}`, data),
  remove:  (id)        => API.delete(`/admin/banners/${id}`),
};

// ── ADMIN – NEWSLETTER ────────────────────────────────────────────────
export const adminNewsletterAPI = {
  getSubscribers: () => API.get('/newsletter/admin/subscribers'),
};

// ── ADMIN – REVIEWS ───────────────────────────────────────────────────
export const adminReviewAPI = {
  getAll:   ()   => API.get('/admin/reviews'),
  approve:  (id) => API.patch(`/admin/reviews/${id}/approve`),
  remove:   (id) => API.delete(`/admin/reviews/${id}`),
};

export const adminPaymentAPI = {
  getAll: () => API.get('/payments/admin/all'),
};

export const adminSettingsAPI = {
  get:    ()     => API.get('/admin/settings'),
  update: (data) => API.put('/admin/settings', data),
};

// ─────────────────────────────────────────────────────────────────────
// ⚠️  MISSING / NOT YET IMPLEMENTED ON BACKEND:
//   - GET /api/admin/payments  → No admin-wide payments list endpoint.
//     The only payment route is user-specific: GET /api/payments/history
//   - Admin Users (Staff) CRUD → No /api/admin/users endpoint at all.
//   - Store Settings            → No /api/admin/settings endpoint.
// ─────────────────────────────────────────────────────────────────────

export default API;
