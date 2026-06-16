import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Search } from 'lucide-react';
import { inventoryAPI, adminCategoryAPI } from '../../../services/api';
import { ensureSocket, socket } from '../../../lib/socket';
import InventoryProductModal from './InventoryProductModal';
import InventoryProductCard from './InventoryProductCard';
import { useConfirm } from '../ConfirmDialog';

const PAGE_SIZE = 50;

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'warehouse', label: 'In warehouse' },
  { id: 'available', label: 'In shop' },
  { id: 'inventory', label: 'Not on website' },
];

const Empty = ({ message }) => (
  <p className="text-gold-500/40 text-sm text-center py-16">{message}</p>
);

const InventoryCatalogView = ({ onCategoryChange, readOnly = false }) => {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [productModal, setProductModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [form, setForm] = useState({ productId: '', qty: 1, notes: '' });
  const [publishItem, setPublishItem] = useState(null);
  const [publishForm, setPublishForm] = useState({ price: '', category_id: '', stock_quantity: '' });
  const [publishBusy, setPublishBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    onCategoryChange?.(selectedCategory);
  }, [selectedCategory, onCategoryChange]);

  const loadSummary = useCallback(async () => {
    try {
      const summaryRes = await inventoryAPI.categorySummary();
      setCategorySummary(summaryRes.data?.data || []);
    } catch {
      setCategorySummary([]);
    }
  }, []);

  const loadStock = useCallback(async (category = '') => {
    setLoading(true);
    try {
      const params = category ? { category } : {};
      const stockRes = await inventoryAPI.stockLevels(params);
      setItems(stockRes.data?.data || []);
    } catch (err) {
      setItems([]);
      toast.error(err.response?.data?.message || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadStock(selectedCategory)]);
  }, [loadSummary, loadStock, selectedCategory]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadStock(selectedCategory);
  }, [selectedCategory, loadStock]);

  useEffect(() => {
    ensureSocket();
    adminCategoryAPI.getAll().then((r) => setCategories(r.data?.data || r.data || [])).catch(() => {});

    const linkKey = 'pos-inventory-auto-linked';
    if (!sessionStorage.getItem(linkKey)) {
      inventoryAPI.ensureWebsiteLinks()
        .then((res) => {
          sessionStorage.setItem(linkKey, '1');
          const d = res.data?.data || {};
          if (d.linked > 0 || d.stockSeeded > 0) {
            toast.success(
              `Synced ${d.linked || 0} website product(s) into inventory` +
                (d.stockSeeded ? ` (${d.stockSeeded} with opening stock)` : '')
            );
            reloadAll();
          }
        })
        .catch(() => {});
    }

    const onReload = () => reloadAll();
    socket.on('stock:updated', onReload);
    socket.on('store:updated', onReload);
    window.addEventListener('inventory:reload', onReload);
    return () => {
      socket.off('stock:updated', onReload);
      socket.off('store:updated', onReload);
      window.removeEventListener('inventory:reload', onReload);
    };
  }, [reloadAll]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [selectedCategory, searchQuery, statusFilter]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((p) => {
      const live = p.on_website ?? (p.website_product_id && p.website_published);
      const inShop = (p.currentQty ?? 0) > 0;
      const inStore = (p.storeQty ?? 0) > 0;
      let statusOk = true;
      if (statusFilter === 'available') statusOk = inShop;
      else if (statusFilter === 'warehouse') statusOk = inStore;
      else if (statusFilter === 'inventory') statusOk = !live;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, statusFilter]);

  const selectedSummary = useMemo(
    () => categorySummary.find((c) => c.name === selectedCategory),
    [categorySummary, selectedCategory]
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const openPanel = (type, productId = '') => {
    setForm({ productId: productId || '', qty: 1, notes: '' });
    setPanel(type);
  };

  const submitMovement = async (type) => {
    if (!form.productId) {
      toast.error('Select a product');
      return;
    }
    const qty = parseInt(form.qty, 10);
    if (!qty || qty < 1) {
      toast.error('Enter a valid quantity');
      return;
    }
    const apiMap = { in: inventoryAPI.stockIn, out: inventoryAPI.stockOut, receive: inventoryAPI.receiveAtStore };
    try {
      const res = await apiMap[type]({ productId: form.productId, qty, notes: form.notes || '' });
      const data = res.data?.data || {};
      const tally = data.shopQty != null
        ? ` Shop: ${data.shopQty}, Store: ${data.storeQty ?? '—'}`
        : data.storeQty != null
          ? ` Store: ${data.storeQty}`
          : '';
      toast.success(`${{ in: 'Moved store → shop', out: 'Moved shop → store', receive: 'Received at store' }[type]}${tally}`);
      setPanel(null);
      reloadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock movement failed');
    }
  };

  const categoryLabel = (cat) => {
    const shopQty = cat.shop_qty ?? 0;
    const storeQty = cat.store_qty ?? 0;
    return `${cat.name} — shop ${shopQty}, store ${storeQty}`;
  };

  const panelProducts = panel === 'out'
    ? filteredProducts.filter((p) => (p.currentQty ?? 0) > 0)
    : panel === 'in'
      ? filteredProducts.filter((p) => (p.storeQty ?? 0) > 0)
      : filteredProducts;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = pagedProducts.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const runBulkTransfer = async (direction) => {
    const ids = [...selectedIds];
    if (!ids.length) {
      toast.error('Select at least one item');
      return;
    }
    setBulkBusy(true);
    try {
      const api = direction === 'in' ? inventoryAPI.bulkStockIn : inventoryAPI.bulkStockOut;
      const res = await api({ productIds: ids, qty: 1 });
      const data = res.data?.data || {};
      const moved = data.moved?.length ?? 0;
      const failed = data.failed?.length ?? 0;
      if (moved) toast.success(`${moved} item(s) moved${failed ? ` · ${failed} skipped` : ''}`);
      else toast.error('No items could be moved');
      setSelectedIds(new Set());
      reloadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk transfer failed');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <>
          <button type="button" onClick={() => openPanel('receive')} className="px-3 py-1.5 border border-sky-500/40 text-sky-300 rounded-lg text-xs">
            Receive at store
          </button>
          <button type="button" onClick={() => openPanel('in')} className="px-3 py-1.5 bg-gold-600 text-navy-950 rounded-lg text-xs font-medium">
            Store → Shop
          </button>
          <button type="button" onClick={() => openPanel('out')} className="px-3 py-1.5 border border-gold-500/30 text-gold-400 rounded-lg text-xs">
            Shop → Store
          </button>
          {selectedIds.size > 0 && (
            <>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => runBulkTransfer('in')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                Move {selectedIds.size} to shop
              </button>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => runBulkTransfer('out')}
                className="px-3 py-1.5 border border-orange-500/40 text-orange-300 rounded-lg text-xs disabled:opacity-50"
              >
                Return {selectedIds.size} to store
              </button>
            </>
          )}
            </>
          )}
        </div>
      </div>

      <div className="bg-navy-900/50 border border-gold-500/10 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="flex-1 space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-gold-500/60 font-bold">Category</span>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-navy-950 border border-gold-500/20 rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:border-gold-500/40 outline-none"
              >
                <option value="">All categories — pick one to browse pieces</option>
                {categorySummary.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {categoryLabel(cat)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-500/40 pointer-events-none" />
            </div>
          </label>

          {selectedSummary && (
            <div className="text-xs text-gold-500/60 sm:pb-1 space-y-0.5 shrink-0">
              <p>
                Shop: <span className="text-gold-300">{selectedSummary.shop_qty}</span>
                {' · '}
                Warehouse: <span className="text-gold-300">{selectedSummary.store_qty}</span>
              </p>
              <p>
                {selectedSummary.live_on_website} on website · {selectedSummary.inventory_only} not published
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/40" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, SKU, description…"
              className="w-full bg-navy-950 border border-gold-500/20 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-gold-500/40"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-950 border border-gold-500/20 rounded-lg px-3 py-2 text-white text-sm sm:w-48"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-medium text-white">
            {selectedCategory || 'All categories'}
            <span className="text-gold-500/50 font-normal ml-2">
              {filteredProducts.length} piece{filteredProducts.length !== 1 ? 's' : ''}
              {searchQuery || statusFilter !== 'all' ? ` (filtered from ${items.length})` : ''}
            </span>
          </h3>
          <div className="flex items-center gap-3">
            {!readOnly && pagedProducts.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="text-[10px] text-gold-400 underline"
              >
                {pagedProducts.every((p) => selectedIds.has(p.id)) ? 'Deselect page' : 'Select page'}
              </button>
            )}
            {filteredProducts.length > PAGE_SIZE && (
              <p className="text-[10px] text-gold-500/40">
                Page {page} of {totalPages}
              </p>
            )}
          </div>
        </div>

        {loading && <Empty message="Loading inventory…" />}

        {!loading && filteredProducts.length === 0 && (
          <Empty
            message={
              selectedCategory
                ? `No pieces in "${selectedCategory}". Use the stock sheet above to update counts.`
                : 'Select a category to browse inventory pieces.'
            }
          />
        )}

        {!loading && pagedProducts.map((p) => (
          <InventoryProductCard
            key={p.id}
            product={p}
            readOnly={readOnly}
            selected={selectedIds.has(p.id)}
            onSelectToggle={readOnly ? undefined : () => toggleSelect(p.id)}
            onEdit={(prod) => setProductModal(prod.id)}
            onPublish={(prod) => {
              setPublishItem(prod);
              setPublishForm({
                price: String(prod.website_price || prod.shop_price || ''),
                category_id: prod.website_category_id || '',
                stock_quantity: String(prod.currentQty ?? 0),
              });
            }}
            onTransferIn={(prod) => openPanel('in', prod.id)}
            onTransferOut={(prod) => openPanel('out', prod.id)}
            onUnpublish={async (prod) => {
              const ok = await confirm({
                title: 'Unpublish from website',
                message: `"${prod.name}" will be hidden from the website. Inventory and shop stock are unchanged.`,
                confirmLabel: 'Unpublish',
                variant: 'warning',
              });
              if (!ok) return;
              try {
                await inventoryAPI.unpublishFromWebsite(prod.id);
                toast.success('Removed from website');
                reloadAll();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Unpublish failed');
              }
            }}
            onThresholdChange={async (prod, threshold) => {
              try {
                await inventoryAPI.updateThreshold(prod.id, { low_stock_threshold: threshold });
                toast.success('Low-stock threshold saved');
                reloadAll();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Could not save threshold');
              }
            }}
          />
        ))}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gold-500/20 text-gold-400 rounded text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-[10px] text-gold-500/50 tabular-nums">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gold-500/20 text-gold-400 rounded text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {productModal && productModal !== 'new' && (
        <InventoryProductModal
          itemId={productModal}
          onClose={() => setProductModal(null)}
          onSaved={() => { reloadAll(); setProductModal(null); }}
        />
      )}

      {panel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPanel(null)}>
          <div className="bg-navy-900 border border-gold-500/20 rounded-xl p-6 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gold-400 text-sm">
              {panel === 'in' && 'Store → Shop'}
              {panel === 'out' && 'Shop → Store'}
              {panel === 'receive' && 'Receive at store'}
            </h3>
            {!form.productId ? (
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white text-sm"
              >
                <option value="">Select product</option>
                {panelProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-white">
                {filteredProducts.find((p) => p.id === form.productId)?.name || 'Selected product'}
              </p>
            )}
            <input type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white" placeholder="Quantity" />
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white text-sm resize-none"
              placeholder="Notes (optional)"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setPanel(null)} className="flex-1 py-2 border border-gold-500/30 text-gold-400 rounded text-sm">Cancel</button>
              <button type="button" onClick={() => submitMovement(panel)} className="flex-1 py-2 bg-gold-600 text-navy-950 rounded text-sm font-medium">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {publishItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPublishItem(null)}>
          <div className="bg-navy-900 border border-gold-500/20 rounded-xl p-6 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gold-400 text-sm">Publish — {publishItem.name}</h3>
            <p className="text-[10px] text-gold-500/50">Set category and price before going live. Add images in Edit details first.</p>
            <select
              value={publishForm.category_id}
              onChange={(e) => setPublishForm({ ...publishForm, category_id: e.target.value })}
              className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white text-sm"
            >
              <option value="">Select website category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="number" value={publishForm.price} onChange={(e) => setPublishForm({ ...publishForm, price: e.target.value })} className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white" placeholder="Website price" />
            <p className="text-[10px] text-gold-500/40">Shop stock on publish: {publishItem.currentQty ?? 0} (mirrors to website)</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPublishItem(null)} className="flex-1 py-2 border border-gold-500/30 text-gold-400 rounded text-sm">Cancel</button>
            <button
              type="button"
              disabled={publishBusy || !publishForm.category_id}
              onClick={async () => {
                setPublishBusy(true);
                try {
                  await inventoryAPI.publishToWebsite(publishItem.id, {
                    price: Number(publishForm.price),
                    category_id: publishForm.category_id || null,
                    is_active: true,
                  });
                  toast.success('Published to website');
                  setPublishItem(null);
                  reloadAll();
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed');
                } finally {
                  setPublishBusy(false);
                }
              }}
              className="flex-1 py-2 bg-gold-600 text-navy-950 rounded font-medium disabled:opacity-50"
            >
              Publish
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCatalogView;
