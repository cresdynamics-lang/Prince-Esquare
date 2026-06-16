export const parsePermissions = (permissions) => {
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

export const isFullAdmin = (user) => user?.role === 'admin';

export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (isFullAdmin(user)) return true;
  if (user.role === 'staff') {
    return parsePermissions(user.permissions).includes(permission);
  }
  return false;
};

export const canManageUsers = (user) => isFullAdmin(user);

export const canViewCustomers = (user) =>
  isFullAdmin(user) || hasPermission(user, 'customers');

export const canViewInventory = (user) =>
  isFullAdmin(user) ||
  hasPermission(user, 'inventory-manage') ||
  hasPermission(user, 'inventory-view');

export const canManageInventory = (user) =>
  isFullAdmin(user) || hasPermission(user, 'inventory-manage');

export const canUsePosTerminal = (user, { isSeller } = {}) => {
  if (isSeller) return true;
  if (isFullAdmin(user)) return true;
  if (user?.role === 'staff') return hasPermission(user, 'pos-terminal');
  return false;
};

export const canAccessFinance = (user) =>
  isFullAdmin(user) || hasPermission(user, 'finance') || canUsePosTerminal(user);

export const STAFF_PERMISSION_GROUPS = [
  {
    label: 'Store',
    permissions: ['dashboard', 'orders', 'products', 'customers'],
  },
  {
    label: 'Operations',
    permissions: ['finance', 'inventory-view', 'inventory-manage', 'pos-terminal'],
  },
  {
    label: 'Store & System',
    permissions: ['reviews', 'settings'],
  },
];

export const INVENTORY_MODULES = [
  { id: 'stock', label: 'Stock' },
  { id: 'daily-sheet', label: 'Summary' },
  { id: 'movements', label: 'Movements' },
  { id: 'stock-take', label: 'Stock Take' },
];

export const FINANCE_MODULES = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'pos-overview', label: 'POS Overview' },
  { id: 'pos-sales', label: 'POS Sales' },
  { id: 'pos-terminal', label: 'POS Terminal' },
];

export const inventoryModuleFromSection = (sectionId) => {
  if (sectionId === 'inventory') return 'stock';
  const found = INVENTORY_MODULES.find((m) => m.id === sectionId.replace('inv-', ''));
  return found?.id || 'stock';
};

export const isInventorySection = (id) =>
  id === 'inventory' || id?.startsWith('inv-');

export const isFinanceSection = (id) =>
  id === 'finance' || FINANCE_MODULES.some((m) => m.id === id);
