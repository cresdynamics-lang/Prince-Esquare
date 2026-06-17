import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingBag, Tag, Award, Users, 
  ShieldCheck, Image as ImageIcon, Mail,
  Star, Settings, LogOut, Bell, Search, Menu, X,
  ArrowUpRight, ArrowDownRight, MoreVertical, Plus, 
  Download, Filter, CheckCircle2, AlertCircle, Clock, 
  UserPlus, UserMinus, Trash2, Edit, Eye, ChevronRight, ChevronDown,
  Phone, Globe, Truck, CreditCard, CreditCard as CardIcon,
  Warehouse,
  Store
} from 'lucide-react';
import { AdminPosTerminalInfo, PosSalesView } from '../components/admin/pos/PosAdminViews';
import PosTerminalView from '../components/pos/PosTerminalView';
import ShiftSummaryView from '../components/pos/ShiftSummaryView';
import { posAdminAPI } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, isStaffSession } from '../store/useAuthStore';
import { userInitials } from '../lib/format';
import { adminToast, apiErrorMessage } from '../lib/adminToast';
import { 
  adminAnalyticsAPI, 
  adminOrderAPI, 
  adminCategoryAPI, 
  adminBrandAPI, 
  adminCustomerAPI,
  adminReviewAPI,
  adminSettingsAPI,
  adminUploadAPI,
} from '../services/api';
import { useEffect } from 'react';
import {
  getUploadUrl,
  getPersistImageUrl,
  getImageSrc,
  resolveDisplayImageUrl,
} from '../utils/cloudinary';
import { ensureSocket, disconnectSocket } from '../lib/socket';
import { ConfirmProvider, useConfirm } from '../components/admin/ConfirmDialog';
import {
  canViewInventory,
  canManageInventory,
  canAccessProducts,
  canUsePosTerminal,
  canViewCustomers,
  canManageUsers,
  canAccessFinance,
  hasPermission,
  parsePermissions,
  STAFF_ACCESS_PRESETS,
  STAFF_PERMISSION_GROUPS,
  detectStaffPreset,
  applyPermissionToggle,
  normalizeStaffPermissions,
} from '../utils/staffPermissions';

const FinanceHub = lazy(() => import('../components/admin/FinanceHub'));
const PosInventoryHub = lazy(() => import('../components/admin/pos/PosInventoryHub'));
const ProductsView = lazy(() => import('../components/admin/ProductsView'));

const SectionLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
  </div>
);

/** Scrollable table wrapper for mobile */
const AdminTable = ({ children }) => (
  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">{children}</div>
);

const AdminDashboard = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() =>
    useAuthStore.getState().isSeller ? 'pos-terminal' : 'dashboard'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const authState = useAuthStore();
  const { user, isAuthenticated, isAdmin, isSeller } = authState;
  const staffSession = isStaffSession(authState);
  const [authReady, setAuthReady] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? true
  );

  useEffect(() => {
    const done = () => setAuthReady(true);
    if (useAuthStore.persist?.hasHydrated?.()) {
      setAuthReady(true);
      return undefined;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(done);
    useAuthStore.persist?.rehydrate?.();
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!staffSession) {
      navigate('/admin/login', { replace: true });
    }
  }, [authReady, staffSession, navigate]);

  useEffect(() => {
    if (location.state?.shiftSummary) {
      setShiftSummary(location.state.shiftSummary);
      setActiveSection('pos-terminal');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const allSidebarItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'orders', label: 'Orders', icon: Package, section: 'Store' },
    { id: 'products', label: 'Products', icon: ShoppingBag, section: 'Store' },
    { id: 'users', label: 'Users', icon: Users, section: 'People' },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, section: 'Operations' },
    { id: 'finance', label: 'Finance', icon: CreditCard, section: 'Operations' },
    { id: 'reviews', label: 'Reviews', icon: Star, section: 'Marketing', badge: '5' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  ], []);

  const posOnlySidebarItems = useMemo(() => [
    { id: 'pos-terminal', label: 'POS Terminal', icon: Store, section: 'POS' },
    { id: 'finance', label: 'Finance', icon: CreditCard, section: 'POS' },
    { id: 'orders', label: 'Online Orders', icon: ShoppingBag, section: 'POS' },
  ], []);

  const sidebarItems = useMemo(() => {
    const posOnly =
      isSeller ||
      (user?.role === 'staff' &&
        canUsePosTerminal(user, { isSeller }) &&
        !canViewInventory(user) &&
        !canAccessProducts(user) &&
        !canViewCustomers(user) &&
        !hasPermission(user, 'dashboard') &&
        !hasPermission(user, 'orders'));

    const items = posOnly ? posOnlySidebarItems : allSidebarItems;
    return items.filter((item) => {
      if (posOnly) return item.id !== 'finance' || canAccessFinance(user);
      if (user?.role === 'admin') return true;
      if (user?.role === 'staff') {
        if (item.id === 'inventory') return canViewInventory(user);
        if (item.id === 'finance') return canAccessFinance(user);
        if (item.id === 'users') return canViewCustomers(user);
        if (item.id === 'products') return canAccessProducts(user);
        return hasPermission(user, item.id) || (item.id === 'users' && hasPermission(user, 'customers'));
      }
      return false;
    });
  }, [isSeller, user, allSidebarItems, posOnlySidebarItems]);

  useEffect(() => {
    if (!authReady || !staffSession) return undefined;
    ensureSocket();
    return undefined;
  }, [authReady, staffSession]);

  useEffect(() => {
    if (user?.role === 'staff' && sidebarItems.length > 0) {
      if (!sidebarItems.find((i) => i.id === activeSection)) {
        setActiveSection(sidebarItems[0].id);
      }
    }
  }, [user, sidebarItems, activeSection]);

  if (!authReady || !staffSession) return null;

  const handleLogout = async () => {
    try {
      // Optional: call backend logout
      // await adminAuthAPI.logout(); 
    } catch (e) {}
    disconnectSocket();
    logout();
    navigate('/admin/login');
  };

  const staffHasPosAccess = (perms) =>
    perms.includes('pos-terminal') ||
    perms.includes('inventory-view') ||
    perms.includes('inventory-manage');

  const navSections = [...new Set(sidebarItems.map((item) => item.section))];

  const renderContent = () => {
    if (user?.role === 'staff') {
      const allowed =
        hasPermission(user, activeSection) ||
        (activeSection === 'users' && canViewCustomers(user)) ||
        (activeSection === 'products' && canAccessProducts(user)) ||
        (activeSection === 'inventory' && canViewInventory(user)) ||
        (activeSection === 'finance' && canAccessFinance(user)) ||
        (activeSection === 'pos-terminal' && canUsePosTerminal(user, { isSeller }));
      if (!allowed) {
        return <div className="p-8 text-center text-red-400">Unauthorized Access</div>;
      }
    }

    const inventoryReadOnly = user?.role === 'staff' && !canManageInventory(user);

    const heavySection = (
      <Suspense fallback={<SectionLoader />}>
        {(() => {
          switch (activeSection) {
            case 'products':
              return <ProductsView />;
            case 'finance':
              return <FinanceHub readOnly={isSeller} />;
            case 'inventory':
              return <PosInventoryHub readOnlyInventory={inventoryReadOnly} />;
            default:
              return null;
          }
        })()}
      </Suspense>
    );

    switch (activeSection) {
      case 'dashboard':
        if (isSeller) return null;
        return <DashboardView onOpenPos={() => setActiveSection('inventory')} />;
      case 'orders': return <OrdersView readOnly={isSeller} />;
      case 'products':
      case 'finance':
      case 'inventory':
        return heavySection;
      case 'users': return <UsersView />;
      case 'reviews': return <ReviewsView />;
      case 'settings': return <SettingsView />;
      case 'pos-terminal':
        if (shiftSummary) {
          return (
            <ShiftSummaryView
              embedded
              summary={shiftSummary}
              onDone={() => {
                setShiftSummary(null);
                logout();
                navigate('/admin/login');
              }}
            />
          );
        }
        if (isSeller || canUsePosTerminal(user, { isSeller })) {
          return <PosTerminalView embedded onClockOut={(summary) => setShiftSummary(summary)} />;
        }
        return (
          <AdminPosTerminalInfo
            onOpenInventory={() => setActiveSection('finance')}
          />
        );
      default: return <DashboardView />;
    }
  };

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileNavOpen(false);
  };

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileNavOpen((open) => !open);
    } else {
      setIsSidebarOpen((open) => !open);
    }
  };

  const isMobileMenuVisible = isMobileNavOpen;

  return (
    <ConfirmProvider>
    <div className="flex h-dvh bg-navy-950 text-gold-50 font-sans overflow-hidden">
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-navy-950/80 z-30 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72 lg:w-64' : 'w-72 lg:w-20'
        } fixed lg:relative inset-y-0 left-0 z-40 lg:z-20 bg-navy-900/95 lg:bg-navy-900/50 border-r border-gold-500/10 transition-all duration-300 flex flex-col backdrop-blur-xl ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-gold-500/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-600 rounded-lg flex items-center justify-center text-navy-950 font-bold text-xl">
            PE
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="font-serif font-bold text-lg text-gradient-gold"
            >
              Prince Esquire
            </motion.div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {navSections.map((section) => (
            <div key={section} className="mb-6">
              {isSidebarOpen && (
                <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500/40 mb-2">
                  {section}
                </h3>
              )}
              {sidebarItems
                .filter((item) => item.section === section)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      activeSection === item.id
                        ? 'bg-gold-600 text-navy-950 shadow-lg shadow-gold-600/20'
                        : 'text-gold-500/60 hover:bg-navy-800/50 hover:text-gold-400'
                    }`}
                  >
                    <item.icon size={20} className={activeSection === item.id ? 'text-navy-950' : 'group-hover:text-gold-400'} />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    )}
                    {isSidebarOpen && item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeSection === item.id ? 'bg-navy-950 text-gold-500' : 'bg-gold-600/20 text-gold-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gold-500/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 w-full lg:ml-0">
        {/* Topbar */}
        <header className="h-16 sm:h-20 bg-navy-900/30 border-b border-gold-500/10 flex items-center justify-between px-4 sm:px-6 lg:px-8 backdrop-blur-md shrink-0 gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button 
              type="button"
              onClick={toggleSidebar}
              className="p-2 text-gold-500/60 hover:text-gold-500 transition-colors bg-navy-800/50 rounded-lg border border-gold-500/10 shrink-0"
            >
              {(isMobileMenuVisible || (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth >= 1024)) ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:block h-8 w-[1px] bg-gold-500/10 mx-1 sm:mx-2" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-gold-500/40 uppercase tracking-widest truncate">
                {isSeller ? 'Seller Portal' : 'Admin / Overview'}
              </span>
              <h2 className="text-base sm:text-xl font-serif font-bold text-gold-100 capitalize truncate">
                {sidebarItems.find((i) => i.id === activeSection)?.label || activeSection.replace(/-/g, ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-navy-800/50 border border-gold-500/10 px-4 py-2 rounded-xl focus-within:border-gold-500/30 transition-all">
              <Search size={18} className="text-gold-500/40" />
              <input
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm text-gold-100 placeholder:text-gold-500/30 w-64"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 text-gold-500/60 hover:text-gold-500 transition-all bg-navy-800/50 rounded-xl border border-gold-500/10 group">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-gold-600 rounded-full border-2 border-navy-900 group-hover:scale-125 transition-transform"></span>
              </button>
              <div
                className="h-10 w-10 bg-gradient-to-br from-gold-400 to-gold-700 rounded-full flex items-center justify-center text-navy-950 font-bold border-2 border-navy-800 cursor-pointer hover:scale-105 transition-transform text-sm"
                title={[user?.fullName, user?.name, user?.full_name, user?.email].filter(Boolean).join(' · ')}
              >
                {userInitials(user)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 custom-scrollbar bg-gradient-to-b from-navy-950 to-navy-900/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </ConfirmProvider>
  );
};

// --- Sub-views ---

const DashboardView = ({ onOpenPos }) => {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [posOverview, setPosOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posLoading, setPosLoading] = useState(true);
  const [closingShiftId, setClosingShiftId] = useState(null);

  const loadPosOverview = async () => {
    setPosLoading(true);
    try {
      const posRes = await posAdminAPI.getOverview().catch(() => null);
      if (posRes?.data?.data) setPosOverview(posRes.data.data);
    } finally {
      setPosLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          adminAnalyticsAPI.getStats(),
          adminAnalyticsAPI.getSalesChart(),
        ]);

        setStats(statsRes.data.data);
        setSalesData(chartRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    loadPosOverview();
  }, []);

  const handleForceCloseShift = async (shiftId) => {
    setClosingShiftId(shiftId);
    try {
      await posAdminAPI.forceCloseShift(shiftId);
      await loadPosOverview();
      adminToast.success('Open shift closed');
    } catch (error) {
      adminToast.error(apiErrorMessage(error, 'Could not close shift'));
    } finally {
      setClosingShiftId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `KSh ${stats?.revenue?.toLocaleString()}`, icon: CreditCard, detail: stats?.posRevenue != null ? `POS KSh ${Math.round(stats.posRevenue).toLocaleString()} + online` : null },
    { label: 'Total Profit', value: `KSh ${stats?.profit?.toLocaleString()}`, icon: Tag },
    { label: 'Total Sales', value: stats?.orders || 0, icon: Package, detail: stats?.posSales != null ? `${stats.posSales} POS · ${stats.onlineOrders} online` : null },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-navy-900/40 border border-gold-500/10 p-6 rounded-2xl hover:border-gold-500/20 transition-all group backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-navy-800/50 rounded-xl group-hover:bg-gold-600 group-hover:text-navy-950 transition-all">
                <stat.icon size={22} className="text-gold-500 group-hover:text-navy-950" />
              </div>
              {stat.change && (stat.up ? (
                <span className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} className="mr-1" /> {stat.change}
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">
                  <ArrowDownRight size={14} className="mr-1" /> {stat.change}
                </span>
              ))}
            </div>
            <div className="text-[10px] font-bold text-gold-500/40 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-serif font-bold text-gold-100">{stat.value}</div>
          </div>
        ))}
      </div>

      {(posLoading || posOverview) && (
        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-serif font-bold text-lg text-gold-100">Shop POS & Inventory</h3>
            {onOpenPos && (
              <button type="button" onClick={onOpenPos} className="text-[10px] font-black uppercase tracking-widest bg-gold-600 text-navy-950 px-4 py-2 rounded-lg">
                Open POS & Inventory
              </button>
            )}
          </div>
          {posLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500" />
            </div>
          ) : posOverview ? (
          <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Today (shop)', `KSh ${Number(posOverview.kpis?.todayRevenue || 0).toLocaleString()}`],
              ['This week', `KSh ${Number(posOverview.kpis?.weekRevenue || 0).toLocaleString()}`],
              ['Open shifts', posOverview.kpis?.activeSellers ?? 0],
              ['Low stock items', posOverview.lowStockItems?.length ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="bg-navy-950/50 border border-gold-500/10 rounded-xl p-4">
                <p className="text-[10px] text-gold-500/40 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-bold text-gold-300 mt-1">{value}</p>
              </div>
            ))}
          </div>
          {posOverview.kpis?.openShifts?.length > 0 && (
            <div className="mt-4 rounded-xl border border-gold-500/10 bg-navy-950/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500/50 mb-3">
                Clocked in now (POS shifts not yet closed)
              </p>
              <div className="space-y-2">
                {posOverview.kpis.openShifts.map((shift) => (
                  <div
                    key={shift.shiftId}
                    className="flex flex-wrap items-center justify-between gap-3 text-sm text-gold-100/90"
                  >
                    <div>
                      <span className="font-semibold">{shift.sellerName}</span>
                      {shift.sellerEmail && (
                        <span className="text-gold-500/50 text-xs ml-2">{shift.sellerEmail}</span>
                      )}
                      {shift.userRole && (
                        <span className="text-[9px] uppercase tracking-widest text-gold-500/40 ml-2">
                          {shift.userRole}
                        </span>
                      )}
                      {!shift.userRole && (
                        <span className="text-[9px] uppercase tracking-widest text-amber-400/70 ml-2">
                          legacy POS profile
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gold-500/40">
                        since {new Date(shift.clockIn).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleForceCloseShift(shift.shiftId)}
                          disabled={closingShiftId === shift.shiftId}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-300/80 hover:text-red-300 disabled:opacity-50"
                        >
                          {closingShiftId === shift.shiftId ? 'Closing…' : 'Close shift'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          ) : null}
        </div>
      )}

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-gold-500/10 flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-gold-100">Monthly Sales</h3>
          <div className="text-[10px] font-bold text-gold-500/40 uppercase tracking-widest">Current Year</div>
        </div>
        <div className="p-8 h-64 flex items-end justify-between gap-2">
          {salesData.length > 0 ? salesData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.total / Math.max(...salesData.map(s => s.total || 1))) * 100}%` }}
                  className="w-8 bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-lg group-hover:from-gold-500 group-hover:to-gold-300 transition-all shadow-lg shadow-gold-600/10"
                />
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gold-600 text-navy-950 text-[10px] font-bold px-2 py-1 rounded pointer-events-none">
                  KSh {parseInt(d.total).toLocaleString()}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gold-500/30 uppercase tracking-widest">{d.label}</span>
            </div>
          )) : (
            <div className="w-full h-full flex items-center justify-center text-gold-500/20 text-xs uppercase tracking-widest">No sales data yet</div>
          )}
        </div>
      </div>
    </div>
  );
};


const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const parseOrderAddress = (value) => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
};

const OrdersView = ({ readOnly = false }) => {
  const confirm = useConfirm();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState('pending');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminOrderAPI.getAll();
      setOrders(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Could not load orders. Try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase());

  const openOrderDetail = async (orderId) => {
    setDetailOrder(null);
    setDetailLoading(true);
    setActionError('');
    try {
      const res = await adminOrderAPI.getOne(orderId);
      setDetailOrder(res.data?.data || null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not load order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openOrderEdit = (order) => {
    setEditOrder(order);
    setEditStatus(order.status || 'pending');
    setEditPaymentStatus(order.payment_status || 'pending');
    setActionError('');
  };

  const handleSaveOrder = async () => {
    if (!editOrder) return;
    setSaving(true);
    setActionError('');
    try {
      const statusChanged = editStatus !== editOrder.status;
      const paymentChanged = editPaymentStatus !== editOrder.payment_status;

      if (statusChanged) {
        await adminOrderAPI.updateStatus(editOrder.id, editStatus);
      }
      if (paymentChanged) {
        await adminOrderAPI.updatePayment(editOrder.id, editPaymentStatus);
      }

      setEditOrder(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      const res = await adminOrderAPI.exportCsv();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    }
  };

  const handleCancelOrder = async () => {
    if (!editOrder) return;
    const ok = await confirm({
      title: 'Cancel order',
      message: 'Cancel this order? Stock will be restored if already paid.',
      confirmLabel: 'Cancel order',
      variant: 'warning',
    });
    if (!ok) return;
    setSaving(true);
    setActionError('');
    try {
      await adminOrderAPI.cancel(editOrder.id);
      setEditOrder(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefundOrder = async () => {
    if (!editOrder) return;
    const ok = await confirm({
      title: 'Refund order',
      message: 'Refund this paid order and restore stock to inventory?',
      confirmLabel: 'Refund order',
      variant: 'warning',
    });
    if (!ok) return;
    setSaving(true);
    setActionError('');
    try {
      await adminOrderAPI.refund(editOrder.id);
      setEditOrder(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not refund order.');
    } finally {
      setSaving(false);
    }
  };

  const closeDetail = () => {
    setDetailOrder(null);
    setDetailLoading(false);
    setActionError('');
  };

  const closeEdit = () => {
    setEditOrder(null);
    setActionError('');
  };

  const detailAddress = parseOrderAddress(detailOrder?.shipping_address);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-xl">
          {error}
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filter === f
                  ? 'bg-gold-600 text-navy-950 border-gold-600'
                  : 'bg-navy-900/50 text-gold-500/60 border-gold-500/10 hover:border-gold-500/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportOrders}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800/50 border border-gold-500/10 rounded-xl text-xs font-bold text-gold-500 hover:bg-navy-800 transition-all"
          >
            <Download size={16} /> Export CSV
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={() => fetchOrders()}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800/50 border border-gold-500/10 rounded-xl text-xs font-bold text-gold-500 hover:bg-navy-800 transition-all"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <AdminTable>
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-navy-800/50">
              <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gold-500">#{o.id.substring(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-gold-100">{o.customer_name}</td>
                  <td className="px-6 py-4 font-bold text-gold-100">KSh {parseFloat(o.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`px-2 py-1 rounded border border-gold-500/10 ${o.payment_status === 'paid' ? 'text-green-400 bg-green-400/5' : 'text-gold-500/60 bg-navy-800'}`}>
                      {o.payment_method} ({o.payment_status})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      o.status === 'pending' ? 'bg-gold-500/10 text-gold-500' :
                      o.status === 'delivered' ? 'bg-green-400/10 text-green-400' :
                      o.status === 'cancelled' ? 'bg-red-400/10 text-red-400' :
                      'bg-blue-400/10 text-blue-400'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gold-500/40">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openOrderDetail(o.id)}
                        className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => openOrderEdit(o)}
                          className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                          title="Edit Order"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTable>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No orders found matching this criteria.
          </div>
        )}
      </div>

      {(detailLoading || detailOrder || actionError) && !editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-serif text-gold-100">Order Details</h3>
                {detailOrder && (
                  <p className="text-gold-500/50 text-xs mt-1 uppercase tracking-widest">
                    #{detailOrder.id.substring(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
              <button type="button" onClick={closeDetail} className="text-gold-500/40 hover:text-gold-500">
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto" />
              </div>
            ) : actionError && !detailOrder ? (
              <p className="text-red-400 text-sm">{actionError}</p>
            ) : detailOrder ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mb-1">Customer</p>
                    <p className="text-gold-100">{detailOrder.customer_name}</p>
                    <p className="text-gold-500/60 text-xs">{detailOrder.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mb-1">Placed</p>
                    <p className="text-gold-100">{new Date(detailOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mb-1">Status</p>
                    <p className="text-gold-100 uppercase text-xs font-bold">{detailOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mb-1">Payment</p>
                    <p className="text-gold-100 text-xs">
                      {detailOrder.payment_method} · {detailOrder.payment_status}
                    </p>
                  </div>
                </div>

                <div className="bg-navy-950/60 border border-gold-500/10 rounded-xl p-4 text-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mb-2">Shipping</p>
                  <p className="text-gold-100">
                    {[detailAddress.first_name, detailAddress.last_name].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.line1}</p>
                  <p className="text-gold-500/70 text-xs">{detailAddress.city}, {detailAddress.country || 'Kenya'}</p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.phone}</p>
                  <p className="text-gold-500/70 text-xs">{detailAddress.email}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mb-3">Items</p>
                  <div className="space-y-2">
                    {(detailOrder.items || []).map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 bg-navy-950/60 border border-gold-500/5 rounded-xl px-4 py-3 text-sm">
                        <div>
                          <p className="text-gold-100">{item.name}</p>
                          <p className="text-gold-500/50 text-xs">
                            Qty {item.quantity}
                            {item.size_label ? ` · Size ${item.size_label}` : ''}
                            {(item.variant_sku || item.product_sku) ? ` · SKU ${item.variant_sku || item.product_sku}` : ''}
                          </p>
                        </div>
                        <p className="text-gold-400 shrink-0">
                          KSh {(parseFloat(item.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-gold-500/10 pt-4 text-sm font-bold">
                  <span className="text-gold-500/60">Total</span>
                  <span className="text-gold-400">KSh {parseFloat(detailOrder.total_amount).toLocaleString()}</span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDetail();
                      openOrderEdit(detailOrder);
                    }}
                    className="w-full py-3 rounded-xl bg-gold-600 text-navy-950 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500"
                  >
                    Edit Order
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-serif text-gold-100">Edit Order</h3>
                <p className="text-gold-500/50 text-xs mt-1 uppercase tracking-widest">
                  #{editOrder.id.substring(0, 8).toUpperCase()} · {editOrder.customer_name}
                </p>
              </div>
              <button type="button" onClick={closeEdit} className="text-gold-500/40 hover:text-gold-500">
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <p className="text-red-400 text-sm mb-4">{actionError}</p>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold-500/40 font-bold">Order Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-navy-950 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-100 text-sm outline-none focus:border-gold-500"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold-500/40 font-bold">Payment Status</label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="w-full bg-navy-950 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-100 text-sm outline-none focus:border-gold-500"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {!readOnly && editOrder.status !== 'cancelled' && editOrder.status !== 'delivered' && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={saving}
                className="w-full mt-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}

            {!readOnly && editOrder.payment_status === 'paid' && (
              <button
                type="button"
                onClick={handleRefundOrder}
                disabled={saving}
                className="w-full mt-2 py-3 rounded-xl border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/10 disabled:opacity-50"
              >
                Refund Order
              </button>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 py-3 rounded-xl border border-gold-500/20 text-gold-500/60 text-[10px] font-bold uppercase tracking-widest"
              >
                Close
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gold-600 text-navy-950 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoriesView = () => {
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    is_featured: false,
    is_active: true
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminCategoryAPI.getAll();
      setCategories(res.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadData = new FormData();
      uploadData.append('images', file);
      try {
        const res = await adminUploadAPI.upload(uploadData);
        if (res.data.success) {
          setFormData({ ...formData, image: res.data.data[0] });
        }
      } catch (error) {
        console.error('Category image upload failed:', error);
      }
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        image: category.image || '',
        is_featured: category.is_featured || false,
        is_active: category.is_active ?? true
      });
    } else {
      setCurrentCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
        is_featured: false,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete category',
      message: 'Products in this category may be affected. Are you sure you want to delete it?',
      confirmLabel: 'Delete category',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminCategoryAPI.remove(id);
      fetchCategories();
    } catch (error) {
      alert('Error deleting category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (currentCategory) {
        await adminCategoryAPI.update(currentCategory.id, formData);
      } else {
        await adminCategoryAPI.create(formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      alert('Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Categories ({categories.length})</h3>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-navy-800/50 border border-gold-500/10 text-gold-500 rounded-xl font-bold hover:bg-navy-800 transition-all"
        >
          <Plus size={20} /> New Category
        </button>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : categories.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-navy-800/50 text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-navy-800/30 transition-colors text-sm">
                  <td className="px-6 py-4 font-bold text-gold-100 flex items-center gap-2">
                    {c.parent_id && <ChevronRight size={14} className="text-gold-500/20" />}
                    {c.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-gold-500/60 text-xs">{c.slug}</td>
                  <td className="px-6 py-4 text-gold-200">{c.is_featured ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      c.is_active ? 'bg-green-400/10 text-green-400' : 'bg-navy-800 text-gold-500/30'
                    }`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(c)}
                        className="p-2 text-gold-500/60 hover:text-gold-500 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-red-400/60 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No categories defined.
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-900 border border-gold-500/20 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-2xl font-serif font-bold text-gold-100">
                {currentCategory ? 'Edit Category' : 'Create New Category'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gold-500/40 hover:text-gold-500"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData({...formData, name: val, slug: val.toLowerCase().replace(/ /g, '-')});
                      }}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Slug</label>
                    <input 
                      type="text" 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Image</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border border-gold-500/10 overflow-hidden bg-navy-950 flex items-center justify-center relative">
                            {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gold-500/20" />}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <p className="text-[9px] text-gold-500/40 uppercase tracking-widest">Click to upload cover image</p>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                    className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all h-24 font-bold uppercase"
                  />
                </div>

              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gold-100">Featured Category</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gold-100">Active</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gold-600 text-navy-950 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gold-500 transition-all disabled:opacity-50"
              >
                {submitting ? 'AUTHENTICATING...' : 'COMMIT CATEGORY'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};


const BrandsView = () => {
  const confirm = useConfirm();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    is_featured: false,
    is_active: true
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await adminBrandAPI.getAll();
      setBrands(res.data.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadData = new FormData();
      uploadData.append('images', file);
      try {
        const res = await adminUploadAPI.upload(uploadData);
        if (res.data.success) {
          setFormData({ ...formData, logo: getUploadUrl(res.data.data[0]) });
        }
      } catch (error) {
        console.error('Brand logo upload failed:', error);
      }
    }
  };

  const handleOpenModal = (brand = null) => {
    if (brand) {
      setCurrentBrand(brand);
      setFormData({
        name: brand.name || '',
        slug: brand.slug || '',
        description: brand.description || '',
        logo: brand.logo || '',
        is_featured: brand.is_featured || false,
        is_active: brand.is_active ?? true
      });
    } else {
      setCurrentBrand(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logo: '',
        is_featured: false,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete brand',
      message: 'This brand will be removed from your store. Products linked to it will remain but lose the brand label.',
      confirmLabel: 'Delete brand',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminBrandAPI.remove(id);
      fetchBrands();
    } catch (error) {
      alert('Error deleting brand');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (currentBrand) {
        await adminBrandAPI.update(currentBrand.id, formData);
      } else {
        await adminBrandAPI.create(formData);
      }
      setIsModalOpen(false);
      fetchBrands();
    } catch (error) {
      alert('Error saving brand');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Brand Partners ({brands.length})</h3>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-navy-800/50 border border-gold-500/10 text-gold-500 rounded-xl font-bold hover:bg-navy-800 transition-all"
        >
          <Plus size={20} /> Add Brand
        </button>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
        </div>
      ) : brands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-navy-900/40 border border-gold-500/10 p-6 rounded-2xl flex items-center justify-between group backdrop-blur-sm transition-all hover:bg-navy-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg border border-gold-500/10 overflow-hidden bg-navy-950 flex items-center justify-center">
                    {brand.logo ? <img src={brand.logo} className="w-full h-full object-contain" /> : <Award size={20} className="text-gold-500/20" />}
                </div>
                <div>
                  <div className="text-lg font-bold text-gold-100 mb-1">{brand.name}</div>
                  <div className="text-xs text-gold-500/40 mb-3">{brand.product_count || 0} products live</div>
                  <div className="flex gap-2">
                    {brand.is_featured && <span className="bg-gold-600/10 text-gold-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest border border-gold-500/10">Featured</span>}
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest border ${brand.is_active ? 'border-green-400/20 text-green-400' : 'border-gold-500/5 text-gold-500/20'}`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(brand)} className="w-10 h-10 bg-navy-800 rounded-xl border border-gold-500/10 flex items-center justify-center text-gold-500/60 hover:text-gold-500 hover:border-gold-500/40 transition-all">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(brand.id)} className="w-10 h-10 bg-red-400/10 rounded-xl border border-red-400/20 flex items-center justify-center text-red-400/60 hover:text-red-400 hover:border-red-400/40 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gold-500/40 text-sm">
          No brand partners found.
        </div>
      )}
      </div>

      {/* Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-900 border border-gold-500/20 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-2xl font-serif font-bold text-gold-100">
                {currentBrand ? 'Edit Brand' : 'Create New Brand'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gold-500/40 hover:text-gold-500"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData({...formData, name: val, slug: val.toLowerCase().replace(/ /g, '-')});
                      }}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Slug</label>
                    <input 
                      type="text" 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border border-gold-500/10 overflow-hidden bg-navy-950 flex items-center justify-center relative">
                            {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain" /> : <Award size={20} className="text-gold-500/20" />}
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <p className="text-[9px] text-gold-500/40 uppercase tracking-widest">Click to upload brand logo</p>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                    className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all h-24 font-bold uppercase"
                  />
                </div>

              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gold-100">Featured Brand</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gold-100">Active</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gold-600 text-navy-950 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gold-500 transition-all disabled:opacity-50"
              >
                {submitting ? 'SAVING...' : 'SAVE BRAND'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};


const UsersView = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = canManageUsers(currentUser);
  const [tab, setTab] = useState('customers');

  const tabs = isAdmin
    ? [
        { id: 'customers', label: 'Customers' },
        { id: 'staff', label: 'Staff' },
        { id: 'admins', label: 'Admins' },
      ]
    : [{ id: 'customers', label: 'Customers' }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-gold-100">Users</h3>
          <p className="text-xs text-gold-500/40 mt-1">
            {isAdmin ? 'Website accounts, staff, and administrators' : 'Customer accounts only'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                tab === t.id
                  ? 'bg-gold-600 text-navy-950 border-gold-600'
                  : 'bg-navy-900/50 text-gold-500/70 border-gold-500/15 hover:border-gold-500/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!isAdmin && currentUser && (
        <div className="bg-navy-900/40 border border-gold-500/15 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold-600 text-navy-950 font-bold flex items-center justify-center">
            {userInitials(currentUser)}
          </div>
          <div>
            <p className="text-sm font-bold text-gold-100">{currentUser.fullName || currentUser.name}</p>
            <p className="text-xs text-gold-500/50">{currentUser.email} · Staff</p>
          </div>
        </div>
      )}

      {tab === 'customers' && <CustomersView embedded />}
      {tab === 'staff' && isAdmin && <AdminsView roleFilter="staff" />}
      {tab === 'admins' && isAdmin && <AdminsView roleFilter="admin" />}
    </div>
  );
};


const CustomersView = ({ embedded = false }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await adminCustomerAPI.getAll({ role: 'customer' });
        setCustomers(res.data.data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminCustomerAPI.updateStatus(id, !currentStatus);
      setCustomers(customers.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };


  return (
    <div className="space-y-6">
      {!embedded && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-gold-100">Customer Directory</h3>
          <p className="text-xs text-gold-500/40 mt-1">Managing {customers.length} registered clients</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="bg-navy-800/50 border border-gold-500/10 px-4 py-2 rounded-xl flex items-center gap-2">
            <Search size={16} className="text-gold-500/40" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gold-100 placeholder:text-gold-500/20" 
            />
          </div>
        </div>
      </div>
      )}
      {embedded && (
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <p className="text-xs text-gold-500/40">{customers.length} registered customers</p>
          <div className="bg-navy-800/50 border border-gold-500/10 px-4 py-2 rounded-xl flex items-center gap-2">
            <Search size={16} className="text-gold-500/40" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gold-100 placeholder:text-gold-500/20 w-48" 
            />
          </div>
        </div>
      )}

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <AdminTable>
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-navy-800/50 text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gold-600 rounded-full flex items-center justify-center text-navy-950 font-bold border-2 border-navy-800 shadow-lg`}>
                        {userInitials(c)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gold-100 flex items-center gap-2">
                          {c.name}
                          {c.is_verified && <CheckCircle2 size={14} className="text-blue-400" />}
                        </div>
                        <div className="text-[10px] text-gold-500/40 uppercase tracking-widest mt-0.5">ID: {c.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gold-100">{c.email}</div>
                    <div className="text-[10px] text-gold-500/40 mt-1 flex items-center gap-1">
                      <Phone size={10} /> {c.phone || 'No phone'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-serif font-bold text-gold-100">KSh {parseFloat(c.total_spent || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-gold-500/60">{new Date(c.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-[0.1em] ${
                      c.is_active !== false ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                    }`}>
                      {c.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(c.id, c.is_active !== false)}
                        className={`p-2 rounded-lg transition-all ${c.is_active !== false ? 'text-red-400/40 hover:text-red-400 hover:bg-red-400/5' : 'text-green-400/40 hover:text-green-400 hover:bg-green-400/5'}`}
                        title={c.is_active !== false ? 'Suspend Account' : 'Activate Account'}
                      >
                        {c.is_active !== false ? <UserMinus size={16} /> : <UserPlus size={16} />}
                      </button>
                      <button className="p-2 text-gold-500/40 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all" title="View History"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTable>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No customers found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};


const AdminsView = ({ roleFilter = null }) => {
  const confirm = useConfirm();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    accessPreset: 'pos-only',
    permissions: ['pos-terminal'],
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const [resStaff, resAdmin] = await Promise.all([
        adminCustomerAPI.getStaff(),
        adminCustomerAPI.getAdmins(),
      ]);
      const combined = [...(resAdmin.data.data || []), ...(resStaff.data.data || [])];
      setAdmins(combined);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      accessPreset: 'pos-only',
      permissions: ['pos-terminal'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    const permissions = parsePermissions(staff.permissions);
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      accessPreset: detectStaffPreset(permissions),
      permissions,
    });
    setIsModalOpen(true);
  };

  const handlePresetChange = (presetId) => {
    const preset = STAFF_ACCESS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormData({
      ...formData,
      accessPreset: presetId,
      permissions: preset.id === 'custom' ? formData.permissions : [...preset.permissions],
    });
  };

  const handlePermissionToggle = (permission, checked) => {
    setFormData({
      ...formData,
      accessPreset: 'custom',
      permissions: applyPermissionToggle(formData.permissions, permission, checked),
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStaff) {
        await adminCustomerAPI.updateStaff(editingStaff.id, {
          name: formData.name,
          permissions: normalizeStaffPermissions(formData.permissions),
        });
        adminToast.success('Staff duties updated');
      } else {
        await adminCustomerAPI.createStaff({
          ...formData,
          permissions: normalizeStaffPermissions(formData.permissions),
        });
        adminToast.success('Staff account created');
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      fetchAdmins();
    } catch (error) {
      adminToast.error(apiErrorMessage(error, editingStaff ? 'Could not update staff' : 'Could not create staff'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminCustomerAPI.updateStatus(id, !currentStatus);
      fetchAdmins();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteStaff = async (id) => {
    const ok = await confirm({
      title: 'Remove staff member',
      message: 'This staff member will lose access to the admin dashboard immediately.',
      confirmLabel: 'Remove staff',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminCustomerAPI.deleteStaff(id);
      adminToast.success('Staff removed');
      fetchAdmins();
    } catch (error) {
      adminToast.error(apiErrorMessage(error, 'Could not remove staff'));
    }
  };

  const visibleAdmins = roleFilter
    ? admins.filter((a) => a.role === roleFilter)
    : admins;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-gold-500/40">{visibleAdmins.length} {roleFilter || 'dashboard'} user(s)</p>
        {roleFilter === 'staff' && (
        <button 
          type="button"
          onClick={handleOpenModal}
          className="px-4 sm:px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20 text-sm"
        >
          <UserPlus size={20} /> Add staff
        </button>
        )}
      </div>
      
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAdmins.length > 0 ? visibleAdmins.map((admin, i) => (
            <div key={i} className={`bg-navy-900/40 border-l-4 border-gold-500 p-6 rounded-r-2xl border-y border-r border-gold-500/10 backdrop-blur-sm group`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-bold text-gold-100 flex items-center gap-2">
                    {admin.name}
                    {admin.is_active === false && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                  </div>
                  <div className="text-xs text-gold-500/40">{admin.email}</div>
                  {admin.role === 'staff' && (
                    <span className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      admin.is_active !== false ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                    }`}>
                      {admin.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded bg-navy-800 border border-gold-500/10 ${admin.role === 'admin' ? 'text-gold-400' : 'text-blue-400'}`}>
                  {admin.role}
                </span>
              </div>
              <div className="pt-4 border-t border-gold-500/5 flex justify-between items-center text-[10px]">
                <span className="text-gold-500/30 uppercase">ID: {admin.id.substring(0, 8)}</span>
                <div className="flex gap-2">
                  {admin.role === 'staff' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(admin)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gold-500/70 hover:text-gold-400 hover:bg-navy-800 transition-all flex items-center gap-1"
                      >
                        <Eye size={14} /> View staff
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteStaff(admin.id)}
                        className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
                        title="Remove Staff"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleToggleStatus(admin.id, admin.is_active !== false)}
                    className="p-1.5 rounded-lg text-gold-500/40 hover:text-gold-500 hover:bg-navy-800 transition-all"
                    title={admin.is_active !== false ? "Suspend Access" : "Restore Access"}
                  >
                    {admin.is_active !== false ? <UserMinus size={14} /> : <CheckCircle2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-gold-500/40 text-sm">No admin accounts found.</div>
          )}
        </div>
      )}

      {/* Admin/Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative flex min-h-full items-center justify-center p-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-navy-900 border border-gold-500/20 rounded-2xl w-full max-w-md max-h-[min(90dvh,720px)] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 justify-between items-center p-6 border-b border-gold-500/10 bg-navy-900/50">
                <h3 className="font-serif font-bold text-gold-100 text-xl">
                  {editingStaff ? 'View staff & re-assign duties' : 'Add staff'}
                </h3>
                <button type="button" onClick={handleCloseModal} className="text-gold-500/40 hover:text-gold-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/60 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-navy-950/50 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-100 focus:outline-none focus:border-gold-500/50 transition-colors placeholder:text-gold-500/20"
                    placeholder="E.g. James Arthur"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gold-500/60 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    readOnly={Boolean(editingStaff)}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full bg-navy-950/50 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-100 focus:outline-none focus:border-gold-500/50 transition-colors placeholder:text-gold-500/20 ${editingStaff ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="staff@prince-esquare.com"
                  />
                </div>

                {!editingStaff && (
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/60 uppercase tracking-widest mb-2">Temporary Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-navy-950/50 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-100 focus:outline-none focus:border-gold-500/50 transition-colors placeholder:text-gold-500/20"
                    placeholder="••••••••"
                  />
                </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gold-500/60 uppercase tracking-widest mb-2">Access role</label>
                  <div className="space-y-2">
                    {STAFF_ACCESS_PRESETS.map((preset) => (
                      <label
                        key={preset.id}
                        className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.accessPreset === preset.id
                            ? 'border-gold-500/50 bg-gold-500/10'
                            : 'border-gold-500/15 bg-navy-950/40 hover:border-gold-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="accessPreset"
                            checked={formData.accessPreset === preset.id}
                            onChange={() => handlePresetChange(preset.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-sm font-bold text-gold-100">{preset.label}</p>
                            <p className="text-[11px] text-gold-500/50 mt-0.5">{preset.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {(formData.accessPreset === 'custom' || editingStaff) && (
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/60 uppercase tracking-widest mb-2">
                    {editingStaff ? 'Assigned duties' : 'Custom duties'}
                  </label>
                  <div className="space-y-3 max-h-52 overflow-y-auto custom-scrollbar p-3 bg-navy-950/50 border border-gold-500/20 rounded-xl">
                    {STAFF_PERMISSION_GROUPS.map((group) => (
                      <div key={group.label}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gold-500/40 mb-1">{group.label}</p>
                        {group.hint && (
                          <p className="text-[10px] text-gold-500/30 mb-2">{group.hint}</p>
                        )}
                        <div className="grid grid-cols-1 gap-2">
                          {group.permissions.map((perm) => (
                            <label key={perm} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm)}
                                onChange={(e) => handlePermissionToggle(perm, e.target.checked)}
                                disabled={perm === 'inventory-manage' && !formData.permissions.includes('inventory-view')}
                                className="w-3.5 h-3.5 rounded border-gold-500/20 bg-navy-900 text-gold-600 focus:ring-0 focus:ring-offset-0"
                              />
                              <span className="text-[10px] uppercase font-bold text-gold-100 group-hover:text-gold-500 transition-colors">
                                {perm.replace(/-/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gold-500/40 mt-2">
                    POS only: checkout without inventory. Inventory view: add products and browse stock read-only. Inventory manage: update stock (admin grants only).
                  </p>
                </div>
                )}
                </div>
                </div>

                <div className="shrink-0 p-6 pt-4 border-t border-gold-500/10 bg-navy-900 rounded-b-2xl">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gold-600 text-navy-950 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gold-500 transition-all disabled:opacity-50"
                  >
                    {submitting ? (editingStaff ? 'SAVING...' : 'CREATING...') : (editingStaff ? 'SAVE CHANGES' : 'CREATE STAFF ACCOUNT')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReviewsView = () => {
  const confirm = useConfirm();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await adminReviewAPI.getAll();
        setReviews(res.data.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminReviewAPI.approve(id);
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: true } : r));
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete review',
      message: 'This customer review will be permanently removed from your store.',
      confirmLabel: 'Delete review',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminReviewAPI.remove(id);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-serif font-bold text-gold-100">Customer Feedback</h3>
          {pendingCount > 0 && (
            <span className="bg-gold-600 text-navy-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-navy-900/40 border border-gold-500/10 p-6 rounded-2xl backdrop-blur-sm relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-gold-500 font-bold border border-gold-500/10">
                    {userInitials({ name: r.user_name, email: r.user_email })}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gold-100">{r.user_name || 'Anonymous'}</div>
                    <div className="text-xs text-gold-500/40">{r.product_name}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={14} className={star <= r.rating ? 'fill-gold-500 text-gold-500' : 'text-gold-500/10'} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gold-200/80 leading-relaxed mb-6 italic">"{r.comment}"</p>
              <div className="flex items-center justify-between border-t border-gold-500/5 pt-4">
                <span className="text-[10px] text-gold-500/30 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!r.is_approved && (
                    <button 
                      onClick={() => handleApprove(r.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-400 text-navy-950 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(r.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-400/20"
                  >
                     <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gold-500/40 text-sm bg-navy-900/40 border border-gold-500/10 rounded-2xl border-dashed">
          No reviews yet.
        </div>
      )}
    </div>
  );
};

const SettingsView = () => {
  const [settings, setSettings] = useState({
    store_name: '',
    support_email: '',
    phone_number: '',
    store_currency: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminSettingsAPI.get();
        setSettings(res.data.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSettingsAPI.update(settings);
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-8 backdrop-blur-sm">
            <h4 className="font-serif font-bold text-xl text-gold-100 mb-6 flex items-center gap-3">
              <Settings size={20} className="text-gold-500" /> Store Information
            </h4>
            {loading ? (
              <div className="py-12 text-center text-gold-500/40 uppercase tracking-widest text-xs">Retrieving configurations...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Store Name', key: 'store_name' },
                  { label: 'Support Email', key: 'support_email' },
                  { label: 'Phone Number', key: 'phone_number' },
                  { label: 'Store Currency', key: 'store_currency' },
                ].map((f, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">{f.label}</label>
                    <input 
                      type="text" 
                      value={settings[f.key] || ''} 
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!f.key.includes('email') && !f.key.includes('phone')) {
                          val = val.toUpperCase();
                        }
                        setSettings({...settings, [f.key]: val});
                      }}
                      className={`w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold ${(!f.key.includes('email') && !f.key.includes('phone')) ? 'uppercase' : ''}`} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-8 backdrop-blur-sm">
            <h4 className="font-serif font-bold text-xl text-gold-100 mb-6 flex items-center gap-3">
              <Mail size={20} className="text-gold-500" /> Notification Preferences
            </h4>
            <div className="space-y-4">
              {[
                'Order Confirmation Emails',
                'Low Stock Alerts',
                'New Customer Registrations',
                'Daily Sales Summaries'
              ].map((pref, i) => (
                <label key={i} className="flex items-center justify-between p-4 bg-navy-950/50 rounded-xl border border-gold-500/5 cursor-pointer group">
                  <span className="text-xs font-bold text-gold-100 group-hover:text-gold-500 transition-colors uppercase">{pref}</span>
                  <div className="w-12 h-6 bg-navy-800 rounded-full relative border border-gold-500/20">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-gold-600 rounded-full" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-8 backdrop-blur-sm">
             <h5 className="text-[10px] font-black text-gold-500/40 uppercase tracking-widest mb-6 border-b border-gold-500/10 pb-2">System Integrations</h5>
             <div className="space-y-6">
                {[
                  { label: 'Daraja API', val: 'Connected', color: 'text-green-400' },
                  { label: 'Cloudinary', val: 'Operational', color: 'text-green-400' },
                  { label: 'PostgreSQL', val: 'Connected', color: 'text-green-400' },
                  { label: 'SendGrid', val: 'Operational', color: 'text-green-400' },
                ].map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gold-100 uppercase">{h.label}</span>
                    <span className={`text-[10px] font-black uppercase ${h.color}`}>{h.val}</span>
                  </div>
                ))}
             </div>
           </div>

           <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-5 bg-gold-600 text-navy-950 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-gold-600/10 hover:bg-gold-500 transition-all disabled:opacity-50"
           >
             {saving ? 'UPDATING...' : 'SAVE CONFIGURATIONS'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
