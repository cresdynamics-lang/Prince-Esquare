import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mail, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { resolveDisplayImageUrl } from '../utils/cloudinary';
import { useAuthStore } from '../store/useAuthStore';

function formatPrice(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n.toLocaleString() : value;
}

export default function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState(user?.email || '');
  const [alertSending, setAlertSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertError, setAlertError] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
      setResult(null);
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
      setResult(res.data?.data || null);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => runSearch(query), query.trim() ? 280 : 0);
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
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Could not save your email. Please try again.');
    } finally {
      setAlertSending(false);
    }
  };

  const displayProducts =
    result?.matchType === 'exact' ? result.products : result?.related || [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 sm:pt-28"
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
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gold-500/20 bg-navy-900 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-gold-500/10 px-4 py-4">
              <Search size={20} className="shrink-0 text-gold-500/50" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shoes, shirts, suits…"
                className="min-w-0 flex-1 bg-transparent text-base text-gold-50 outline-none placeholder:text-gold-500/30"
                autoComplete="off"
              />
              {loading && <Loader2 size={18} className="animate-spin text-gold-500/60" />}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gold-500/40 hover:bg-navy-800 hover:text-gold-500"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[min(70vh,520px)] overflow-y-auto custom-scrollbar">
              {!query.trim() && (
                <p className="px-5 py-8 text-center text-sm text-gold-500/40">
                  Start typing to search the collection
                </p>
              )}

              {query.trim() && !loading && result?.message && result.matchType !== 'exact' && (
                <p className="border-b border-gold-500/10 px-5 py-3 text-sm leading-relaxed text-gold-500/70">
                  {result.message}
                </p>
              )}

              {displayProducts.length > 0 && (
                <ul className="divide-y divide-gold-500/5">
                  {result.matchType === 'related' && (
                    <li className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gold-500/45">
                      Related products
                    </li>
                  )}
                  {displayProducts.map((product) => (
                    <li key={product.id}>
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-navy-800/60"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gold-500/10 bg-navy-950">
                          {product.thumbnail ? (
                            <img
                              src={resolveDisplayImageUrl(product.thumbnail, { width: 120 })}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-gold-500/30">
                              PE
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gold-100">{product.name}</p>
                          <p className="truncate text-xs text-gold-500/50">
                            {[product.category_name, product.brand_name].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm text-gold-500">
                          KSh {formatPrice(product.discount_price || product.price)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {query.trim() && !loading && result?.showRestockPrompt && (
                <div className="border-t border-gold-500/10 px-5 py-6">
                  {alertSent ? (
                    <p className="text-center text-sm text-green-400">
                      You're on the list — we'll email you when &ldquo;{query}&rdquo; is restocked.
                    </p>
                  ) : (
                    <>
                      <p className="mb-4 text-sm leading-relaxed text-gold-500/70">
                        {result.message ||
                          `We couldn't find "${query}" in stock. Sign in with your email for updates when new stock arrives.`}
                      </p>
                      <form onSubmit={handleRestockSubmit} className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/40" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full rounded-xl border border-gold-500/15 bg-navy-950/60 py-3 pl-10 pr-4 text-sm text-gold-100 outline-none focus:border-gold-500/40"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={alertSending}
                          className="rounded-xl bg-gold-600 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-500 disabled:opacity-50"
                        >
                          {alertSending ? 'Saving…' : 'Notify me'}
                        </button>
                      </form>
                      {alertError && (
                        <p className="mt-2 text-xs text-red-400">{alertError}</p>
                      )}
                      {!isAuthenticated && (
                        <p className="mt-3 text-center text-xs text-gold-500/40">
                          Already have an account?{' '}
                          <Link to="/login" onClick={onClose} className="text-gold-500 hover:text-gold-400">
                            Sign in
                          </Link>{' '}
                          for a faster checkout when items return.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {query.trim() && !loading && result?.matchType === 'exact' && displayProducts.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-gold-500/40">No products found.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
