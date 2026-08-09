import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, User, LogOut, ChevronDown, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import SearchOverlay from './SearchOverlay';

/**
 * Primary nav dropdowns — category + optional sub for /products filters
 */
const menuItems = [
  {
    name: 'Trousers',
    category: 'trousers',
    sub: [
      { name: 'Khaki', category: 'trousers', sub: 'khaki' },
      { name: 'Formal', category: 'trousers', sub: 'formal' },
      { name: 'Chino', category: 'trousers', sub: 'chino' },
      { name: 'Jeans', category: 'trousers', sub: 'jeans' },
      { name: 'Gurkha', category: 'trousers', sub: 'gurkha' },
      { name: 'Linen Trousers', category: 'linen', sub: 'linen-trousers' },
    ],
  },
  {
    name: 'Long Sleeve',
    category: 'shirts',
    defaultSub: 'formal-shirts',
    sub: [
      { name: 'Formal Shirts', category: 'shirts', sub: 'formal-shirts' },
      { name: 'Presidential', category: 'shirts', sub: 'presidential' },
      { name: 'Linen Shirts', category: 'linen', sub: 'linen-shirts' },
    ],
  },
  {
    name: 'Shirts',
    category: 'shirts',
    sub: [
      { name: 'Formal Shirts', category: 'shirts', sub: 'formal-shirts' },
      { name: 'Casual Shirts', category: 'shirts', sub: 'shirts-casual' },
      { name: 'Presidential', category: 'shirts', sub: 'presidential' },
      { name: 'Polo T-shirts', category: 'polo-t-shirts' },
      { name: 'T-shirts', category: 't-shirts' },
    ],
  },
  {
    name: 'Formal Shoes',
    category: 'shoes',
    defaultSub: 'formal-shoes',
    sub: [
      { name: 'Official Lowcuts', category: 'shoes', sub: 'formal-shoes' },
      { name: 'Official Boots', category: 'shoes', sub: 'boots' },
      { name: 'Loafers', category: 'shoes', sub: 'loafers' },
      { name: 'All Formal Shoes', category: 'shoes', sub: 'formal-shoes' },
    ],
  },
  {
    name: 'Casual Shoes',
    category: 'shoes',
    defaultSub: 'casual',
    sub: [
      { name: 'Casual Shoes', category: 'shoes', sub: 'casual' },
      { name: 'Sandals', category: 'shoes', sub: 'sandals' },
      { name: 'All Casual Footwear', category: 'shoes', sub: 'casual' },
    ],
  },
  {
    name: 'Track Suits',
    category: 'track-suits',
    sub: [],
  },
  {
    name: 'Jackets',
    category: 'jackets',
    sub: [
      { name: 'Full Jackets', category: 'jackets', sub: 'full-jackets' },
      { name: 'Half Jackets', category: 'jackets', sub: 'half-jackets' },
      { name: 'Blazers', category: 'blazers' },
      { name: 'Vests', category: 'vests' },
      { name: 'Sweaters', category: 'sweaters' },
    ],
  },
  {
    name: 'Suits',
    category: 'suits',
    sub: [
      { name: 'Two Piece', category: 'suits', sub: 'two-piece' },
      { name: 'Three Piece', category: 'suits', sub: 'three-piece' },
      { name: 'Sets', category: 'sets' },
    ],
  },
  {
    name: 'Accessories',
    category: 'belts-ties',
    sub: [
      { name: 'Belts & Ties', category: 'belts-ties' },
      { name: 'Caps & Hats', category: 'caps-hats' },
      { name: 'Socks', category: 'socks' },
      { name: 'Boxers', category: 'boxers' },
    ],
  },
];

/** Secondary only — leftovers not on primary nav */
const moreItems = [
  { name: 'All Footwear', category: 'shoes' },
  { name: 'Linen', category: 'linen' },
];

const SECTION_SHOP_LINKS = {
  'track-suits': '/products?category=track-suits',
  khaki: '/products?category=trousers&sub=khaki',
  'formal-shoes': '/products?category=shoes&sub=formal-shoes',
  'casual-shoes': '/products?category=shoes&sub=casual',
  boots: '/products?category=shoes&sub=boots',
  loafers: '/products?category=shoes&sub=loafers',
  trousers: '/products?category=trousers',
  shirts: '/products?category=shirts',
  jackets: '/products?category=jackets',
  suits: '/products?category=suits',
  accessories: '/products?category=belts-ties',
};

const buildProductsPath = (category, sub) => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (sub) params.set('sub', sub);
  const q = params.toString();
  return q ? `/products?${q}` : '/products';
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [menuHighlight, setMenuHighlight] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();

  const cartItemCount = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  );
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const openMenu = () => setIsOpen(true);
    const highlightMenu = (e) => setMenuHighlight(Boolean(e.detail?.on));
    window.addEventListener('prince:open-menu', openMenu);
    window.addEventListener('prince:highlight-menu', highlightMenu);
    return () => {
      window.removeEventListener('prince:open-menu', openMenu);
      window.removeEventListener('prince:highlight-menu', highlightMenu);
    };
  }, []);

  useEffect(() => {
    if (!openDropdown) return undefined;
    const handleOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [openDropdown]);

  const closeAll = () => {
    setIsOpen(false);
    setOpenDropdown(null);
    setOpenSection(null);
  };

  /** Navigate to filtered product listing and close menus */
  const goShop = (category, sub) => {
    navigate(buildProductsPath(category, sub));
    closeAll();
  };

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const toggleSection = (name) => {
    setOpenSection((prev) => (prev === name ? null : name));
  };

  const dropdownPanel = (children) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 pt-4 z-50"
    >
      <div className="bg-navy-950/95 border border-gold-500/20 backdrop-blur-xl p-8 min-w-[220px] shadow-2xl">
        {children}
      </div>
    </motion.div>
  );

  return (
    <nav
      ref={navRef}
      className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'py-4 glass shadow-2xl' : 'py-6 lg:py-8 bg-transparent'}`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" onClick={closeAll}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <span className="text-xl sm:text-2xl lg:text-3xl font-serif tracking-[0.18em] font-semibold text-gradient-gold leading-none">
              PRINCE ESQUIRE
            </span>
            <span className="text-[8px] lg:text-[9px] uppercase tracking-[0.45em] text-gold-500/70 font-medium mt-1.5 font-sans">
              The Man&apos;s Shop
            </span>
          </motion.div>
        </Link>

        <div className="hidden lg:flex items-center gap-3 xl:gap-4 2xl:gap-6 flex-wrap justify-end max-w-[62vw]">
          {menuItems.map((item) => (
            <div key={item.name} className="relative">
              <button
                type="button"
                onClick={() =>
                  item.sub.length > 0
                    ? toggleDropdown(item.name)
                    : goShop(item.category, item.defaultSub)
                }
                aria-expanded={openDropdown === item.name}
                className={`flex items-center gap-0.5 text-[8px] xl:text-[9px] 2xl:text-[10px] font-medium tracking-[0.14em] xl:tracking-[0.18em] uppercase font-sans transition-colors duration-300 whitespace-nowrap ${
                  openDropdown === item.name ? 'text-gold-400' : 'text-white hover:text-gold-400'
                }`}
              >
                {item.name}
                {item.sub.length > 0 && (
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-300 shrink-0 ${openDropdown === item.name ? 'rotate-180' : ''}`}
                  />
                )}
              </button>
              <AnimatePresence>
                {openDropdown === item.name &&
                  item.sub.length > 0 &&
                  dropdownPanel(
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => goShop(item.category, item.defaultSub)}
                        className="block w-full text-left text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-500 hover:text-gold-300 transition-colors pb-2 border-b border-gold-500/10"
                      >
                        Shop All {item.name}
                      </button>
                      {item.sub.map((link) => (
                        <button
                          key={link.name}
                          type="button"
                          onClick={() => goShop(link.category, link.sub)}
                          className="block w-full text-left text-[9px] font-medium uppercase tracking-[0.18em] text-navy-200 hover:text-gold-400 transition-colors font-sans"
                        >
                          {link.name}
                        </button>
                      ))}
                    </div>
                  )}
              </AnimatePresence>
            </div>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('More')}
              aria-expanded={openDropdown === 'More'}
              className={`flex items-center gap-1 text-[9px] xl:text-[10px] font-medium tracking-[0.18em] xl:tracking-[0.22em] uppercase font-sans transition-colors duration-300 ${
                openDropdown === 'More' ? 'text-gold-400' : 'text-white hover:text-gold-400'
              }`}
            >
              More
              <ChevronDown
                size={11}
                className={`transition-transform duration-300 ${openDropdown === 'More' ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {openDropdown === 'More' &&
                dropdownPanel(
                  <div className="space-y-3 max-h-[360px] overflow-y-auto">
                    {moreItems.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => goShop(item.category, item.sub)}
                        className="block w-full text-left text-[9px] font-medium uppercase tracking-[0.18em] text-navy-200 hover:text-gold-400 transition-colors font-sans"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
            </AnimatePresence>
          </div>

          <Link
            to="/sale"
            onClick={closeAll}
            className="text-[9px] xl:text-[10px] font-medium tracking-[0.18em] xl:tracking-[0.22em] uppercase font-sans text-red-400 hover:text-red-300 transition-colors duration-300 whitespace-nowrap"
          >
            Sale
          </Link>
          <Link
            to="/new-arrivals"
            onClick={closeAll}
            className="text-[9px] xl:text-[10px] font-medium tracking-[0.14em] xl:tracking-[0.18em] uppercase font-sans text-gold-400 hover:text-gold-200 transition-colors duration-300 whitespace-nowrap"
          >
            New
          </Link>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6 text-gold-400">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hover:text-gold-200 transition-colors"
            aria-label="Search products"
          >
            <Search size={18} />
          </button>

          <div className="relative group hidden sm:block">
            <Link to={isAuthenticated ? '/profile' : '/login'}>
              <User size={18} className="cursor-pointer hover:text-gold-200 transition-colors" />
            </Link>
            {isAuthenticated && (
              <div className="absolute top-full right-0 mt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-navy-950/95 border border-gold-500/20 p-6 min-w-[180px] shadow-2xl">
                  <p className="text-[10px] text-gold-500 mb-4 uppercase tracking-[0.2em] font-bold border-b border-gold-500/10 pb-2">{user?.name}</p>
                  <div className="space-y-3">
                    <Link to="/profile" className="block text-[10px] font-bold uppercase tracking-widest text-navy-200 hover:text-gold-400">My Account</Link>
                    <button
                      type="button"
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
            <span
              key={cartItemCount}
              className={`absolute -top-2 -right-2 bg-gold-600 text-navy-950 text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-sans font-bold tabular-nums shadow-sm ${
                cartItemCount > 0 ? 'animate-[cart-pop_0.35s_ease-out]' : 'opacity-90'
              }`}
            >
              {cartItemCount}
            </span>
          </Link>

          <button
            type="button"
            id="prince-menu-trigger"
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden text-gold-400 hover:text-gold-200 transition-colors relative rounded-md p-1 ${
              menuHighlight && !isOpen
                ? 'ring-2 ring-gold-400/80 ring-offset-2 ring-offset-navy-950 animate-pulse'
                : ''
            }`}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAll}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm z-40 lg:hidden bg-navy-950 border-l border-gold-500/10 overflow-y-auto font-sans"
            >
              <div className="p-6 pt-24 pb-12">
                <div className="mb-8 border-b border-gold-500/10 pb-6">
                  <p className="text-2xl font-serif tracking-[0.18em] font-semibold text-gradient-gold">
                    PRINCE ESQUIRE
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.42em] text-gold-500/80 font-medium mt-2 font-sans">
                    The Man&apos;s Shop
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-navy-300 mt-3 font-light tracking-wide font-sans">
                    <MapPin size={11} className="text-gold-500/70" />
                    Yala Towers, Nairobi
                  </p>
                </div>

                <div className="flex flex-col">
                  {menuItems.map((item) => (
                    <div key={item.name} className="border-b border-gold-500/10">
                      <div className="flex w-full items-center">
                        <button
                          type="button"
                          onClick={() => goShop(item.category, item.defaultSub)}
                          className="flex-1 py-5 text-left text-[1.35rem] font-serif text-white tracking-[0.04em] hover:text-gold-400 transition-colors"
                        >
                          {item.name}
                        </button>
                        {item.sub.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleSection(item.name)}
                            aria-expanded={openSection === item.name}
                            aria-label={`Show ${item.name} filters`}
                            className="p-3 text-gold-500"
                          >
                            <ChevronDown
                              size={18}
                              className={`transition-transform duration-300 ${openSection === item.name ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {openSection === item.name && item.sub.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col space-y-1 pb-5 pl-1">
                              {item.sub.map((link) => (
                                <button
                                  key={link.name}
                                  type="button"
                                  onClick={() => goShop(link.category, link.sub)}
                                  className="text-left text-[11px] font-medium uppercase tracking-[0.18em] text-navy-200 hover:text-gold-400 py-2.5 px-2 rounded-lg hover:bg-gold-500/5 font-sans"
                                >
                                  {link.name}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => goShop(item.category, item.defaultSub)}
                                className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-500 py-2.5 px-2 font-sans"
                              >
                                Shop All {item.name}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <div className="border-b border-gold-500/10">
                    <button
                      type="button"
                      onClick={() => toggleSection('More')}
                      aria-expanded={openSection === 'More'}
                      className="flex w-full items-center justify-between py-5 text-left"
                    >
                      <span className="text-[1.35rem] font-serif text-white tracking-[0.04em]">More Categories</span>
                      <ChevronDown
                        size={18}
                        className={`text-gold-500 transition-transform duration-300 ${openSection === 'More' ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {openSection === 'More' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col space-y-1 pb-5 pl-1">
                            {moreItems.map((item) => (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => goShop(item.category, item.sub)}
                                className="text-left text-[11px] font-medium uppercase tracking-[0.18em] text-navy-200 hover:text-gold-400 py-2.5 px-2 rounded-lg hover:bg-gold-500/5 font-sans"
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link
                    to="/sale"
                    onClick={closeAll}
                    className="flex items-center justify-between border-b border-gold-500/10 py-5 text-[1.35rem] font-serif text-red-400 tracking-[0.04em]"
                  >
                    Sale
                    <span className="bg-red-500/10 border border-red-400/30 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] rounded-full font-sans">Hot</span>
                  </Link>

                  <Link
                    to="/new-arrivals"
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 text-[1.35rem] font-serif text-gold-200 tracking-[0.04em]"
                  >
                    New Arrivals
                  </Link>

                  <Link
                    to="/products"
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 text-[1.35rem] font-serif text-gold-500 tracking-[0.04em]"
                  >
                    Shop All
                  </Link>
                </div>

                <div className="pt-8 space-y-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(true);
                      closeAll();
                    }}
                    className="flex items-center gap-3 text-[12px] font-medium text-gold-400 uppercase tracking-[0.22em] font-sans"
                  >
                    <Search size={18} />
                    Search
                  </button>
                  <Link
                    to={isAuthenticated ? '/profile' : '/login'}
                    onClick={closeAll}
                    className="flex items-center gap-3 text-[12px] font-medium text-gold-400 uppercase tracking-[0.22em] font-sans"
                  >
                    <User size={18} />
                    {isAuthenticated ? 'My Account' : 'Sign In'}
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export { SECTION_SHOP_LINKS, buildProductsPath };
export default Navbar;
