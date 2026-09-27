import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, User, LogOut, ChevronDown, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import SearchOverlay from './SearchOverlay';
import MegaMenu, { shopPath, buildProductsPath } from './MegaMenu';
import { taxonomyAPI } from '../services/api';
import { TAXONOMY_TREE, NAV_ANCHORS } from '../data/taxonomy';

/** Fallback when API is slow/offline — primaries only (excludes Linen Edit special) */
const staticTree = () =>
  TAXONOMY_TREE.filter((n) => n.isNavPrimary !== false).map((n) => ({
    name: n.name,
    slug: n.slug,
    navCopy: n.copy || '',
    description: n.copy || '',
    tileImage: n.tileImage,
    children: (n.children || []).map((c) => ({
      name: c.name,
      slug: c.slug,
      tileImage: c.tileImage,
      image: c.tileImage,
      children: (c.children || []).map((t) => ({
        name: t.name,
        slug: t.slug,
        tileImage: t.tileImage,
      })),
    })),
  }));

const SECTION_SHOP_LINKS = {
  suits: '/shop/suits',
  shirts: '/shop/shirts',
  trousers: '/shop/trousers',
  jackets: '/shop/jackets',
  shoes: '/shop/shoes',
  accessories: '/shop/accessories',
  'gift-sets': '/shop/gift-sets',
  'linen-edit': '/shop/linen-edit',
  'track-suits': '/shop/jackets/track-tops',
  khaki: '/shop/trousers/khaki',
  'formal-shoes': '/shop/shoes/formal-shoes',
  'casual-shoes': '/shop/shoes/casual',
  boots: '/shop/shoes/formal-shoes',
  loafers: '/shop/shoes/loafers',
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [menuHighlight, setMenuHighlight] = useState(false);
  const [tree, setTree] = useState(staticTree);
  const [anchors, setAnchors] = useState(NAV_ANCHORS);
  const navRef = useRef(null);
  const navigate = useNavigate();

  const cartItemCount = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  );
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    taxonomyAPI
      .tree()
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (data?.tree?.length) setTree(data.tree);
        if (data?.anchors?.length) setAnchors(data.anchors);
      })
      .catch(() => {
        /* keep static fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [openDropdown]);

  const closeAll = () => {
    setIsOpen(false);
    setOpenDropdown(null);
    setOpenSection(null);
  };

  const goShop = (category, sub, tier) => {
    navigate(shopPath(category, sub, tier));
    closeAll();
  };

  const toggleDropdown = (slug) => {
    setOpenDropdown((prev) => (prev === slug ? null : slug));
  };

  const toggleSection = (slug) => {
    setOpenSection((prev) => (prev === slug ? null : slug));
  };

  const activePrimary = tree.find((p) => p.slug === openDropdown) || null;
  const bestsellersHref = anchors.find((a) => a.id === 'bestsellers')?.href || '/sale';
  const newArrivalsHref = anchors.find((a) => a.id === 'new-arrivals')?.href || '/new-arrivals';
  const linenEditHref = anchors.find((a) => a.id === 'linen-edit')?.href || '/shop/linen-edit';
  /** Spec: Gift Sets sits in secondary cluster, not primary mega-nav. */
  const primaryNav = tree.filter((p) => p.slug !== 'gift-sets');
  const giftSetsHref = '/shop/gift-sets';

  return (
    <nav
      ref={navRef}
      className={`fixed z-50 w-full transition-all duration-500 ${
        scrolled ? 'glass py-4 shadow-2xl' : 'bg-transparent py-6 lg:py-8'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <Link to="/" onClick={closeAll} className="min-w-0 shrink">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex max-w-[min(58vw,14rem)] flex-col sm:max-w-none"
          >
            <span className="text-gradient-gold block whitespace-nowrap font-serif text-[clamp(0.95rem,3.8vw,1.85rem)] font-semibold leading-none tracking-[0.14em] sm:tracking-[0.18em]">
              PRINCE ESQUIRE
            </span>
            <span className="mt-1.5 block whitespace-nowrap font-sans text-[clamp(6px,1.8vw,9px)] font-medium uppercase tracking-[0.35em] text-gold-500/70 sm:tracking-[0.45em]">
              The Man&apos;s Shop
            </span>
          </motion.div>
        </Link>

        {/* Desktop primary nav */}
        <div className="relative hidden max-w-[72vw] flex-wrap items-center justify-end gap-2 xl:gap-3 2xl:gap-4 lg:flex">
          <Link
            to={newArrivalsHref}
            onClick={closeAll}
            className="whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.14em] text-gold-400 transition-colors hover:text-gold-200 xl:text-[9px] 2xl:text-[10px] xl:tracking-[0.18em]"
          >
            New Arrivals
          </Link>

          {primaryNav.map((item) => (
            <div key={item.slug} className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown(item.slug)}
                onMouseEnter={() => setOpenDropdown(item.slug)}
                aria-expanded={openDropdown === item.slug}
                className={`flex items-center gap-0.5 whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 xl:text-[9px] 2xl:text-[10px] xl:tracking-[0.18em] ${
                  openDropdown === item.slug ? 'text-gold-400' : 'text-white hover:text-gold-400'
                }`}
              >
                {item.name}
                <ChevronDown
                  size={11}
                  className={`shrink-0 transition-transform duration-300 ${
                    openDropdown === item.slug ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          ))}

          <span className="mx-1 hidden h-3 w-px bg-gold-500/25 2xl:inline-block" aria-hidden />

          <Link
            to={linenEditHref}
            onClick={closeAll}
            className="whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.14em] text-gold-400/90 transition-colors hover:text-gold-200 xl:text-[9px] xl:tracking-[0.18em]"
          >
            The Linen Edit
          </Link>
          <Link
            to={giftSetsHref}
            onClick={closeAll}
            className="whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.14em] text-gold-400/90 transition-colors hover:text-gold-200 xl:text-[9px] xl:tracking-[0.18em]"
          >
            Gift Sets
          </Link>
          <Link
            to={bestsellersHref}
            onClick={closeAll}
            className="whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.14em] text-red-400 transition-colors hover:text-red-300 xl:text-[9px] xl:tracking-[0.18em]"
          >
            Sale
          </Link>

          <AnimatePresence>
            {activePrimary && activePrimary.slug !== 'gift-sets' ? (
              <MegaMenu
                primary={activePrimary}
                onNavigate={goShop}
                onClose={() => setOpenDropdown(null)}
              />
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-3 text-gold-400 sm:space-x-5">
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            onClick={closeAll}
            className="hidden whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.16em] text-gold-400/90 transition-colors hover:text-gold-200 xl:inline xl:text-[9px]"
          >
            {isAuthenticated ? 'Account' : 'Sign In'}
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/signup"
              onClick={closeAll}
              className="hidden whitespace-nowrap rounded-full border border-gold-500/40 px-3 py-1.5 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-gold-400 transition-colors hover:border-gold-400 hover:bg-gold-600 hover:text-navy-950 xl:inline xl:text-[9px]"
            >
              Get Started
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="transition-colors hover:text-gold-200"
            aria-label="Search products"
          >
            <Search size={18} />
          </button>

          <div className="group relative hidden sm:block xl:hidden">
            <Link to={isAuthenticated ? '/profile' : '/login'}>
              <User size={18} className="cursor-pointer transition-colors hover:text-gold-200" />
            </Link>
            {isAuthenticated && (
              <div className="invisible absolute right-0 top-full mt-6 translate-y-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="min-w-[180px] border border-gold-500/20 bg-navy-950/95 p-6 shadow-2xl">
                  <p className="mb-4 border-b border-gold-500/10 pb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">
                    {user?.name}
                  </p>
                  <div className="space-y-3">
                    <Link
                      to="/profile"
                      className="block text-[10px] font-bold uppercase tracking-widest text-navy-200 hover:text-gold-400"
                    >
                      My Account
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-red-400/70 transition-colors hover:text-red-400"
                    >
                      <LogOut size={12} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" className="group relative cursor-pointer">
            <ShoppingBag size={18} className="transition-colors group-hover:text-gold-200" />
            <span
              key={cartItemCount}
              className={`absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-600 px-1 font-sans text-[9px] font-bold tabular-nums text-navy-950 shadow-sm ${
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
            className={`relative rounded-md p-1 text-gold-400 transition-colors hover:text-gold-200 lg:hidden ${
              menuHighlight && !isOpen
                ? 'animate-pulse ring-2 ring-gold-400/80 ring-offset-2 ring-offset-navy-950'
                : ''
            }`}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAll}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-40 w-[88%] max-w-sm overflow-y-auto border-l border-gold-500/10 bg-navy-950 font-sans lg:hidden"
            >
              <div className="p-6 pb-12 pt-24">
                <div className="mb-8 border-b border-gold-500/10 pb-6">
                  <p className="text-gradient-gold whitespace-nowrap font-serif text-[clamp(1.1rem,5vw,1.5rem)] font-semibold tracking-[0.16em]">
                    PRINCE ESQUIRE
                  </p>
                  <p className="mt-2 whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.42em] text-gold-500/80">
                    The Man&apos;s Shop
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 font-sans text-[11px] font-light tracking-wide text-navy-300">
                    <MapPin size={11} className="text-gold-500/70" />
                    Yala Towers, Nairobi
                  </p>
                </div>

                <div className="flex flex-col">
                  <Link
                    to={newArrivalsHref}
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 font-serif text-[1.25rem] tracking-[0.04em] text-gold-400"
                  >
                    New Arrivals
                  </Link>
                  {primaryNav.map((item) => (
                    <div key={item.slug} className="border-b border-gold-500/10">
                      <div className="flex w-full items-center">
                        <button
                          type="button"
                          onClick={() => goShop(item.slug)}
                          className="flex-1 py-5 text-left font-serif text-[1.25rem] tracking-[0.04em] text-white transition-colors hover:text-gold-400"
                        >
                          {item.name}
                        </button>
                        {(item.children || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleSection(item.slug)}
                            aria-expanded={openSection === item.slug}
                            aria-label={`Show ${item.name} subcategories`}
                            className="p-3 text-gold-500"
                          >
                            <ChevronDown
                              size={18}
                              className={`transition-transform duration-300 ${
                                openSection === item.slug ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {openSection === item.slug && (item.children || []).length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col space-y-3 pb-5 pl-1">
                              {(item.children || []).map((link) => (
                                <div key={link.slug} className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => goShop(item.slug, link.slug)}
                                    className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gold-500/5"
                                  >
                                    <img
                                      src={
                                        link.tileImage ||
                                        link.image ||
                                        `/placeholders/taxonomy/${link.slug}.svg`
                                      }
                                      alt=""
                                      className="h-14 w-11 object-cover ring-1 ring-gold-500/20"
                                      loading="lazy"
                                    />
                                    <span className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-navy-200">
                                      {link.name}
                                    </span>
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => goShop(item.slug)}
                                className="px-2 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-500"
                              >
                                Shop all {item.name}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <Link
                    to={linenEditHref}
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 font-serif text-[1.25rem] tracking-[0.04em] text-gold-200"
                  >
                    The Linen Edit
                  </Link>

                  <Link
                    to={giftSetsHref}
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 font-serif text-[1.25rem] tracking-[0.04em] text-gold-200"
                  >
                    Gift Sets
                  </Link>

                  <Link
                    to={bestsellersHref}
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 font-serif text-[1.25rem] tracking-[0.04em] text-red-400"
                  >
                    Sale
                  </Link>

                  <Link
                    to="/signup"
                    onClick={closeAll}
                    className="border-b border-gold-500/10 py-5 font-serif text-[1.25rem] tracking-[0.04em] text-gold-500"
                  >
                    Get Started
                  </Link>
                </div>

                <div className="space-y-5 pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(true);
                      closeAll();
                    }}
                    className="flex items-center gap-3 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-gold-400"
                  >
                    <Search size={18} />
                    Search
                  </button>
                  <Link
                    to={isAuthenticated ? '/profile' : '/login'}
                    onClick={closeAll}
                    className="flex items-center gap-3 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-gold-400"
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
