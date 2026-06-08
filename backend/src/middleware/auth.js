// MODIFIED — Unified auth: ecommerce users + POS sellers (Option A)
const { formatResponse } = require('../utils/responseFormatter');
const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');
const posDb = require('../lib/posDb');
const { isAdminRole, isSellerRole } = require('../utils/posHelpers');

const loadUserFromToken = async (decoded) => {
  if (decoded.accountType === 'pos') {
    const profile = await posDb.findProfileById(decoded.id);
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.full_name,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
      accountType: 'pos',
    };
  }

  const result = await db.query(
    'SELECT id, name, email, role, permissions FROM users WHERE id = $1',
    [decoded.id]
  );
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  return {
    ...user,
    fullName: user.name,
    accountType: decoded.accountType || 'user',
  };
};

/** Attach user when Bearer token present; continue as guest otherwise */
exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await loadUserFromToken(decoded);
    if (user) req.user = user;
  } catch {
    /* guest */
  }
  next();
};

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return formatResponse(res, 401, false, 'Not authorized to access this route');
  }
  try {
    const decoded = verifyToken(token);
    const user = await loadUserFromToken(decoded);
    if (!user) {
      return formatResponse(res, 401, false, 'User no longer exists');
    }
    req.user = user;
    next();
  } catch {
    return formatResponse(res, 401, false, 'Not authorized, token failed');
  }
};

exports.adminOnly = (req, res, next) => {
  if (isAdminRole(req.user)) return next();
  return formatResponse(res, 403, false, 'Access denied. Admin and Staff only.');
};

exports.requireAdmin = [
  exports.protect,
  (req, res, next) => {
    if (isAdminRole(req.user)) return next();
    return formatResponse(res, 403, false, 'Admin only');
  },
];

exports.requireSeller = [
  exports.protect,
  async (req, res, next) => {
    if (!isSellerRole(req.user)) {
      return formatResponse(res, 403, false, 'Sellers only');
    }
    if (!req.user.is_active) {
      return formatResponse(res, 403, false, 'Account deactivated');
    }
    next();
  },
];

/** Active POS sellers or admin/staff */
exports.requireSellerOrAdmin = [
  exports.protect,
  async (req, res, next) => {
    if (isAdminRole(req.user)) return next();
    if (isSellerRole(req.user)) {
      if (!req.user.is_active) {
        return formatResponse(res, 403, false, 'Account deactivated');
      }
      return next();
    }
    return formatResponse(res, 403, false, 'Access denied');
  },
];

/** POS catalog: active sellers or admin/staff (for terminal preview) */
exports.requirePosCatalog = [
  exports.protect,
  async (req, res, next) => {
    if (isAdminRole(req.user)) return next();
    if (isSellerRole(req.user)) {
      if (!req.user.is_active) {
        return formatResponse(res, 403, false, 'Account deactivated');
      }
      return next();
    }
    return formatResponse(res, 403, false, 'POS catalog access required');
  },
];

exports.internalKey = (req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (!process.env.INTERNAL_KEY || key !== process.env.INTERNAL_KEY) {
    return formatResponse(res, 403, false, 'Invalid internal key');
  }
  next();
};
