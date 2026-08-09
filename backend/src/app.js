const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Nginx / reverse proxy sets X-Forwarded-For — required for correct rate limiting
app.set('trust proxy', 1);

// Middleware — allow Cloudinary product images for Meta/IG crawlers & shop embeds
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.cloudinary.com',
          'https://prince-esquire.co.ke',
        ],
        "media-src": ["'self'", 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
      },
    },
    // Meta crawlers fetch OG images cross-origin; same-origin CORP can break previews.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate Limiting (higher ceiling so admin multi-request loads do not 429)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.API_RATE_LIMIT_MAX || 800),
    standardHeaders: true,
    legacyHeaders: false,
    // Behind trusted proxy only
    validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CUSTOMER ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes')); // Note: Reference has /api/coupons/validate
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/analytics', require('./routes/analyticsTrackRoutes'));
app.use('/api/admin/visitors', require('./routes/adminVisitorRoutes'));
app.use('/api/seo', require('./routes/seoRoutes'));
app.use('/api/feeds', require('./routes/feedRoutes'));
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
app.use('/api/admin/customers', require('./routes/customerRoutes'));
app.use('/api/admin/dashboard', require('./routes/analyticsRoutes'));
app.use('/api/admin/blog', require('./routes/adminBlogRoutes'));
app.use('/api/admin/upload', require('./routes/adminUploadRoutes'));
app.use('/api/admin/subscribers', require('./controllers/newsletterController').adminGetSubscribers);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Prince Esquare API' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;
