const parsePermissions = (permissions) => {
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isFullAdmin = (user) =>
  user?.accountType === 'user' && user?.role === 'admin';

const hasPermission = (user, permission) => {
  if (!user) return false;
  if (isFullAdmin(user)) return true;
  if (user.accountType === 'user' && user.role === 'staff') {
    const perms = parsePermissions(user.permissions);
    return perms.includes(permission);
  }
  return false;
};

const canViewInventory = (user) =>
  isFullAdmin(user) ||
  hasPermission(user, 'inventory-manage') ||
  hasPermission(user, 'inventory-view');

const canManageInventory = (user) =>
  isFullAdmin(user) || hasPermission(user, 'inventory-manage');

const canUsePosTerminal = (user) => {
  if (!user) return false;
  if (isFullAdmin(user)) return true;
  if (user.accountType === 'pos' && user.role === 'SELLER' && user.is_active !== false) return true;
  if (user.accountType === 'user' && user.role === 'staff') {
    return hasPermission(user, 'pos-terminal');
  }
  return false;
};

module.exports = {
  parsePermissions,
  isFullAdmin,
  hasPermission,
  canViewInventory,
  canManageInventory,
  canUsePosTerminal,
};
