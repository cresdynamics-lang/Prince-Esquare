import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, Loader2, Mail, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { resolveDisplayImageUrl } from '../utils/cloudinary';
import { useAuthStore } from '../store/useAuthStore';
import { trackSearch, trackLead } from '../lib/metaPixel';
import { displayProductName } from '../seo/seoData';

const POPULAR_SEARCHES = ['Two-piece suit', 'Official shoes', 'Blazer', 'Khaki trousers', 'Polo', 'Loafers', 'Track suit', 'Belt'];

const BROWSE_LINKS = [
  { name: 'Suits', href: '/shop/suits', image: '/models/blazers/tan-lifestyle.jpg' },
  { name: 'Shirts', href: '/shop/shirts', image: '/models/shirts/light-blue-gingham.jpg' },
  { name: 'Trousers', href: '/shop/trousers', image: '/models/shirts/rose-contrast.jpg' },
  { name: 'Shoes', href: '/shop/shoes', image: '/models/shoes/tan-brogue-lifestyle.jpg' },
];

const RECENT_KEY = 'pe-recent-searches';

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function rememberSearch(term) {
  try {
    const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private window: recent searches are only a convenience */
  }
}

function formatPrice(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString('en-KE') : value;
}

export default function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [email, setEmail] = useState(user?.email || '');
  const [alertSending, setAlertSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertError, setAlertError] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
      setResult(null);
      setRecent(readRecent());
      setAlertSent(false);
      setAlertError('');
      setEmail(user?.email || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, user?.email]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchAPI.search(trimmed);
      const data = res.data?.data || null;
      setResult(data);
      const listed = data?.matchType === 'exact' ? data.products : data?.related || [];
      trackSearch(trimmed, listed);
    } catch {
      setResult({
        query: trimmed,
        matchType: 'none',
        products: [],
        related: [],
        showRestockPrompt: true,
        message:
          `We couldn't find "${trimmed}" in the shop right now. ` +
          'Leave your email and we\'ll notify you when similar items arrive.',
      });
      trackSearch(trimmed, []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => runSearch(query), query.trim() ? 220 : 0);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !query.trim()) return;
    setAlertSending(true);
    setAlertError('');
    try {
      await searchAPI.restockAlert({ email: email.trim(), query: query.trim() });
      setAlertSent(true);
      trackLead('restock_alert');
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Could not save your email. Please try again.');
    } finally {
      setAlertSending(false);
    }
  };

  const goToResults = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    rememberSearch(trimmed);
    onClose();
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const closeAndRemember = () => {
    if (query.trim()) rememberSearch(query.trim());
    onClose();
  };

  const displayProducts = result?.matchType === 'exact' ? result.products : result?.related || [];
  const categories = result?.categories || [];
  const total = result?.total || displayProducts.length;
  const hasQuery = Boolean(query.trim());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center sm:p-4 sm:pt-16"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-navy-950/90 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            exit={{ y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden border border-gold-500/25 bg-navy-950 shadow-2xl sm:h-auto sm:max-h-[84vh]"
          >
            <form
              className="flex items-center gap-3 border-b border-gold-500/20 px-4 py-3.5 sm:px-5"
              onSubmit={(e) => {
                e.preventDefault();
                goToResults(query);
              }}
              role="search"
            >
              <Search size={20} className="shrink-0 text-gold-400" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search suits, shirts, shoes…"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent font-sans text-base text-white outline-none placeholder:text-navy-300 [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off"
              />
              {loading && <Loader2 size={18} className="animate-spin text-gold-400" aria-label="Searching" />}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-navy-100 transition-colors hover:text-gold-300"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!hasQuery && (
                <div className="space-y-7 p-5">
                  {recent.length > 0 ? (
                    <section>
                      <h3 className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                        Recent searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="flex items-center gap-1.5 border border-gold-500/25 px-3 py-2 font-sans text-sm text-white hover:border-gold-400"
                          >
                            <Clock size={13} className="text-navy-200" aria-hidden />
                            {term}
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section>
                    <h3 className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                      Popular searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="border border-gold-500/25 px-3 py-2 font-sans text-sm text-white transition-colors hover:border-gold-400 hover:text-gold-200"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                      Browse
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {BROWSE_LINKS.map((link) => (
                        <Link key={link.href} to={link.href} onClick={onClose} className="group block">
                          <div className="aspect-[3/4] overflow-hidden bg-navy-900">
                            <img
                              src={link.image}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                          <p className="mt-2 font-sans text-sm font-medium text-white group-hover:text-gold-300">
                            {link.name}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {hasQuery && !loading && result?.correctedQuery ? (
                <p className="border-b border-gold-500/10 px-5 py-3 font-sans text-sm text-navy-100">
                  Showing results for <strong className="font-semibold text-white">{result.correctedQuery}</strong>
                </p>
              ) : null}

              {hasQuery && !loading && result?.message && result.matchType === 'related' ? (
                <p className="border-b border-gold-500/10 px-5 py-3 font-sans text-sm text-navy-100">{result.message}</p>
              ) : null}

              {hasQuery && categories.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-b border-gold-500/10 px-5 py-3.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={cat.href}
                      onClick={closeAndRemember}
                      className="flex items-center gap-1.5 border border-gold-500/40 px-3 py-1.5 font-sans text-[13px] text-gold-200 transition-colors hover:bg-gold-500 hover:text-navy-950"
                    >
                      {cat.name}
                      {cat.count ? <span className="opacity-70">({cat.count})</span> : null}
                    </Link>
                  ))}
                </div>
              ) : null}

              {hasQuery && displayProducts.length > 0 ? (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-5 p-5 md:grid-cols-4">
                  {displayProducts.map((product) => (
                    <li key={product.id}>
                      <Link to={`/product/${product.slug}`} onClick={closeAndRemember} className="group block">
                        <div className="aspect-[3/4] overflow-hidden bg-navy-900">
                          {product.thumbnail ? (
                            <img
                              src={resolveDisplayImageUrl(product.thumbnail, { width: 360 })}
                              alt={displayProductName(product.name)}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : null}
                        </div>
                        <p className="mt-2 font-serif text-[15px] font-medium leading-snug text-white line-clamp-2 group-hover:text-gold-300">
                          {displayProductName(product.name)}
                        </p>
                        <p className="mt-1 font-sans text-sm font-semibold text-gold-300">
                          KSh {formatPrice(product.discount_price || product.price)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {hasQuery && displayProducts.length > 0 ? (
                <div className="sticky bottom-0 border-t border-gold-500/20 bg-navy-950 p-3">
                  <button
                    type="button"
                    onClick={() => goToResults(query)}
                    className="flex w-full items-center justify-center gap-2 bg-gold-500 px-4 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-navy-950 transition-colors hover:bg-gold-300"
                  >
                    View all {total > 0 ? `${total} ` : ''}results
                    <ArrowRight size={15} aria-hidden />
                  </button>
                </div>
              ) : null}

              {hasQuery && !loading && result?.showRestockPrompt && (
                <div className="px-5 py-6">
                  {alertSent ? (
                    <p className="text-center font-sans text-sm text-green-300">
                      You&apos;re on the list. We&apos;ll email you when &ldquo;{query}&rdquo; arrives.
                    </p>
                  ) : (
                    <>
                      <p className="mb-4 font-sans text-sm leading-relaxed text-navy-100">
                        {result.message ||
                          `We couldn't find "${query}" in stock. Leave your email and we'll tell you when new stock arrives.`}
                      </p>
                      <form onSubmit={handleRestockSubmit} className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400" aria-hidden />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            aria-label="Your email address"
                            className="w-full border border-gold-500/25 bg-navy-900/50 py-3 pl-10 pr-4 font-sans text-sm text-white outline-none placeholder:text-navy-300 focus:border-gold-400"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={alertSending}
                          className="bg-gold-500 px-5 py-3 font-sans text-sm font-semibold text-navy-950 hover:bg-gold-300 disabled:opacity-50"
                        >
                          {alertSending ? 'Saving…' : 'Notify me'}
                        </button>
                      </form>
                      {alertError && <p className="mt-2 font-sans text-xs text-red-300">{alertError}</p>}
                      {!isAuthenticated && (
                        <p className="mt-3 text-center font-sans text-xs text-navy-200">
                          Already have an account?{' '}
                          <Link to="/login" onClick={onClose} className="text-gold-300 hover:text-gold-100">
                            Sign in
                          </Link>{' '}
                          for a faster checkout.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
