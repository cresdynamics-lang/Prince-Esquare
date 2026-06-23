import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, ShoppingBag, Search, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { userInitials } from '../lib/format';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState('polo-t-shirts');
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

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
      name: 'Trousers',
      category: 'trousers',
      sub: ['Khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'],
    },
    {
      name: 'Suits',
      category: 'suits',
      sub: ['Two piece', 'Three piece'],
    },
    {
      name: 'Shirts',
      category: 'shirts',
      sub: ['Formal shirts', 'Casual', 'Presidential'],
    },
    {
      name: 'Blazers',
      category: 'blazers',
      sub: ['Modern', 'Casual', 'Classic'],
    },
    {
      name: 'Track Suits',
      category: 'track-suits',
      sub: [],
    },
    {
      name: 'Jackets',
      category: 'jackets',
      sub: ['Jackets', 'Half jackets'],
    },
    {
      name: 'Linen',
      category: 'linen',
      sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'],
    },
    {
      name: 'Caps & Hats',
      category: 'caps-hats',
      sub: [],
    },
    {
      name: 'Belts & Ties',
      category: 'belts-ties',
      sub: [],
    },
    {
      name: 'Sweaters',
      category: 'sweaters',
      sub: [],
    },
    {
      name: 'T-shirts',
      category: 't-shirts',
      sub: ['Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'],
    },
  ];

  const desktopMenuItems = [
    ...menuItems.filter((item) => ['polo-t-shirts', 'shoes', 'trousers', 'shirts', 'suits'].includes(item.category)),
    {
      name: 'More',
      category: 'more',
      sub: menuItems
        .filter((item) => !['polo-t-shirts', 'shoes', 'trousers', 'shirts', 'suits'].includes(item.category))
        .map((item) => item.name),
    },
  ];

  const handleCategoryClick = (category, sub = null) => {
    const categoryPages = ['polo-t-shirts', 'shoes', 'shirts', 'suits', 'trousers', 'linen'];
    let url = categoryPages.includes(category) ? `/${category}` : `/products?category=${category}`;
    if (sub) {
      url += categoryPages.includes(category)
        ? `?sub=${encodeURIComponent(sub)}`
        : `&sub=${encodeURIComponent(sub)}`;
    }
    navigate(url);
    setIsOpen(false);
  };

  const toggleMobileCategory = (category) => {
    setOpenMobileCategory((current) => (current === category ? '' : category));
  };

  return (
    <nav className={`fixed w-full z-[80] transition-all duration-500 ${scrolled ? 'py-4 glass shadow-2xl' : 'py-8 bg-transparent'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="xl:hidden text-gold-400">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Logo */}
        <Link to="/">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src="/LOGO.jpeg"
              alt="Prince Esquire"
              className="h-10 w-10 lg:h-12 lg:w-12 rounded-full object-cover border border-gold-500/30 bg-navy-950"
            />
            <span className="text-xl sm:text-2xl lg:text-3xl font-serif tracking-[0.16em] lg:tracking-[0.2em] font-bold text-gradient-gold">
              PRINCE ESQUIRE
            </span>
          </motion.div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden xl:flex items-center gap-5 2xl:gap-7">
          {desktopMenuItems.map((item) => (
            <div key={item.name} className="relative group">
              <button 
                onClick={() => handleCategoryClick(item.category)}
                className="text-[9px] 2xl:text-[10px] font-bold tracking-[0.18em] 2xl:tracking-[0.24em]  text-white hover:text-gold-400 transition-colors duration-300"
              >
                {item.name}
              </button>
              {item.sub.length > 0 && (
                <div className="absolute top-full left-0 mt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-navy-950/95 border border-gold-500/20 backdrop-blur-xl p-8 min-w-[220px] shadow-2xl">
                    <div className="space-y-4">
                      {item.sub.map((sub) => {
                        const moreTarget = item.category === 'more'
                          ? menuItems.find((menuItem) => menuItem.name === sub)
                          : null;

                        return (
                        <button
                          key={sub}
                          onClick={() => moreTarget ? handleCategoryClick(moreTarget.category) : handleCategoryClick(item.category, sub)}
                          className="block w-full text-left text-[9px] font-bold  tracking-[0.2em] text-navy-200 hover:text-gold-400 transition-colors"
                        >
                          {sub}
                        </button>
                      )})}
                      <div className="pt-2 border-t border-gold-500/10">
                        <button 
                          onClick={() => handleCategoryClick(item.category)}
                          className="text-[9px] font-bold  tracking-[0.2em] text-gold-500 hover:text-white transition-colors"
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
        <div className="hidden xl:flex items-center space-x-6 text-gold-400">
          <Link to="/blog" className="text-[9px] 2xl:text-[10px] font-bold tracking-[0.18em] 2xl:tracking-[0.24em] text-white hover:text-gold-400 transition-colors duration-300">
            BLOG
          </Link>
          <Search size={18} className="cursor-pointer hover:text-gold-200 transition-colors" />
          
          <div className="relative group">
            <Link to={isAuthenticated ? "/profile" : "/login"} className="relative block">
              {isAuthenticated ? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/30 bg-navy-900 text-[10px] font-bold text-gold-300"
                  title={user?.name || user?.email || ""}
                >
                  {userInitials(user)}
                </span>
              ) : (
                <User size={18} className="cursor-pointer hover:text-gold-200 transition-colors" />
              )}
            </Link>
            {isAuthenticated && (
              <div className="absolute top-full right-0 mt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-navy-950/95 border border-gold-500/20 p-6 min-w-[180px] shadow-2xl">
                  <p className="text-[10px] text-gold-500 mb-4 tracking-[0.2em] font-bold border-b border-gold-500/10 pb-2">{user?.name}</p>
                  <div className="space-y-3">
                    <Link to="/profile" className="block text-[10px] font-bold text-navy-200 hover:text-gold-400">My Account</Link>
                    <button 
                      onClick={logout}
                      className="flex items-center space-x-2 text-[10px] font-bold text-red-400/70 hover:text-red-400 transition-colors"
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] xl:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 h-dvh w-[88%] max-w-sm z-[100] xl:hidden bg-navy-950 border-r border-gold-500/10 p-6 pt-24 overflow-y-auto overscroll-contain custom-scrollbar shadow-2xl"
            >
              <div className="flex flex-col space-y-4 pb-16">
                {menuItems.map((item) => (
                  <div key={item.name} className="border-b border-gold-500/10 pb-4">
                    <button
                      type="button"
                      onClick={() => item.sub.length ? toggleMobileCategory(item.category) : handleCategoryClick(item.category)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <span className="text-xl font-serif text-white  tracking-[0.08em]">
                        {item.name}
                      </span>
                      {item.sub.length > 0 && (
                        <ChevronDown
                          size={18}
                          className={`text-gold-500 transition-transform ${openMobileCategory === item.category ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {item.sub.length > 0 && openMobileCategory === item.category && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col space-y-3 pt-5 pl-2">
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(item.category)}
                              className="text-left text-[10px] font-black   text-gold-400 hover:text-gold-200"
                            >
                              Shop All {item.name}
                            </button>
                            {item.sub.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => handleCategoryClick(item.category, sub)}
                                className="text-left text-[10px] font-bold   text-navy-300 hover:text-gold-400"
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <Link to="/blog" className="text-xl font-serif text-white tracking-[0.08em]">
                  Blog
                </Link>

                <div className="pt-10 border-t border-gold-500/10">
                  <Link to="/products" className="text-xl font-serif text-gold-500  ">Shop All</Link>
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

