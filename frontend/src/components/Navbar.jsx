import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, User, ChevronDown, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import SearchOverlay from './SearchOverlay';
import MegaMenu, { shopPath, buildProductsPath } from './MegaMenu';
import { tileImageFor } from '../data/categoryLooks';
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
  'track-suits': '/shop/tracksuits',
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
  const menuTriggerRef = useRef(null);
  const menuCloseRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // Back and forward change the page without a menu link being tapped.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setIsOpen(false);
    setOpenSection(null);
  }

  const cartItemCount = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  );
  const { isAuthenticated } = useAuthStore();

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

  // While the menu is open: the page behind stays still, Escape closes it, and focus moves in and back.
  useEffect(() => {
    if (!isOpen) return undefined;
    const { documentElement: html, body } = document;
    const previous = [html.style.overflow, body.style.overflow];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    const trigger = menuTriggerRef.current;
    menuCloseRef.current?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setOpenSection(null);
      }
    };
    // Rotating a tablet to desktop width hides the menu, so it must not leave the page locked.
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => {
      if (desktop.matches) {
        setIsOpen(false);
        setOpenSection(null);
      }
    };
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      [html.style.overflow, body.style.overflow] = previous;
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
      trigger?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const closeAll = () => {
    setIsOpen(false);
    setOpenDropdown(null);
    setOpenSection(null);
  };

  const toggleSection = (slug) => {
    setOpenSection((prev) => (prev === slug ? null : slug));
  };

  const activePrimary = tree.find((p) => p.slug === openDropdown) || null;
  const bestsellersHref = anchors.find((a) => a.id === 'bestsellers')?.href || '/sale';
  const newArrivalsHref = anchors.find((a) => a.id === 'new-arrivals')?.href || '/new-arrivals';
  const linenEditHref = anchors.find((a) => a.id === 'linen-edit')?.href || '/shop/linen-edit';
  /** Spec: Gift Sets sits in secondary cluster, not primary mega-nav. */
  const primaryNav = tree.filter((p) => p.slug !== 'gift-sets' && p.productCount !== 0);
  const giftSetsHref = '/shop/gift-sets';

  const navLinkClass =
    'whitespace-nowrap py-3 font-sans text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 xl:text-xs';

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      onMouseLeave={() => setOpenDropdown(null)}
      className={`fixed z-50 w-full transition-colors duration-300 ${
        isHome && !scrolled && !openDropdown
          ? 'bg-gradient-to-b from-navy-950/85 to-transparent'
          : 'border-b border-gold-500/15 bg-navy-950/97 shadow-xl backdrop-blur-md'
      }`}
    >
      {!scrolled ? (
        <p className="hidden bg-gold-500 py-1 text-center font-sans text-[11px] font-medium tracking-[0.06em] text-navy-950 sm:block">
          Same-day delivery in Nairobi, 1-2 hours · Countrywide in 1-2 days · Yala Towers · WhatsApp +254 724 494089
        </p>
      ) : null}

      <div className="container mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-4 py-2 sm:gap-3 sm:px-6 sm:py-3">
        {/* Left: menu on phones, search field on desktop */}
        <div className="flex items-center gap-3 text-gold-300">
          <button
            ref={menuTriggerRef}
            type="button"
            id="prince-menu-trigger"
            onClick={() => setIsOpen(true)}
            className={`-ml-2.5 flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-md transition-[color,transform] duration-150 hover:text-gold-100 active:scale-90 lg:hidden ${
              menuHighlight && !isOpen
                ? 'animate-pulse ring-2 ring-gold-400/80 ring-offset-2 ring-offset-navy-950'
                : ''
            }`}
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="prince-mobile-menu"
          >
            <Menu size={24} />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden w-full max-w-xs items-center gap-2.5 border border-gold-500/30 bg-navy-900/40 px-3.5 py-2 text-left font-sans text-[13px] text-navy-100 transition-colors hover:border-gold-400 lg:flex"
            aria-label="Search products"
          >
            <Search size={16} className="shrink-0 text-gold-400" />
            Search suits, shirts, shoes…
          </button>
        </div>

        {/* Centre: brand */}
        <Link to="/" onClick={closeAll} className="flex flex-col items-center text-center" aria-label="Prince Esquire home">
          <span className="text-gradient-gold whitespace-nowrap font-serif text-[1.15rem] font-semibold leading-none tracking-[0.14em] sm:text-2xl sm:tracking-[0.18em] lg:text-[1.85rem]">
            PRINCE ESQUIRE
          </span>
          {!scrolled ? (
            <span className="mt-1 whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.4em] text-gold-300 sm:text-[9px]">
              The Man&apos;s Shop
            </span>
          ) : null}
        </Link>

        {/* Right: account + bag */}
        <div className="flex items-center justify-end text-gold-300 sm:gap-2 lg:gap-5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-9 touch-manipulation items-center justify-center transition-colors hover:text-gold-100 active:scale-90 sm:w-11 lg:hidden"
            aria-label="Search products"
          >
            <Search size={21} />
          </button>
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            onClick={closeAll}
            className="hidden items-center gap-2 font-sans text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-gold-100 sm:flex"
            aria-label={isAuthenticated ? 'My account' : 'Sign in'}
          >
            <User size={19} />
            <span className="hidden xl:inline">{isAuthenticated ? 'Account' : 'Sign in'}</span>
          </Link>
          <Link to="/cart" className="group relative -mr-2 flex h-11 w-11 touch-manipulation items-center justify-center" aria-label={`Shopping bag, ${cartItemCount} items`}>
            <ShoppingBag size={21} className="transition-colors group-hover:text-gold-100" />
            <span
              key={cartItemCount}
              className={`absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 font-sans text-[10px] font-bold tabular-nums text-navy-950 ${
                cartItemCount > 0 ? 'animate-[cart-pop_0.35s_ease-out]' : ''
              }`}
            >
              {cartItemCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Desktop department row: real links, so they can be crawled and opened in a new tab */}
      <div className="relative hidden border-t border-gold-500/10 lg:block">
        <div className="container mx-auto flex items-center justify-center gap-5 px-6 xl:gap-8">
          <Link to={newArrivalsHref} onClick={closeAll} onMouseEnter={() => setOpenDropdown(null)} className={`${navLinkClass} text-gold-300 hover:text-gold-100`}>
            New Arrivals
          </Link>

          {primaryNav.map((item) => (
            <Link
              key={item.slug}
              to={shopPath(item.slug)}
              onClick={closeAll}
              onMouseEnter={() => setOpenDropdown(item.slug)}
              onFocus={() => setOpenDropdown(item.slug)}
              aria-expanded={openDropdown === item.slug}
              aria-haspopup="true"
              className={`${navLinkClass} flex items-center gap-1 ${
                openDropdown === item.slug ? 'text-gold-300' : 'text-white hover:text-gold-300'
              }`}
            >
              {item.name}
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform duration-200 ${openDropdown === item.slug ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </Link>
          ))}

          <Link to={linenEditHref} onClick={closeAll} onMouseEnter={() => setOpenDropdown(null)} className={`${navLinkClass} text-white hover:text-gold-300`}>
            Linen Edit
          </Link>
          <Link to={giftSetsHref} onClick={closeAll} onMouseEnter={() => setOpenDropdown(null)} className={`${navLinkClass} text-white hover:text-gold-300`}>
            Gift Sets
          </Link>
          <Link to={bestsellersHref} onClick={closeAll} onMouseEnter={() => setOpenDropdown(null)} className={`${navLinkClass} text-red-300 hover:text-red-200`}>
            Sale
          </Link>
        </div>

        <AnimatePresence>
          {activePrimary && activePrimary.slug !== 'gift-sets' && (activePrimary.children || []).length > 0 ? (
            <MegaMenu primary={activePrimary} onNavigate={closeAll} />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Mobile menu. Rendered on <body>: the header's backdrop blur would otherwise trap it inside the header. */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div key="prince-mobile-menu" className="lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                onClick={closeAll}
                className="fixed inset-0 z-[60] bg-black/60"
                aria-hidden="true"
              />
              <motion.div
                id="prince-mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-y-0 left-0 z-[70] flex h-dvh w-[min(88vw,24rem)] flex-col border-r border-gold-500/15 bg-navy-950 font-sans shadow-2xl"
              >
                <div className="grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center border-b border-gold-500/15 px-4 py-2 sm:px-6 sm:py-3">
                  <button
                    ref={menuCloseRef}
                    type="button"
                    onClick={closeAll}
                    className="-ml-2.5 flex h-11 w-11 touch-manipulation items-center justify-center rounded-md text-gold-300 transition-[color,transform] duration-150 hover:text-gold-100 active:scale-90"
                    aria-label="Close menu"
                  >
                    <X size={24} />
                  </button>
                  <div className="min-w-0 text-center">
                    <p className="text-gradient-gold whitespace-nowrap font-serif text-[1.05rem] font-semibold leading-none tracking-[0.14em]">
                      PRINCE ESQUIRE
                    </p>
                    <p className="mt-1 whitespace-nowrap font-sans text-[8px] font-medium uppercase tracking-[0.4em] text-gold-300">
                      The Man&apos;s Shop
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
                    <div className="flex flex-col">
                      <Link
                        to={newArrivalsHref}
                        onClick={closeAll}
                        className="border-b border-gold-500/10 flex min-h-14 items-center py-3 font-serif text-[1.15rem] tracking-[0.04em] text-gold-400"
                      >
                        New Arrivals
                      </Link>
                      {primaryNav.map((item) => (
                        <div key={item.slug} className="border-b border-gold-500/10">
                          <div className="flex w-full items-center">
                            <Link
                              to={shopPath(item.slug)}
                              onClick={closeAll}
                              className="flex min-h-14 min-w-0 flex-1 items-center py-3 text-left font-serif text-[1.15rem] tracking-[0.04em] text-white transition-colors hover:text-gold-400"
                            >
                              {item.name}
                            </Link>
                            {(item.children || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleSection(item.slug)}
                                aria-expanded={openSection === item.slug}
                                aria-label={`Show ${item.name} subcategories`}
                                className="-mr-3 flex h-14 w-12 shrink-0 touch-manipulation items-center justify-center text-gold-500"
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
                                <div className="flex flex-col gap-1 pb-4">
                                  {(item.children || [])
                                    .filter((link) => link.productCount !== 0)
                                    .map((link) => {
                                      const image = tileImageFor(link.slug, link.tileImage || link.image);
                                      return (
                                        <Link
                                          key={link.slug}
                                          to={shopPath(item.slug, link.slug)}
                                          onClick={closeAll}
                                          className="flex min-h-12 items-center gap-3 rounded-md py-1.5 text-left hover:bg-gold-500/5"
                                        >
                                          {image && !image.endsWith('.svg') ? (
                                            <img
                                              src={image}
                                              alt=""
                                              className="h-14 w-11 shrink-0 object-cover object-top ring-1 ring-gold-500/20"
                                              loading="lazy"
                                            />
                                          ) : null}
                                          <span className="font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-navy-100">
                                            {link.name}
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  <Link
                                    to={shopPath(item.slug)}
                                    onClick={closeAll}
                                    className="flex min-h-11 items-center text-left font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-300"
                                  >
                                    Shop all {item.name}
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      <Link
                        to={linenEditHref}
                        onClick={closeAll}
                        className="border-b border-gold-500/10 flex min-h-14 items-center py-3 font-serif text-[1.15rem] tracking-[0.04em] text-gold-200"
                      >
                        The Linen Edit
                      </Link>

                      <Link
                        to={giftSetsHref}
                        onClick={closeAll}
                        className="border-b border-gold-500/10 flex min-h-14 items-center py-3 font-serif text-[1.15rem] tracking-[0.04em] text-gold-200"
                      >
                        Gift Sets
                      </Link>

                      <Link
                        to={bestsellersHref}
                        onClick={closeAll}
                        className="border-b border-gold-500/10 flex min-h-14 items-center py-3 font-serif text-[1.15rem] tracking-[0.04em] text-red-400"
                      >
                        Sale
                      </Link>

                      <Link
                        to="/signup"
                        onClick={closeAll}
                        className="border-b border-gold-500/10 flex min-h-14 items-center py-3 font-serif text-[1.15rem] tracking-[0.04em] text-gold-500"
                      >
                        Get Started
                      </Link>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(true);
                          closeAll();
                        }}
                        className="flex min-h-12 w-full items-center gap-3 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-gold-400"
                      >
                        <Search size={18} />
                        Search
                      </button>
                      <Link
                        to={isAuthenticated ? '/profile' : '/login'}
                        onClick={closeAll}
                        className="flex min-h-12 w-full items-center gap-3 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-gold-400"
                      >
                        <User size={18} />
                        {isAuthenticated ? 'My Account' : 'Sign In'}
                      </Link>
                    </div>
                  <p className="flex min-h-12 items-center gap-3 font-sans text-[11px] font-light tracking-wide text-navy-300">
                    <MapPin size={18} className="text-gold-500/70" />
                    Yala Towers, Nairobi
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export { SECTION_SHOP_LINKS, buildProductsPath };
export default Navbar;
