import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Inject JWT from persisted Zustand store on every request
API.interceptors.request.use((config) => {
  try {
    const authStorage = JSON.parse(localStorage.getItem('prince-esquire-auth'));
    const token = authStorage?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // eslint-disable-next-line no-unused-vars
  } catch (_) { /* empty */ }
  return config;
});

// ── AUTH ──────────────────────────────────────────────────────────────
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
  get: () => API.get('/catalogue'),
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

// ── ADMIN – DASHBOARD / ANALYTICS ────────────────────────────────────
export const adminAnalyticsAPI = {
  getStats: () => API.get('/admin/dashboard/stats'),
  getSalesChart: (params) => API.get('/admin/dashboard/sales-chart', { params }),
  getTopProducts: () => API.get('/admin/dashboard/top-products'),
  getLowStock: () => API.get('/admin/dashboard/low-stock'),
  getOrderReport: () => API.get('/admin/reports/orders'),
};

// ── ADMIN – ORDERS ────────────────────────────────────────────────────
export const adminOrderAPI = {
  getAll: (params) => API.get('/admin/orders', { params }),
  getOne: (id) => API.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => API.patch(`/admin/orders/${id}/status`, { status }),
  updatePayment: (id, status) => API.patch(`/admin/orders/${id}/payment`, { status }),
  refund: (id) => API.post(`/admin/orders/${id}/refund`),
};

// ── ADMIN – PRODUCTS ──────────────────────────────────────────────────
export const adminProductAPI = {
  getAll: (params) => API.get('/admin/products', { params }),
  create: (data) => API.post('/admin/products', data),
  update: (id, data) => API.put(`/admin/products/${id}`, data),
  remove: (id) => API.delete(`/admin/products/${id}`),
};

// ── ADMIN – CATEGORIES (public GET, admin mutate) ─────────────────────
export const adminCategoryAPI = {
  getAll: () => API.get('/categories'),               // public endpoint
  create: (data) => API.post('/admin/categories', data),
  update: (id, data) => API.put(`/admin/categories/${id}`, data),
  remove: (id) => API.delete(`/admin/categories/${id}`),
};

// ── ADMIN – BRANDS (public GET, admin mutate) ─────────────────────────
export const adminBrandAPI = {
  getAll: () => API.get('/brands'),                   // public endpoint
  create: (data) => API.post('/admin/brands', data),
  update: (id, data) => API.put(`/admin/brands/${id}`, data),
  remove: (id) => API.delete(`/admin/brands/${id}`),
};

// ── ADMIN – CUSTOMERS & STAFF ─────────────────────────────────────────
export const adminCustomerAPI = {
  getAll: (params) => API.get('/admin/customers/all', { params }),
  getCustomers: () => API.get('/admin/customers/all', { params: { role: 'customer' } }),
  getAdmins: () => API.get('/admin/customers/all', { params: { role: 'admin' } }),
  getStaff: () => API.get('/admin/customers/all', { params: { role: 'staff' } }),
  getOne: (id) => API.get(`/admin/customers/${id}`),
  updateStatus: (id, status) => API.patch(`/admin/customers/${id}/status`, { is_active: status }),
  createStaff: (data) => API.post('/admin/customers/staff', data),
  deleteStaff: (id) => API.delete(`/admin/customers/staff/${id}`),
};

// ── FRONTEND – BANNERS ───────────────────────────────────────────────────
export const bannerAPI = {
  getAll: () => API.get('/banners'),
  getHomepageData: () => API.get('/homepage'),
};

// ── ADMIN – COUPONS ───────────────────────────────────────────────────
export const adminCouponAPI = {
  getAll: () => API.get('/admin/coupons'),
  create: (data) => API.post('/admin/coupons', data),
  update: (id, data) => API.put(`/admin/coupons/${id}`, data),
  remove: (id) => API.delete(`/admin/coupons/${id}`),
};

// ── ADMIN – BANNERS ───────────────────────────────────────────────────
export const adminBannerAPI = {
  getAll: () => API.get('/admin/banners'),
  create: (data) => API.post('/admin/banners', data),
  update: (id, data) => API.put(`/admin/banners/${id}`, data),
  remove: (id) => API.delete(`/admin/banners/${id}`),
};

// ── ADMIN – NEWSLETTER ────────────────────────────────────────────────
export const adminNewsletterAPI = {
  getSubscribers: () => API.get('/newsletter/admin/subscribers'),
};

// ── ADMIN – REVIEWS ───────────────────────────────────────────────────
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
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ── ADMIN – INVENTORY ─────────────────────────────────────────────────
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

export default API;
