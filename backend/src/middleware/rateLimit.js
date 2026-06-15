const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { formatResponse } = require('../utils/responseFormatter');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;

const clientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return ipKeyGenerator(req.ip || 'unknown');
};

const shouldSkipRateLimit = (req) => process.env.RATE_LIMIT_DISABLED === 'true';

const handler = (req, res) => {
  formatResponse(res, 429, false, 'Too many requests. Please try again later.', {
    retryAfter: res.getHeader('Retry-After'),
    requestId: req.id,
  });
};

const createLimiter = (max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    message,
    keyGenerator: clientIp,
    skip: shouldSkipRateLimit,
    validate: { trustProxy: false },
  });

const globalLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  'Global rate limit exceeded'
);

const authLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: clientIp,
  skip: (req) => process.env.RATE_LIMIT_DISABLED === 'true',
  validate: { trustProxy: false },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => process.env.RATE_LIMIT_DISABLED === 'true',
  validate: { trustProxy: false },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX, 10) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => process.env.RATE_LIMIT_DISABLED === 'true',
  validate: { trustProxy: false },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_SEARCH_MAX, 10) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => process.env.RATE_LIMIT_DISABLED === 'true',
  validate: { trustProxy: false },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STRICT_MAX, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => process.env.RATE_LIMIT_DISABLED === 'true',
  validate: { trustProxy: false },
});

module.exports = {
  globalLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  searchLimiter,
  strictLimiter,
};
