// NEW — POS & Inventory admin views (embedded in AdminDashboard)
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  posAdminAPI, posAPI, inventoryAPI, shiftsAPI, sellersAPI, reportsAPI, posSettingsAPI, downloadReport,
  adminCategoryAPI, adminUploadAPI,
} from '../../../services/api';
import { formatKES } from '../../../lib/format';
import { getUploadUrl, toImageJson } from '../../../utils/cloudinary';
import InventoryCatalogView from './InventoryCatalogView';
import InventoryProductModal from './InventoryProductModal';
import { downloadReceiptPdf } from '../../../utils/receiptPdf';
import { ensureSocket, socket } from '../../../lib/socket';

const CHART_COLORS = ['#b8922a', '#4ade80', '#60a5fa', '#f472b6'];

const RevenueBarChart = ({ data = [] }) => {
  const rows = data.map((d) => ({
    label: d.date ? format(new Date(d.date), 'dd MMM') : '—',
    value: Number(d.revenue || 0),
  }));
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (!rows.length) {
    return <p className="text-gold-500/40 text-sm text-center py-16">No revenue data yet</p>;
  }

  return (
    <div className="h-full flex items-end gap-1.5 pt-4">
      {rows.map((row) => (
        <div key={row.label} className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end" title={`${row.label}: ${formatKES(row.value)}`}>
          <div
            className="w-full rounded-t bg-gradient-to-t from-gold-700 to-gold-400 min-h-[4px]"
            style={{ height: `${Math.max(4, (row.value / max) * 100)}%` }}
          />
          <span className="text-[9px] text-gold-500/50 truncate w-full text-center">{row.label}</span>
        </div>
      ))}
    </div>
  );
};

const PaymentMixChart = ({ data = [] }) => {
  const rows = data
    .map((d) => ({
      label: d.payment_method || 'Other',
      value: Number(d._sum?.total_amount || 0),
    }))
    .filter((d) => d.value > 0);
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  if (!rows.length) {
    return <p className="text-gold-500/40 text-sm text-center py-16">No payment data yet</p>;
  }

  return (
    <div className="space-y-3 py-2">
      {rows.map((row, i) => {
        const pct = total ? Math.round((row.value / total) * 100) : 0;
        return (
          <div key={row.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gold-300">{row.label}</span>
              <span className="text-gold-500/60">{formatKES(row.value)} ({pct}%)</span>
            </div>
            <div className="h-2 bg-navy-950 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}</div>
);

const blobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const IMPORT_MODES = [
  {
    id: 'opening_reset',
    label: 'Set opening stock',
    hint: 'Uses Opening Stock column only. Resets today sales/in/out to zero. Live qty = opening.',
  },
  {
    id: 'opening',
    label: 'Update opening only',
    hint: 'Updates Opening Stock column. Keeps today sales and movements.',
  },
  {
    id: 'full',
    label: 'Full sheet import',
    hint: 'Shop daily sheet: Stock In = store→shop, Stock Out = shop→store. Live shop qty = closing.',
  },
];

const StockExcelToolbar = ({ onImported, sheetDate }) => {
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState(sheetDate || format(new Date(), 'yyyy-MM-dd'));
  const [mode, setMode] = useState('opening_reset');

  useEffect(() => {
    if (sheetDate) setDate(sheetDate);
  }, [sheetDate]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await inventoryAPI.importExcel(file, { date, mode });
      if (res.data?.success) {
        const d = res.data.data || {};
        const count = (d.created || 0) + (d.updated || 0);
        toast.success(res.data.message || `Updated ${count} products from Excel`);
        if (d.warnings?.length) toast(d.warnings.join('; '), { icon: '⚠️' });
        onImported?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3 p-4 bg-navy-900/50 border border-gold-500/10 rounded-xl">
      <h3 className="text-gold-400 text-sm font-medium uppercase tracking-wider">Opening Stock — Excel Upload</h3>
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-navy-950 border border-gold-500/20 rounded px-2 py-1.5 text-white text-sm" title="Sheet date" />
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-navy-950 border border-gold-500/20 rounded px-2 py-1.5 text-white text-sm max-w-[220px]">
          {IMPORT_MODES.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <label className="px-4 py-1.5 bg-gold-600 text-navy-950 rounded text-sm font-medium cursor-pointer hover:bg-gold-500">
          {uploading ? 'Uploading…' : 'Upload Stock.xlsx'}
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        <button
          type="button"
          onClick={async () => {
            const res = await inventoryAPI.exportStock(date);
            blobDownload(new Blob([res.data]), `Stock-${date}.xlsx`);
            toast.success('Stock exported');
          }}
          className="px-3 py-1.5 border border-gold-500/30 text-gold-400 rounded text-sm"
        >
          Download Stock.xlsx
        </button>
        <button
          type="button"
          onClick={async () => {
            const res = await inventoryAPI.downloadTemplate();
            blobDownload(new Blob([res.data]), 'Stock-Template.xlsx');
          }}
          className="px-3 py-1.5 border border-gold-500/20 text-gold-500/50 rounded text-sm"
        >
          Template
        </button>
      </div>
    </div>
  );
};

const ProductCatalogToolbar = ({ category = '', onImported }) => {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await inventoryAPI.exportProductCatalog(category || undefined);
      const suffix = category ? `-${category.replace(/\s+/g, '-')}` : '';
      blobDownload(new Blob([res.data]), `Product-Catalog${suffix}.xlsx`);
      toast.success('Live catalogue downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await inventoryAPI.importExcel(file, { mode: 'catalog' });
      if (res.data?.success) {
        toast.success(res.data.message || 'Catalog imported');
        onImported?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Catalog upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2 p-4 bg-navy-900/50 border border-sky-500/15 rounded-xl">
      <h3 className="text-sky-300 text-sm font-medium uppercase tracking-wider">Product Catalog</h3>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={downloading}
          className="px-4 py-1.5 bg-sky-600 text-white rounded text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {downloading ? 'Generating…' : 'Download Product-Catalog.xlsx'}
        </button>
        <label className="px-4 py-1.5 border border-sky-500/40 text-sky-200 rounded text-sm font-medium cursor-pointer hover:bg-sky-500/10">
          {uploading ? 'Uploading…' : 'Upload Product Catalog.xlsx'}
          <input type="file" accept=".xlsx" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        <button
          type="button"
          onClick={async () => {
            const res = await inventoryAPI.downloadCatalogTemplate();
            blobDownload(new Blob([res.data]), 'Product-Catalog-Template.xlsx');
          }}
          className="px-3 py-1.5 border border-sky-500/30 text-sky-300 rounded text-sm"
        >
          Catalog template
        </button>
      </div>
    </div>
  );
};

const VariantStockToolbar = ({ category = '', onImported }) => {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    inventoryAPI.variantStockSummary(category ? { category } : {})
      .then((r) => setSummary(r.data?.data || null))
      .catch(() => setSummary(null));
  }, [category]);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await inventoryAPI.exportVariantStock(category || undefined);
      const suffix = category ? `-${category.replace(/\s+/g, '-')}` : '';
      blobDownload(new Blob([res.data]), `Variant-Stock${suffix}.xlsx`);
      toast.success('Variant stock report downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await inventoryAPI.importVariantStock(file);
      if (res.data?.success) {
        toast.success(res.data.message || 'Variant stock updated');
        if (res.data.data?.warnings?.length) {
          toast(res.data.data.warnings.slice(0, 3).join('; '), { icon: '⚠️' });
        }
        onImported?.();
        const sum = await inventoryAPI.variantStockSummary(category ? { category } : {});
        setSummary(sum.data?.data || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const transferNeeded = summary?.physicalRows?.filter(
    (r) => r.shopQty <= 0 && r.warehouseQty > 0
  ).length ?? 0;
  const outCount = summary?.physicalRows?.filter(
    (r) => r.shopQty <= 0 && r.warehouseQty <= 0
  ).length ?? 0;

  return (
    <div className="space-y-2 p-4 bg-navy-900/50 border border-emerald-500/20 rounded-xl">
      <h3 className="text-emerald-300 text-sm font-medium uppercase tracking-wider">Variant Stock</h3>
      {summary && (transferNeeded > 0 || outCount > 0) && (
        <p className="text-[11px] text-gold-500/60">
          {transferNeeded > 0 && (
            <span className="text-sky-300 mr-3">{transferNeeded} need warehouse → shop</span>
          )}
          {outCount > 0 && (
            <span className="text-red-400/90 mr-3">{outCount} completely out</span>
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={downloading}
          className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {downloading ? 'Generating…' : 'Download Variant-Stock.xlsx'}
        </button>
        <label className="px-4 py-1.5 border border-emerald-500/40 text-emerald-300 rounded text-sm font-medium cursor-pointer hover:bg-emerald-500/10">
          {uploading ? 'Uploading…' : 'Upload updated Web Stock'}
          <input type="file" accept=".xlsx" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        <button
          type="button"
          onClick={async () => {
            const res = await inventoryAPI.downloadVariantTemplate();
            blobDownload(new Blob([res.data]), 'Variant-Stock-Template.xlsx');
          }}
          className="px-3 py-1.5 border border-emerald-500/25 text-emerald-400/80 rounded text-sm"
        >
          Template
        </button>
      </div>
    </div>
  );
};

const Empty = ({ icon: Icon, message }) => (
  <div className="text-center py-16 text-gold-500/40">
    {Icon && <Icon className="mx-auto mb-3 opacity-40" size={40} />}
    <p>{message}</p>
  </div>
);

/** Shown to admins on POS Terminal — sellers get the live checkout screen instead */
export const AdminPosTerminalInfo = ({ onNavigateTab, onOpenInventory, onEnableTestPos }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    posAdminAPI.getOverview()
      .then((r) => setData(r.data?.data))
      .finally(() => setLoading(false));
  }, []);

  const go = (tab) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onOpenInventory) onOpenInventory(tab);
  };

  return (
    <div className="space-y-6">
      {!loading && data?.kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Today (POS)', data.kpis.todayRevenue],
            ['This week', data.kpis.weekRevenue],
            ['Active sellers now', data.kpis.activeSellers],
            ['This month', data.kpis.monthRevenue],
          ].map(([label, val]) => (
            <div key={label} className="bg-navy-900/50 border border-gold-500/10 rounded-xl p-4">
              <p className="text-gold-500/50 text-[10px] uppercase tracking-wider">{label}</p>
              <p className="text-xl font-bold text-gold-400 mt-1">
                {typeof val === 'number' && !String(label).includes('seller')
                  ? formatKES(val)
                  : val ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {onEnableTestPos && (
          <button
            type="button"
            onClick={onEnableTestPos}
            className="px-5 py-3 rounded-xl bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest"
          >
            Open test checkout
          </button>
        )}
        <button
          type="button"
          onClick={() => go('pos-sales')}
          className="px-5 py-3 rounded-xl bg-gold-600 text-navy-950 text-[10px] font-black uppercase tracking-widest"
        >
          View POS Sales
        </button>
        <button
          type="button"
          onClick={() => go('sellers')}
          className="px-5 py-3 rounded-xl border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-widest hover:bg-navy-800/50"
        >
          <Users size={14} className="inline mr-2 -mt-0.5" />
          Manage Sellers
        </button>
        <button
          type="button"
          onClick={() => go('overview')}
          className="px-5 py-3 rounded-xl border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-widest hover:bg-navy-800/50"
        >
          POS Overview
        </button>
      </div>
    </div>
  );
};

export const PosOverviewView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSocket();
    posAdminAPI.getOverview().then((r) => setData(r.data?.data)).finally(() => setLoading(false));
    const onLow = (p) => toast.error(`Low stock: ${p.productName} (${p.currentQty})`);
    socket.on('stock:lowAlert', onLow);
    return () => socket.off('stock:lowAlert', onLow);
  }, []);

  if (loading) return <TableSkeleton />;
  if (!data) return <Empty message="No overview data" />;

  return (
    <div className="space-y-6 p-2">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ['Today', data.kpis.todayRevenue],
          ['This week', data.kpis.weekRevenue],
          ['This month', data.kpis.monthRevenue],
          ['Active sellers', data.kpis.activeSellers],
          ['Low stock items', data.lowStockItems?.length ?? 0],
        ].map(([label, val]) => (
          <div key={label} className="bg-navy-900/50 border border-gold-500/10 rounded-xl p-4">
            <p className="text-gold-500/50 text-xs uppercase">{label}</p>
            <p className="text-2xl font-bold text-gold-400 mt-1">
              {typeof val === 'number' && label !== 'Active sellers' && label !== 'Low stock items'
                ? formatKES(val)
                : val}
            </p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-xl p-4 h-64">
          <p className="text-gold-500/50 text-xs mb-2">Revenue (30 days)</p>
          <div className="h-[calc(100%-1.5rem)]">
            <RevenueBarChart data={data.dailyRevenue || []} />
          </div>
        </div>
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-xl p-4 h-64">
          <p className="text-gold-500/50 text-xs mb-2">Payment mix</p>
          <PaymentMixChart data={data.paymentBreakdown || []} />
        </div>
      </div>
    </div>
  );
};

export const PosSalesView = ({ channel = 'POS', readOnly = false }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voidId, setVoidId] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const load = () => {
    setLoading(true);
    posAPI.listSales({ channel, limit: 50 })
      .then((r) => setSales(r.data?.data?.sales || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [channel]);

  const doVoid = async () => {
    await posAPI.voidSale(voidId, { voidReason });
    toast.success('Sale voided');
    setVoidId(null);
    setVoidReason('');
    load();
  };

  return (
    <div className="p-2">
      {loading ? <TableSkeleton /> : sales.length === 0 ? <Empty message="No sales" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gold-500/50 text-xs uppercase">
              <tr><th className="p-2">Receipt</th><th>Date</th><th>Seller</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-gold-500/10">
                  <td className="p-2">{s.receipt_number}</td>
                  <td>{format(new Date(s.created_at), 'dd MMM yyyy HH:mm')}</td>
                  <td>{s.seller?.full_name || 'Website'}</td>
                  <td>{formatKES(s.total_amount)}</td>
                  <td>{s.payment_method}</td>
                  <td>{s.is_voided ? <span className="text-red-400">Voided</span> : 'OK'}</td>
                  <td className="space-x-2">
                    <button type="button" onClick={() => downloadReceiptPdf(s, s.seller?.full_name)} className="text-gold-400 text-xs">Receipt</button>
                    {!readOnly && !s.is_voided && <button type="button" onClick={() => setVoidId(s.id)} className="text-red-400 text-xs">Void</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {voidId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-gold-400 font-medium">Void sale</h3>
            <textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason" className="w-full mt-3 bg-navy-950 border border-gold-500/20 rounded p-3 text-white text-sm" rows={3} />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setVoidId(null)} className="flex-1 py-2 border border-gold-500/20 rounded text-gold-500/60">Cancel</button>
              <button onClick={doVoid} disabled={voidReason.length < 3} className="flex-1 py-2 bg-red-600 rounded text-white disabled:opacity-40">Confirm void</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StockOverviewView = () => {
  const [exportCategory, setExportCategory] = useState('');
  const reload = () => window.dispatchEvent(new Event('inventory:reload'));

  return (
    <div className="p-2 space-y-4">
      <div className="rounded-xl border border-gold-500/15 bg-navy-900/40 px-4 py-3 text-xs text-gold-500/70 leading-relaxed">
        <strong className="text-gold-400">Physical stock lives here.</strong> Shop floor and warehouse counts are managed in this tab.
        Website stock mirrors shop floor automatically after transfers, sales, and stock takes.
        Use <span className="text-gold-300">Sales &amp; Finance</span> for revenue — not for moving pieces between store and shop.
      </div>
      <VariantStockToolbar category={exportCategory} onImported={reload} />
      <ProductCatalogToolbar category={exportCategory} onImported={reload} />
      <StockExcelToolbar onImported={reload} />
      <InventoryCatalogView onCategoryChange={setExportCategory} />
    </div>
  );
};

export const StockMovementsView = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  const load = () => {
    setLoading(true);
    inventoryAPI.movements({ limit, page, type: typeFilter || undefined })
      .then((r) => setRows(r.data?.data?.movements || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, typeFilter]);

  const color = (t) => ({ STOCK_IN: 'text-green-400', STOCK_OUT: 'text-orange-400', SALE_POS: 'text-red-400', SALE_ONLINE: 'text-red-400', ADJUSTMENT: 'text-amber-400', VOID: 'text-gray-400' }[t] || '');
  const label = (m) => {
    if (m.movement_type === 'STOCK_IN') return 'Store → Shop';
    if (m.movement_type === 'STOCK_OUT') return 'Shop → Store';
    if (m.movement_type === 'VOID') return 'Sale void / return';
    return m.movement_type;
  };

  return (
    <div className="p-2 space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-navy-950 border border-gold-500/20 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="">All movement types</option>
          <option value="STOCK_IN">Store → Shop</option>
          <option value="STOCK_OUT">Shop → Store</option>
          <option value="SALE_POS">POS sale</option>
          <option value="SALE_ONLINE">Online sale</option>
          <option value="ADJUSTMENT">Stock take</option>
          <option value="VOID">Void / return</option>
        </select>
        <button type="button" onClick={load} className="text-gold-400 text-sm underline">Refresh</button>
      </div>
      {loading ? <TableSkeleton /> : rows.length === 0 ? (
        <Empty message="No movements recorded yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gold-500/50 text-xs"><tr><th className="p-2 text-left">Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Notes</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className={`border-t border-gold-500/10 ${color(m.movement_type)}`}>
                  <td className="p-2">{format(new Date(m.created_at), 'dd MMM yyyy HH:mm')}</td>
                  <td>{m.product?.name}</td>
                  <td>{label(m)}</td>
                  <td>{m.qty}</td>
                  <td className="text-gold-500/50">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border border-gold-500/20 rounded text-gold-400 text-sm disabled:opacity-40">Previous</button>
        <span className="text-gold-500/50 text-sm self-center">Page {page}</span>
        <button type="button" disabled={rows.length < limit} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-gold-500/20 rounded text-gold-400 text-sm disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};


const PIECE_PAGE = 50;

const locationBadge = (piece) => {
  const inShop = (piece.currentQty ?? 0) > 0;
  const inStore = (piece.storeQty ?? 0) > 0;
  if (inShop && inStore) return { text: 'Shop + Store', cls: 'bg-amber-500/10 text-amber-300' };
  if (inStore) return { text: 'In warehouse', cls: 'bg-violet-500/10 text-violet-300' };
  if (inShop) return { text: 'On shop floor', cls: 'bg-emerald-500/10 text-emerald-300' };
  return { text: 'Not in stock', cls: 'bg-red-500/10 text-red-400' };
};

const StockSummaryPieceRow = ({ piece, detailOpen, onToggleDetail, onViewFull, onTransfer, transferBusy }) => {
  const loc = locationBadge(piece);
  const canToShop = (piece.storeQty ?? 0) > 0;
  const canToStore = (piece.currentQty ?? 0) > 0;

  return (
    <>
      <tr className="border-t border-gold-500/5 hover:bg-white/[0.02]">
        <td className="py-2 font-mono text-[10px] text-gold-500/50">{piece.sku}</td>
        <td className="py-2">
          <button
            type="button"
            onClick={() => onToggleDetail(piece.id)}
            className="text-left group"
          >
            <span className="text-gold-200 group-hover:text-gold-100">{piece.name}</span>
            {piece.description && (
              <p className="text-[10px] text-gold-500/40 mt-0.5 line-clamp-1">{piece.description}</p>
            )}
          </button>
        </td>
        <td className="py-2 text-gold-300/90">{piece.color || '—'}</td>
        <td className="py-2 text-gold-300/90">{piece.size || '—'}</td>
        <td className="py-2 text-center tabular-nums">{piece.currentQty ?? 0}</td>
        <td className="py-2 text-center tabular-nums text-gold-500/50">{piece.storeQty ?? 0}</td>
        <td className="py-2 text-center text-gold-400/80">{formatKES(piece.shop_price)}</td>
        <td className="py-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${loc.cls}`}>{loc.text}</span>
          {' '}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${piece.on_website ? 'bg-sky-500/10 text-sky-300' : 'bg-navy-800 text-gold-500/50'}`}>
            {piece.on_website ? 'On website' : 'Inventory only'}
          </span>
        </td>
        <td className="py-2 text-right">
          <button
            type="button"
            onClick={() => onViewFull(piece.id)}
            className="text-[10px] text-gold-400 hover:text-gold-300 underline"
          >
            Full details
          </button>
        </td>
      </tr>
      {detailOpen && (
        <tr className="border-t border-gold-500/5 bg-navy-900/60">
          <td colSpan={9} className="px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-4 text-xs">
              {piece.website_thumbnail ? (
                <img src={piece.website_thumbnail} alt="" className="w-20 h-20 rounded-lg object-contain bg-white border border-gold-500/10 shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-navy-950 border border-gold-500/10 flex items-center justify-center text-[10px] text-gold-500/30 shrink-0 text-center px-1">
                  No image
                </div>
              )}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                  <p><span className="text-gold-500/50">Color</span> <span className="text-gold-200 ml-1">{piece.color || '—'}</span></p>
                  <p><span className="text-gold-500/50">Size</span> <span className="text-gold-200 ml-1">{piece.size || '—'}</span></p>
                  <p><span className="text-gold-500/50">Shop</span> <span className="text-gold-200 ml-1">{piece.currentQty ?? 0}</span></p>
                  <p><span className="text-gold-500/50">Store</span> <span className="text-gold-200 ml-1">{piece.storeQty ?? 0}</span></p>
                  <p><span className="text-gold-500/50">Price</span> <span className="text-gold-200 ml-1">{formatKES(piece.shop_price)}</span></p>
                  <p><span className="text-gold-500/50">Category</span> <span className="text-gold-200 ml-1">{piece.category}</span></p>
                  {piece.unit_number != null && (
                    <p><span className="text-gold-500/50">Piece #</span> <span className="text-gold-200 ml-1">{piece.unit_number}</span></p>
                  )}
                </div>
                {piece.description && (
                  <p className="text-slate-400 leading-relaxed">{piece.description}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {canToShop && (
                    <button
                      type="button"
                      disabled={transferBusy}
                      onClick={() => onTransfer('toShop', piece)}
                      className="px-2 py-1 text-[10px] bg-gold-600/20 text-gold-300 border border-gold-500/30 rounded disabled:opacity-50"
                    >
                      Store → Shop
                    </button>
                  )}
                  {canToStore && (
                    <button
                      type="button"
                      disabled={transferBusy}
                      onClick={() => onTransfer('toStore', piece)}
                      className="px-2 py-1 text-[10px] border border-gold-500/25 text-gold-400 rounded disabled:opacity-50"
                    >
                      Shop → Store
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewFull(piece.id)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 underline"
                  >
                    Edit / publish →
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const StockSummaryCategoryRow = ({ row, expanded, onToggle, piecesState, onLoadMore, onViewProduct, onTransfer, onBulkToShop, transferBusy, inventoryMode }) => {
  const category = row.product?.name || row.name;
  const cache = piecesState[category];
  const isOpen = expanded === category;
  const [openPieceId, setOpenPieceId] = useState(null);

  useEffect(() => {
    if (!isOpen) setOpenPieceId(null);
  }, [isOpen]);

  return (
    <>
      <tr className="border-t border-gold-500/10 hover:bg-white/[0.02]">
        <td className="p-2 font-medium">
          <button
            type="button"
            onClick={() => onToggle(category)}
            className="flex items-center gap-2 text-left w-full group"
          >
            {isOpen ? (
              <ChevronDown size={16} className="text-gold-500 shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-gold-500/50 group-hover:text-gold-500 shrink-0" />
            )}
            <span className="text-white">{category}</span>
            <span className="text-[10px] text-gold-500/40 font-normal ml-1">
              ({row.shop_piece_count ?? 0} shop
              {(row.warehouse_piece_count ?? 0) > 0 && ` + ${row.warehouse_piece_count} store`}
              {row.target_qty != null && (
                <span className={row.shop_tally_match && row.store_tally_match ? ' text-emerald-500/70' : ' text-amber-500/70'}>
                  {' · '}
                  {row.shop_tally_match && row.store_tally_match ? '✓' : '≠ sheet'}
                </span>
              )}
              )
            </span>
          </button>
        </td>
        <td className="p-2 text-center tabular-nums">{row.opening_qty}</td>
        <td className="p-2 text-center tabular-nums">{row.stock_in_qty}</td>
        <td className="p-2 text-center tabular-nums">{row.sales_qty}</td>
        <td className="p-2 text-center tabular-nums">{row.stock_out_qty}</td>
        <td className="p-2 text-center tabular-nums font-medium text-gold-300">{row.closing_qty}</td>
        <td className="p-2 text-center tabular-nums text-gold-500/50">
          {row.target_qty != null ? (
            <span className={row.shop_tally_match ? 'text-emerald-400' : 'text-amber-400'}>{row.target_qty}</span>
          ) : '—'}
        </td>
        <td className="p-2 text-center tabular-nums text-violet-300/90">{row.store_qty ?? 0}</td>
      </tr>

      {isOpen && (
        <tr className="border-t border-gold-500/5 bg-navy-950/40">
          <td colSpan={8} className="p-0">
            <div className="px-4 py-3 border-l-2 border-gold-500/30 ml-3">
              {onBulkToShop && (
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    disabled={transferBusy}
                    onClick={() => onBulkToShop(category)}
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-gold-500/30 text-gold-400 hover:bg-gold-600/10 disabled:opacity-50"
                  >
                    Move all warehouse → shop
                  </button>
                </div>
              )}
              {cache?.loading && !cache?.items?.length && (
                <p className="text-gold-500/40 text-xs py-4 text-center">Loading pieces…</p>
              )}
              {cache?.error && (
                <p className="text-red-400 text-xs py-2">{cache.error}</p>
              )}
              {cache?.items?.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="text-gold-500/40">
                    <tr>
                      <th className="py-1.5 text-left font-normal">SKU</th>
                      <th className="py-1.5 text-left font-normal">Name</th>
                      <th className="py-1.5 text-left font-normal">Color</th>
                      <th className="py-1.5 text-left font-normal">Size</th>
                      <th className="py-1.5 text-center font-normal">Shop</th>
                      <th className="py-1.5 text-center font-normal">Store</th>
                      <th className="py-1.5 text-center font-normal">Price</th>
                      <th className="py-1.5 text-left font-normal">Location</th>
                      <th className="py-1.5 text-right font-normal" />
                    </tr>
                  </thead>
                  <tbody>
                    {cache.items.map((p) => (
                      <StockSummaryPieceRow
                        key={p.id}
                        piece={p}
                        detailOpen={openPieceId === p.id}
                        onToggleDetail={(id) => setOpenPieceId((cur) => (cur === id ? null : id))}
                        onViewFull={onViewProduct}
                        onTransfer={onTransfer}
                        transferBusy={transferBusy}
                      />
                    ))}
                  </tbody>
                </table>
              )}
              {cache && !cache.loading && cache.items?.length === 0 && (
                <p className="text-gold-500/40 text-xs py-3">No pieces in this category.</p>
              )}
              {cache && cache.total > (cache.items?.length ?? 0) && (
                <button
                  type="button"
                  onClick={() => onLoadMore(category)}
                  disabled={cache.loading}
                  className="mt-2 text-[10px] text-gold-400 hover:text-gold-300 underline disabled:opacity-50"
                >
                  {cache.loading
                    ? 'Loading…'
                    : `Show more (${cache.items.length} of ${cache.total})`}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const DailyStockSheetView = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [piecesState, setPiecesState] = useState({});
  const [productModalId, setProductModalId] = useState(null);
  const [inventoryMode, setInventoryMode] = useState('all');
  const [transferBusy, setTransferBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    inventoryAPI.dailySheet(date)
      .then((r) => {
        if (r.data?.success) setRows(r.data.data || []);
        else {
          setRows([]);
          setError(r.data?.message || 'Could not load stock summary');
        }
      })
      .catch((err) => {
        setRows([]);
        setError(err.response?.data?.message || 'Failed to load stock summary');
        toast.error(err.response?.data?.message || 'Failed to load stock summary');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date]);

  const fetchPieces = useCallback(async (category, { append = false, location = inventoryMode } = {}) => {
    let offset = 0;
    setPiecesState((s) => {
      offset = append ? (s[category]?.items?.length ?? 0) : 0;
      return {
        ...s,
        [category]: {
          ...s[category],
          loading: true,
          error: null,
          items: append ? (s[category]?.items ?? []) : [],
        },
      };
    });

    try {
      const res = await inventoryAPI.categoryPieces({
        category,
        limit: PIECE_PAGE,
        offset,
        availableOnly: '0',
        location: location === 'all' ? undefined : location,
      });
      const { items = [], total = 0 } = res.data?.data || {};
      setPiecesState((s) => ({
        ...s,
        [category]: {
          loading: false,
          error: null,
          total,
          items: append ? [...(s[category]?.items ?? []), ...items] : items,
        },
      }));
    } catch (err) {
      setPiecesState((s) => ({
        ...s,
        [category]: {
          ...s[category],
          loading: false,
          error: err.response?.data?.message || 'Failed to load pieces',
        },
      }));
    }
  }, [inventoryMode]);

  useEffect(() => {
    if (expanded) {
      setPiecesState((s) => ({ ...s, [expanded]: undefined }));
      fetchPieces(expanded, { location: inventoryMode });
    }
  }, [inventoryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTransfer = async (direction, piece) => {
    setTransferBusy(true);
    try {
      if (direction === 'toShop') {
        await inventoryAPI.stockIn({ productId: piece.id, qty: 1 });
        toast.success('Moved to shop floor');
      } else {
        await inventoryAPI.stockOut({ productId: piece.id, qty: 1 });
        toast.success('Moved to warehouse');
      }
      load();
      if (expanded) fetchPieces(expanded, { location: inventoryMode });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferBusy(false);
    }
  };

  const handleBulkToShop = async (category) => {
    setTransferBusy(true);
    try {
      const res = await inventoryAPI.categoryPieces({
        category,
        limit: 500,
        offset: 0,
        location: 'store',
      });
      const pieces = (res.data?.data?.items || []).filter((p) => (p.storeQty ?? 0) > 0);
      if (!pieces.length) {
        toast.error('No warehouse stock to move for this category');
        return;
      }
      let moved = 0;
      for (const piece of pieces) {
        await inventoryAPI.stockIn({ productId: piece.id, qty: 1, notes: 'Bulk store → shop' });
        moved += 1;
      }
      toast.success(`Moved ${moved} piece(s) from warehouse to shop`);
      load();
      if (expanded === category) fetchPieces(category, { location: inventoryMode });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk transfer failed');
    } finally {
      setTransferBusy(false);
    }
  };

  const toggleCategory = (category) => {
    if (expanded === category) {
      setExpanded(null);
      return;
    }
    setExpanded(category);
    fetchPieces(category, { location: inventoryMode });
  };

  return (
    <div className="p-2 space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'All locations'],
          ['shop', 'Shop floor only'],
          ['store', 'Warehouse only'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setInventoryMode(id)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${
              inventoryMode === id
                ? 'bg-gold-600/20 border-gold-500/40 text-gold-300'
                : 'border-gold-500/15 text-gold-500/50 hover:text-gold-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <StockExcelToolbar sheetDate={date} onImported={load} />
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-navy-950 border border-gold-500/20 rounded px-3 py-2 text-white" />
        <button onClick={async () => { await inventoryAPI.closeDay(); toast.success('Day closed'); load(); }} className="px-4 py-2 border border-gold-500/30 text-gold-400 rounded text-sm">Force close day</button>
        <button type="button" onClick={() => downloadReport(reportsAPI.stockReport, `stock-report-${date}.xlsx`, { date })} className="text-gold-400 text-sm underline">Download Excel</button>
        <button type="button" onClick={load} className="text-gold-500/50 text-sm underline">Refresh</button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading ? <TableSkeleton /> : rows.length === 0 ? (
        <Empty message="No stock summary for this date" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gold-500/10">
          <table className="w-full text-sm">
            <thead className="text-gold-500/50 text-xs bg-navy-950/50">
              <tr>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-center">Open</th>
                <th className="p-2 text-center">In ↓</th>
                <th className="p-2 text-center">Sales</th>
                <th className="p-2 text-center">Out ↑</th>
                <th className="p-2 text-center">Shop close</th>
                <th className="p-2 text-center">Sheet target</th>
                <th className="p-2 text-center">In store</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <StockSummaryCategoryRow
                  key={r.product_id || r.category || r.name}
                  row={r}
                  expanded={expanded}
                  onToggle={toggleCategory}
                  piecesState={piecesState}
                  onLoadMore={(cat) => fetchPieces(cat, { append: true, location: inventoryMode })}
                  onViewProduct={setProductModalId}
                  onTransfer={handleTransfer}
                  onBulkToShop={handleBulkToShop}
                  transferBusy={transferBusy}
                  inventoryMode={inventoryMode}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productModalId && (
        <InventoryProductModal
          itemId={productModalId}
          onClose={() => setProductModalId(null)}
          onSaved={() => {
            setProductModalId(null);
            load();
            if (expanded) fetchPieces(expanded, { location: inventoryMode });
          }}
        />
      )}
    </div>
  );
};

export const StockTakeView = () => {
  const [location, setLocation] = useState('shop');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    inventoryAPI.stockLevels(categoryFilter ? { category: categoryFilter } : {})
      .then((r) => {
        const list = r.data?.data || [];
        setItems(list);
        setCounts(Object.fromEntries(
          list.map((p) => [p.id, location === 'shop' ? p.currentQty : (p.storeQty ?? 0)])
        ));
      })
      .finally(() => setLoading(false));
  }, [location, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const payload = items
      .map((p) => ({
        productId: p.id,
        physicalQty: counts[p.id] ?? (location === 'shop' ? p.currentQty : (p.storeQty ?? 0)),
      }))
      .filter((r) => {
        const system = location === 'shop'
          ? (items.find((i) => i.id === r.productId)?.currentQty ?? 0)
          : (items.find((i) => i.id === r.productId)?.storeQty ?? 0);
        return r.physicalQty !== system;
      });
    if (!payload.length) return toast.error('No variances to save');
    const api = location === 'shop' ? inventoryAPI.stockTake : inventoryAPI.storeStockTake;
    await api(payload);
    toast.success(`${location === 'shop' ? 'Shop' : 'Warehouse'} stock take saved — website stock updated`);
    load();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await inventoryAPI.exportStockTake({
        location,
        category: categoryFilter || undefined,
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stock-Take-${location}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleTemplate = async () => {
    try {
      const res = await inventoryAPI.downloadStockTakeTemplate(location);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stock-Take-${location}-Template.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Template download failed');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await inventoryAPI.importStockTake(file, { location });
      const d = res.data?.data || {};
      if (res.data?.success) {
        toast.success(
          res.data.message ||
            `Applied ${d.adjusted || 0} adjustment(s)${d.skipped?.length ? `, ${d.skipped.length} skipped` : ''}`
        );
        load();
        window.dispatchEvent(new Event('inventory:reload'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const categories = [...new Set(items.map((p) => p.category).filter(Boolean))].sort();

  const totals = useMemo(() => {
    let costValue = 0;
    let retailValue = 0;
    let varianceUnits = 0;
    for (const p of items) {
      const system = location === 'shop' ? p.currentQty : (p.storeQty ?? 0);
      const physical = counts[p.id] ?? system;
      const variance = physical - system;
      const cost = p.costPrice ?? 0;
      const retail = p.retailPrice ?? p.shop_price ?? 0;
      costValue += cost * physical;
      retailValue += retail * physical;
      varianceUnits += variance;
    }
    return { costValue, retailValue, profit: retailValue - costValue, varianceUnits };
  }, [items, counts, location]);

  const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : formatKES(n));

  return (
    <div className="p-2 space-y-4">
      <p className="text-xs text-gold-500/50">
        Variance = Physical Count − System Qty (same as Excel). Download the sheet, fill Physical Count, upload to update shop, warehouse, and website stock automatically.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        {[
          ['shop', 'Shop floor'],
          ['store', 'Warehouse'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLocation(id)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${
              location === id ? 'bg-gold-600/20 border-gold-500/40 text-gold-300' : 'border-gold-500/15 text-gold-500/50'
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-navy-950 border border-gold-500/20 rounded-lg px-3 py-1.5 text-white text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || loading}
          className="px-3 py-1.5 border border-gold-500/30 text-gold-400 rounded-lg text-xs"
        >
          {downloading ? 'Downloading…' : 'Download Excel'}
        </button>
        <label className="px-3 py-1.5 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs cursor-pointer">
          {uploading ? 'Uploading…' : 'Upload adjustments'}
          <input type="file" accept=".xlsx" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        <button type="button" onClick={handleTemplate} className="text-gold-500/50 text-xs underline">
          Blank template
        </button>
        <button onClick={save} className="px-4 py-2 bg-gold-600 text-navy-950 rounded text-sm font-medium ml-auto">
          Save on screen
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-lg p-3">
          <p className="text-gold-500/40 uppercase tracking-wider">Cost value (counted)</p>
          <p className="text-gold-200 font-semibold mt-1">{fmt(totals.costValue)}</p>
        </div>
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-lg p-3">
          <p className="text-gold-500/40 uppercase tracking-wider">Retail value (counted)</p>
          <p className="text-gold-200 font-semibold mt-1">{fmt(totals.retailValue)}</p>
        </div>
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-lg p-3">
          <p className="text-gold-500/40 uppercase tracking-wider">Potential profit</p>
          <p className="text-emerald-400 font-semibold mt-1">{fmt(totals.profit)}</p>
        </div>
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-lg p-3">
          <p className="text-gold-500/40 uppercase tracking-wider">Net variance (units)</p>
          <p className={`font-semibold mt-1 ${totals.varianceUnits < 0 ? 'text-red-400' : totals.varianceUnits > 0 ? 'text-green-400' : 'text-gold-200'}`}>
            {totals.varianceUnits > 0 ? '+' : ''}{totals.varianceUnits}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gold-500/40 text-sm py-8 text-center">Loading stock list…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-gold-500/50 text-xs">
              <tr>
                <th className="p-2 text-left">Product</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Web</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Retail</th>
                <th className="p-2">System</th>
                <th className="p-2">Physical</th>
                <th className="p-2">Variance</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const system = location === 'shop' ? p.currentQty : (p.storeQty ?? 0);
                const physical = counts[p.id] ?? system;
                const variance = physical - system;
                const cost = p.costPrice ?? 0;
                const retail = p.retailPrice ?? p.shop_price ?? 0;
                const lineProfit = (retail - cost) * physical;
                return (
                  <tr key={p.id} className="border-t border-gold-500/10">
                    <td className="p-2 max-w-[200px] truncate" title={p.name}>{p.name}</td>
                    <td className="p-2 text-gold-500/60 text-xs">{p.sku}</td>
                    <td className="p-2 text-center">{p.on_website ? '✓' : '—'}</td>
                    <td className="p-2 text-right text-xs">{cost ? fmt(cost) : '—'}</td>
                    <td className="p-2 text-right text-xs">{fmt(retail)}</td>
                    <td className="p-2 text-center">{system}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={physical}
                        onChange={(e) => setCounts({ ...counts, [p.id]: Number(e.target.value) })}
                        className="w-20 bg-navy-950 border border-gold-500/20 rounded px-2 py-1 text-white text-center"
                      />
                    </td>
                    <td className={`p-2 text-center font-medium ${variance < 0 ? 'text-red-400' : variance > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                      {variance > 0 ? '+' : ''}{variance}
                    </td>
                    <td className="p-2 text-right text-xs text-emerald-400/80">{fmt(lineProfit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ShiftsView = () => {
  const [shifts, setShifts] = useState([]);
  const [detail, setDetail] = useState(null);

  const load = () => shiftsAPI.list().then((r) => setShifts(r.data?.data?.shifts || []));
  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    const r = await shiftsAPI.getOne(id);
    setDetail(r.data?.data);
  };

  return (
    <div className="p-2 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gold-500/50 text-xs">
          <tr><th className="p-2">Seller</th><th>Clock In</th><th>Clock Out</th><th>Cash</th><th>M-Pesa</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <tr key={s.id} className="border-t border-gold-500/10 hover:bg-navy-800/30">
              <td className="p-2">
                <button type="button" onClick={() => openDetail(s.id)} className="text-gold-400 hover:underline">{s.seller?.full_name}</button>
              </td>
              <td>{format(new Date(s.clock_in), 'dd MMM HH:mm')}</td>
              <td>{s.clock_out ? format(new Date(s.clock_out), 'dd MMM HH:mm') : 'Open'}</td>
              <td>{formatKES(s.total_cash)}</td>
              <td>{formatKES(s.total_mpesa)}</td>
              <td>{formatKES(s.total_sales)}</td>
              <td>
                <button type="button" onClick={() => downloadReport(reportsAPI.shiftReport, `shift-${s.id}.xlsx`, { shiftId: s.id })} className="text-gold-400 text-xs">Report</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-navy-900 border border-gold-500/20 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gold-400 font-medium">{detail.seller?.full_name} — Shift</h3>
            <p className="text-gold-500/50 text-xs mt-1">{format(new Date(detail.clock_in), 'PPpp')} → {detail.clock_out ? format(new Date(detail.clock_out), 'PPpp') : 'Open'}</p>
            <table className="w-full text-sm mt-4">
              <thead className="text-gold-500/50 text-xs"><tr><th className="p-2 text-left">Receipt</th><th>Total</th><th>Payment</th></tr></thead>
              <tbody>
                {(detail.sales || []).map((sale) => (
                  <tr key={sale.id} className="border-t border-gold-500/10">
                    <td className="p-2">{sale.receipt_number}</td>
                    <td>{formatKES(sale.total_amount)}</td>
                    <td>{sale.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => setDetail(null)} className="mt-4 px-4 py-2 border border-gold-500/20 rounded text-gold-500/60 text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SellersView = () => {
  const [sellers, setSellers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const load = () => sellersAPI.list().then((r) => setSellers(r.data?.data || []));
  useEffect(() => { load(); }, []);
  return (
    <div className="p-2">
      <button onClick={() => setShowAdd(true)} className="mb-4 px-4 py-2 bg-gold-600 text-navy-950 rounded text-sm font-medium">Add Seller</button>
      <table className="w-full text-sm">
        <thead className="text-gold-500/50 text-xs"><tr><th className="p-2">Name</th><th>Email</th><th>Status</th><th>Sales</th><th></th></tr></thead>
        <tbody>
          {sellers.map((s) => (
            <tr key={s.id} className="border-t border-gold-500/10">
              <td className="p-2">{s.fullName}</td>
              <td>{s.email}</td>
              <td>{s.is_active ? 'Active' : 'Inactive'}</td>
              <td>{s.totalSales}</td>
              <td><button onClick={async () => { await sellersAPI.toggle(s.id); load(); }} className="text-gold-400 text-xs">Toggle</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-xl p-6 max-w-md w-full space-y-3">
            <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white" />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white" />
            <button onClick={async () => { await sellersAPI.create(form); setShowAdd(false); load(); toast.success('Seller added'); }} className="w-full py-2 bg-gold-600 text-navy-950 rounded">Create</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PosReportsView = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [busy, setBusy] = useState('');

  const run = async (key, fn, file, params) => {
    setBusy(key);
    try {
      await downloadReport(fn, file, params);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    } finally {
      setBusy('');
    }
  };

  const reports = [
    { key: 'daily', title: 'Daily Sales', desc: 'Receipts, channels, payment methods', needsRange: true, fn: reportsAPI.dailySales, file: 'daily-sales.xlsx' },
    { key: 'stock', title: 'Stock Report', desc: 'Opening, movements, closing by date', needsDate: true, fn: reportsAPI.stockReport, file: 'stock-report.xlsx' },
    { key: 'movements', title: 'Stock Movements', desc: 'Full movement log', needsRange: true, fn: reportsAPI.stockMovements, file: 'stock-movements.xlsx' },
    { key: 'low', title: 'Low Stock', desc: 'Products at or below threshold', fn: reportsAPI.lowStock, file: 'low-stock.xlsx' },
    { key: 'eod', title: 'End of Day', desc: 'Per-seller cash and sales totals', needsDate: true, fn: reportsAPI.endOfDay, file: 'end-of-day.xlsx' },
  ];

  return (
    <div className="p-2 space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-navy-950 border border-gold-500/20 rounded px-3 py-2 text-white text-sm" placeholder="From" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-navy-950 border border-gold-500/20 rounded px-3 py-2 text-white text-sm" placeholder="To" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-navy-950 border border-gold-500/20 rounded px-3 py-2 text-white text-sm" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.key} className="bg-navy-900/50 border border-gold-500/10 rounded-xl p-4">
            <h3 className="text-gold-400 font-medium">{r.title}</h3>
            <button
              type="button"
              disabled={busy === r.key}
              onClick={() => {
                const params = {};
                if (r.needsRange) { if (from) params.from = from; if (to) params.to = to; }
                if (r.needsDate) params.date = date;
                run(r.key, r.fn, r.file, params);
              }}
              className="inline-block mt-3 text-sm bg-gold-600 text-navy-950 px-4 py-2 rounded disabled:opacity-50"
            >
              {busy === r.key ? 'Generating…' : 'Download Excel'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PosSettingsView = () => {
  const [settings, setSettings] = useState({});
  useEffect(() => { posSettingsAPI.get().then((r) => setSettings(r.data?.data || {})); }, []);
  const save = async (key, value) => {
    await posSettingsAPI.update({ key, value: String(value) });
    setSettings({ ...settings, [key]: String(value) });
    toast.success('Saved');
  };
  return (
    <div className="p-2 space-y-6 max-w-lg">
      <label className="flex items-center gap-3 text-gold-400">
        <input type="checkbox" checked={settings.pos_sellers_can_discount === 'true'} onChange={(e) => save('pos_sellers_can_discount', e.target.checked)} />
        Allow sellers to apply discounts
      </label>
      <div>
        <label className="text-gold-500/50 text-xs">Low stock alert email</label>
        <input value={settings.pos_low_stock_email || ''} onBlur={(e) => save('pos_low_stock_email', e.target.value)} onChange={(e) => setSettings({ ...settings, pos_low_stock_email: e.target.value })} className="w-full mt-1 bg-navy-950 border border-gold-500/20 rounded p-2 text-white" />
      </div>
      <div>
        <label className="text-gold-500/50 text-xs">Default low stock threshold</label>
        <input type="number" value={settings.pos_low_stock_threshold || '5'} onBlur={(e) => save('pos_low_stock_threshold', e.target.value)} onChange={(e) => setSettings({ ...settings, pos_low_stock_threshold: e.target.value })} className="w-full mt-1 bg-navy-950 border border-gold-500/20 rounded p-2 text-white" />
      </div>
    </div>
  );
};

export const AuditLogView = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => { posAdminAPI.auditLog().then((r) => setLogs(r.data?.data?.logs || [])); }, []);
  return (
    <div className="p-2 overflow-x-auto text-sm">
      <table className="w-full">
        <thead className="text-gold-500/50 text-xs"><tr><th className="p-2">Time</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-gold-500/10">
              <td className="p-2">{format(new Date(l.created_at), 'dd MMM yyyy HH:mm')}</td>
              <td>{l.action}</td>
              <td>{l.entity}</td>
              <td className="text-gold-500/50 text-xs max-w-xs truncate">{JSON.stringify(l.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
