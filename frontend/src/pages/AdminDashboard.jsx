import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingBag, Tag, Award, Users, 
  ShieldCheck, Ticket, Image as ImageIcon, Mail, 
  Star, Settings, LogOut, Bell, Search, Menu, X, 
  ArrowUpRight, ArrowDownRight, MoreVertical, Plus, 
  Download, Filter, CheckCircle2, AlertCircle, Clock, 
  UserPlus, UserMinus, Trash2, Edit, Eye, ChevronRight,
  Phone, Globe, Truck, CreditCard, CreditCard as CardIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  adminAnalyticsAPI, 
  adminOrderAPI, 
  adminProductAPI, 
  adminCategoryAPI, 
  adminBrandAPI, 
  adminCustomerAPI,
  adminCouponAPI,
  adminBannerAPI,
  adminNewsletterAPI,
  adminReviewAPI,
  adminSettingsAPI,
  adminUploadAPI
} from '../services/api';
import { useEffect } from 'react';
import { getUploadUrl, getImageSrc, parseProductImages, toImageJson } from '../utils/cloudinary';

/** Scrollable table wrapper for mobile */
const AdminTable = ({ children }) => (
  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">{children}</div>
);

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { user, isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) return null;

  const handleLogout = async () => {
    try {
      // Optional: call backend logout
      // await adminAuthAPI.logout(); 
    } catch (e) {}
    logout();
    navigate('/admin/login');
  };

  const allSidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'orders', label: 'Orders', icon: Package, section: 'Store' },
    { id: 'products', label: 'Products', icon: ShoppingBag, section: 'Store' },
    { id: 'customers', label: 'Customers', icon: Users, section: 'People' },
    { id: 'admins', label: 'Admins', icon: ShieldCheck, section: 'People' },
    { id: 'coupons', label: 'Coupons', icon: Ticket, section: 'Marketing' },
    { id: 'banners', label: 'Banners', icon: ImageIcon, section: 'Marketing' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, section: 'Marketing' },
    { id: 'finance', label: 'Finance', icon: CardIcon, section: 'Finance' },
    { id: 'reviews', label: 'Reviews', icon: Star, section: 'Finance', badge: '5' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  ];

  const sidebarItems = allSidebarItems.filter(item => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'staff') {
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      return perms.includes(item.id);
    }
    return false;
  });

  // Redirect to first available section if current activeSection is not permitted
  useEffect(() => {
    if (user?.role === 'staff' && sidebarItems.length > 0) {
      if (!sidebarItems.find(i => i.id === activeSection)) {
        setActiveSection(sidebarItems[0].id);
      }
    }
  }, [user, sidebarItems, activeSection]);

  const renderContent = () => {
    // Basic protection inside renderContent as well
    if (user?.role === 'staff') {
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      if (!perms.includes(activeSection)) {
        return <div className="p-8 text-center text-red-400">Unauthorized Access</div>;
      }
    }

    switch (activeSection) {
      case 'dashboard': return <DashboardView />;
      case 'orders': return <OrdersView />;
      case 'products': return <ProductsView />;
      case 'customers': return <CustomersView />;
      case 'admins': return <AdminsView />;
      case 'coupons': return <CouponsView />;
      case 'banners': return <BannersView />;
      case 'newsletter': return <NewsletterView />;
      case 'finance': return <FinanceView />;
      case 'reviews': return <ReviewsView />;
      case 'settings': return <SettingsView />;
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

  return (
    <div className="flex h-screen bg-navy-950 text-gold-50 font-sans overflow-hidden">
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
          isSidebarOpen ? 'w-64' : 'w-20'
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
          {['Overview', 'Store', 'People', 'Marketing', 'Finance', 'System'].map((section) => (
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
              {(isMobileNavOpen || isSidebarOpen) ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:block h-8 w-[1px] bg-gold-500/10 mx-1 sm:mx-2" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-gold-500/40 uppercase tracking-widest truncate">Admin / Overview</span>
              <h2 className="text-base sm:text-xl font-serif font-bold text-gold-100 capitalize truncate">
                {activeSection.replace('-', ' ')}
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
              <div className="h-10 w-10 bg-gradient-to-br from-gold-400 to-gold-700 rounded-full flex items-center justify-center text-navy-950 font-bold border-2 border-navy-800 cursor-pointer hover:scale-105 transition-transform">
                AD
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
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- Sub-views ---

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, topRes, lowStockRes, chartRes] = await Promise.all([
          adminAnalyticsAPI.getStats(),
          adminAnalyticsAPI.getTopProducts(),
          adminAnalyticsAPI.getLowStock(),
          adminAnalyticsAPI.getSalesChart()
        ]);
        
        setStats(statsRes.data.data);
        setTopProducts(topRes.data.data);
        setLowStock(lowStockRes.data.data);
        setSalesData(chartRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `KSh ${stats?.revenue?.toLocaleString()}`, icon: CreditCard },
    { label: 'Total Profit', value: `KSh ${stats?.profit?.toLocaleString()}`, icon: Tag },
    { label: 'Total Orders', value: stats?.orders || 0, icon: Package },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart Placeholder */}
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

        {/* Top Products */}
        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-gold-500/10 flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-gold-100">Top Products</h3>
            <button className="text-xs font-bold text-gold-500 hover:text-gold-400 transition-colors uppercase tracking-widest">Analytics</button>
          </div>
          <div className="p-6 space-y-6">
            {topProducts.length > 0 ? topProducts.map((product, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gold-200">{product.name}</span>
                  <span className="text-gold-500/60 font-bold">{product.sales} units sold</span>
                </div>
                <div className="h-2 bg-navy-800 rounded-full overflow-hidden border border-gold-500/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(product.sales / (topProducts[0]?.sales || 1)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                  />
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gold-500/40 text-sm">No sales data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-gold-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <h3 className="font-serif font-bold text-lg text-gold-100">Low Stock Alerts</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-navy-800/50">
              <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em] border-b border-gold-500/10">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {lowStock.length > 0 ? lowStock.map((item, i) => (
                <tr key={i} className="hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gold-100">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${item.stock === 0 ? 'text-red-500 bg-red-500/10' : 'text-red-400 bg-red-400/10'} px-2 py-1 rounded-lg`}>
                      {item.stock} units left
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gold-500 hover:text-gold-400 p-2 bg-navy-800/50 rounded-lg border border-gold-500/10 transition-all">
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gold-500/40 text-sm">All products are well-stocked</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await adminOrderAPI.getAll();
        setOrders(res.data.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = filter === 'All' 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
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
          <button className="flex items-center gap-2 px-4 py-2 bg-navy-800/50 border border-gold-500/10 rounded-xl text-xs font-bold text-gold-500 hover:bg-navy-800 transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <table className="w-full text-left">
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
                      <button className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all" title="View Details"><Eye size={16} /></button>
                      <button className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all" title="Edit Order"><Edit size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No orders found matching this criteria.
          </div>
        )}
      </div>
    </div>
  );
};

const formatMoney = (value) => `KSh ${Math.round(Number(value) || 0).toLocaleString()}`;

const getPeriodStart = (period) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'daily') return start;
  if (period === 'weekly') {
    start.setDate(start.getDate() - 6);
    return start;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getPeriodLabel = (period) => {
  if (period === 'daily') return 'Today';
  if (period === 'weekly') return 'Last 7 days';
  return 'This month';
};

const buildSeries = (orders, period) => {
  const buckets = new Map();
  const now = new Date();
  const size = period === 'daily' ? 7 : period === 'weekly' ? 8 : 6;

  for (let i = size - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    if (period === 'daily') d.setDate(now.getDate() - i);
    if (period === 'weekly') d.setDate(now.getDate() - i * 7);
    if (period === 'monthly') d.setMonth(now.getMonth() - i);

    const label = period === 'daily'
      ? d.toLocaleDateString(undefined, { weekday: 'short' })
      : period === 'weekly'
        ? `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString(undefined, { month: 'short' })}`
        : d.toLocaleDateString(undefined, { month: 'short' });
    buckets.set(label, 0);
  }

  orders.forEach((order) => {
    const d = new Date(order.created_at);
    const label = period === 'daily'
      ? d.toLocaleDateString(undefined, { weekday: 'short' })
      : period === 'weekly'
        ? `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString(undefined, { month: 'short' })}`
        : d.toLocaleDateString(undefined, { month: 'short' });
    if (buckets.has(label)) {
      buckets.set(label, buckets.get(label) + Number(order.total_amount || 0));
    }
  });

  return Array.from(buckets, ([label, total]) => ({ label, total }));
};

const FinanceView = () => {
  const [period, setPeriod] = useState('daily');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, orders: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [isLowStockOpen, setIsLowStockOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingStockId, setSavingStockId] = useState(null);

  const stockKey = (product, variant = null) => variant
    ? `${product.id}:variant:${variant.id || `${variant.color}-${variant.size}`}`
    : `${product.id}:total`;

  const getVariantRows = (product) => Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.color || variant.size || variant.id)
    : [];

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const [statsRes, topRes, orderRes, productRes] = await Promise.all([
        adminAnalyticsAPI.getStats().catch(() => ({ data: { data: {} } })),
        adminAnalyticsAPI.getTopProducts().catch(() => ({ data: { data: [] } })),
        adminOrderAPI.getAll().catch(() => ({ data: { data: [] } })),
        adminProductAPI.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      const fetchedOrders = orderRes.data.data || [];
      const fetchedProducts = productRes.data.data || [];
      const recentOrders = fetchedOrders.slice(0, 60);
      const details = await Promise.all(
        recentOrders.map((order) =>
          adminOrderAPI.getOne(order.id)
            .then((res) => res.data.data)
            .catch(() => ({ ...order, items: [] }))
        )
      );

      setStats(statsRes.data.data || {});
      setTopProducts(topRes.data.data || []);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setOrderDetails(details);
      const drafts = {};
      fetchedProducts.forEach((product) => {
        drafts[stockKey(product)] = product.stock_quantity ?? 0;
        getVariantRows(product).forEach((variant) => {
          drafts[stockKey(product, variant)] = variant.stock ?? variant.stock_quantity ?? 0;
        });
      });
      setStockDrafts(drafts);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const periodOrders = orders.filter((order) => {
    const createdAt = new Date(order.created_at);
    return createdAt >= getPeriodStart(period) && order.status !== 'cancelled';
  });

  const productCost = new Map(products.map((p) => [p.id, Number(p.cost_price || 0)]));
  const productMeta = new Map(products.map((p) => [p.id, p]));
  const periodOrderIds = new Set(periodOrders.map((order) => order.id));
  const soldMap = new Map();

  orderDetails
    .filter((order) => periodOrderIds.has(order.id))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        const productId = item.product_id;
        const unitPrice = Number(item.price || 0);
        const quantity = Number(item.quantity || 0);
        const revenue = unitPrice * quantity;
        const unitCost = productCost.get(productId) || unitPrice * 0.65;
        const profit = revenue - unitCost * quantity;
        const existing = soldMap.get(productId) || {
          id: productId,
          name: item.name || productMeta.get(productId)?.name || 'Product',
          quantity: 0,
          revenue: 0,
          profit: 0,
        };

        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.profit += profit;
        soldMap.set(productId, existing);
      });
    });

  const soldProducts = Array.from(soldMap.values()).sort((a, b) => b.quantity - a.quantity);
  const periodRevenue = periodOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const periodProfit = soldProducts.length
    ? soldProducts.reduce((sum, item) => sum + item.profit, 0)
    : periodRevenue * 0.35;
  const getProductStockTotal = (product) => {
    const variants = getVariantRows(product);
    if (!variants.length) return Number(product.stock_quantity || 0);
    return variants.reduce((sum, variant) => sum + Number(variant.stock ?? variant.stock_quantity ?? 0), 0);
  };

  const inventoryRows = products.flatMap((product) => {
    const variants = getVariantRows(product);
    if (!variants.length) {
      return [{
        product,
        variant: null,
        key: stockKey(product),
        name: product.name,
        size: 'Standard',
        color: null,
        stock: Number(product.stock_quantity || 0),
        stockId: null,
      }];
    }

    return variants.map((variant) => ({
      product,
      variant,
      key: stockKey(product, variant),
      name: product.name,
      size: variant.size || 'Standard',
      color: variant.color || null,
      stock: Number(variant.stock ?? variant.stock_quantity ?? 0),
      stockId: variant.stock_id || null,
    }));
  });

  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price || 0) * getProductStockTotal(p), 0);
  const totalStock = products.reduce((sum, p) => sum + getProductStockTotal(p), 0);
  const lowStockRows = inventoryRows.filter((row) => row.stock <= 5).sort((a, b) => a.stock - b.stock);
  const chartData = buildSeries(orders.filter((order) => order.status !== 'cancelled'), period);
  const maxChart = Math.max(...chartData.map((item) => item.total), 1);

  const handleStockSave = async (product) => {
    setSavingStockId(product.id);
    try {
      const variants = getVariantRows(product);
      const nextVariants = variants.map((variant) => ({
        ...variant,
        stock: Number(stockDrafts[stockKey(product, variant)]) || 0,
        price_override: variant.price_override ?? variant.price_modifier ?? 0,
        stock_id: variant.stock_id || null,
      }));
      const nextProductStock = variants.length
        ? nextVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
        : Number(stockDrafts[stockKey(product)]) || 0;

      await adminProductAPI.update(product.id, {
        ...product,
        stock_quantity: nextProductStock,
        images: Array.isArray(product.images) ? product.images : [],
        variants: variants.length ? nextVariants : [],
      });
        await fetchFinance();
        setStockModalProduct(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Could not update stock.');
    } finally {
      setSavingStockId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500/40">Money, stock, and movement</span>
          <h3 className="text-3xl font-serif font-bold text-gold-100 mt-2">Finance Control Room</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                period === p
                  ? 'bg-gold-600 text-navy-950 border-gold-600'
                  : 'bg-navy-900/50 text-gold-500/70 border-gold-500/10 hover:border-gold-500/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: `${getPeriodLabel(period)} Revenue`, value: formatMoney(periodRevenue), detail: `${periodOrders.length} orders`, icon: CreditCard },
          { label: `${getPeriodLabel(period)} Profit`, value: formatMoney(periodProfit), detail: 'Uses cost price when available', icon: ArrowUpRight },
          { label: 'Inventory Value', value: formatMoney(inventoryValue), detail: `${totalStock.toLocaleString()} pieces in stock`, icon: Package },
          { label: 'Low Stock Alerts', value: lowStockRows.length, detail: 'Sizes at 5 units or less', icon: AlertCircle, action: () => setIsLowStockOpen(true) },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.action}
            className="text-left bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm transition-all hover:border-gold-500/40 disabled:hover:border-gold-500/10"
            disabled={!card.action}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 rounded-xl bg-gold-600/10 border border-gold-500/10 flex items-center justify-center text-gold-500">
                <card.icon size={20} />
              </div>
              <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">Live</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500/40 font-black">{card.label}</p>
            <h4 className="text-2xl font-serif font-bold text-gold-100 mt-2">{card.value}</h4>
            <p className="text-xs text-gold-500/40 mt-2">{card.detail}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-serif font-bold text-xl text-gold-100">Revenue Graph</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">{getPeriodLabel(period)}</span>
          </div>
          <div className="h-72 flex items-end gap-3">
            {chartData.map((item) => (
              <div key={item.label} className="flex-1 h-full flex flex-col justify-end gap-3">
                <div className="text-[10px] text-gold-500/50 text-center">{formatMoney(item.total).replace('KSh ', '')}</div>
                <div className="h-56 flex items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-gold-700 to-gold-400 min-h-[8px]"
                    style={{ height: `${Math.max(5, (item.total / maxChart) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gold-500/40 text-center">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm">
          <h4 className="font-serif font-bold text-xl text-gold-100 mb-6">Top Movers</h4>
          <div className="space-y-4">
            {(soldProducts.length ? soldProducts : topProducts).slice(0, 6).map((item, index) => (
              <div key={item.id || item.name} className="flex items-center justify-between p-4 rounded-xl bg-navy-950/50 border border-gold-500/5">
                <div>
                  <p className="text-sm font-bold text-gold-100">{item.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold-500/40">Rank #{index + 1}</p>
                </div>
                <span className="text-gold-500 font-black">{item.quantity || item.sales || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-gold-500/10 flex items-center justify-between">
            <h4 className="font-serif font-bold text-xl text-gold-100">Products Sold - {getPeriodLabel(period)}</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">{soldProducts.length} products</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-navy-800/50">
                <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Sold</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/5">
                {soldProducts.length ? soldProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-navy-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gold-100">{item.name}</td>
                    <td className="px-6 py-4 text-gold-500 font-black">{item.quantity}</td>
                    <td className="px-6 py-4 text-gold-100">{formatMoney(item.revenue)}</td>
                    <td className="px-6 py-4 text-green-400">{formatMoney(item.profit)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gold-500/40 text-sm">No sold products in this period yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-gold-500/10 flex items-center justify-between">
            <h4 className="font-serif font-bold text-xl text-gold-100">Stock Manager</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">{totalStock.toLocaleString()} total pieces</span>
          </div>
          <div className="max-h-[520px] overflow-y-auto custom-scrollbar divide-y divide-gold-500/5">
            {products.slice(0, 18).map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => setStockModalProduct(product)}
                className="w-full p-5 hover:bg-navy-800/20 transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold-500/30">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                    <p className="text-sm font-bold text-gold-100 uppercase">{product.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/40">
                      {product.category_name || 'Uncategorized'} - {formatMoney(product.price)} - Total stock {getProductStockTotal(product)}
                    </p>
                  </div>
                </div>
                  <span className="px-4 py-2 border border-gold-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold-500">
                    Manage
                  </span>
                  </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {stockModalProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-gold-500/20 rounded-3xl p-6 w-full max-w-3xl max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                  {stockModalProduct.thumbnail ? (
                    <img src={stockModalProduct.thumbnail} alt={stockModalProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold-500/30">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xl font-serif font-bold text-gold-100 uppercase">{stockModalProduct.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mt-1">
                    {stockModalProduct.category_name || 'Uncategorized'} - {formatMoney(stockModalProduct.price)}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setStockModalProduct(null)} className="text-gold-500/40 hover:text-gold-500">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3">
              {getVariantRows(stockModalProduct).length > 0 ? getVariantRows(stockModalProduct).map((variant) => (
                <div key={stockKey(stockModalProduct, variant)} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-navy-950/60 border border-gold-500/5 rounded-2xl p-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gold-100">
                      Size {variant.size || 'Standard'}{variant.color ? ` - ${variant.color}` : ''}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-gold-500/30 mt-1">
                      Stock ID: {variant.stock_id || 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStockDrafts({
                        ...stockDrafts,
                        [stockKey(stockModalProduct, variant)]: Math.max(0, Number(stockDrafts[stockKey(stockModalProduct, variant)] ?? 0) - 1),
                      })}
                      className="w-10 h-10 rounded-xl bg-navy-800 border border-gold-500/10 text-gold-500 font-black"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={stockDrafts[stockKey(stockModalProduct, variant)] ?? 0}
                      onChange={(e) => setStockDrafts({ ...stockDrafts, [stockKey(stockModalProduct, variant)]: e.target.value })}
                      className="w-24 bg-navy-900 border border-gold-500/10 rounded-xl py-3 px-3 text-gold-100 text-sm outline-none focus:border-gold-500/40 font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setStockDrafts({
                        ...stockDrafts,
                        [stockKey(stockModalProduct, variant)]: Number(stockDrafts[stockKey(stockModalProduct, variant)] ?? 0) + 1,
                      })}
                      className="w-10 h-10 rounded-xl bg-navy-800 border border-gold-500/10 text-gold-500 font-black"
                    >
                      +
                    </button>
                  </div>
                </div>
              )) : (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-navy-950/60 border border-gold-500/5 rounded-2xl p-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gold-100">Product total stock</p>
                    <p className="text-[9px] uppercase tracking-widest text-gold-500/30 mt-1">No size variants saved</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={stockDrafts[stockKey(stockModalProduct)] ?? 0}
                    onChange={(e) => setStockDrafts({ ...stockDrafts, [stockKey(stockModalProduct)]: e.target.value })}
                    className="w-28 bg-navy-900 border border-gold-500/10 rounded-xl py-3 px-3 text-gold-100 text-sm outline-none focus:border-gold-500/40 font-bold text-center"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gold-500/10">
              <button type="button" onClick={() => setStockModalProduct(null)} className="px-6 py-3 rounded-xl bg-navy-800 text-gold-500/70 text-[10px] font-black uppercase tracking-widest">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStockSave(stockModalProduct)}
                disabled={savingStockId === stockModalProduct.id}
                className="px-6 py-3 rounded-xl bg-gold-600 text-navy-950 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {savingStockId === stockModalProduct.id ? 'Updating' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLowStockOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-gold-500/20 rounded-3xl p-6 w-full max-w-3xl max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-serif font-bold text-gold-100 uppercase tracking-widest">Low Stock Sizes</h4>
              <button type="button" onClick={() => setIsLowStockOpen(false)} className="text-gold-500/40 hover:text-gold-500">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-3">
              {lowStockRows.length ? lowStockRows.map((row) => (
                <button
                  type="button"
                  key={row.key}
                  onClick={() => {
                    setIsLowStockOpen(false);
                    setStockModalProduct(row.product);
                  }}
                  className="w-full flex items-center justify-between gap-4 bg-navy-950/60 border border-gold-500/5 rounded-2xl p-4 text-left hover:border-gold-500/30"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                      {row.product.thumbnail && <img src={row.product.thumbnail} alt={row.product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gold-100 uppercase">{row.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gold-500/40">
                        Size {row.size}{row.color ? ` - ${row.color}` : ''} - {row.stockId || 'No stock ID'}
                      </p>
                    </div>
                  </div>
                  <span className="text-red-400 text-sm font-black">{row.stock} left</span>
                </button>
              )) : (
                <div className="py-12 text-center text-gold-500/40 text-sm">No low stock sizes right now.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500/30">
        Finance data is loaded through the live admin orders, order-detail, product, and analytics APIs. Stock updates are saved back to the product API by size.
      </p>
    </div>
  );
};


const toStockIdPart = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const buildStockId = (productName) => {
  const productPart = toStockIdPart(productName) || 'PRODUCT';
  return `${productPart}-STOCK`;
};

const buildSizeRows = (flatVariants) => {
  return (flatVariants || [])
    .filter((variant) => variant.size)
    .map((variant) => ({
      _key: Math.random().toString(36).slice(2),
      id: variant.id,
      size: String(variant.size || '').toUpperCase(),
      stock: variant.stock ?? variant.stock_quantity ?? 0,
      price_override: variant.price_override ?? variant.price_modifier ?? '',
    }));
};

const flattenSizeRows = (sizeRows, stockId, imageUrl) => {
  return (sizeRows || [])
    .filter((row) => row.size?.trim())
    .map((row) => ({
      id: row.id,
      color: null,
      size: String(row.size).trim().toUpperCase(),
      stock: parseInt(row.stock, 10) || 0,
      price_override: row.price_override === '' || row.price_override == null ? 0 : parseFloat(row.price_override) || 0,
      image_url: imageUrl || null,
      stock_id: stockId?.trim() || null,
    }));
};

const getSizeOptionsForCategory = (categoryName = '') => {
  const name = categoryName.toLowerCase();
  if (name.includes('shoe') || name.includes('loafer') || name.includes('boot') || name.includes('sandal')) {
    return ['39', '40', '41', '42', '43', '44', '45', '46'];
  }
  if (name.includes('trouser') || name.includes('chino') || name.includes('jeans') || name.includes('khaki') || name.includes('gurkha')) {
    return ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
  }
  return ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
};

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [customSize, setCustomSize] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    show_offer: false,
    stock_id: '',
    parent_category_id: '',
    category_id: '',
    stock_quantity: 0,
    is_featured: false,
    is_active: true,
    thumbnail: '',
    images: [], // This will store the final URLs for saving
    sizeRows: [],
    thumbnailFile: null,
    thumbnailPreview: '',
    gallery: [] // Combined state: { id, preview, url, isUploading }
  });

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    const skipUppercase = ['thumbnail', 'slug', 'description', 'image', 'logo', 'url', 'email', 'phone'];
    if (typeof value === 'string' && !skipUppercase.some(s => field.toLowerCase().includes(s))) {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [field]: value });
  };

  const removeGalleryFile = (index) => {
    const nextGallery = [...formData.gallery];
    const removedItem = nextGallery.splice(index, 1)[0];
    
    // Revoke blob if needed
    if (removedItem.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(removedItem.preview);
    }

    // Also update images array which is used for saving
    const nextImages = nextGallery.map(item => item.url).filter(Boolean);
    
    setFormData({ 
        ...formData, 
        gallery: nextGallery,
        images: nextImages
    });
  };

  const removeThumbnail = () => {
    setFormData({ ...formData, thumbnail: '', thumbnailPreview: '' });
  };

  const [uploading, setUploading] = useState(false);

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const localPreview = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        thumbnailPreview: localPreview,
        thumbnail: localPreview
      }));
      
      const uploadData = new FormData();
      uploadData.append('images', file);
      try {
        const res = await adminUploadAPI.upload(uploadData);
        if (res.data.success) {
          const uploaded = res.data.data[0];
          const finalUrl = getUploadUrl(uploaded);
          setFormData(prev => ({ 
            ...prev, 
            thumbnail: finalUrl,
            thumbnailPreview: getImageSrc(uploaded) || finalUrl 
          }));
        }
      } catch (error) {
        console.error('Thumbnail upload failed:', error);
        alert('Image upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleGalleryChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Add placeholders with local previews
    const newItems = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        preview: URL.createObjectURL(file),
        url: null,
        isUploading: true
    }));

    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, ...newItems]
    }));

    const uploadData = new FormData();
    files.forEach(file => uploadData.append('images', file));
    try {
      const res = await adminUploadAPI.upload(uploadData);
      if (res.data.success) {
        const uploadedUrls = res.data.data;
        setFormData(prev => {
            const nextGallery = [...prev.gallery];
            // Match uploaded URLs to our new items (simple sequential match for now)
            let urlIdx = 0;
            const updatedGallery = nextGallery.map(item => {
                if (item.isUploading && urlIdx < uploadedUrls.length) {
                    const uploaded = uploadedUrls[urlIdx++];
                    const url = getUploadUrl(uploaded);
                    return { ...item, url, urlJson: toImageJson(uploaded), preview: getImageSrc(uploaded) || url, isUploading: false };
                }
                return item;
            });
            return { 
                ...prev, 
                gallery: updatedGallery,
                images: updatedGallery.map(i => i.urlJson || toImageJson(i.url)).filter(Boolean)
            };
        });
      }
    } catch (error) {
      console.error('Gallery upload failed:', error);
      alert('One or more gallery images failed to upload.');
      // Remove the failed ones
      setFormData(prev => ({
          ...prev,
          gallery: prev.gallery.filter(i => !i.isUploading)
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleToggleSize = (size) => {
    const exists = formData.sizeRows.some((row) => row.size === size);
    const nextRows = exists
      ? formData.sizeRows.filter((row) => row.size !== size)
      : [...formData.sizeRows, { _key: Math.random().toString(36).slice(2), id: undefined, size, stock: 0, price_override: '' }];
    setFormData({
      ...formData,
      sizeRows: nextRows,
      stock_quantity: nextRows.reduce((sum, row) => sum + (parseInt(row.stock, 10) || 0), 0),
    });
  };

  const handleAddCustomSize = () => {
    const nextSize = customSize.trim().toUpperCase();
    if (!nextSize) return;
    if (!formData.sizeRows.some((row) => row.size === nextSize)) {
      const nextRows = [
        ...formData.sizeRows,
        { _key: Math.random().toString(36).slice(2), id: undefined, size: nextSize, stock: 0, price_override: '' },
      ];
      setFormData({
        ...formData,
        sizeRows: nextRows,
        stock_quantity: nextRows.reduce((sum, row) => sum + (parseInt(row.stock, 10) || 0), 0),
      });
    }
    setCustomSize('');
  };

  const handleSizeChange = (size, field, value) => {
    const nextRows = formData.sizeRows.map((row) => row.size === size ? { ...row, [field]: value } : row);
    setFormData({
      ...formData,
      sizeRows: nextRows,
      stock_quantity: field === 'stock' ? nextRows.reduce((sum, row) => sum + (parseInt(row.stock, 10) || 0), 0) : formData.stock_quantity,
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminProductAPI.getAll(),
        adminCategoryAPI.getAll(),
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parentCategories = categories.filter((category) => !category.parent_id);
  const selectedParentCategory = categories.find((category) => category.id === formData.parent_category_id);
  const selectedCategory = categories.find((category) => category.id === formData.category_id);
  const subCategories = formData.parent_category_id ? categories.filter((category) => category.parent_id === formData.parent_category_id) : [];
  const sizeOptions = getSizeOptionsForCategory(selectedCategory?.name || selectedParentCategory?.name || '');
  const displaySizeOptions = [...new Set([...sizeOptions, ...formData.sizeRows.map((row) => row.size)])];

  const handleCategorySelect = (category) => {
    setFormData({
      ...formData,
      parent_category_id: category.id,
      category_id: category.id,
      sizeRows: [],
      stock_quantity: 0,
    });
  };

  const handleSubCategorySelect = (category) => {
    setFormData({
      ...formData,
      category_id: category.id,
      sizeRows: [],
      stock_quantity: 0,
    });
  };

  const handleOpenModal = (product = null) => {
    const productCategory = categories.find((category) => category.id === product?.category_id);
    const parentCategoryId = productCategory?.parent_id || productCategory?.id || '';
    const productSizeRows = buildSizeRows(Array.isArray(product?.variants) ? product.variants : []);
    const productStockId = product?.variants?.find((variant) => variant.stock_id)?.stock_id || buildStockId(product?.name);

    if (product) {
      setCurrentProduct(product);
      setCustomSize('');
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price || '',
        discount_price: product.discount_price || '',
        show_offer: Boolean(product.discount_price),
        stock_id: productStockId,
        parent_category_id: parentCategoryId,
        category_id: product.category_id || '',
        stock_quantity: productSizeRows.length ? productSizeRows.reduce((sum, row) => sum + (parseInt(row.stock, 10) || 0), 0) : product.stock_quantity || 0,
        is_featured: product.is_featured || false,
        is_active: product.is_active ?? true,
        thumbnail: product.thumbnail || '',
        images: Array.isArray(product.images) ? product.images : [],
        sizeRows: productSizeRows,
        thumbnailPreview: product.thumbnail || '',
        gallery: parseProductImages(product.images).map((img) => ({
          id: Math.random().toString(36).substring(7),
          preview: getImageSrc(img),
          url: getImageSrc(img),
          urlJson: img,
          isUploading: false,
        }))
      });
    } else {
      setCurrentProduct(null);
      setCustomSize('');
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        discount_price: '',
        show_offer: false,
        stock_id: '',
        parent_category_id: '',
        category_id: '',
        stock_quantity: 0,
        is_featured: false,
        is_active: true,
        thumbnail: '',
        images: [],
        sizeRows: [],
        thumbnailPreview: '',
        gallery: []
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminProductAPI.remove(id);
        fetchData();
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      alert('Please select a category before saving this product.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData };
      payload.variants = flattenSizeRows(formData.sizeRows, formData.stock_id || buildStockId(formData.name), formData.thumbnail);
      payload.stock_quantity = formData.sizeRows.length
        ? formData.sizeRows.reduce((sum, row) => sum + (parseInt(row.stock, 10) || 0), 0)
        : parseInt(formData.stock_quantity, 10) || 0;
      payload.brand_id = null;

      // Remove frontend-only state fields
      delete payload.thumbnailPreview;
      delete payload.galleryPreviews;
      delete payload.gallery;
      delete payload.thumbnailFile;
      delete payload.galleryFiles;
      delete payload.galleryPreviews;
      delete payload.sizeRows;
      delete payload.stock_id;
      delete payload.parent_category_id;
      delete payload.show_offer;
      delete payload.cost_price;
      payload.discount_price = formData.show_offer ? formData.discount_price || null : null;

      if (currentProduct) {
        await adminProductAPI.update(currentProduct.id, payload);
      } else {
        await adminProductAPI.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-serif font-bold text-gold-100 uppercase tracking-widest">Inventory ({products.length})</h3>
        <button 
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20 text-xs sm:text-sm"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm text-gold-100">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : products.length > 0 ? (
          <AdminTable>
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-navy-800/50">
              <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-navy-800 rounded-xl border border-gold-500/10 overflow-hidden flex items-center justify-center">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={24} className="text-gold-500/40" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gold-100 uppercase">{p.name}</div>
                        <div className="text-[10px] font-mono text-gold-500/40 uppercase mt-1">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-gold-500/60 uppercase">{p.category_name || 'Uncategorized'}</td>
                  <td className="px-6 py-4 font-bold text-gold-100">KSh {parseFloat(p.price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className={`text-[10px] font-black uppercase ${p.stock_quantity === 0 ? 'text-red-400' : p.stock_quantity < 10 ? 'text-gold-500' : 'text-green-400'}`}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : `${p.stock_quantity} units`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.is_active ? 'bg-green-400/10 text-green-400' : 'bg-navy-800 text-gold-500/30'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTable>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm uppercase tracking-widest">
            No products found in inventory.
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 bg-navy-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-900 border border-gold-500/20 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-2xl font-serif font-bold text-gold-100 uppercase tracking-widest">
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gold-500/40 hover:text-gold-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Info */}
              <div className="space-y-6">
                <h5 className="text-xs font-black text-gold-500 uppercase tracking-[0.3em] border-b border-gold-500/10 pb-2">General Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData({
                          ...formData,
                          name: val,
                          slug: val.toLowerCase().replace(/ /g, '-'),
                          stock_id: formData.stock_id ? formData.stock_id : buildStockId(val),
                        });
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
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Price (KSh)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Total Stock</label>
                    <input 
                      type="number" 
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gold-500/10 bg-navy-950/60 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-400">Offers</p>
                      <p className="text-[9px] uppercase tracking-wider text-gold-500/35 mt-1">Enable when this product has a sale or special price.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        show_offer: !formData.show_offer,
                        discount_price: formData.show_offer ? '' : formData.discount_price
                      })}
                      className={`relative h-8 w-16 rounded-full border transition-all ${formData.show_offer ? 'bg-gold-600 border-gold-500' : 'bg-navy-900 border-gold-500/20'}`}
                      aria-pressed={formData.show_offer}
                    >
                      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${formData.show_offer ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>

                  {formData.show_offer && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Offer Price (KSh)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                        className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gold-500/10 bg-navy-950/60 p-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-400">Category</p>
                    <p className="text-[9px] uppercase tracking-wider text-gold-500/35 mt-1">Tick the main category first, then tick a subcategory when it applies.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {parentCategories.map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                          formData.parent_category_id === category.id
                            ? 'border-gold-500 bg-gold-600/10 text-gold-100'
                            : 'border-gold-500/10 bg-navy-900/50 text-gold-500/60 hover:border-gold-500/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.parent_category_id === category.id}
                          onChange={() => handleCategorySelect(category)}
                          className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">{category.name}</span>
                      </label>
                    ))}
                  </div>

                  {subCategories.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gold-500/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gold-500/50">Subcategory</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {subCategories.map((category) => (
                          <label
                            key={category.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                              formData.category_id === category.id
                                ? 'border-gold-500 bg-gold-600/10 text-gold-100'
                                : 'border-gold-500/10 bg-navy-900/50 text-gold-500/60 hover:border-gold-500/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.category_id === category.id}
                              onChange={() => handleSubCategorySelect(category)}
                              className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                    className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all h-24 font-bold uppercase"
                  />
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-6">
                <h5 className="text-xs font-black text-gold-500 uppercase tracking-[0.3em] border-b border-gold-500/10 pb-2">Product Media</h5>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Main Thumbnail</label>
                    <div className="flex items-center gap-6 p-6 bg-navy-950 border-2 border-dashed border-gold-500/10 rounded-2xl group hover:border-gold-500/30 transition-all relative">
                      {uploading && (
                        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent animate-spin rounded-full" />
                             <span className="text-[8px] font-black uppercase text-gold-500 tracking-widest">Uploading to Cloudinary...</span>
                          </div>
                        </div>
                      )}
                      <div className="w-24 h-24 rounded-xl border border-gold-500/20 overflow-hidden bg-navy-900 flex items-center justify-center relative group">
                        {formData.thumbnailPreview ? (
                          <>
                            <img src={formData.thumbnailPreview} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={removeThumbnail}
                              className="absolute inset-0 bg-red-500/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="text-gold-500/20" size={32} />
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleThumbnailChange}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                          </>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-black text-gold-100 uppercase tracking-widest">
                          {formData.thumbnailPreview ? 'Current Thumbnail' : 'Select Thumbnail'}
                        </p>
                        <p className="text-[9px] text-gold-500/40 uppercase tracking-wider">
                          {formData.thumbnailPreview ? 'Hover to remove and select a different one' : 'Drag and drop or click to upload'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Additional Gallery Images</label>
                      <div className="relative">
                        <button type="button" className="text-[10px] text-gold-500 hover:text-gold-300 font-black uppercase flex items-center gap-2 transition-colors">
                          <Plus size={14} /> {uploading ? 'Processing...' : 'Attach Photos'}
                        </button>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={handleGalleryChange}
                          disabled={uploading}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.gallery.map((item, idx) => (
                        <div key={item.id || item.preview || idx} className="aspect-square rounded-xl border border-gold-500/10 overflow-hidden relative group">
                          <img src={item.preview || item.url} className={`w-full h-full object-cover ${item.isUploading ? 'opacity-40 grayscale blur-[2px]' : ''}`} />
                          {item.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent animate-spin rounded-full" />
                            </div>
                          )}
                          <button 
                            type="button" 
                            onClick={() => removeGalleryFile(idx)} 
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants Section — grouped by color */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gold-500/10 pb-2">
                  <div>
                    <h5 className="text-xs font-black text-gold-500 uppercase tracking-[0.3em]">Stock By Size</h5>
                    <p className="text-[9px] text-gold-500/40 uppercase tracking-wider mt-1">Tick available sizes and enter how many pieces are in stock for each size.</p>
                  </div>
                </div>

                <div className="bg-navy-950/50 border border-gold-500/15 rounded-2xl p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Stock ID</label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. SHIRT-BLUE-001"
                      value={formData.stock_id}
                      onChange={(e) => setFormData({ ...formData, stock_id: e.target.value.toUpperCase() })}
                      className="w-full bg-navy-900 border border-gold-500/5 rounded-lg py-3 px-4 text-gold-100 text-[11px] outline-none focus:border-gold-500/20 font-bold uppercase"
                    />
                    <p className="text-[8px] text-gold-500/30 uppercase tracking-wider">This ID is shared by every selected size for this product.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <input
                      type="text"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSize();
                        }
                      }}
                      placeholder="ADD SIZE: 40, 50, XXL"
                      className="w-full bg-navy-900 border border-gold-500/5 rounded-xl py-3 px-4 text-gold-100 text-[11px] outline-none focus:border-gold-500/20 font-bold uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      className="px-5 py-3 rounded-xl border border-gold-500/20 text-gold-500 text-[10px] font-black uppercase tracking-widest hover:border-gold-500/50"
                    >
                      Add Size
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {displaySizeOptions.map((size) => {
                      const row = formData.sizeRows.find((item) => item.size === size);
                      return (
                        <div
                          key={size}
                          className={`rounded-xl border p-3 space-y-3 transition-all ${
                            row ? 'border-gold-500 bg-gold-600/10' : 'border-gold-500/10 bg-navy-900/50'
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(row)}
                              onChange={() => handleToggleSize(size)}
                              className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                            />
                            <span className="text-[11px] font-black uppercase tracking-widest text-gold-100">{size}</span>
                          </label>

                          {row && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[8px] text-gold-500/40 uppercase tracking-widest font-black">Stock</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={row.stock}
                                  onChange={(e) => handleSizeChange(size, 'stock', e.target.value)}
                                  className="w-full bg-navy-950 border border-gold-500/5 rounded-lg py-2 px-3 text-gold-100 text-[10px] outline-none focus:border-gold-500/20 font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-gold-500/40 uppercase tracking-widest font-black">Price +</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={row.price_override}
                                  onChange={(e) => handleSizeChange(size, 'price_override', e.target.value)}
                                  className="w-full bg-navy-950 border border-gold-500/5 rounded-lg py-2 px-3 text-gold-100 text-[10px] outline-none focus:border-gold-500/20 font-bold"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status & Submit */}
              <div className="pt-10 border-t border-gold-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black uppercase text-gold-100 tracking-widest group-hover:text-gold-500 transition-colors">Featured</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black uppercase text-gold-100 tracking-widest group-hover:text-gold-500 transition-colors">Active / Published</span>
                  </label>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-navy-800 text-gold-500/60 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-navy-700 hover:text-gold-500 transition-all border border-gold-500/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-4 bg-gold-600 text-navy-950 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all disabled:opacity-50 shadow-xl shadow-gold-600/20"
                  >
                    {submitting ? 'COMMITTING...' : 'SAVE PRODUCT'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};


const CategoriesView = () => {
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
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await adminCategoryAPI.remove(id);
        fetchCategories();
      } catch (error) {
        alert('Error deleting category');
      }
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
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await adminBrandAPI.remove(id);
        fetchBrands();
      } catch (error) {
        alert('Error deleting brand');
      }
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


const CustomersView = () => {
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
          <button className="p-2.5 bg-navy-800/50 border border-gold-500/10 text-gold-500 rounded-xl hover:bg-navy-800 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

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
                        {c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
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
                      c.is_active ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                    }`}>
                      {c.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(c.id, c.is_active)}
                        className={`p-2 rounded-lg transition-all ${c.is_active ? 'text-red-400/40 hover:text-red-400 hover:bg-red-400/5' : 'text-green-400/40 hover:text-green-400 hover:bg-green-400/5'}`}
                        title={c.is_active ? 'Suspend Account' : 'Activate Account'}
                      >
                        {c.is_active ? <UserMinus size={16} /> : <UserPlus size={16} />}
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


const AdminsView = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: ['products', 'orders']
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Fetch both staff and admins
      const [resStaff, resAdmin] = await Promise.all([
        adminCustomerAPI.getStaff(),
        adminCustomerAPI.getAdmins(),
      ]);
      const combined = [...(resAdmin.data.data || []), ...(resStaff.data.data || [])];
      setAdmins(combined);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      permissions: ['products', 'orders']
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminCustomerAPI.createStaff(formData);
      setIsModalOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error creating staff:', error);
      alert('Error creating staff member.');
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
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await adminCustomerAPI.deleteStaff(id);
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff member.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-xl font-serif font-bold text-gold-100">Admins &amp; Staff</h3>
          <p className="text-xs text-gold-500/40 mt-1">{admins.length} users with dashboard access</p>
        </div>
        <button 
          type="button"
          onClick={handleOpenModal}
          className="px-4 sm:px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20 text-sm"
        >
          <UserPlus size={20} /> ADD STAFF
        </button>
      </div>
      
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.length > 0 ? admins.map((admin, i) => (
            <div key={i} className={`bg-navy-900/40 border-l-4 border-gold-500 p-6 rounded-r-2xl border-y border-r border-gold-500/10 backdrop-blur-sm group`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-bold text-gold-100 flex items-center gap-2">
                    {admin.name}
                    {admin.is_active === false && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                  </div>
                  <div className="text-xs text-gold-500/40">{admin.email}</div>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded bg-navy-800 border border-gold-500/10 ${admin.role === 'admin' ? 'text-gold-400' : 'text-blue-400'}`}>
                  {admin.role}
                </span>
              </div>
              <div className="pt-4 border-t border-gold-500/5 flex justify-between items-center text-[10px]">
                <span className="text-gold-500/30 uppercase">ID: {admin.id.substring(0, 8)}</span>
                <div className="flex gap-2">
                  {admin.role === 'staff' && (
                    <button 
                      onClick={() => handleDeleteStaff(admin.id)}
                      className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
                      title="Remove Staff"
                    >
                      <Trash2 size={14} />
                    </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-900 border border-gold-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-gold-500/10 bg-navy-900/50">
              <h3 className="font-serif font-bold text-gold-100 text-xl">ADD NEW STAFF</h3>
              <button onClick={handleCloseModal} className="text-gold-500/40 hover:text-gold-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-navy-950/50 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-100 focus:outline-none focus:border-gold-500/50 transition-colors placeholder:text-gold-500/20"
                    placeholder="staff@prince-esquare.com"
                  />
                </div>

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

                <div>
                  <label className="block text-[10px] font-bold text-gold-500/60 uppercase tracking-widest mb-2">Access Permissions</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-3 bg-navy-950/50 border border-gold-500/20 rounded-xl">
                    {['dashboard', 'orders', 'products', 'customers', 'admins', 'coupons', 'banners', 'newsletter', 'finance', 'reviews', 'settings'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={formData.permissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, permissions: [...formData.permissions, perm] });
                            } else {
                              setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-gold-500/20 bg-navy-900 text-gold-600 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-[10px] uppercase font-bold text-gold-100 group-hover:text-gold-500 transition-colors">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gold-600 text-navy-950 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gold-500 transition-all disabled:opacity-50"
              >
                {submitting ? 'CREATING...' : 'CREATE STAFF ACCOUNT'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const CouponsView = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await adminCouponAPI.getAll();
        setCoupons(res.data.data);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Promotional Coupons</h3>
        <button className="px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-bold hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20">
          Create Coupon
        </button>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : coupons.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-navy-800/50 text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4 text-center">Uses</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="bg-gold-600/10 text-gold-500 font-mono font-bold px-3 py-1 rounded border border-gold-500/20 inline-block uppercase">
                      {c.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gold-200">{c.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                  <td className="px-6 py-4 font-bold text-gold-100">
                    {c.type === 'percentage' ? `${c.value}%` : `KSh ${parseFloat(c.value).toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gold-500/60">
                    {c.used_count} / {c.usage_limit || '∞'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gold-500/40">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gold-500/40 hover:text-gold-500 transition-colors"><Edit size={16} /></button>
                      <button className="p-2 text-red-400/40 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No coupons found.
          </div>
        )}
      </div>
    </div>
  );
};


const BannersView = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await adminBannerAPI.getAll();
        setBanners(res.data.data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold text-gold-100">Site Appearance — Banners</h3>
        <button className="px-6 py-3 bg-navy-800/50 border border-gold-500/10 text-gold-500 rounded-xl font-bold flex items-center gap-2">
           <Plus size={18} /> New Banner
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
        </div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden group backdrop-blur-sm">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={banner.image_url} 
                  alt={banner.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-6">
                  <div className="text-xs font-bold text-gold-500/60 uppercase tracking-widest">{banner.position || 'Main Hero'}</div>
                  <div className="text-lg font-serif font-bold text-gold-100">{banner.title}</div>
                </div>
                <div className="absolute top-4 right-4">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${banner.is_active ? 'bg-green-400 text-navy-950' : 'bg-navy-900 text-gold-500/40'}`}>
                     {banner.is_active ? 'Active' : 'Draft'}
                   </span>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="text-xs text-gold-500/60 line-clamp-1 max-w-[200px]">
                  {banner.subtitle || 'No subtitle provided.'}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-navy-800/50 rounded-lg border border-gold-500/10 text-gold-500 hover:text-gold-400 transition-all"><Edit size={16} /></button>
                  <button className="p-2 bg-navy-800/50 rounded-lg border border-gold-500/10 text-red-400 hover:text-red-300 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gold-500/40 text-sm bg-navy-900/40 border border-gold-500/10 rounded-2xl border-dashed">
          No banners found. Click "New Banner" to create your first promotion.
        </div>
      )}
    </div>
  );
};


const NewsletterView = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await adminNewsletterAPI.getSubscribers();
        setSubscribers(res.data.data);
      } catch (error) {
        console.error('Error fetching subscribers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Subscribers', val: subscribers.length.toLocaleString(), icon: Mail },
          { label: 'Growth Rate', val: '+12.5%', icon: ArrowUpRight },
          { label: 'Email Open Rate', val: '68.2%', icon: Eye },
        ].map((s, i) => (
          <div key={i} className="bg-navy-900/40 border border-gold-500/10 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2 text-gold-500/40">
              <s.icon size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-2xl font-serif font-bold text-gold-100">{s.val}</div>
          </div>
        ))}
      </div>
      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-gold-500/10 flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-gold-100">Audience List</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-navy-950 rounded-lg text-xs font-bold hover:bg-gold-500 transition-all">
            <Download size={16} /> Export Subscribers
          </button>
        </div>
        
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : subscribers.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-navy-800/50 text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">Subscriber Email</th>
                <th className="px-6 py-4">Subscription Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gold-100">{s.email}</td>
                  <td className="px-6 py-4 text-xs text-gold-500/60">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-green-400/10 text-green-400`}>Active</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-400/40 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No newsletter subscribers found.
          </div>
        )}
      </div>
    </div>
  );
};


const ReviewsView = () => {
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
    if (!window.confirm('Delete this review?')) return;
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
                    {r.user_name?.[0] || 'U'}
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
