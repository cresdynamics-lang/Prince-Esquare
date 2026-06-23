import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { authAPI } from '../services/api';
import { Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        await useCartStore.getState().mergeGuestCartToServer();
        await useCartStore.getState().loadCart();
        const target = redirect
          ? redirect.startsWith('/')
            ? redirect
            : `/${redirect}`
          : '/';
        navigate(target);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar />
      
      <main className="pt-48 pb-24 flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-navy-950/50 border border-gold-500/10 p-12 space-y-10 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif text-white">Sign In</h1>
            <p className="text-navy-400 font-light text-sm tracking-wide">
              Access your bespoke orders and preferences.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gold-500   font-bold ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-950 border border-gold-500/10 py-4 pl-12 pr-6 text-white text-sm focus:border-gold-500 outline-none transition-all placeholder:text-navy-700"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gold-500   font-bold ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-950 border border-gold-500/10 py-4 pl-12 pr-6 text-white text-sm focus:border-gold-500 outline-none transition-all placeholder:text-navy-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold-600 text-navy-950 py-5 text-sm font-bold   hover:bg-gold-500 transition-all flex items-center justify-center space-x-3 shadow-xl mt-8 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : 'Authenticate'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="pt-8 border-t border-gold-500/10 text-center space-y-6">
            <p className="text-xs text-navy-400">Don't have an account?</p>
            <Link 
              to="/signup" 
              className="flex items-center justify-center space-x-2 text-gold-500 hover:text-gold-200 transition-colors  tracking-[0.2em] text-[10px] font-bold"
            >
              <UserPlus size={16} />
              <span>Create Your Profile</span>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
