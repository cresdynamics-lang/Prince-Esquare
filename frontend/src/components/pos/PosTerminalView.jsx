import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus, Trash2, LogOut, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { usePosStore } from '../../store/usePosStore';
import { posAPI, posSettingsAPI } from '../../services/api';
import { formatKES } from '../../lib/format';
import PosReceiptModal from './PosReceiptModal';
import { socket } from '../../lib/socket';

const PAGE_SIZE = 100;

const CHANNEL_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in_stock', label: 'In stock' },
  { id: 'inventory', label: 'Inventory only' },
  { id: 'website', label: 'Live on website' },
];

const isLiveOnWebsite = (p) =>
  Boolean(p.isWebsiteListing || p.pieceOnWebsite || p.publishedOnline || p.websiteStatus === 'live');

const normalizeProduct = (p) => ({
  ...p,
  ecommerceProductId: p.ecommerceProductId || p.ecommerce_product_id || null,
  productId: p.productId || p.product_id || null,
  shop_price: Number(p.shop_price ?? p.shopPrice ?? 0),
  website_price: p.website_price != null ? Number(p.website_price) : null,
  currentQty: p.currentQty ?? p.current_qty ?? p.stock_level?.current_qty ?? 0,
  channel: p.channel || (p.ecommerceProductId ? 'both' : 'inventory'),
  websiteStatus: p.websiteStatus || (p.publishedOnline || p.pieceOnWebsite || p.isWebsiteListing ? 'live' : 'none'),
  publishedOnline: Boolean(p.publishedOnline ?? p.pieceOnWebsite ?? p.isWebsiteListing ?? p.websiteStatus === 'live'),
  pieceOnWebsite: Boolean(p.pieceOnWebsite || p.isWebsiteListing),
  isWebsiteListing: Boolean(p.isWebsiteListing),
  categoryShopTotal: p.categoryShopTotal ?? null,
  categoryWebsiteStock: p.categoryWebsiteStock ?? null,
  categoryBalanced: p.categoryBalanced ?? null,
  isCategoryFallback: Boolean(p.isCategoryFallback ?? p.is_category_fallback),
  isOut: Boolean(p.isOut ?? p.is_out),
});

const channelBadge = (p) => {
  if (p.isWebsiteListing) {
    return { label: 'Live on website', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (p.pieceOnWebsite) {
    return { label: 'Live on website', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (p.channel === 'inventory' || p.websiteStatus === 'none') {
    return { label: 'Inventory only', className: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
  if (p.websiteStatus === 'live') {
    return { label: 'On website', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (p.websiteStatus === 'hidden') {
    return { label: 'Web hidden', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  return { label: 'Website', className: 'bg-violet-500/20 text-violet-300 border-violet-500/30' };
};

const matchesChannelFilter = (p, filter) => {
  if (filter === 'in_stock') return Boolean(p.productId && !p.isOut);
  if (filter === 'inventory') return !isLiveOnWebsite(p);
  if (filter === 'website') return isLiveOnWebsite(p);
  return true;
};

const sortProducts = (list) =>
  [...list].sort((a, b) => {
    const aQty = a.currentQty ?? 0;
    const bQty = b.currentQty ?? 0;
    const aSellable = a.productId && !a.isOut && aQty > 0;
    const bSellable = b.productId && !b.isOut && bQty > 0;
    if (aSellable !== bSellable) return aSellable ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });

const PosCartPanel = ({
  cart,
  canDiscount,
  discount,
  setDiscount,
  paymentMethod,
  setPaymentMethod,
  mpesaRef,
  setMpesaRef,
  subtotal,
  grandTotal,
  busy,
  removeFromCart,
  updateQty,
  confirmSale,
}) => (
  <div className="flex flex-col h-full">
    <h2 className="text-lg font-semibold text-white mb-4">Cart</h2>
    <div className="flex-1 overflow-y-auto space-y-3">
      {cart.length === 0 && <p className="text-white/40 text-sm">Cart is empty</p>}
      {cart.map((item) => (
        <div key={item.key} className="bg-white/5 rounded-lg p-3 text-white text-sm">
          <div className="flex justify-between gap-2">
            <div>
              <span className="font-medium">{item.name}</span>
              {item.websiteStatus === 'live' && (
                <span className="ml-1 text-[9px] text-emerald-400/80 uppercase">Web</span>
              )}
              {item.channel === 'inventory' && (
                <span className="ml-1 text-[9px] text-sky-400/80 uppercase">Inv</span>
              )}
              <p className="text-white/50 text-xs">{formatKES(item.unitPrice)} each</p>
            </div>
            <button type="button" onClick={() => removeFromCart(item.key)}><Trash2 size={14} className="text-red-400" /></button>
          </div>
          {item.variantLabel && <p className="text-white/50 text-xs">{item.variantLabel}</p>}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateQty(item.key, item.qty - 1)} className="p-1 bg-white/10 rounded"><Minus size={14} /></button>
              <span>{item.qty}</span>
              <button type="button" onClick={() => updateQty(item.key, item.qty + 1)} className="p-1 bg-white/10 rounded"><Plus size={14} /></button>
            </div>
            <span>{formatKES(item.unitPrice * item.qty)}</span>
          </div>
        </div>
      ))}
    </div>
    {canDiscount && (
      <div className="mt-4">
        <label className="text-white/60 text-xs">Discount (KES)</label>
        <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full mt-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white" />
      </div>
    )}
    <div className="mt-4 space-y-1 text-white border-t border-white/10 pt-4">
      <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatKES(subtotal)}</span></div>
      {canDiscount && discount > 0 && <div className="flex justify-between text-sm text-green-400"><span>Discount</span><span>-{formatKES(discount)}</span></div>}
      <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-gold-400">{formatKES(grandTotal)}</span></div>
    </div>
    <div className="mt-4 flex gap-2">
      {['CASH', 'MPESA'].map((m) => (
        <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex-1 py-2 rounded text-sm font-medium ${paymentMethod === m ? 'bg-gold-600 text-navy-950' : 'bg-white/10 text-white'}`}>{m}</button>
      ))}
    </div>
    {paymentMethod === 'MPESA' && (
      <input placeholder="M-Pesa ref (8–12 chars)" value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} className="w-full mt-3 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
    )}
    <button
      type="button"
      disabled={cart.length === 0 || busy}
      onClick={confirmSale}
      className="mt-4 w-full bg-gold-600 text-navy-950 font-bold py-4 rounded-lg disabled:opacity-40"
    >
      Confirm Sale
    </button>
  </div>
);

const PosTerminalView = ({ embedded = false, onClockOut }) => {
  const { user, logout } = useAuthStore();
  const {
    cart, activeShift, addToCart, removeFromCart, updateQty, clearCart, setShift, clearShift,
  } = usePosStore();

  const [products, setProducts] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState(null);
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [channelFilter, setChannelFilter] = useState('in_stock');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [skuScan, setSkuScan] = useState('');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [mpesaRef, setMpesaRef] = useState('');
  const [discount, setDiscount] = useState(0);
  const [canDiscount, setCanDiscount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [variantPick, setVariantPick] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showClockOut, setShowClockOut] = useState(false);

  const shellClass = embedded
    ? 'min-h-[70vh] bg-navy-950 border border-gold-500/10 rounded-2xl overflow-hidden flex flex-col'
    : 'min-h-screen bg-[#0a0f1e] flex flex-col';

  const loadShift = useCallback(async () => {
    const res = await posAPI.getCurrentShift();
    if (res.data?.data) setShift(res.data.data);
    else setShift(null);
  }, [setShift]);

  const loadProducts = useCallback(async (q = '', category = '', { offset = 0, append = false, channel = 'in_stock' } = {}) => {
    try {
      if (append) setLoadingMore(true);
      const hasQuery = Boolean(q.trim() || category);
      const res = await posAPI.searchProducts({
        search: q,
        category: category || undefined,
        limit: PAGE_SIZE,
        offset,
        inStockOnly: !hasQuery && channel === 'in_stock',
        shopFloorOnly: true,
        catalogFilter: channel,
      });
      if (res.data?.success) {
        const payload = res.data.data || {};
        const raw = Array.isArray(payload) ? payload : (payload.items || []);
        const list = raw
          .map(normalizeProduct)
          .filter((p) => !p.isCategoryFallback);
        setProducts((prev) => (append ? sortProducts([...prev, ...list]) : sortProducts(list)));
        setCatalogMeta(Array.isArray(payload) ? null : (payload.meta || null));
        setCatalogOffset(offset);
      } else {
        if (!append) {
          setProducts([]);
          setCatalogMeta(null);
        }
        toast.error(res.data?.message || 'Could not load products');
      }
    } catch (err) {
      if (!append) {
        setProducts([]);
        setCatalogMeta(null);
      }
      toast.error(err.response?.data?.message || 'Could not load products');
    } finally {
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const onStock = () => loadProducts(search, categoryFilter, { offset: 0, append: false, channel: channelFilter });
    socket.on('stock:updated', onStock);
    socket.on('store:updated', onStock);
    return () => {
      socket.off('stock:updated', onStock);
      socket.off('store:updated', onStock);
    };
  }, [loadProducts, search, categoryFilter, channelFilter]);

  useEffect(() => {
    (async () => {
      await loadShift();
      await loadProducts('', '', { offset: 0, append: false, channel: channelFilter });
      try {
        const s = await posSettingsAPI.getTerminal();
        setCanDiscount(s.data?.data?.pos_sellers_can_discount === 'true');
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [loadShift, loadProducts]);

  useEffect(() => {
    setCatalogOffset(0);
    const t = setTimeout(
      () => loadProducts(search, categoryFilter, { offset: 0, append: false, channel: channelFilter }),
      300
    );
    return () => clearTimeout(t);
  }, [search, categoryFilter, channelFilter, loadProducts]);

  const loadNextPage = () => {
    if (!catalogMeta?.hasMore || loadingMore) return;
    const next = catalogOffset + PAGE_SIZE;
    loadProducts(search, categoryFilter, { offset: next, append: false, channel: channelFilter });
  };

  const loadPrevPage = () => {
    const prev = Math.max(0, catalogOffset - PAGE_SIZE);
    loadProducts(search, categoryFilter, { offset: prev, append: false, channel: channelFilter });
  };

  const handleSkuScan = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = skuScan.trim().toUpperCase();
    if (!code) return;
    const match = products.find((p) => (p.sku || '').toUpperCase() === code)
      || products.find((p) => (p.sku || '').toUpperCase().startsWith(code));
    if (!match) {
      setSearch(code);
      toast.error('SKU not in current list — searching…');
      return;
    }
    if (match.isOut || !match.productId) {
      toast.error(`${match.name} is out of stock on the shop floor`);
      return;
    }
    if ((match.sku || '').includes('-W-')) {
      toast.error('Warehouse piece — ask admin to move it to the shop floor first');
      return;
    }
    if (match.variants?.length) {
      setVariantPick(match);
    } else {
      addToCart(match);
      toast.success(`Added ${match.name}`);
    }
    setSkuScan('');
  };

  const clockIn = async () => {
    const res = await posAPI.clockIn();
    if (res.data?.success) {
      setShift(res.data.data.shift);
      toast.success('Clocked in');
    }
  };

  const clockOut = async () => {
    const res = await posAPI.clockOut();
    if (res.data?.success) {
      const summary = res.data.data;
      clearShift();
      clearCart();
      logout();
      if (onClockOut) onClockOut(summary);
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const grandTotal = Math.max(0, subtotal - (canDiscount ? discount : 0));

  const confirmSale = async () => {
    if (!activeShift?.id) return toast.error('No active shift');
    if (paymentMethod === 'MPESA' && !/^[a-zA-Z0-9]{8,12}$/.test(mpesaRef)) {
      return toast.error('Valid M-Pesa ref required (8–12 alphanumeric)');
    }
    setBusy(true);
    try {
      const res = await posAPI.createSale({
        shiftId: activeShift.id,
        paymentMethod,
        mpesaRef: paymentMethod === 'MPESA' ? mpesaRef : undefined,
        discountAmount: canDiscount ? discount : 0,
        items: cart.map((i) => {
          const line = {
            productId: i.productId,
            qty: i.qty,
            unitPrice: Number(i.unitPrice),
            lineName: i.lineName || i.name,
          };
          if (i.variantId) line.variantId = i.variantId;
          if (i.ecommerceProductId) line.ecommerceProductId = i.ecommerceProductId;
          return line;
        }),
      });
      if (res.data?.success) {
        setLastSale(res.data.data);
        clearCart();
        setMpesaRef('');
        setDiscount(0);
        loadProducts(search, categoryFilter, { offset: 0, append: false });
        loadShift();
        toast.success('Sale complete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className={`${shellClass} items-center justify-center text-white animate-pulse`}>
        Loading POS…
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className={`${shellClass} flex flex-col items-center justify-center text-white p-6`}>
        <h1 className="text-2xl font-semibold mb-2">Clock in to start</h1>
        <p className="text-white/60 mb-8 text-center">
          Hi {user?.fullName || user?.name}, begin your shift to access the terminal.
        </p>
        <button type="button" onClick={clockIn} className="bg-gold-600 text-navy-950 px-8 py-3 rounded-lg font-bold">
          Clock In
        </button>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => matchesChannelFilter(p, channelFilter));
  const metaCounts = catalogMeta?.filterCounts;
  const filterCounts = {
    all: metaCounts?.all ?? products.length,
    in_stock: metaCounts?.in_stock ?? products.filter((p) => p.productId && !p.isOut && (p.currentQty ?? 0) > 0).length,
    inventory: metaCounts?.inventory ?? products.filter((p) => !isLiveOnWebsite(p)).length,
    website: metaCounts?.website ?? products.filter((p) => isLiveOnWebsite(p)).length,
  };
  const categoryBalance = catalogMeta?.categoryBalance || [];
  const categoryTotals = catalogMeta?.categoryTotals || [];
  const totalInStock = catalogMeta?.totalInStock ?? 0;
  const totalMatching = catalogMeta?.total ?? products.length;
  const currentPage = catalogMeta?.page ?? Math.floor(catalogOffset / PAGE_SIZE) + 1;
  const totalPages = catalogMeta?.totalPages ?? 1;
  const hasMore = catalogMeta?.hasMore ?? false;
  const selectedBalance = categoryBalance.find((b) => b.name === categoryFilter);
  const categoryOptions = categoryBalance.length
    ? categoryBalance.filter((b) => b.inStockPieces > 0)
    : categoryTotals.filter((c) => c.in_stock_pieces > 0);

  const cartPanelProps = {
    cart,
    canDiscount,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    mpesaRef,
    setMpesaRef,
    subtotal,
    grandTotal,
    busy,
    removeFromCart,
    updateQty,
    confirmSale,
  };

  return (
    <div className={shellClass}>
      <header className="bg-navy-950 border-b border-gold-500/20 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-white text-sm">
        <span>{user?.fullName || user?.name}</span>
        <span>Shift: {new Date(activeShift.clock_in).toLocaleTimeString()}</span>
        <span>Cash: {formatKES(activeShift.total_cash || 0)} | M-Pesa: {formatKES(activeShift.total_mpesa || 0)}</span>
        <button type="button" onClick={() => setShowClockOut(true)} className="flex items-center gap-1 text-red-400"><LogOut size={16} /> Clock Out</button>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50">
            <p>
              <strong className="text-gold-400">{totalInStock.toLocaleString()}</strong> on floor
              {' · '}
              Page <strong className="text-gold-400">{currentPage}</strong> /{' '}
              <strong className="text-gold-400">{totalPages}</strong>
              {' · '}
              <strong className="text-gold-400">{totalMatching.toLocaleString()}</strong> total
            </p>
            {selectedBalance && (
              <p className="mt-1">
                {selectedBalance.name}: shop {selectedBalance.shopTotal}
                {' · '}
                web {selectedBalance.websitePool ?? '—'}
                {selectedBalance.balanced === true && ' ✓'}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, or category…"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 text-white"
              />
            </div>
            <input
              value={skuScan}
              onChange={(e) => setSkuScan(e.target.value)}
              onKeyDown={handleSkuScan}
              placeholder="Scan / type SKU + Enter to add"
              className="w-full bg-gold-600/10 border border-gold-500/30 rounded-lg py-3 px-4 text-white font-mono text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-3 items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
            >
              <option value="">All categories (shop floor)</option>
              {categoryOptions.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                  {` — shop ${c.shopTotal ?? c.shop_qty ?? 0}`}
                  {c.websitePool != null ? ` / web ${c.websitePool}${c.balanced ? ' ✓' : ''}` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/70"
            >
              {viewMode === 'list' ? 'Grid view' : 'List view'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {CHANNEL_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setChannelFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  channelFilter === f.id
                    ? 'bg-gold-600 text-navy-950 border-gold-600'
                    : 'bg-white/5 text-white/70 border-white/10 hover:border-gold-500/40'
                }`}
              >
                {f.label} ({filterCounts[f.id] ?? 0})
              </button>
            ))}
          </div>
          <p className="text-white/40 text-xs mb-3 tabular-nums">
            {filteredProducts.length} shown · Page {currentPage}/{totalPages}
          </p>
          {(hasMore || catalogOffset > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                disabled={catalogOffset <= 0 || loadingMore}
                onClick={loadPrevPage}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-white/20 text-white disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-white/50 text-xs tabular-nums">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={!hasMore || loadingMore}
                onClick={loadNextPage}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-gold-600 text-navy-950 disabled:opacity-40"
              >
                {loadingMore ? 'Loading…' : 'Next page →'}
              </button>
            </div>
          )}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-white/50">
              <p className="text-lg">{products.length === 0 ? 'No products found' : 'No items in this filter'}</p>
              <p className="text-sm mt-2">
                {products.length === 0
                  ? 'Check your connection or try a different search.'
                  : 'Try another tab — inventory-only items and website listings are listed separately.'}
              </p>
              <button
                type="button"
                onClick={() => loadProducts(search, categoryFilter, { offset: 0, append: false })}
                className="mt-4 px-4 py-2 rounded-lg bg-gold-600 text-navy-950 font-medium text-sm"
              >
                Retry
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-white">
                <thead className="text-white/40 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">POS</th>
                    <th className="p-3 text-center">Shop</th>
                    <th className="p-3 text-center">Web pool</th>
                    <th className="p-3 text-center">Live</th>
                    <th className="p-3 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const qty = p.currentQty ?? 0;
                    const out = p.isOut || !p.productId || qty === 0;
                    const badge = channelBadge(p);
                    return (
                      <tr key={p.id} className={`border-t border-white/5 ${out ? 'opacity-60' : 'hover:bg-white/5'}`}>
                        <td className="p-3 font-mono text-xs text-gold-400/90">{p.sku || '—'}</td>
                        <td className="p-3">
                          <span className="font-medium">{p.name}</span>
                          <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded border ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="p-3 text-white/50 text-xs">{p.categoryName || '—'}</td>
                        <td className="p-3 text-right text-gold-400 font-semibold">{formatKES(p.shop_price)}</td>
                        <td className="p-3 text-center text-xs tabular-nums">{out ? 'Out' : qty === 1 ? '1' : qty}</td>
                        <td className="p-3 text-center text-xs tabular-nums text-violet-300/90">
                          {p.categoryWebsiteStock != null ? p.categoryWebsiteStock : '—'}
                        </td>
                        <td className="p-3 text-center text-xs">
                          {isLiveOnWebsite(p) ? (
                            <span className="text-emerald-400">Yes</span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            disabled={out}
                            onClick={() => (p.variants?.length ? setVariantPick(p) : addToCart(p))}
                            className="px-3 py-1 rounded bg-gold-600 text-navy-950 text-xs font-bold disabled:opacity-40"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const qty = p.currentQty ?? p.stock_level?.current_qty ?? 0;
                const noInventoryLink = !p.productId;
                const out = p.isOut || noInventoryLink || qty === 0;
                const badge = channelBadge(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={out}
                    onClick={() => (p.variants?.length ? setVariantPick(p) : addToCart(p))}
                    className={`text-left p-4 rounded-xl border bg-white/5 text-white transition-colors ${
                      out
                        ? 'border-white/10 opacity-70 cursor-not-allowed'
                        : p.channel === 'inventory'
                          ? 'border-sky-500/25 hover:bg-white/10 hover:border-sky-500/40'
                          : 'border-gold-500/30 hover:bg-white/10 hover:border-gold-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-2 flex-1">{p.name}</p>
                    {p.sku && <p className="font-mono text-[10px] text-gold-400/70 mt-0.5">{p.sku}</p>}
                      {p.thumbnail && (
                        <img src={p.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-white/10" />
                      )}
                    </div>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${badge.className}`}>
                      {badge.label}
                    </span>
                    <p className="text-gold-400 text-sm mt-2 font-semibold">POS: {formatKES(p.shop_price)}</p>
                    {p.website_price != null && p.websiteStatus !== 'none' && (
                      <p className="text-white/45 text-xs mt-0.5">Web: {formatKES(p.website_price)}</p>
                    )}
                    {p.sku && <p className="text-white/35 text-[10px] mt-0.5">SKU: {p.sku}</p>}
                    {p.categoryName && (
                      <p className="text-white/40 text-xs mt-0.5">{p.categoryName}</p>
                    )}
                    <p className={`text-xs mt-1 ${out ? 'text-red-400/80' : 'text-white/50'}`}>
                      {noInventoryLink
                        ? 'No inventory link'
                        : out
                          ? 'Out of stock on shop floor'
                          : `${p.stockCategory ? `${p.stockCategory}: ` : ''}${qty === 1 ? '1 piece on floor' : `${qty} on floor`}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <aside className="hidden lg:block w-96 border-l border-white/10 p-4">
          <PosCartPanel {...cartPanelProps} />
        </aside>
      </div>

      {!embedded && (
        <button type="button" onClick={() => setShowCart(true)} className="lg:hidden fixed bottom-4 right-4 bg-gold-600 text-navy-950 px-6 py-3 rounded-full font-bold shadow-lg">
          Cart ({cart.length})
        </button>
      )}

      {embedded && (
        <button type="button" onClick={() => setShowCart(true)} className="lg:hidden m-4 bg-gold-600 text-navy-950 px-6 py-3 rounded-full font-bold shadow-lg self-end">
          Cart ({cart.length})
        </button>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowCart(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-navy-950 rounded-t-2xl p-6 max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <PosCartPanel {...cartPanelProps} />
          </div>
        </div>
      )}

      {variantPick && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setVariantPick(null)}>
          <div className="bg-navy-950 border border-white/10 rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-medium mb-4">Select variant — {variantPick.name}</h3>
            <div className="space-y-2">
              {variantPick.variants.map((v) => (
                <button key={v.id} type="button" onClick={() => { addToCart(variantPick, v); setVariantPick(null); }} className="w-full text-left px-4 py-2 rounded bg-white/5 text-white hover:bg-white/10">
                  {[v.size, v.color].filter(Boolean).join(' / ') || 'Default'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showClockOut && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-navy-950 border border-white/10 rounded-xl p-6 max-w-sm w-full text-white">
            <h3 className="font-semibold">End shift?</h3>
            <p className="text-white/60 text-sm mt-2">You will be logged out after clocking out.</p>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowClockOut(false)} className="flex-1 py-2 border border-white/20 rounded-lg">Cancel</button>
              <button type="button" onClick={async () => { setShowClockOut(false); await clockOut(); }} className="flex-1 py-2 bg-red-600 rounded-lg font-medium">Clock Out</button>
            </div>
          </div>
        </div>
      )}

      {lastSale && (
        <PosReceiptModal sale={lastSale} sellerName={user?.fullName || user?.name} onClose={() => setLastSale(null)} />
      )}
    </div>
  );
};

export default PosTerminalView;
