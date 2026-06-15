/**
 * @deprecated Legacy multi-shop inventory — not used. Physical stock is managed in PosInventoryHub.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Plus, X, ArrowRightLeft, Package, AlertCircle,
  ArrowDown, ArrowUp, ShoppingCart, History, RefreshCw,
  CheckCircle2, Building2
} from 'lucide-react';
import { adminInventoryAPI } from '../../services/api';
import { useConfirm } from './ConfirmDialog';

// ── Fixed inventory item list ──────────────────────────────────────────
const INVENTORY_ITEMS = [
  'Shirts', 'Khakis', 'Knitted Pollos', 'Polos', 'Office Shoes',
  'Casual Shoes', 'Loafers', 'Linen Trousers', 'Blazers', 'Suits',
  'Track Suits', 'Vests', 'Capes', 'Hats', 'Ties', 'Belts',
  'Jackets', 'Half-Jackets', 'Sweat Shirts', 'Socks', 'Sweaters',
  'Jeans', 'T-Shirts', 'Gurkha Pants',
];

// ── Helpers ────────────────────────────────────────────────────────────

const MOVEMENT_LABELS = {
  opening_stock: { label: 'Opening Stock', color: 'text-blue-400 bg-blue-400/10' },
  sales: { label: 'Sales', color: 'text-red-400 bg-red-400/10' },
  stock_in: { label: 'Stock In', color: 'text-green-400 bg-green-400/10' },
  stock_out: { label: 'Stock Out', color: 'text-orange-400 bg-orange-400/10' },
  transfer_in: { label: 'Transfer In', color: 'text-cyan-400 bg-cyan-400/10' },
  transfer_out: { label: 'Transfer Out', color: 'text-purple-400 bg-purple-400/10' },
};

const Badge = ({ type }) => {
  const cfg = MOVEMENT_LABELS[type] || { label: type, color: 'text-gold-400 bg-gold-400/10' };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const Spinner = () => (
  <div className="py-20 flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500" />
  </div>
);

const EmptyRow = ({ cols, msg }) => (
  <tr>
    <td colSpan={cols} className="px-6 py-12 text-center text-gold-500/40 text-sm">{msg}</td>
  </tr>
);

// ── Sub-components ─────────────────────────────────────────────────────

const ShopsPanel = ({ shops, onRefresh }) => {
  const confirm = useConfirm();
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.code) return alert('Name and code are required');
    setSaving(true);
    try {
      await adminInventoryAPI.createShop(form);
      setForm({ name: '', code: '', address: '', phone: '', email: '' });
      setShowForm(false);
      onRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create shop');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete shop',
      message: 'Delete this shop? All inventory data for it will be permanently lost.',
      confirmLabel: 'Delete shop',
      variant: 'danger',
    });
    if (!ok) return;
    try { await adminInventoryAPI.deleteShop(id); onRefresh(); }
    catch (e) { alert(e?.response?.data?.message || 'Failed to delete shop'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-black uppercase tracking-widest text-gold-500/60">Shops / Branches</h5>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-navy-950 rounded-xl text-[10px] font-black uppercase tracking-widest">
          <Plus size={14} /> Add Shop
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-navy-950/60 border border-gold-500/10 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[['name', 'Shop Name *'], ['code', 'Shop Code *'], ['address', 'Address'], ['phone', 'Phone'], ['email', 'Email']].map(([k, lbl]) => (
              <input key={k} placeholder={lbl} value={form[k]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                className="bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-3 text-sm text-gold-100 placeholder:text-gold-500/30 outline-none focus:border-gold-500/40" />
            ))}
            <div className="flex gap-3 items-center">
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-3 bg-gold-600 text-navy-950 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-3 bg-navy-800 text-gold-500 rounded-xl text-[10px] font-black uppercase">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {shops.map(shop => (
          <div key={shop.id} className="bg-navy-950/60 border border-gold-500/10 rounded-2xl p-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gold-600/10 border border-gold-500/10 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-gold-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-gold-100 uppercase truncate">{shop.name}</p>
                <p className="text-[10px] text-gold-500/40 uppercase tracking-widest">{shop.code}</p>
                {shop.address && <p className="text-[10px] text-gold-500/30 truncate">{shop.address}</p>}
              </div>
            </div>
            <button onClick={() => handleDelete(shop.id)} className="text-red-400/50 hover:text-red-400 transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
        {!shops.length && (
          <div className="col-span-3 py-10 text-center text-gold-500/30 text-sm">No shops yet. Add one to start tracking inventory.</div>
        )}
      </div>
    </div>
  );
};

// ── Opening Stock Modal ────────────────────────────────────────────────

const OpeningStockModal = ({ shops, onClose, onDone }) => {
  const [form, setForm] = useState({ item_name: '', shop_id: '', quantity: '', description: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!confirmed) return setConfirmed(true);
    if (!form.item_name || !form.shop_id || !form.quantity) return alert('All fields required');
    setSaving(true);
    try {
      await adminInventoryAPI.setOpeningStock({
        product_id: form.item_name, // item name used as product identifier
        shop_id: form.shop_id,
        quantity: parseInt(form.quantity),
        description: form.description || `Opening stock for ${form.item_name}`,
      });
      onDone();
      onClose();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to set opening stock');
      setConfirmed(false);
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap title="Set Opening Stock" onClose={onClose}>
      <div className="space-y-4">
        <SelectField label="Item *" value={form.item_name} onChange={v => setForm(f => ({ ...f, item_name: v }))}>
          <option value="">Select item</option>
          {INVENTORY_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
        </SelectField>

        <SelectField label="Shop *" value={form.shop_id} onChange={v => setForm(f => ({ ...f, shop_id: v }))}>
          <option value="">Select shop</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </SelectField>

        <InputField label="Quantity *" type="number" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} />
        <InputField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional note" />

        {confirmed && (
          <div className="flex items-start gap-3 p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>Are you sure? Opening stock can only be set once per item/shop and <strong>cannot be edited later.</strong></span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-3 bg-navy-800 text-gold-500 rounded-xl text-[10px] font-black uppercase">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase disabled:opacity-50 ${confirmed ? 'bg-amber-500 text-navy-950' : 'bg-gold-600 text-navy-950'}`}>
            {saving ? 'Saving...' : confirmed ? 'Confirm & Lock' : 'Set Opening Stock'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
};

// ── Movement Modal (Sales / Stock In / Stock Out) ─────────────────────

const MovementModal = ({ type, shops, onClose, onDone }) => {
  const [form, setForm] = useState({ item_name: '', shop_id: '', quantity: '', description: '' });
  const [saving, setSaving] = useState(false);

  const apiMap = { sales: adminInventoryAPI.recordSales, stock_in: adminInventoryAPI.recordStockIn, stock_out: adminInventoryAPI.recordStockOut };
  const labelMap = { sales: 'Record Sales', stock_in: 'Record Stock In', stock_out: 'Record Stock Out' };

  const handleSubmit = async () => {
    if (!form.item_name || !form.shop_id || !form.quantity) return alert('Item, shop and quantity are required');
    setSaving(true);
    try {
      await apiMap[type]({
        product_id: form.item_name,
        shop_id: form.shop_id,
        quantity: parseInt(form.quantity),
        description: form.description || `${labelMap[type]} — ${form.item_name}`,
      });
      onDone(); onClose();
    } catch (e) {
      alert(e?.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap title={labelMap[type]} onClose={onClose}>
      <div className="space-y-4">
        <SelectField label="Item *" value={form.item_name} onChange={v => setForm(f => ({ ...f, item_name: v }))}>
          <option value="">Select item</option>
          {INVENTORY_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
        </SelectField>

        <SelectField label="Shop *" value={form.shop_id} onChange={v => setForm(f => ({ ...f, shop_id: v }))}>
          <option value="">Select shop</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </SelectField>

        <InputField label="Quantity *" type="number" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} />
        <InputField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional note" />

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-3 bg-navy-800 text-gold-500 rounded-xl text-[10px] font-black uppercase">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-3 bg-gold-600 text-navy-950 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
};

// ── Transfer Modal ─────────────────────────────────────────────────────

const TransferModal = ({ shops, onClose, onDone }) => {
  const [fromShop, setFromShop] = useState('');
  const [toShop, setToShop] = useState('');
  const [items, setItems] = useState([{ item_name: '', quantity: '' }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems(i => [...i, { item_name: '', quantity: '' }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx, key, val) => setItems(i => i.map((item, j) => j === idx ? { ...item, [key]: val } : item));

  const handleSubmit = async () => {
    if (!fromShop || !toShop) return alert('Select both shops');
    if (fromShop === toShop) return alert('Source and destination must differ');
    const validItems = items.filter(i => i.item_name && i.quantity);
    if (!validItems.length) return alert('Add at least one item');
    setSaving(true);
    try {
      await adminInventoryAPI.transfer({
        from_shop_id: fromShop,
        to_shop_id: toShop,
        items: validItems.map(i => ({ product_id: i.item_name, quantity: parseInt(i.quantity) }))
      });
      onDone(); onClose();
    } catch (e) {
      alert(e?.response?.data?.message || 'Transfer failed');
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap title="Transfer Stock Between Shops" onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="From Shop *" value={fromShop} onChange={setFromShop}>
            <option value="">Select source</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </SelectField>
          <SelectField label="To Shop *" value={toShop} onChange={setToShop}>
            <option value="">Select destination</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </SelectField>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gold-500/50">Items</p>
            <button onClick={addItem} className="flex items-center gap-1 text-gold-500 text-[10px] font-black uppercase">
              <Plus size={12} /> Add Item
            </button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center bg-navy-950/40 border border-gold-500/5 rounded-xl p-3">
              <SelectField label="" value={item.item_name} onChange={v => updateItem(idx, 'item_name', v)}>
                <option value="">Select item</option>
                {INVENTORY_ITEMS.map(name => <option key={name} value={name}>{name}</option>)}
              </SelectField>
              <input type="number" min="1" placeholder="Qty" value={item.quantity}
                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                className="w-20 bg-navy-900 border border-gold-500/10 rounded-xl px-3 py-3 text-sm text-gold-100 outline-none focus:border-gold-500/40 text-center" />
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-red-400/50 hover:text-red-400"><X size={16} /></button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-3 bg-navy-800 text-gold-500 rounded-xl text-[10px] font-black uppercase">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-gold-600 text-navy-950 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">
            <ArrowRightLeft size={14} /> {saving ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
};

// ── Stock Summary Table ────────────────────────────────────────────────

const StockSummaryTable = ({ shops }) => {
  const [period, setPeriod] = useState('daily');
  const [shopFilter, setShopFilter] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminInventoryAPI.getSummary({ period, shop_id: shopFilter || undefined });
      setData(res.data.data || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [period, shopFilter]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const periodLabels = { daily: 'Today', weekly: 'This Week', monthly: 'This Month' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                period === p ? 'bg-gold-600 text-navy-950 border-gold-600' : 'bg-navy-900/50 text-gold-500/60 border-gold-500/10 hover:border-gold-500/30'
              }`}>{p}</button>
          ))}
        </div>
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)}
          className="bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-2 text-sm text-gold-300 outline-none cursor-pointer">
          <option value="">All Shops</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={fetchSummary} className="p-2 text-gold-500/50 hover:text-gold-500 bg-navy-800/50 border border-gold-500/10 rounded-xl transition-colors">
          <RefreshCw size={16} />
        </button>
        <span className="text-[10px] uppercase tracking-widest text-gold-500/30">{periodLabels[period]}</span>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-navy-800/50">
                <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Variant</th>
                  <th className="px-5 py-4">Shop</th>
                  <th className="px-5 py-4 text-right">Opening</th>
                  <th className="px-5 py-4 text-right">Stock In</th>
                  <th className="px-5 py-4 text-right">Stock Out</th>
                  <th className="px-5 py-4 text-right">Sales</th>
                  <th className="px-5 py-4 text-right">Closing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/5">
                {data.length ? data.map((row, i) => (
                  <tr key={i} className="hover:bg-navy-800/20 transition-colors">
                    <td className="px-5 py-4 text-sm font-bold text-gold-100">{row.product_name}</td>
                    <td className="px-5 py-4 text-xs text-gold-500/60">{row.variant_label || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black uppercase text-gold-500 bg-gold-500/10 px-2 py-1 rounded-lg">{row.shop_code}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-gold-100 font-bold">{row.opening_stock}</td>
                    <td className="px-5 py-4 text-right text-green-400 font-bold">+{row.stock_in}</td>
                    <td className="px-5 py-4 text-right text-orange-400 font-bold">-{row.stock_out}</td>
                    <td className="px-5 py-4 text-right text-red-400 font-bold">-{row.sales}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-black text-sm ${parseInt(row.closing_stock) <= 5 ? 'text-red-400' : 'text-gold-100'}`}>
                        {row.closing_stock ?? '—'}
                      </span>
                    </td>
                  </tr>
                )) : <EmptyRow cols={8} msg="No stock movements found for this period." />}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formula hint */}
      <p className="text-[10px] text-gold-500/30 uppercase tracking-widest">
        Closing Stock = Opening Stock + Stock In − Stock Out − Sales
      </p>
    </div>
  );
};

// ── Current Stock Panel ────────────────────────────────────────────────

const CurrentStockPanel = ({ shops }) => {
  const [shopFilter, setShopFilter] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminInventoryAPI.getCurrentStock({ shop_id: shopFilter || undefined });
      setData(res.data.data || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [shopFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)}
          className="bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-2 text-sm text-gold-300 outline-none cursor-pointer">
          <option value="">All Shops</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={fetchData} className="p-2 text-gold-500/50 hover:text-gold-500 bg-navy-800/50 border border-gold-500/10 rounded-xl transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-navy-800/50">
                <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Variant</th>
                  <th className="px-5 py-4">Shop</th>
                  <th className="px-5 py-4 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/5">
                {data.length ? data.map((row, i) => (
                  <tr key={i} className="hover:bg-navy-800/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {row.thumbnail && <img src={row.thumbnail} alt={row.product_name} className="w-8 h-8 rounded-lg object-cover border border-gold-500/10" />}
                        <span className="text-sm font-bold text-gold-100">{row.product_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gold-500/60">{row.variant_label || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black uppercase text-gold-500 bg-gold-500/10 px-2 py-1 rounded-lg">{row.shop_code}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-base font-black ${parseInt(row.current_stock) <= 5 ? 'text-red-400' : parseInt(row.current_stock) <= 15 ? 'text-amber-400' : 'text-green-400'}`}>
                        {row.current_stock}
                      </span>
                    </td>
                  </tr>
                )) : <EmptyRow cols={4} msg="No stock records found." />}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Movement History Panel ─────────────────────────────────────────────

const MovementHistory = ({ shops }) => {
  const [shopFilter, setShopFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminInventoryAPI.getMovements({
        shop_id: shopFilter || undefined,
        product_id: itemFilter || undefined,
        limit: 100
      });
      setData(res.data.data || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [shopFilter, itemFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)}
          className="bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-2 text-sm text-gold-300 outline-none cursor-pointer">
          <option value="">All Shops</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={itemFilter} onChange={e => setItemFilter(e.target.value)}
          className="bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-2 text-sm text-gold-300 outline-none cursor-pointer">
          <option value="">All Items</option>
          {INVENTORY_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <button onClick={fetchData} className="p-2 text-gold-500/50 hover:text-gold-500 bg-navy-800/50 border border-gold-500/10 rounded-xl transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-navy-800/50">
                <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Variant</th>
                  <th className="px-5 py-4">Shop</th>
                  <th className="px-5 py-4 text-right">Qty</th>
                  <th className="px-5 py-4 text-right">Closing</th>
                  <th className="px-5 py-4">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/5">
                {data.length ? data.map((row) => (
                  <tr key={row.id} className="hover:bg-navy-800/20 transition-colors">
                    <td className="px-5 py-4 text-xs text-gold-500/50">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4"><Badge type={row.movement_type} /></td>
                    <td className="px-5 py-4 text-sm font-bold text-gold-100">{row.product_name}</td>
                    <td className="px-5 py-4 text-xs text-gold-500/60">{row.variant_label || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black uppercase text-gold-500 bg-gold-500/10 px-2 py-1 rounded-lg">{row.shop_name}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-gold-100">{row.quantity}</td>
                    <td className="px-5 py-4 text-right font-black text-gold-400">{row.closing_stock}</td>
                    <td className="px-5 py-4 text-xs text-gold-500/40 max-w-[160px] truncate">{row.description || '—'}</td>
                  </tr>
                )) : <EmptyRow cols={8} msg="No movements found." />}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Transfer History ───────────────────────────────────────────────────

const TransferHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminInventoryAPI.getTransfers()
      .then(r => setData(r.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden">
      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-navy-800/50">
              <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">From</th>
                <th className="px-5 py-4">To</th>
                <th className="px-5 py-4 text-right">Total Qty</th>
                <th className="px-5 py-4 text-right">Items</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {data.length ? data.map(row => (
                <tr key={row.id} className="hover:bg-navy-800/20 transition-colors">
                  <td className="px-5 py-4 text-xs text-gold-500/50">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gold-100">{row.from_shop_name}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gold-100">{row.to_shop_name}</td>
                  <td className="px-5 py-4 text-right font-black text-gold-400">{row.total_quantity}</td>
                  <td className="px-5 py-4 text-right text-gold-500/60">{row.item_count}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-black uppercase text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">{row.status}</span>
                  </td>
                </tr>
              )) : <EmptyRow cols={6} msg="No transfers yet." />}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Small Shared UI ────────────────────────────────────────────────────

const ModalWrap = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-sm">
    <div className={`bg-navy-900 border border-gold-500/20 rounded-3xl p-6 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl`}>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-serif font-bold text-gold-100">{title}</h4>
        <button onClick={onClose} className="text-gold-500/40 hover:text-gold-500"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, children }) => (
  <div>
    {label && <label className="block text-[10px] font-black uppercase tracking-widest text-gold-500/50 mb-1">{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-3 text-sm text-gold-200 outline-none focus:border-gold-500/40 cursor-pointer">
      {children}
    </select>
  </div>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    {label && <label className="block text-[10px] font-black uppercase tracking-widest text-gold-500/50 mb-1">{label}</label>}
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-navy-900 border border-gold-500/10 rounded-xl px-4 py-3 text-sm text-gold-100 placeholder:text-gold-500/30 outline-none focus:border-gold-500/40" />
  </div>
);

// ── MAIN InventoryView ─────────────────────────────────────────────────

const TABS = [
  { id: 'summary', label: 'Stock Summary', icon: Package },
  { id: 'current', label: 'Current Stock', icon: CheckCircle2 },
  { id: 'history', label: 'Movements', icon: History },
  { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
  { id: 'shops', label: 'Shops', icon: Store },
];

const InventoryView = () => {
  const [tab, setTab] = useState('summary');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'opening'|'sales'|'stock_in'|'stock_out'|'transfer'

  const fetchBase = useCallback(async () => {
    setLoading(true);
    try {
      const shopsRes = await adminInventoryAPI.getShops();
      setShops(shopsRes.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  const closeModal = () => setModal(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500/40">Multi-Shop · Real-Time</span>
          <h3 className="text-2xl font-serif font-bold text-gold-100 mt-1">Inventory Management</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'opening', label: 'Opening Stock', icon: Package, color: 'bg-blue-500/20 text-blue-300 border-blue-500/20 hover:bg-blue-500/30' },
            { id: 'sales', label: 'Record Sales', icon: ShoppingCart, color: 'bg-red-500/20 text-red-300 border-red-500/20 hover:bg-red-500/30' },
            { id: 'stock_in', label: 'Stock In', icon: ArrowDown, color: 'bg-green-500/20 text-green-300 border-green-500/20 hover:bg-green-500/30' },
            { id: 'stock_out', label: 'Stock Out', icon: ArrowUp, color: 'bg-orange-500/20 text-orange-300 border-orange-500/20 hover:bg-orange-500/30' },
            { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'bg-gold-600 text-navy-950 border-gold-600 hover:bg-gold-500' },
          ].map(btn => (
            <button key={btn.id} onClick={() => setModal(btn.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${btn.color}`}>
              <btn.icon size={14} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Item Types', value: INVENTORY_ITEMS.length, icon: Package, color: 'text-blue-400' },
          { label: 'Shops', value: shops.length, icon: Building2, color: 'text-gold-400' },
          { label: 'Active Shops', value: shops.filter(s => s.is_active !== false).length, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Low Stock', value: '—', icon: AlertCircle, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-4 flex items-center gap-4">
            <div className={`${s.color} opacity-80`}><s.icon size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gold-500/40">{s.label}</p>
              <p className="text-xl font-serif font-bold text-gold-100">{loading ? '—' : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              tab === t.id ? 'bg-gold-600 text-navy-950 border-gold-600' : 'bg-navy-900/50 text-gold-500/60 border-gold-500/10 hover:border-gold-500/30'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {tab === 'summary' && <StockSummaryTable shops={shops} />}
          {tab === 'current' && <CurrentStockPanel shops={shops} />}
          {tab === 'history' && <MovementHistory shops={shops} />}
          {tab === 'transfers' && <TransferHistory />}
          {tab === 'shops' && <ShopsPanel shops={shops} onRefresh={fetchBase} />}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {modal === 'opening' && <OpeningStockModal shops={shops} onClose={closeModal} onDone={fetchBase} />}
      {modal === 'sales' && <MovementModal type="sales" shops={shops} onClose={closeModal} onDone={fetchBase} />}
      {modal === 'stock_in' && <MovementModal type="stock_in" shops={shops} onClose={closeModal} onDone={fetchBase} />}
      {modal === 'stock_out' && <MovementModal type="stock_out" shops={shops} onClose={closeModal} onDone={fetchBase} />}
      {modal === 'transfer' && <TransferModal shops={shops} onClose={closeModal} onDone={fetchBase} />}
    </div>
  );
};

export default InventoryView;
