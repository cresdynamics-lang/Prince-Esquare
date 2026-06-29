const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const pinoHttp = require('pino-http');
const path = require('path');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const {
  globalLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  searchLimiter,
  strictLimiter,
} = require('./middleware/rateLimit');
const db = require('./config/db');

const app = express();

if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

app.use(
  helmet({
    // Frontend (5173) loads images from API/uploads (8000) — same-origin blocks <img> tags.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '2mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    const { getMediaStorageStatus } = require('./lib/mediaStorage');
    const media = getMediaStorageStatus();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mediaStorage: media.provider,
      productionReady: media.productionReady,
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: err.message,
    });
  }
});

app.use('/api', globalLimiter);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/pos/login', authLimiter);
app.use('/api/admin/auth/login', authLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/admin/upload', uploadLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/pos/sale', strictLimiter);
app.use('/api/inventory/import-excel', uploadLimiter);

app.use(
  '/uploads',
  (req, res, next) => {
    const origin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// --- CUSTOMER ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/catalogue', require('./routes/catalogueRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
app.get('/api/homepage', require('./controllers/bannerController').getHomepageData);

// --- ADMIN ROUTES ---
app.use('/api/admin/auth', require('./routes/adminAuthRoutes'));
app.use('/api/admin/products', require('./routes/adminProductRoutes'));
app.use('/api/admin/variants', require('./routes/variantRoutes'));
app.use('/api/admin/categories', require('./routes/adminCategoryRoutes'));
app.use('/api/admin/brands', require('./routes/adminBrandRoutes'));
app.use('/api/admin/orders', require('./routes/adminOrderRoutes'));
app.use('/api/admin/reviews', require('./routes/adminReviewRoutes'));
app.use('/api/admin/coupons', require('./routes/adminCouponRoutes'));
app.use('/api/admin/banners', require('./routes/adminBannerRoutes'));
app.use('/api/admin/blog', require('./routes/adminBlogRoutes'));
app.use('/api/admin/upload', require('./routes/adminUploadRoutes'));
app.use('/api/admin/customers', require('./routes/customerRoutes'));
app.use('/api/admin/dashboard', require('./routes/analyticsRoutes'));
app.use('/api/admin/settings', require('./routes/settingsRoutes'));
app.use('/api/admin/subscribers', require('./controllers/newsletterController').adminGetSubscribers);
app.use('/api/admin/inventory', require('./routes/adminInventoryRoutes'));

// --- POS & INVENTORY ROUTES ---
app.use('/api/auth/pos', require('./routes/auth.pos.routes'));
app.use('/api/pos', require('./routes/pos.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/shifts', require('./routes/shifts.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/sellers', require('./routes/sellers.routes'));
app.use('/api/settings', require('./routes/posSettings.routes'));
app.use('/api/pos-admin', require('./routes/posOverview.routes'));

app.use('/api/health', require('./routes/healthRoutes'));

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to Prince Esquare API', version: '1.0.0' });
});

app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  req.log?.error({ err, requestId: req.id, path: req.path }, err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
