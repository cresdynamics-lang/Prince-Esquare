import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingBag, Tag, Award, Users, 
  ShieldCheck, Ticket, Image as ImageIcon, Mail, CreditCard, 
  Star, Settings, LogOut, Bell, Search, Menu, X, 
  ArrowUpRight, ArrowDownRight, MoreVertical, Plus, 
  Download, Filter, CheckCircle2, AlertCircle, Clock, 
  UserPlus, UserMinus, Trash2, Edit, Eye, ChevronRight,
  Phone, Globe, Truck, CreditCard as CardIcon, Laptop
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
  adminReviewAPI
} from '../services/api';
import { useEffect } from 'react';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { isAuthenticated, isAdmin } = useAuthStore();

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

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'orders', label: 'Orders', icon: Package, section: 'Store', badge: '12' },
    { id: 'products', label: 'Products', icon: ShoppingBag, section: 'Store' },
    { id: 'categories', label: 'Categories', icon: Tag, section: 'Store' },
    { id: 'brands', label: 'Brands', icon: Award, section: 'Store' },
    { id: 'customers', label: 'Customers', icon: Users, section: 'People' },
    { id: 'admins', label: 'Admins', icon: ShieldCheck, section: 'People' },
    { id: 'coupons', label: 'Coupons', icon: Ticket, section: 'Marketing' },
    { id: 'banners', label: 'Banners', icon: ImageIcon, section: 'Marketing' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, section: 'Marketing' },
    { id: 'payments', label: 'Payments', icon: CreditCard, section: 'Finance' },
    { id: 'reviews', label: 'Reviews', icon: Star, section: 'Finance', badge: '5' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardView />;
      case 'orders': return <OrdersView />;
      case 'products': return <ProductsView />;
      case 'categories': return <CategoriesView />;
      case 'brands': return <BrandsView />;
      case 'customers': return <CustomersView />;
      case 'admins': return <AdminsView />;
      case 'coupons': return <CouponsView />;
      case 'banners': return <BannersView />;
      case 'newsletter': return <NewsletterView />;
      case 'payments': return <PaymentsView />;
      case 'reviews': return <ReviewsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-navy-950 text-gold-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-navy-900/50 border-r border-gold-500/10 transition-all duration-300 flex flex-col z-20 backdrop-blur-xl`}
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
                    onClick={() => setActiveSection(item.id)}
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-navy-900/30 border-b border-gold-500/10 flex items-center justify-between px-8 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gold-500/60 hover:text-gold-500 transition-colors bg-navy-800/50 rounded-lg border border-gold-500/10"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="h-8 w-[1px] bg-gold-500/10 mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gold-500/40 uppercase tracking-widest">Admin / Overview</span>
              <h2 className="text-xl font-serif font-bold text-gold-100 capitalize">
                {activeSection.replace('-', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-navy-950 to-navy-900/50">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, topRes, lowStockRes] = await Promise.all([
          adminAnalyticsAPI.getStats(),
          adminAnalyticsAPI.getTopProducts(),
          adminAnalyticsAPI.getLowStock()
        ]);
        
        setStats(statsRes.data.data);
        setTopProducts(topRes.data.data);
        setLowStock(lowStockRes.data.data);
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
    { label: 'Total Revenue', value: `KSh ${stats?.revenue?.toLocaleString()}`, icon: CreditCard, up: true, change: '+12%' },
    { label: 'Total Orders', value: stats?.orders || 0, icon: Package, up: true, change: '+5%' },
    { label: 'Customers', value: stats?.customers || 0, icon: Users, up: true, change: '+8%' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, up: stats?.pendingOrders < 5, change: stats?.pendingOrders > 10 ? 'Action required' : 'Manageable' },
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
              {stat.up ? (
                <span className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} className="mr-1" /> {stat.change}
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">
                  <ArrowDownRight size={14} className="mr-1" /> {stat.change}
                </span>
              )}
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
             {[40, 65, 45, 80, 55, 90, 75, 60, 85, 70, 95, 80].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                 <div className="relative w-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-full bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-lg opacity-40 group-hover:opacity-100 transition-all duration-500"
                    />
                 </div>
                 <span className="text-[9px] font-bold text-gold-500/30 uppercase tracking-tighter">
                   {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                 </span>
               </div>
             ))}
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


const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await adminProductAPI.getAll();
        setProducts(res.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Inventory Management ({products.length})</h3>
        <button className="flex items-center gap-2 px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-bold hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20">
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : products.length > 0 ? (
          <table className="w-full text-left">
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
                        <div className="text-sm font-bold text-gold-100">{p.name}</div>
                        <div className="text-[10px] font-mono text-gold-500/40 uppercase mt-1">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gold-500/60">{p.category_name || 'Uncategorized'}</td>
                  <td className="px-6 py-4 font-bold text-gold-100">KSh {parseFloat(p.price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className={`text-xs font-bold ${p.stock_quantity === 0 ? 'text-red-400' : p.stock_quantity < 10 ? 'text-gold-500' : 'text-green-400'}`}>
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
                      <button className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"><Edit size={16} /></button>
                      <button className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm">
            No products found in inventory.
          </div>
        )}
      </div>
    </div>
  );
};


const CategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await adminCategoryAPI.getAll();
        setCategories(res.data.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Categories ({categories.length})</h3>
        <button className="flex items-center gap-2 px-6 py-3 bg-navy-800/50 border border-gold-500/10 text-gold-500 rounded-xl font-bold hover:bg-navy-800 transition-all">
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
                <th className="px-6 py-4">Parent ID</th>
                <th className="px-6 py-4">Products</th>
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
                  <td className="px-6 py-4 text-gold-500/40">{c.parent_id || '—'}</td>
                  <td className="px-6 py-4 font-bold text-gold-200">{c.product_count || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      c.is_active ? 'bg-green-400/10 text-green-400' : 'bg-navy-800 text-gold-500/30'
                    }`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gold-500/60 hover:text-gold-500 transition-all"><Edit size={16} /></button>
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
    </div>
  );
};


const BrandsView = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await adminBrandAPI.getAll();
        setBrands(res.data.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Brand Partners ({brands.length})</h3>
        <button className="px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-bold hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20">
          Add Brand
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
        </div>
      ) : brands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-navy-900/40 border border-gold-500/10 p-6 rounded-2xl flex items-center justify-between group backdrop-blur-sm">
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
              <button className="w-10 h-10 bg-navy-800 rounded-xl border border-gold-500/10 flex items-center justify-center text-gold-500/40 group-hover:border-gold-500/40 transition-all">
                <Settings size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gold-500/40 text-sm">
          No brand partners found.
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
        const res = await adminCustomerAPI.getAll();
        setCustomers(res.data.data);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h3 className="text-2xl font-serif font-bold text-gold-100">Customer Directory</h3>
          <p className="text-xs text-gold-500/40 mt-1">Managing {customers.length} registered clients</p>
        </div>
        <div className="flex gap-3">
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
          <table className="w-full text-left">
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
                          {c.is_verified && <CheckCircle size={14} className="text-blue-400" />}
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
                      <button className="p-2 text-gold-500/40 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all" title="View History"><Eye size={16} /></button>
                      <button className="p-2 text-gold-500/40 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"><MoreVertical size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-serif font-bold text-gold-100">Internal Access Controls</h3>
        <button className="px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-bold flex items-center gap-2">
          <UserPlus size={20} /> Add Staff
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Super Admin', email: 'admin@princeesquire.com', role: 'Superadmin', last: '13 May, 09:14', color: 'border-red-400' },
          { name: 'Store Manager', email: 'manager@princeesquire.com', role: 'Admin', last: '12 May, 15:30', color: 'border-gold-500' },
          { name: 'Content Editor', email: 'editor@princeesquire.com', role: 'Editor', last: '10 May, 11:05', color: 'border-blue-400' },
        ].map((admin, i) => (
          <div key={i} className={`bg-navy-900/40 border-l-4 ${admin.color} p-6 rounded-r-2xl border-y border-r border-gold-500/10 backdrop-blur-sm group`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm font-bold text-gold-100">{admin.name}</div>
                <div className="text-xs text-gold-500/40">{admin.email}</div>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded bg-navy-800 border border-gold-500/10`}>{admin.role}</span>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-[10px] text-gold-500/40 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> Last Login: {admin.last}
              </div>
              <button className="text-gold-500/40 hover:text-gold-500 transition-colors"><MoreVertical size={18} /></button>
            </div>
          </div>
        ))}
      </div>
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


const PaymentsView = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-navy-900/40 border border-gold-500/10 p-8 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="text-xs font-bold text-gold-500/40 uppercase tracking-widest mb-2">M-Pesa Collections</div>
            <div className="text-3xl font-serif font-bold text-gold-100 mb-6">KSh 3,745,200</div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gold-500/30 uppercase">Transactions</span>
                <span className="text-lg font-bold text-gold-200">842</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gold-500/30 uppercase">Success Rate</span>
                <span className="text-lg font-bold text-green-400">98.4%</span>
              </div>
            </div>
          </div>
          <Laptop size={120} className="absolute -bottom-4 -right-4 text-gold-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>
        <div className="bg-navy-900/40 border border-gold-500/10 p-8 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="text-xs font-bold text-gold-500/40 uppercase tracking-widest mb-2">Card Payments</div>
            <div className="text-3xl font-serif font-bold text-gold-100 mb-6">KSh 1,076,100</div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gold-500/30 uppercase">Transactions</span>
                <span className="text-lg font-bold text-gold-200">142</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gold-500/30 uppercase">Success Rate</span>
                <span className="text-lg font-bold text-green-400">94.2%</span>
              </div>
            </div>
          </div>
          <CardIcon size={120} className="absolute -bottom-4 -right-4 text-gold-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>
      </div>
      
      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gold-500/10 bg-navy-800/30">
          <h3 className="font-serif font-bold text-lg text-gold-100">Transaction History</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-navy-800/50 text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-500/5">
            {[
              { ref: 'MP240513001', order: '#PE-0412', method: 'M-Pesa', amount: 'KSh 18,500', status: 'Success' },
              { ref: 'MP240513002', order: '#PE-0411', method: 'M-Pesa', amount: 'KSh 9,750', status: 'Success' },
              { ref: 'MP240512002', order: '#PE-0409', method: 'M-Pesa', amount: 'KSh 12,000', status: 'Refunded' },
              { ref: 'CD240512001', order: '#PE-0410', method: 'Card', amount: 'KSh 34,200', status: 'Failed' },
            ].map((p, i) => (
              <tr key={i} className="hover:bg-navy-800/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gold-500">{p.ref}</td>
                <td className="px-6 py-4 text-sm font-bold text-gold-100">{p.order}</td>
                <td className="px-6 py-4 text-xs text-gold-500/60 uppercase">{p.method}</td>
                <td className="px-6 py-4 font-bold text-gold-100">{p.amount}</td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    p.status === 'Success' ? 'border-green-400 text-green-400 bg-green-400/5' : 
                    p.status === 'Refunded' ? 'border-gold-500 text-gold-500 bg-gold-500/5' : 'border-red-400 text-red-400 bg-red-400/5'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gold-500/40 hover:text-gold-500 transition-colors"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Store Info */}
          <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-8">
            <h4 className="font-serif font-bold text-xl text-gold-100 mb-6 flex items-center gap-3">
              <Settings size={20} className="text-gold-500" /> Store Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Store Name', val: 'Prince Esquire' },
                { label: 'Support Email', val: 'hello@princeesquire.com' },
                { label: 'Phone Number', val: '+254 700 000 000' },
                { label: 'Store Currency', val: 'KES (KSh)' },
              ].map((f, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-bold text-gold-500/40 uppercase tracking-widest">{f.label}</label>
                  <input type="text" defaultValue={f.val} className="w-full bg-navy-800/50 border border-gold-500/10 px-4 py-3 rounded-xl text-sm text-gold-100 focus:border-gold-500/40 transition-all outline-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Zones */}
          <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-8">
             <h4 className="font-serif font-bold text-xl text-gold-100 mb-6 flex items-center gap-3">
              <Truck size={20} className="text-gold-500" /> Shipping & Logistics
            </h4>
            <div className="space-y-4">
               {[
                 { zone: 'Nairobi Metro', counties: 'Nairobi, Kiambu, Kajiado', rate: 'KSh 350', time: 'Same Day' },
                 { zone: 'Central & Rift', counties: 'Nakuru, Nyeri, Meru', rate: 'KSh 650', time: '24 - 48 Hours' },
               ].map((z, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-navy-800/30 border border-gold-500/5 rounded-xl">
                   <div>
                     <div className="text-sm font-bold text-gold-100">{z.zone}</div>
                     <div className="text-[10px] text-gold-500/40 mt-1">{z.counties}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm font-bold text-gold-500">{z.rate}</div>
                     <div className="text-[9px] uppercase font-bold text-gold-500/20">{z.time}</div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Integrations */}
          <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-8">
            <h4 className="font-serif font-bold text-lg text-gold-100 mb-6 flex items-center gap-3">
              <Globe size={18} className="text-gold-500" /> System Integrations
            </h4>
            <div className="space-y-4">
              {[
                { name: 'M-Pesa Daraja API', status: 'Connected', color: 'text-green-400' },
                { name: 'Cloudinary CDN', status: 'Connected', color: 'text-green-400' },
                { name: 'SendGrid Email', status: 'Connected', color: 'text-green-400' },
                { name: 'Google Analytics', status: 'Not Configured', color: 'text-gold-500/20' },
              ].map((int, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-gold-500/5 last:border-0">
                  <span className="text-xs text-gold-200">{int.name}</span>
                  <span className={`text-[9px] font-bold uppercase ${int.color}`}>{int.status}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-4 bg-gold-600 text-navy-950 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-gold-600/10 hover:bg-gold-500 hover:-translate-y-1 transition-all duration-300">
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
