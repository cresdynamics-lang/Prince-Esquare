import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowUpRight, CreditCard, Globe, Package,
} from 'lucide-react';
import {
  adminAnalyticsAPI,
  adminOrderAPI,
  adminProductAPI,
} from '../../services/api';

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

const isInFinancePeriod = (createdAt, periodStart) => new Date(createdAt) >= periodStart;

/** Revenue chart — same window as KPI cards (today / last 7 days / this month). */
const buildFinanceChart = (onlineOrders, period) => {
  const entries = [
    ...onlineOrders.map((o) => ({ created_at: o.created_at, total_amount: o.total_amount })),
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

  const periodToRange = (p) => {
    const from = getPeriodStart(p);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(true);
  const periodRef = useRef(period);
  const initialLoadDone = useRef(false);

  const fetchPeriodSales = useCallback(async (p) => {
    setLoadingPeriod(true);
    try {
      const { from, to } = periodToRange(p);
      const [orderRes] = await Promise.all([
        adminOrderAPI.getAll({ from, to, include_items: '1' }).catch(() => ({ data: { data: [] } })),
      ]);
      setOrders(orderRes.data.data || []);
    } catch (error) {
      console.error('Error loading period sales:', error);
    } finally {
      setLoadingPeriod(false);
    }
  }, []);

  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingKpis(true);
      try {
        const [statsRes, productRes] = await Promise.all([
          adminAnalyticsAPI.getStats().catch(() => ({ data: { data: {} } })),
          adminProductAPI.getAll({ lite: 1 }).catch(() => ({ data: { data: [] } })),
        ]);
        if (cancelled) return;
        setStats(statsRes.data.data || {});
        setProducts(productRes.data.data || []);
      } catch (error) {
        console.error('Error loading finance KPIs:', error);
      } finally {
        if (!cancelled) setLoadingKpis(false);
      }
      if (!cancelled) {
        await fetchPeriodSales(period);
        initialLoadDone.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [fetchPeriodSales]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    fetchPeriodSales(period);
  }, [period, fetchPeriodSales]);

  const periodStart = getPeriodStart(period);
  const periodOrders = orders.filter(
    (order) => isPaidOnlineOrder(order) && isInFinancePeriod(order.created_at, periodStart)
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

  const soldProducts = Array.from(soldMap.values()).sort((a, b) => b.quantity - a.quantity);
  const onlineRevenue = periodOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const periodRevenue = onlineRevenue;
  const periodProfit = soldProducts.length
    ? soldProducts.reduce((sum, item) => sum + item.profit, 0)
    : periodRevenue * 0.35;

  const chartData = buildFinanceChart(periodOrders, period);
  const maxChart = Math.max(...chartData.map((item) => item.total), 1);

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
          <span className="text-[10px] font-black  tracking-[0.3em] text-gold-500/40">Online Store</span>
          <h3 className="text-3xl font-serif font-bold text-gold-100 mt-2">Finance</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black   border transition-all ${
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
          { label: `${getPeriodLabel(period)} Revenue`, value: formatMoney(periodRevenue), detail: `${periodOrders.length} online orders`, icon: CreditCard },
          { label: `${getPeriodLabel(period)} Profit`, value: formatMoney(periodProfit), detail: 'Uses cost price when available', icon: ArrowUpRight },
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
              <span className="text-[10px] text-green-400 font-black  ">Live</span>
            </div>
            <p className="text-[10px]  tracking-[0.2em] text-gold-500/40 font-black">{card.label}</p>
            <h4 className="text-2xl font-serif font-bold text-gold-100 mt-2">{card.value}</h4>
            <p className="text-xs text-gold-500/40 mt-2">{card.detail}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-navy-900/40 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-serif font-bold text-xl text-gold-100">Revenue Graph</h4>
            <span className="text-[10px]   text-gold-500/40">{getPeriodLabel(period)}</span>
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
                <div className="text-[10px] font-black   text-gold-500/40 text-center">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceOverview;
