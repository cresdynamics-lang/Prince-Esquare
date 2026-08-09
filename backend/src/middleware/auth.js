// MODIFIED — Unified auth: ecommerce users + POS sellers (Option A)
const { formatResponse } = require('../utils/responseFormatter');
const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');
const posDb = require('../lib/posDb');
const { isAdminRole, isSellerRole } = require('../utils/posHelpers');
const { canViewInventory, canManageInventory, canUsePosTerminal } = require('../utils/permissions');
const { resolvePosActorId } = require('../services/staffPosBridge');

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
    'SELECT id, name, email, phone, avatar, role, permissions, is_active, default_shipping_address, created_at FROM users WHERE id = $1',
    [decoded.id]
  );
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  let permissions = user.permissions;
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions);
    } catch {
      permissions = [];
    }
  }
  return {
    ...user,
    permissions,
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
    if (!canUsePosTerminal(req.user)) {
      return formatResponse(res, 403, false, 'POS terminal access required');
    }
    if (req.user.accountType === 'pos' && !req.user.is_active) {
      return formatResponse(res, 403, false, 'Account deactivated');
    }
    if (req.user.accountType === 'user' && req.user.is_active === false) {
      return formatResponse(res, 403, false, 'Account deactivated');
    }
    try {
      const actorId = await resolvePosActorId(req.user);
      if (!actorId) {
        return formatResponse(res, 403, false, 'POS profile not available');
      }
      req.posActorId = actorId;
      next();
    } catch (e) {
      next(e);
    }
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

/** POS catalog: staff with POS permission or legacy sellers */
exports.requirePosCatalog = [
  exports.protect,
  async (req, res, next) => {
    if (isAdminRole(req.user)) return next();
    if (canUsePosTerminal(req.user)) {
      if (req.user.accountType === 'pos' && !req.user.is_active) {
        return formatResponse(res, 403, false, 'Account deactivated');
      }
      return next();
    }
    return formatResponse(res, 403, false, 'POS catalog access required');
  },
];

exports.requireInventoryView = [
  exports.protect,
  (req, res, next) => {
    if (canViewInventory(req.user)) return next();
    return formatResponse(res, 403, false, 'Inventory view access required');
  },
];

exports.requireInventoryManage = [
  exports.protect,
  async (req, res, next) => {
    if (!canManageInventory(req.user)) {
      return formatResponse(res, 403, false, 'Inventory management requires admin permission');
    }
    try {
      req.posActorId = await resolvePosActorId(req.user);
      return next();
    } catch (e) {
      return next(e);
    }
  },
];

exports.internalKey = (req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (!process.env.INTERNAL_KEY || key !== process.env.INTERNAL_KEY) {
    return formatResponse(res, 403, false, 'Invalid internal key');
  }
  next();
};

/** Role-based authorization middleware factory */
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return formatResponse(res, 401, false, 'Not authorized');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return formatResponse(res, 403, false, 'Access denied');
    }
    next();
  };
};
