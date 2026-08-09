import { useEffect, useState, useCallback, useMemo } from 'react';
import { ExternalLink, RefreshCw, ShoppingBag, Eye, Users, MousePointerClick, FileText, Plus, Minus, X, Search, MessageCircle } from 'lucide-react';
import { adminVisitorAPI } from '../../services/api';
import { ensureSocket, socket } from '../../lib/socket';

const SITE = 'https://prince-esquire.co.ke';

const WINDOW_KEYS = [
  { key: 'live', short: 'Now' },
  { key: '30m', short: '30m' },
  { key: '3h', short: '3h' },
  { key: '6h', short: '6h' },
  { key: '12h', short: '12h' },
  { key: '24h', short: '1 day' },
  { key: '2d', short: '2 days' },
];

const fmtTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtPrice = (value) => `KSh ${parseFloat(value || 0).toLocaleString()}`;

function StatCard({ label, value, hint, accent = false }) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-4 sm:p-5 ${
        accent
          ? 'border-green-500/25 bg-green-500/10'
          : 'border-gold-500/10 bg-navy-900/50'
      }`}
    >
      <p className={`truncate text-[10px] font-bold uppercase tracking-[0.22em] ${accent ? 'text-green-400' : 'text-gold-500/55'}`}>
        {label}
      </p>
      <p className="mt-2 truncate font-serif text-3xl text-white sm:text-4xl">{value}</p>
      {hint ? <p className="mt-2 truncate text-[10px] text-navy-300">{hint}</p> : null}
    </div>
  );
}

function Panel({ title, icon: Icon, children, empty }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-gold-500/10 bg-navy-900/30">
      <div className="flex items-center gap-2 border-b border-gold-500/10 px-4 py-3 sm:px-5">
        {Icon ? <Icon size={16} className="shrink-0 text-gold-400" /> : null}
        <h3 className="truncate font-serif text-lg text-gold-300">{title}</h3>
      </div>
      <div className="max-h-[28rem] overflow-y-auto px-4 py-3 sm:px-5">
        {empty ? <p className="py-6 text-sm text-gold-500/40">{empty}</p> : children}
      </div>
    </section>
  );
}

function ProductRow({ name, slug, price, meta }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gold-500/5 py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-4">
      <div className="min-w-0">
        <a
          href={`${SITE}/product/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="block break-words text-sm text-green-400 hover:text-green-300 hover:underline"
        >
          {name || slug}
        </a>
        <p className="mt-1 break-words text-[10px] uppercase tracking-widest text-gold-500/45">
          {fmtPrice(price)} · {slug}
        </p>
      </div>
      <p className="shrink-0 text-sm font-medium text-white sm:text-right">{meta}</p>
    </div>
  );
}

function SaleCatalogManager({ open, onClose, onChanged }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const loadPicker = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminVisitorAPI.getSaleCatalogPicker({ tab, q: search || undefined });
      setPicker(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load products');
      setPicker(null);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    if (!open) return undefined;
    loadPicker();
    return undefined;
  }, [open, loadPicker]);

  const toggleSale = async (product, nextValue) => {
    setBusyId(product.id);
    setError('');
    try {
      await adminVisitorAPI.setSaleCatalog({
        product_ids: [product.id],
        is_on_sale: nextValue,
      });
      await loadPicker();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  const products = picker?.products || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gold-500/15 bg-navy-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gold-500/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500/55">Manage sale</p>
            <h3 className="font-serif text-2xl text-white">Add or remove sale products</h3>
            <p className="mt-1 text-sm text-navy-200">
              Only products marked On Sale appear on `/sale` and in Meta ads.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-gold-500/20 p-2 text-gold-400 hover:bg-navy-900">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 border-b border-gold-500/10 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands, categories…"
                className="w-full rounded-lg border border-gold-500/15 bg-navy-900 px-9 py-2.5 text-sm text-white outline-none placeholder:text-gold-500/30 focus:border-gold-500/40"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'on_sale', label: 'On sale' },
                { id: 'not_on_sale', label: 'Not on sale' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${
                    tab === item.id
                      ? 'bg-gold-500 text-navy-950'
                      : 'border border-gold-500/20 text-gold-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-gold-500/50">
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-green-400">
              On sale: {picker?.onSaleCount ?? 0}
            </span>
            <span className="rounded-full border border-gold-500/15 px-3 py-1">
              Available to add: {picker?.availableCount ?? 0}
            </span>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-16 text-center text-[10px] uppercase tracking-widest text-gold-500/40">Loading products…</p>
          ) : products.length === 0 ? (
            <p className="py-16 text-center text-sm text-gold-500/40">No products match this filter.</p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => {
                const onSale = Boolean(p.is_on_sale);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-gold-500/10 bg-navy-900/40 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={p.thumbnail || '/LOGO.jpeg'}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg border border-gold-500/10 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{p.name}</p>
                        <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-gold-500/45">
                          {p.brand_name || '—'} · {p.category_name || p.parent_category_name || '—'} · {fmtPrice(p.price)}
                        </p>
                        <p className="mt-1 text-[10px] text-navy-300">
                          {onSale ? 'Currently on sale catalog' : 'Not on sale'} · stock {p.stock_quantity}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => toggleSale(p, !onSale)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 ${
                        onSale
                          ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                          : 'bg-green-600 text-white hover:bg-green-500'
                      }`}
                    >
                      {onSale ? <Minus size={14} /> : <Plus size={14} />}
                      {busyId === p.id ? 'Saving…' : onSale ? 'Subtract' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SaleCatalogView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managerOpen, setManagerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminVisitorAPI.getSaleCatalog();
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const products = data?.products || [];
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = p.category_name || p.parent_category_name || 'Sale';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return Array.from(map.entries());
  }, [products]);

  return (
    <div className="space-y-8 p-2">
      <div className="flex flex-col gap-4 border-b border-gold-500/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500/60">Storefront</p>
          <h2 className="font-serif text-3xl text-white">Sale Page Catalog</h2>
          <p className="mt-2 max-w-2xl text-sm font-light text-navy-200">
            Products currently visible to customers on the{' '}
            <a href={data?.salePageUrl || '/sale'} target="_blank" rel="noreferrer" className="text-gold-400 underline">
              Sale page
            </a>{' '}
            and Meta catalog ads. Use Add to include or subtract products without code changes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 bg-green-600 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-green-500"
          >
            <Plus size={14} />
            Add
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex shrink-0 items-center gap-2 border border-gold-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gold-400 hover:border-gold-500/50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Live on Sale" value={products.length} accent />
        <div className="min-w-0 rounded-xl border border-gold-500/10 bg-navy-900/50 p-5">
          <p className="text-[10px] uppercase tracking-widest text-gold-500/50">Sale page</p>
          <a href={data?.salePageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300">
            View live <ExternalLink size={14} />
          </a>
        </div>
        <div className="min-w-0 rounded-xl border border-gold-500/10 bg-navy-900/50 p-5">
          <p className="text-[10px] uppercase tracking-widest text-gold-500/50">Meta feed</p>
          <a href={data?.metaFeedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300">
            Catalog CSV <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-[10px] uppercase tracking-widest text-gold-500/40">Loading sale catalog…</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold-500/20 px-6 py-16 text-center">
          <p className="text-sm text-gold-500/50">No products on sale yet.</p>
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-green-600 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
          >
            <Plus size={14} />
            Add products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, rows]) => (
            <div key={category} className="overflow-hidden rounded-xl border border-gold-500/10">
              <div className="border-b border-gold-500/10 bg-navy-900/80 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gold-500/55">
                {category} · {rows.length}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-gold-500/10 text-[10px] uppercase tracking-widest text-gold-500/40">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Customer link</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id} className="border-b border-gold-500/5 hover:bg-navy-900/40">
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <img src={p.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded border border-gold-500/10 object-cover" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{p.name}</p>
                              <p className="truncate text-[10px] text-gold-500/40">{p.brand_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gold-400">{fmtPrice(p.price)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-bold uppercase text-green-400">
                            {p.stock_quantity} in stock
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <a href={p.productUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold-400 hover:text-gold-300">
                            Open <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={async () => {
                              await adminVisitorAPI.setSaleCatalog({ product_ids: [p.id], is_on_sale: false });
                              load();
                            }}
                            className="inline-flex items-center gap-1 rounded border border-red-500/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10"
                          >
                            <Minus size={12} />
                            Subtract
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <SaleCatalogManager open={managerOpen} onClose={() => setManagerOpen(false)} onChanged={load} />
    </div>
  );
}

export function LiveVisitorsView() {
  const [windowKey, setWindowKey] = useState('24h');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await adminVisitorAPI.getLive(windowKey);
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [windowKey]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    ensureSocket();
    const onActivity = () => load();
    socket.on('visitor:activity', onActivity);
    const interval = setInterval(load, 15000);
    return () => {
      socket.off('visitor:activity', onActivity);
      clearInterval(interval);
    };
  }, [load]);

  if (loading && !data) {
    return <p className="p-8 text-center text-[10px] uppercase tracking-widest text-gold-500/40">Loading visitors…</p>;
  }

  const windows = data?.windows || [];
  const summary = data?.summary || {};
  const sessions = data?.sessions || [];
  const recentEvents = data?.recentEvents || [];
  const pagesViewed = data?.pagesViewed || data?.topPages || [];
  const productsClicked = data?.productsClicked || [];
  const productsAddedToCart = data?.productsAddedToCart || [];
  const productsWhatsApp = data?.productsWhatsApp || [];
  const liveNow = windows.find((w) => w.key === 'live')?.visitors ?? data?.liveCount ?? 0;

  return (
    <div className="space-y-8 overflow-x-hidden p-2">
      <div className="flex flex-col gap-4 border-b border-gold-500/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold-500/60">Analytics</p>
          <h2 className="font-serif text-3xl text-white">Live Visitors</h2>
          <p className="mt-2 max-w-2xl text-sm font-light text-navy-200">
            End-of-day traffic story: who is live now, how many visited by window, which pages and products they opened, cart adds, and WhatsApp orders from the Sale page.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex shrink-0 items-center gap-2 border border-gold-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gold-400 hover:border-gold-500/50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-green-400" />
          <h3 className="font-serif text-lg text-gold-300">Visitor windows</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          {WINDOW_KEYS.map((slot) => {
            const row = windows.find((w) => w.key === slot.key);
            const active = windowKey === slot.key;
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => setWindowKey(slot.key)}
                className={`min-w-0 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-gold-500/10 bg-navy-900/50 hover:border-gold-500/30'
                }`}
              >
                <p className={`truncate text-[10px] font-bold uppercase tracking-[0.18em] ${active ? 'text-green-400' : 'text-gold-500/50'}`}>
                  {row?.label || slot.short}
                </p>
                <p className="mt-2 font-serif text-3xl text-white">{row?.visitors ?? 0}</p>
                <p className="mt-2 truncate text-[10px] text-navy-300">
                  {(row?.pageViews ?? 0)} pages · {(row?.productViews ?? 0)} products · {(row?.whatsappClicks ?? 0)} WhatsApp · {(row?.cartAdds ?? 0)} carts
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-gold-500/55">
          Showing detail for: {data?.selectedLabel || 'Last 24 hours (1 day)'} · Live right now: {liveNow}
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
          <StatCard label="Visitors" value={summary.visitors ?? 0} accent />
          <StatCard label="Pages viewed" value={summary.pageViews ?? 0} />
          <StatCard label="Products viewed" value={summary.productViews ?? 0} />
          <StatCard label="WhatsApp orders" value={summary.whatsappClicks ?? 0} accent />
          <StatCard label="Cart adds" value={summary.cartAdds ?? 0} />
          <StatCard label="Unique products clicked" value={summary.uniqueProductsClicked ?? productsClicked.length} />
          <StatCard label="Unique WhatsApp products" value={summary.uniqueProductsWhatsApp ?? productsWhatsApp.length} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="Products clicked" icon={MousePointerClick} empty={productsClicked.length === 0 ? 'No product clicks in this window.' : null}>
          {productsClicked.map((p) => (
            <ProductRow key={`click-${p.product_slug}`} name={p.product_name} slug={p.product_slug} price={p.product_price} meta={`${p.clicks} click${p.clicks === 1 ? '' : 's'}`} />
          ))}
        </Panel>
        <Panel title="WhatsApp orders (Sale page)" icon={MessageCircle} empty={productsWhatsApp.length === 0 ? 'No WhatsApp order clicks in this window.' : null}>
          {productsWhatsApp.map((p) => (
            <ProductRow key={`wa-${p.product_slug}`} name={p.product_name} slug={p.product_slug} price={p.product_price} meta={`${p.whatsapp_clicks} click${p.whatsapp_clicks === 1 ? '' : 's'}`} />
          ))}
        </Panel>
        <Panel title="Products added to cart" icon={ShoppingBag} empty={productsAddedToCart.length === 0 ? 'No cart adds in this window.' : null}>
          {productsAddedToCart.map((p) => (
            <ProductRow key={`cart-${p.product_slug}`} name={p.product_name} slug={p.product_slug} price={p.product_price} meta={`${p.cart_adds} add${p.cart_adds === 1 ? '' : 's'}`} />
          ))}
        </Panel>
        <Panel title="Pages viewed" icon={FileText} empty={pagesViewed.length === 0 ? 'No page views in this window.' : null}>
          {pagesViewed.map((p) => (
            <div key={p.path} className="grid grid-cols-[1fr_auto] items-start gap-3 border-b border-gold-500/5 py-3 last:border-0">
              <p className="min-w-0 break-all text-sm text-white">{p.path}</p>
              <p className="shrink-0 text-sm text-gold-400">{p.views}</p>
            </div>
          ))}
        </Panel>
        <Panel title="Active sessions" icon={Eye} empty={sessions.length === 0 ? 'No sessions in this window.' : null}>
          {sessions.map((s) => (
            <div key={s.session_id} className="mb-3 rounded-lg border border-gold-500/10 bg-navy-950/60 p-3 last:mb-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-gold-500/50">
                <span>Last seen {fmtTime(s.last_seen)}</span>
                <span>{s.event_count} events</span>
              </div>
              <p className="mt-2 break-words text-sm text-white">{(s.paths || []).slice(0, 5).join(' → ') || '—'}</p>
              <p className="mt-1 text-[10px] text-navy-300">
                {s.page_views} pages · {s.product_clicks} product clicks · {s.whatsapp_clicks || 0} WhatsApp · {s.cart_adds} cart adds
              </p>
            </div>
          ))}
        </Panel>
      </div>

      <Panel title="Recent activity feed" icon={Users} empty={recentEvents.length === 0 ? 'No recent events.' : null}>
        <div className="space-y-0">
          {recentEvents.slice(0, 60).map((e) => (
            <div key={e.id} className="grid grid-cols-1 gap-1 border-b border-gold-500/5 py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:gap-4">
              <div className="min-w-0">
                <p className="break-words text-sm text-white">
                  {e.event_type === 'page_view' && `Viewed ${e.path}`}
                  {e.event_type === 'product_click' && `Clicked ${e.product_name}`}
                  {e.event_type === 'product_add_cart' && `Added to cart: ${e.product_name}`}
                  {e.event_type === 'whatsapp_order_click' && `WhatsApp order: ${e.product_name}${e.path?.includes('size=') ? ` · Size ${decodeURIComponent(e.path.split('size=')[1] || '')}` : ''}`}
                </p>
                {e.product_slug ? (
                  <a href={`${SITE}/product/${e.product_slug}`} target="_blank" rel="noreferrer" className="mt-1 inline-block break-words text-[10px] text-green-400 hover:underline">
                    {e.product_name} — {fmtPrice(e.product_price)}
                  </a>
                ) : null}
              </div>
              <span className="shrink-0 text-[10px] text-gold-500/40 sm:text-right">{fmtTime(e.created_at)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
