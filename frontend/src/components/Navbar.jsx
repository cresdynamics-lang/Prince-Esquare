import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { adminCategoryAPI } from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  
  const getItemCount = useCartStore((state) => state.getItemCount);
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    {
      name: 'Polo T-shirts',
      category: 'polo-t-shirts',
      sub: ['Knitted Polos', 'Polos'],
    },
    {
      name: 'Shoes',
      category: 'shoes',
      sub: ['Formal shoes', 'Casual', 'Boots', 'Sandals', 'Loafers'],
    },
    {
      name: 'Shirts',
      category: 'shirts',
      sub: ['Formal shirts', 'Casual', 'Presidential'],
    },
    {
      name: 'Suits',
      category: 'suits',
      sub: ['Two piece', 'Three piece'],
    },
    {
      name: 'Trousers',
      category: 'trousers',
      sub: ['Khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'],
    },
    {
      name: 'Linen',
      category: 'linen',
      sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'],
    },
    {
      name: 'More',
      category: 'more',
      sub: ['Blazers', 'Track Suits', 'Jackets', 'Half jackets', 'Caps & Hats', 'Belts & Ties', 'Sweaters', 'Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'],
    },
  ];

  const handleCategoryClick = (category, sub = null) => {
    let url = `/products?category=${category}`;
    if (sub) url += `&sub=${encodeURIComponent(sub)}`;
    navigate(url);
    setIsOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'py-4 glass shadow-2xl' : 'py-8 bg-transparent'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-gold-400">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Logo */}
        <Link to="/">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl lg:text-3xl font-serif tracking-[0.2em] font-bold text-gradient-gold"
          >
            PRINCE ESQUIRE
          </motion.div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-12">
          {menuItems.map((item) => (
            <div key={item.name} className="relative group">
              <button 
                onClick={() => handleCategoryClick(item.category)}
                className="text-[10px] font-bold tracking-[0.3em] uppercase text-white hover:text-gold-400 transition-colors duration-300"
              >
                {item.name}
              </button>
              {item.sub.length > 0 && (
                <div className="absolute top-full left-0 mt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-navy-950/95 border border-gold-500/20 backdrop-blur-xl p-8 min-w-[220px] shadow-2xl">
                    <div className="space-y-4">
                      {item.sub.map((sub) => (
                        <button 
                          key={sub} 
                          onClick={() => handleCategoryClick(item.category, sub)}
                          className="block w-full text-left text-[9px] font-bold uppercase tracking-[0.2em] text-navy-200 hover:text-gold-400 transition-colors"
                        >
                          {sub}
                        </button>
                      ))}
                      <div className="pt-2 border-t border-gold-500/10">
                        <button 
                          onClick={() => handleCategoryClick(item.category)}
                          className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold-500 hover:text-white transition-colors"
                        >
                          Shop All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-6 text-gold-400">
          <Search size={18} className="cursor-pointer hover:text-gold-200 transition-colors" />
          
          <div className="relative group">
            <Link to={isAuthenticated ? "/profile" : "/login"}>
              <User size={18} className="cursor-pointer hover:text-gold-200 transition-colors" />
            </Link>
            {isAuthenticated && (
              <div className="absolute top-full right-0 mt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-navy-950/95 border border-gold-500/20 p-6 min-w-[180px] shadow-2xl">
                  <p className="text-[10px] text-gold-500 mb-4 uppercase tracking-[0.2em] font-bold border-b border-gold-500/10 pb-2">{user?.name}</p>
                  <div className="space-y-3">
                    <Link to="/profile" className="block text-[10px] font-bold uppercase tracking-widest text-navy-200 hover:text-gold-400">My Account</Link>
                    <button 
                      onClick={logout}
                      className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      <LogOut size={12} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" className="relative cursor-pointer group">
            <ShoppingBag size={18} className="group-hover:text-gold-200 transition-colors" />
            <motion.span 
              key={getItemCount()}
              initial={{ scale: 1.5, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              className="absolute -top-2 -right-2 bg-gold-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
            >
              {getItemCount()}
            </motion.span>
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm z-40 lg:hidden bg-navy-950 border-r border-gold-500/10 p-8 pt-24"
            >
              <div className="flex flex-col space-y-10">
                {menuItems.map((item) => (
                  <div key={item.name} className="space-y-4">
                    <h3 
                      onClick={() => handleCategoryClick(item.category)}
                      className="text-2xl font-serif text-white uppercase tracking-[0.1em] cursor-pointer"
                    >
                      {item.name}
                    </h3>
                    <div className="flex flex-col space-y-3 pl-2">
                      {item.sub.map((sub) => (
                        <button 
                          key={sub} 
                          onClick={() => handleCategoryClick(item.category, sub)}
                          className="text-left text-[10px] font-bold uppercase tracking-widest text-navy-300 hover:text-gold-400"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="pt-10 border-t border-gold-500/10">
                  <Link to="/products" className="text-xl font-serif text-gold-500 uppercase tracking-widest">Shop All</Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
