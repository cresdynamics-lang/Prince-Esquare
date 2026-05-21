import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { adminAuthAPI } from '../services/api';
import { ShieldCheck, Lock, ArrowRight, Mail } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAuthAPI.login({ email, password });
      if (response.data.success) {
        login(response.data.data.admin, response.data.data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-950 min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-600/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-navy-900/40 border border-gold-500/10 p-10 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div className="text-center space-y-4 mb-10">
            <div className="w-16 h-16 bg-gold-600/10 border border-gold-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-gold-500" size={32} />
            </div>
            <h1 className="text-3xl font-serif text-white uppercase tracking-[0.2em]">Staff Access</h1>
            <p className="text-gold-500/40 font-bold text-[10px] uppercase tracking-widest">
              Prince Esquire Administrative Portal
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 text-center rounded-xl mb-8"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black ml-1">Admin ID / Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600/40 group-focus-within:text-gold-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-950/50 border border-gold-500/10 py-4 pl-12 pr-6 text-white text-sm rounded-xl focus:border-gold-500 outline-none transition-all placeholder:text-navy-700"
                  placeholder="manage@prince-esquire.co.ke"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black ml-1">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600/40 group-focus-within:text-gold-500 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-950/50 border border-gold-500/10 py-4 pl-12 pr-6 text-white text-sm rounded-xl focus:border-gold-500 outline-none transition-all placeholder:text-navy-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold-600 text-navy-950 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-gold-600/10 mt-10 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Authorize Access'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-[10px] text-gold-500/30 hover:text-gold-500 font-bold uppercase tracking-widest transition-colors"
            >
              Return to storefront
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
