import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowUpRight, AlertCircle, CreditCard, Globe, Package, Store, X,
} from 'lucide-react';
import {
  adminAnalyticsAPI,
  adminOrderAPI,
  adminProductAPI,
  posAPI,
  inventoryAPI,
} from '../../services/api';
import { resolveDisplayImageUrl } from '../../utils/cloudinary';
import { adminToast } from '../../lib/adminToast';

const formatMoney = (value) => `KSh ${Math.round(Number(value) || 0).toLocaleString()}`;

const getPeriodStart = (period) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'daily') return start;
  if (period === 'weekly') {
    start.setDate(start.getDate() - 6);
    return start;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getPeriodLabel = (period) => {
  if (period === 'daily') return 'Today';
  if (period === 'weekly') return 'Last 7 days';
  return 'This month';
};

const isPaidOnlineOrder = (order) =>
  order.status !== 'cancelled' && order.payment_status === 'paid';

const isActivePosSale = (sale) => !sale.is_voided;

const isInFinancePeriod = (createdAt, periodStart) => new Date(createdAt) >= periodStart;

/** Revenue chart — same window as KPI cards (today / last 7 days / this month). */
const buildFinanceChart = (onlineOrders, posSales, period) => {
  const entries = [
    ...onlineOrders.map((o) => ({ created_at: o.created_at, total_amount: o.total_amount })),
    ...posSales.map((s) => ({ created_at: s.created_at, total_amount: s.total_amount })),
  ];

  if (period === 'daily') {
    const total = entries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
    return [{ label: 'Today', total }];
  }

  if (period === 'weekly') {
    const buckets = new Map();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.set(d.toLocaleDateString(undefined, { weekday: 'short' }), 0);
    }
    entries.forEach((e) => {
      const label = new Date(e.created_at).toLocaleDateString(undefined, { weekday: 'short' });
      if (buckets.has(label)) {
        buckets.set(label, buckets.get(label) + Number(e.total_amount || 0));
      }
    });
    return Array.from(buckets, ([label, total]) => ({ label, total }));
  }

  const buckets = new Map();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let d = new Date(monthStart); d <= now; d.setDate(d.getDate() + 1)) {
    buckets.set(String(d.getDate()), 0);
  }
  entries.forEach((e) => {
    const d = new Date(e.created_at);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const label = String(d.getDate());
      if (buckets.has(label)) {
        buckets.set(label, buckets.get(label) + Number(e.total_amount || 0));
      }
    }
  });
  return Array.from(buckets, ([label, total]) => ({ label, total }));
};

const FinanceOverview = () => {
  const [period, setPeriod] = useState('daily');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, orders: 0 });
  const [posSales, setPosSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [dailyStockRows, setDailyStockRows] = useState([]);
  const [isLowStockOpen, setIsLowStockOpen] = useState(false);
  const [savingStockId, setSavingStockId] = useState(null);

  const stockKey = (product, variant = null) => variant
    ? `${product.id}:variant:${variant.id || `${variant.color}-${variant.size}`}`
    : `${product.id}:total`;

  const getVariantRows = (product) => Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.color || variant.size || variant.id)
    : [];

  const periodToRange = (p) => {
    const from = getPeriodStart(p);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const periodRef = useRef(period);
  const initialLoadDone = useRef(false);

  const applyProductDrafts = useCallback((fetchedProducts) => {
    const drafts = {};
    fetchedProducts.forEach((product) => {
      drafts[stockKey(product)] = product.stock_quantity ?? 0;
      getVariantRows(product).forEach((variant) => {
        drafts[stockKey(product, variant)] = variant.stock ?? variant.stock_quantity ?? 0;
      });
    });
    setStockDrafts(drafts);
  }, []);

  const fetchPeriodSales = useCallback(async (p) => {
    setLoadingPeriod(true);
    try {
      const { from, to } = periodToRange(p);
      const [orderRes, posRes] = await Promise.all([
        adminOrderAPI.getAll({ from, to, include_items: '1' }).catch(() => ({ data: { data: [] } })),
        posAPI.listSales({ from, to, limit: 150 }).catch(() => ({ data: { data: { sales: [] } } })),
      ]);
      setOrders(orderRes.data.data || []);
      setPosSales(posRes.data?.data?.sales || []);
    } catch (error) {
      console.error('Error loading period sales:', error);
    } finally {
      setLoadingPeriod(false);
    }
  }, []);

  const fetchInventoryData = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const [productRes, sheetRes] = await Promise.all([
        adminProductAPI.getAll({ lite: 1 }).catch(() => ({ data: { data: [] } })),
        inventoryAPI.dailySheet(new Date().toISOString().slice(0, 10)).catch(() => ({ data: { data: [] } })),
      ]);
      const fetchedProducts = productRes.data.data || [];
      setProducts(fetchedProducts);
      setDailyStockRows(sheetRes.data?.data || []);
      applyProductDrafts(fetchedProducts);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoadingInventory(false);
    }
  }, [applyProductDrafts]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPeriodSales(periodRef.current), fetchInventoryData()]);
  }, [fetchPeriodSales, fetchInventoryData]);

  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingKpis(true);
      try {
        const [statsRes, topRes] = await Promise.all([
          adminAnalyticsAPI.getStats().catch(() => ({ data: { data: {} } })),
          adminAnalyticsAPI.getTopProducts().catch(() => ({ data: { data: [] } })),
        ]);
        if (cancelled) return;
        setStats(statsRes.data.data || {});
        setTopProducts(topRes.data.data || []);
      } catch (error) {
        console.error('Error loading finance KPIs:', error);
      } finally {
        if (!cancelled) setLoadingKpis(false);
      }
      if (!cancelled) {
        await fetchPeriodSales(period);
        fetchInventoryData();
        initialLoadDone.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [fetchPeriodSales, fetchInventoryData]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    fetchPeriodSales(period);
  }, [period, fetchPeriodSales]);

  const periodStart = getPeriodStart(period);
  const periodOrders = orders.filter(
    (order) => isPaidOnlineOrder(order) && isInFinancePeriod(order.created_at, periodStart)
  );
  const periodPosSales = posSales.filter(
    (sale) => isActivePosSale(sale) && isInFinancePeriod(sale.created_at, periodStart)
  );

  const productCost = new Map(products.map((p) => [p.id, Number(p.cost_price || 0)]));
  const productMeta = new Map(products.map((p) => [p.id, p]));
  const periodOrderIds = new Set(periodOrders.map((order) => order.id));
  const soldMap = new Map();

  const addSoldLine = (productId, name, unitPrice, quantity) => {
    const revenue = unitPrice * quantity;
    const storedCost = productId ? productCost.get(productId) : null;
    const unitCost = storedCost > 0 ? storedCost : unitPrice * 0.65;
    const profit = revenue - unitCost * quantity;
    const key = productId || name;
    const existing = soldMap.get(key) || {
      id: productId || key,
      name: name || 'Product',
      quantity: 0,
      revenue: 0,
      profit: 0,
    };
    existing.quantity += quantity;
    existing.revenue += revenue;
    existing.profit += profit;
    soldMap.set(key, existing);
  };

  orders
    .filter((order) => periodOrderIds.has(order.id) && isPaidOnlineOrder(order))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        addSoldLine(
          item.product_id,
          item.name || productMeta.get(item.product_id)?.name,
          Number(item.price || 0),
          Number(item.quantity || 0)
        );
      });
    });

  periodPosSales.forEach((sale) => {
    (sale.items || []).forEach((item) => {
      addSoldLine(
        item.ecommerce_product_id || null,
        item.line_name || item.product?.name || item.product_name,
        Number(item.unit_price || 0),
        Number(item.qty || 0)
      );
    });
  });

  const soldProducts = Array.from(soldMap.values()).sort((a, b) => b.quantity - a.quantity);
  const onlineRevenue = periodOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const posRevenue = periodPosSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const periodRevenue = onlineRevenue + posRevenue;
  const periodProfit = soldProducts.length
    ? soldProducts.reduce((sum, item) => sum + item.profit, 0)
    : periodRevenue * 0.35;
  const getProductStockTotal = (product) => {
    const variants = getVariantRows(product);
    if (!variants.length) return Number(product.stock_quantity || 0);
    return variants.reduce((sum, variant) => sum + Number(variant.stock ?? variant.stock_quantity ?? 0), 0);
  };

  const inventoryRows = products.flatMap((product) => {
    const variants = getVariantRows(product);
    if (!variants.length) {
      return [{
        product,
        variant: null,
        key: stockKey(product),
        name: product.name,
        size: 'Standard',
        color: null,
        stock: Number(product.stock_quantity || 0),
        stockId: null,
      }];
    }

    return variants.map((variant) => ({
      product,
      variant,
      key: stockKey(product, variant),
      name: product.name,
      size: variant.size || 'Standard',
      color: variant.color || null,
      stock: Number(variant.stock ?? variant.stock_quantity ?? 0),
      stockId: variant.sku || variant.stock_id || null,
    }));
  });

  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price || 0) * getProductStockTotal(p), 0);
  const totalStock = products.reduce((sum, p) => sum + getProductStockTotal(p), 0);
  const shopOpeningTotal = dailyStockRows.reduce((sum, r) => sum + Number(r.opening_qty || 0), 0);
  const shopClosingTotal = dailyStockRows.reduce((sum, r) => sum + Number(r.closing_qty || 0), 0);
  const warehouseTotal = dailyStockRows.reduce((sum, r) => sum + Number(r.store_qty || 0), 0);
  const lowStockRows = inventoryRows.filter((row) => row.stock <= 5).sort((a, b) => a.stock - b.stock);
  const chartData = buildFinanceChart(periodOrders, periodPosSales, period);
  const maxChart = Math.max(...chartData.map((item) => item.total), 1);

  const handleStockSave = async (product) => {
    setSavingStockId(product.id);
    try {
      const variants = getVariantRows(product);
      const nextVariants = variants.map((variant) => ({
        ...variant,
        stock: Number(stockDrafts[stockKey(product, variant)]) || 0,
        price_override: variant.price_override ?? variant.price_modifier ?? 0,
        sku: variant.sku || variant.stock_id || null,
        stock_id: variant.sku || variant.stock_id || null,
      }));
      const nextProductStock = variants.length
        ? nextVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
        : Number(stockDrafts[stockKey(product)]) || 0;

      await adminProductAPI.update(product.id, {
        ...product,
        stock_quantity: nextProductStock,
        images: Array.isArray(product.images) ? product.images : [],
        variants: variants.length ? nextVariants : [],
      });
        await refreshAll();
        setStockModalProduct(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      adminToast.error('Could not update stock.');
    } finally {
      setSavingStockId(null);
    }
  };

  const loading = loadingKpis && loadingPeriod;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500/40">Shop + online — one view</span>
          <h3 className="text-3xl font-serif font-bold text-gold-100 mt-2">Finance</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                period === p
                  ? 'bg-gold-600 text-navy-950 border-gold-600'
                  : 'bg-navy-900/50 text-gold-500/70 border-gold-500/10 hover:border-gold-500/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { label: `${getPeriodLabel(period)} Revenue`, value: formatMoney(periodRevenue), detail: `${periodOrders.length} online · ${periodPosSales.length} POS`, icon: CreditCard },
          { label: 'POS Revenue', value: formatMoney(posRevenue), detail: `${periodPosSales.length} in-store sales`, icon: Store },
          { label: 'Online Revenue', value: formatMoney(onlineRevenue), detail: `${periodOrders.length} website orders`, icon: Globe },
          { label: `${getPeriodLabel(period)} Profit`, value: formatMoney(periodProfit), detail: 'Uses cost price when available', icon: ArrowUpRight },
          { label: 'Inventory Value', value: formatMoney(inventoryValue), detail: `${totalStock.toLocaleString()} pieces in stock`, icon: Package },
          { label: 'Shop Opening (today)', value: shopOpeningTotal.toLocaleString(), detail: 'Total shop floor at start of day', icon: Package },
          { label: 'Shop Closing (today)', value: shopClosingTotal.toLocaleString(), detail: `Warehouse backup: ${warehouseTotal.toLocaleString()} units`, icon: Package },
          { label: 'Low Stock Alerts', value: lowStockRows.length, detail: 'Sizes at 5 units or less', icon: AlertCircle, action: () => setIsLowStockOpen(true) },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.action}
            className="text-left bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm transition-all hover:border-gold-500/40 disabled:hover:border-gold-500/10"
            disabled={!card.action}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 rounded-xl bg-gold-600/10 border border-gold-500/10 flex items-center justify-center text-gold-500">
                <card.icon size={20} />
              </div>
              <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">Live</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500/40 font-black">{card.label}</p>
            <h4 className="text-2xl font-serif font-bold text-gold-100 mt-2">{card.value}</h4>
            <p className="text-xs text-gold-500/40 mt-2">{card.detail}</p>
          </button>
        ))}
      </div>

      {dailyStockRows.length > 0 && (
        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-gold-500/10 flex items-center justify-between">
            <h4 className="font-serif font-bold text-xl text-gold-100">Opening &amp; Closing Stock (today)</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">By category — from POS inventory</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-800/50 text-gold-500/50 text-xs uppercase">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Opening</th>
                  <th className="p-3 text-center">Sales</th>
                  <th className="p-3 text-center">Stock In</th>
                  <th className="p-3 text-center">Stock Out</th>
                  <th className="p-3 text-center">Closing</th>
                  <th className="p-3 text-center">Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {dailyStockRows.map((row) => (
                  <tr key={row.name || row.category} className="border-t border-gold-500/10">
                    <td className="p-3 text-gold-100">{row.name || row.category}</td>
                    <td className="p-3 text-center tabular-nums">{row.opening_qty ?? 0}</td>
                    <td className="p-3 text-center tabular-nums text-red-400/90">{row.sales_qty ?? 0}</td>
                    <td className="p-3 text-center tabular-nums text-green-400/90">{row.stock_in_qty ?? 0}</td>
                    <td className="p-3 text-center tabular-nums text-orange-400/90">{row.stock_out_qty ?? 0}</td>
                    <td className="p-3 text-center tabular-nums font-medium text-gold-200">{row.closing_qty ?? 0}</td>
                    <td className="p-3 text-center tabular-nums text-violet-300/90">{row.store_qty ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-serif font-bold text-xl text-gold-100">Revenue Graph</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">{getPeriodLabel(period)}</span>
          </div>
          <div className="h-72 flex items-end gap-3">
            {chartData.map((item) => (
              <div key={item.label} className="flex-1 h-full flex flex-col justify-end gap-3">
                <div className="text-[10px] text-gold-500/50 text-center">{formatMoney(item.total).replace('KSh ', '')}</div>
                <div className="h-56 flex items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-gold-700 to-gold-400 min-h-[8px]"
                    style={{ height: `${Math.max(5, (item.total / maxChart) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gold-500/40 text-center">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm">
          <h4 className="font-serif font-bold text-xl text-gold-100 mb-6">Top Movers</h4>
          <div className="space-y-4">
            {(soldProducts.length ? soldProducts : topProducts).slice(0, 6).map((item, index) => (
              <div key={item.id || item.name} className="flex items-center justify-between p-4 rounded-xl bg-navy-950/50 border border-gold-500/5">
                <div>
                  <p className="text-sm font-bold text-gold-100">{item.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold-500/40">Rank #{index + 1}</p>
                </div>
                <span className="text-gold-500 font-black">{item.quantity || item.sales || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-gold-500/10 flex items-center justify-between">
            <h4 className="font-serif font-bold text-xl text-gold-100">Products Sold - {getPeriodLabel(period)}</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">{soldProducts.length} products</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-navy-800/50">
                <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Sold</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/5">
                {soldProducts.length ? soldProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-navy-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gold-100">{item.name}</td>
                    <td className="px-6 py-4 text-gold-500 font-black">{item.quantity}</td>
                    <td className="px-6 py-4 text-gold-100">{formatMoney(item.revenue)}</td>
                    <td className="px-6 py-4 text-green-400">{formatMoney(item.profit)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gold-500/40 text-sm">No sold products in this period yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-gold-500/10 flex items-center justify-between">
            <h4 className="font-serif font-bold text-xl text-gold-100">Stock Manager</h4>
            <span className="text-[10px] uppercase tracking-widest text-gold-500/40">Website stock · {totalStock.toLocaleString()} pieces</span>
          </div>
          <div className="max-h-[520px] overflow-y-auto custom-scrollbar divide-y divide-gold-500/5">
            {products.slice(0, 18).map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => setStockModalProduct(product)}
                className="w-full p-5 hover:bg-navy-800/20 transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                      {product.thumbnail ? (
                        <img src={resolveDisplayImageUrl(product.thumbnail)} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold-500/30">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                    <p className="text-sm font-bold text-gold-100 uppercase">{product.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/40">
                      {product.category_name || 'Uncategorized'} - {formatMoney(product.price)} - Total stock {getProductStockTotal(product)}
                    </p>
                  </div>
                </div>
                  <span className="px-4 py-2 border border-gold-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold-500">
                    Manage
                  </span>
                  </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {stockModalProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-gold-500/20 rounded-3xl p-6 w-full max-w-3xl max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                  {stockModalProduct.thumbnail ? (
                    <img src={resolveDisplayImageUrl(stockModalProduct.thumbnail)} alt={stockModalProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold-500/30">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xl font-serif font-bold text-gold-100 uppercase">{stockModalProduct.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold-500/40 mt-1">
                    {stockModalProduct.category_name || 'Uncategorized'} - {formatMoney(stockModalProduct.price)}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setStockModalProduct(null)} className="text-gold-500/40 hover:text-gold-500">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3">
              {getVariantRows(stockModalProduct).length > 0 ? getVariantRows(stockModalProduct).map((variant) => (
                <div key={stockKey(stockModalProduct, variant)} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-navy-950/60 border border-gold-500/5 rounded-2xl p-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gold-100">
                      Size {variant.size || 'Standard'}{variant.color ? ` - ${variant.color}` : ''}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-gold-500/30 mt-1">
                      SKU: {variant.sku || variant.stock_id || 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStockDrafts({
                        ...stockDrafts,
                        [stockKey(stockModalProduct, variant)]: Math.max(0, Number(stockDrafts[stockKey(stockModalProduct, variant)] ?? 0) - 1),
                      })}
                      className="w-10 h-10 rounded-xl bg-navy-800 border border-gold-500/10 text-gold-500 font-black"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={stockDrafts[stockKey(stockModalProduct, variant)] ?? 0}
                      onChange={(e) => setStockDrafts({ ...stockDrafts, [stockKey(stockModalProduct, variant)]: e.target.value })}
                      className="w-24 bg-navy-900 border border-gold-500/10 rounded-xl py-3 px-3 text-gold-100 text-sm outline-none focus:border-gold-500/40 font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setStockDrafts({
                        ...stockDrafts,
                        [stockKey(stockModalProduct, variant)]: Number(stockDrafts[stockKey(stockModalProduct, variant)] ?? 0) + 1,
                      })}
                      className="w-10 h-10 rounded-xl bg-navy-800 border border-gold-500/10 text-gold-500 font-black"
                    >
                      +
                    </button>
                  </div>
                </div>
              )) : (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center bg-navy-950/60 border border-gold-500/5 rounded-2xl p-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gold-100">Product total stock</p>
                    <p className="text-[9px] uppercase tracking-widest text-gold-500/30 mt-1">No size variants saved</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={stockDrafts[stockKey(stockModalProduct)] ?? 0}
                    onChange={(e) => setStockDrafts({ ...stockDrafts, [stockKey(stockModalProduct)]: e.target.value })}
                    className="w-28 bg-navy-900 border border-gold-500/10 rounded-xl py-3 px-3 text-gold-100 text-sm outline-none focus:border-gold-500/40 font-bold text-center"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gold-500/10">
              <button type="button" onClick={() => setStockModalProduct(null)} className="px-6 py-3 rounded-xl bg-navy-800 text-gold-500/70 text-[10px] font-black uppercase tracking-widest">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStockSave(stockModalProduct)}
                disabled={savingStockId === stockModalProduct.id}
                className="px-6 py-3 rounded-xl bg-gold-600 text-navy-950 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {savingStockId === stockModalProduct.id ? 'Updating' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLowStockOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-gold-500/20 rounded-3xl p-6 w-full max-w-3xl max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-serif font-bold text-gold-100 uppercase tracking-widest">Low Stock Sizes</h4>
              <button type="button" onClick={() => setIsLowStockOpen(false)} className="text-gold-500/40 hover:text-gold-500">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-3">
              {lowStockRows.length ? lowStockRows.map((row) => (
                <button
                  type="button"
                  key={row.key}
                  onClick={() => {
                    setIsLowStockOpen(false);
                    setStockModalProduct(row.product);
                  }}
                  className="w-full flex items-center justify-between gap-4 bg-navy-950/60 border border-gold-500/5 rounded-2xl p-4 text-left hover:border-gold-500/30"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                      {resolveDisplayImageUrl(row.product.thumbnail) && (
                        <img src={resolveDisplayImageUrl(row.product.thumbnail)} alt={row.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gold-100 uppercase">{row.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gold-500/40">
                        Size {row.size}{row.color ? ` - ${row.color}` : ''} - {row.stockId || 'No stock ID'}
                      </p>
                    </div>
                  </div>
                  <span className="text-red-400 text-sm font-black">{row.stock} left</span>
                </button>
              )) : (
                <div className="py-12 text-center text-gold-500/40 text-sm">No low stock sizes right now.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceOverview;
