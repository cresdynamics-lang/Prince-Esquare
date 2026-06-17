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

export const canAccessProducts = (user) =>
  isFullAdmin(user) ||
  hasPermission(user, 'products') ||
  hasPermission(user, 'inventory-view') ||
  hasPermission(user, 'inventory-manage');

export const canUsePosTerminal = (user, { isSeller } = {}) => {
  if (isSeller) return true;
  if (isFullAdmin(user)) return true;
  if (user?.role === 'staff') return hasPermission(user, 'pos-terminal');
  return false;
};

export const canAccessFinance = (user) =>
  isFullAdmin(user) || hasPermission(user, 'finance') || canUsePosTerminal(user);

/** Preset access roles — admin picks one when adding staff; details hidden on list until View staff. */
export const STAFF_ACCESS_PRESETS = [
  {
    id: 'pos-only',
    label: 'POS checkout',
    description: 'Log in, clock in, and make sales. No inventory or catalogue access.',
    permissions: ['pos-terminal'],
  },
  {
    id: 'catalog-inventory-view',
    label: 'Products & inventory view',
    description: 'Add products and browse stock. Cannot change inventory levels.',
    permissions: ['products', 'inventory-view'],
  },
  {
    id: 'inventory-manager',
    label: 'Inventory manager',
    description: 'Full stock control — stock in/out, transfers, and inventory updates.',
    permissions: ['products', 'inventory-view', 'inventory-manage'],
  },
  {
    id: 'custom',
    label: 'Custom duties',
    description: 'Choose individual access areas below.',
    permissions: [],
  },
];

export const STAFF_PERMISSION_GROUPS = [
  {
    label: 'Checkout',
    permissions: ['pos-terminal'],
    hint: 'POS terminal — make sales without inventory access.',
  },
  {
    label: 'Catalogue',
    permissions: ['products', 'orders', 'customers', 'dashboard'],
    hint: 'Website catalogue and orders.',
  },
  {
    label: 'Inventory',
    permissions: ['inventory-view', 'inventory-manage'],
    hint: 'View is read-only. Manage lets staff update stock (admin grants only).',
  },
  {
    label: 'Other',
    permissions: ['finance', 'reviews', 'settings'],
    hint: 'Finance reports, reviews, and store settings.',
  },
];

export const normalizeStaffPermissions = (permissions = []) => {
  const perms = [...new Set(parsePermissions(permissions))];
  const hasManage = perms.includes('inventory-manage');
  const hasView = perms.includes('inventory-view');

  if (hasView || hasManage) {
    if (!perms.includes('products')) perms.push('products');
  }
  if (hasManage && !hasView) perms.push('inventory-view');

  return perms;
};

export const detectStaffPreset = (permissions) => {
  const perms = normalizeStaffPermissions(permissions).sort();
  const match = STAFF_ACCESS_PRESETS.find((preset) => {
    if (preset.id === 'custom') return false;
    const presetPerms = [...preset.permissions].sort();
    return presetPerms.length === perms.length && presetPerms.every((p, i) => p === perms[i]);
  });
  return match?.id || 'custom';
};

export const getStaffAccessSummary = (permissions) => {
  const presetId = detectStaffPreset(permissions);
  const preset = STAFF_ACCESS_PRESETS.find((p) => p.id === presetId);
  if (preset && preset.id !== 'custom') return preset.label;
  const perms = parsePermissions(permissions);
  if (!perms.length) return 'No access assigned';
  if (perms.length === 1 && perms[0] === 'pos-terminal') return 'POS checkout';
  return 'Custom access';
};

export const applyPermissionToggle = (current, permission, checked) => {
  let next = [...parsePermissions(current)];

  if (checked) {
    if (!next.includes(permission)) next.push(permission);
    if (permission === 'inventory-manage') {
      if (!next.includes('inventory-view')) next.push('inventory-view');
      if (!next.includes('products')) next.push('products');
    }
    if (permission === 'inventory-view' && !next.includes('products')) {
      next.push('products');
    }
  } else {
    next = next.filter((p) => p !== permission);
    if (permission === 'inventory-view') {
      next = next.filter((p) => p !== 'inventory-manage');
    }
  }

  return normalizeStaffPermissions(next);
};

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
