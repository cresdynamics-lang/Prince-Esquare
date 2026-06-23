import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, MapPin, Settings, LogOut, ChevronRight, ShoppingBag, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { orderAPI, authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { userInitials } from '../lib/format';

const Profile = () => {
  const { user, logout, isAuthenticated, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ delivery_zone: 'nairobi_outside_cbd', line1: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=profile');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    setDetailsForm({ name: user.name || '', phone: user.phone || '' });
    setAddressForm({
      delivery_zone: user.default_shipping_address?.delivery_zone || 'nairobi_outside_cbd',
      line1: user.default_shipping_address?.line1 || '',
    });
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const saveProfile = async (nextAddress = addressForm) => {
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const res = await authAPI.updateProfile({
        name: detailsForm.name,
        phone: detailsForm.phone,
        default_shipping_address: nextAddress,
      });
      const updated = res.data?.data?.user;
      if (updated) updateUser(updated);
      setProfileMessage('Account details saved.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not save account details');
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      await authAPI.updatePassword(passwordForm);
      setPasswordForm({ current_password: '', new_password: '' });
      setProfileMessage('Password changed.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not change password');
    } finally {
      setProfileSaving(false);
    }
  };

  const tabs = [
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'details', label: 'Account Details', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Profile Header */}
          <div className="relative mb-16 overflow-hidden bg-navy-900 border border-gold-600/10 p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 bg-navy-800 border-2 border-gold-600/20 flex items-center justify-center relative group">
                <div className="absolute inset-0 border border-gold-600/50 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gold-400 tracking-wider">{userInitials(user)}</span>
                )}
              </div>
              
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl md:text-4xl text-white">{user?.name}</h1>
                <p className="text-gold-500/60 font-light italic">{user?.email}</p>
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-[10px] bg-gold-600/10 text-gold-500 border border-gold-600/20 px-3 py-1   font-bold">
                    Member Since {new Date(user?.created_at).getFullYear() || 2024}
                  </span>
                </div>
              </div>
              
              <div className="md:ml-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-red-500/70 hover:text-red-400 text-[10px] font-bold   border border-red-500/20 px-6 py-3 transition-all"
                >
                  <LogOut size={14} />
                  Sign Out
                </motion.button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-5 text-[11px] font-bold  tracking-[0.2em] transition-all border ${
                    activeTab === tab.id 
                      ? 'bg-gold-600 text-navy-950 border-gold-600' 
                      : 'text-gold-500/50 border-gold-600/10 hover:border-gold-600/40 hover:text-gold-500'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <tab.icon size={16} />
                    {tab.label}
                  </div>
                  <ChevronRight size={14} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9">
              {(profileMessage || profileError) && (
                <div className={`mb-6 border px-4 py-3 text-sm ${profileError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-green-500/30 bg-green-500/10 text-green-300'}`}>
                  {profileError || profileMessage}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-[500px]"
                >
                  {activeTab === 'orders' && (
                    <div className="space-y-8">
                      <div className="flex justify-between items-end border-b border-gold-600/10 pb-6">
                        <h2 className="text-xl md:text-2xl text-white">Recent Orders</h2>
                        <span className="text-[10px] text-gold-600/50  ">{orders.length} total</span>
                      </div>

                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                          <div className="w-12 h-12 border-2 border-gold-600 border-t-transparent animate-spin" />
                          <p className="text-gold-600/50 text-[10px]  ">Loading orders...</p>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-24 border border-dashed border-gold-600/20 space-y-6">
                          <ShoppingBag size={48} className="mx-auto text-gold-600/20" />
                          <div className="space-y-2">
                            <p className="text-white text-lg italic">Your collection is empty.</p>
                            <p className="text-gold-600/50 text-[10px]  ">Begin your bespoke journey today.</p>
                          </div>
                          <button 
                            onClick={() => navigate('/products')}
                            className="bg-gold-600 text-navy-950 px-8 py-4 text-[10px] font-bold   hover:bg-gold-500 transition-all"
                          >
                            Explore Collection
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {orders.map((order) => (
                            <div 
                              key={order.id}
                              className="bg-navy-900/50 border border-gold-600/10 p-8 hover:border-gold-600/30 transition-all group"
                            >
                              <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <span className="text-gold-500 text-[10px] font-bold  ">Order #{order.id.slice(-8).toUpperCase()}</span>
                                    <span className={`text-[9px] px-3 py-1   font-bold ${
                                      order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                      'bg-gold-600/10 text-gold-500'
                                    } border border-current opacity-70`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6 text-navy-400 text-xs">
                                    <div className="flex items-center gap-2">
                                      <Clock size={12} />
                                      {new Date(order.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-white font-serif italic">
                                      KSh {parseFloat(order.total_amount).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <button 
                                    onClick={() => navigate(`/payment/${order.id}`)}
                                    className="text-gold-500 text-[10px] font-bold   flex items-center gap-2 group-hover:gap-4 transition-all"
                                  >
                                    View Details <ChevronRight size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="space-y-8 bg-navy-900/30 border border-gold-600/10 p-12">
                      <h2 className="text-xl md:text-2xl text-white border-b border-gold-600/10 pb-6">Personal Details</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-2">
                            <label className="text-[10px] text-gold-600/50  tracking-[0.2em] font-bold">Full Name</label>
                            <input
                              value={detailsForm.name}
                              onChange={(e) => setDetailsForm((f) => ({ ...f, name: e.target.value }))}
                              className="w-full bg-navy-950 border border-gold-600/10 py-4 px-5 text-white text-sm outline-none focus:border-gold-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gold-600/50  tracking-[0.2em] font-bold">Email Address</label>
                            <p className="text-white text-lg font-serif border-b border-gold-600/10 pb-2">{user?.email}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gold-600/50  tracking-[0.2em] font-bold">Phone Number</label>
                            <input
                              value={detailsForm.phone}
                              onChange={(e) => setDetailsForm((f) => ({ ...f, phone: e.target.value }))}
                              className="w-full bg-navy-950 border border-gold-600/10 py-4 px-5 text-white text-sm outline-none focus:border-gold-500"
                              placeholder="0712 345 678"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gold-600/50  tracking-[0.2em] font-bold">Preferred Style</label>
                            <p className="text-gold-500 text-lg font-serif border-b border-gold-600/10 pb-2 italic">Bespoke Tailoring</p>
                          </div>
                       </div>
                       <div className="pt-8">
                         <button
                           type="button"
                           onClick={() => saveProfile()}
                           disabled={profileSaving}
                           className="bg-transparent border border-gold-600/30 text-gold-500 px-8 py-4 text-[10px] font-bold   hover:bg-gold-600 hover:text-navy-950 transition-all disabled:opacity-50"
                         >
                           {profileSaving ? 'Saving...' : 'Update Profile'}
                         </button>
                       </div>
                    </div>
                  )}

                  {activeTab === 'addresses' && (
                    <div className="space-y-8">
                      <div className="flex justify-between items-end border-b border-gold-600/10 pb-6">
                        <h2 className="text-xl md:text-2xl text-white">Saved Addresses</h2>
                      </div>
                      <div className="bg-navy-900/50 border border-gold-600/10 p-8 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            ['cbd', 'CBD'],
                            ['nairobi_outside_cbd', 'Outside CBD'],
                            ['outside_nairobi', 'Outside Nairobi'],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setAddressForm((f) => ({ ...f, delivery_zone: value }))}
                              className={`border px-3 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                addressForm.delivery_zone === value
                                  ? 'bg-gold-600 text-navy-950 border-gold-600'
                                  : 'border-gold-500/20 text-gold-400 hover:border-gold-500/60'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-gold-600/50 tracking-[0.2em] font-bold">Exact Location</label>
                          <textarea
                            rows={5}
                            value={addressForm.line1}
                            onChange={(e) => setAddressForm((f) => ({ ...f, line1: e.target.value }))}
                            className="w-full bg-navy-950 border border-gold-600/10 py-4 px-5 text-white text-sm outline-none focus:border-gold-500 resize-y"
                            placeholder="Estate, street, building, floor, landmark"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveProfile(addressForm)}
                          disabled={profileSaving}
                          className="bg-gold-600 text-navy-950 px-8 py-4 text-[10px] font-bold hover:bg-gold-500 transition-all disabled:opacity-50"
                        >
                          {profileSaving ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-8 bg-navy-900/30 border border-gold-600/10 p-12">
                      <h2 className="text-xl md:text-2xl text-white border-b border-gold-600/10 pb-6">Security Settings</h2>
                      <div className="max-w-md space-y-8">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] text-gold-600/50  tracking-[0.2em] font-bold ml-1">Current Password</label>
                            <input 
                              type="password"
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                              className="w-full bg-navy-950 border border-gold-600/10 py-4 px-6 text-white text-sm outline-none focus:border-gold-500"
                              placeholder="••••••••"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gold-600/50  tracking-[0.2em] font-bold ml-1">New Password</label>
                            <input 
                              type="password"
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                              className="w-full bg-navy-950 border border-gold-600/10 py-4 px-6 text-white text-sm outline-none focus:border-gold-500"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                        <button disabled={profileSaving} className="w-full bg-gold-600 text-navy-950 py-5 text-[10px] font-bold   shadow-xl shadow-gold-600/10 hover:bg-gold-500 transition-all disabled:opacity-50">
                          {profileSaving ? 'Saving...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;


