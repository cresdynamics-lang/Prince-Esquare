import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Eye,
  Zap,
  AlertCircle,
} from 'lucide-react';

const GOLD = '#d4a574';
const GOLD_LIGHT = '#e8c896';
const PIE_COLORS = ['#d4a574', '#c4956a', '#a67c52', '#8b6914', '#6b5344', '#4a3728', '#e8c896', '#f0d9b5'];

const fmtKsh = (n) => `KSh ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-navy-900/40 border border-gold-500/10 rounded-lg overflow-hidden ${className}`}>
      <div className="px-2.5 py-1.5 border-b border-gold-500/10 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gold-100">{title}</h3>
        {subtitle && (
          <span className="text-[8px] font-medium text-gold-500/40 uppercase tracking-wide truncate">{subtitle}</span>
        )}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-950/95 border border-gold-500/25 rounded-md px-2 py-1.5 shadow-lg text-[10px]">
      <p className="uppercase tracking-wider text-gold-500/60 mb-0.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-bold text-gold-100">
          {p.name}:{' '}
          {typeof p.value === 'number' && (p.dataKey === 'revenue' || p.dataKey === 'total')
            ? fmtKsh(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent = 'amber' }) {
  const accents = {
    amber: 'border-amber-500/20 bg-amber-500/5',
    rose: 'border-rose-500/20 bg-rose-500/5',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-2.5 py-2 ${accents[accent]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-gold-500/50 truncate">{label}</p>
          <p className="text-base font-serif font-bold text-gold-50 tabular-nums leading-tight mt-0.5">{value}</p>
        </div>
        <div className="p-1.5 rounded-md bg-navy-950/50 border border-gold-500/10 shrink-0">
          <Icon size={12} className="text-gold-500" />
        </div>
      </div>
    </motion.div>
  );
}

function ProductIntelList({ items, metricLabel, metricKey, emptyText, icon: Icon }) {
  const max = Math.max(...(items.map((i) => i[metricKey]) || [1]), 1);
  return (
    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
      {items.length === 0 ? (
        <p className="text-center py-4 text-[9px] text-gold-500/35">{emptyText}</p>
      ) : (
        items.map((item, i) => (
          <div key={item.id || item.name || i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded overflow-hidden bg-navy-800 border border-gold-500/10 shrink-0">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold-500/30">
                  <ShoppingBag size={10} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-1 mb-0.5">
                <span className="text-[9px] font-medium text-gold-100 truncate">{item.name}</span>
                <span className="text-[8px] font-bold text-gold-500 shrink-0 flex items-center gap-0.5">
                  <Icon size={9} />
                  {item[metricKey]} {metricLabel}
                </span>
              </div>
              <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item[metricKey] / max) * 100}%` }}
                  transition={{ duration: 0.45, delay: i * 0.03 }}
                  className="h-full bg-gradient-to-r from-gold-700 to-gold-400 rounded-full"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthlySeries(rows) {
  const byMonth = new Map((rows || []).map((r) => [r.month_num, parseFloat(r.total)]));
  return MONTH_LABELS.map((month, i) => ({
    month,
    total: byMonth.get(i + 1) || 0,
  }));
}

export default function AdminDashboardCharts({ data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[180px] gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gold-500" />
        <p className="text-[9px] uppercase tracking-widest text-gold-500/40">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-gold-500/40 text-xs">Could not load dashboard data.</div>
    );
  }

  const { stats, dailySales, weeklySales, salesByCategory, monthlySales, fastMoving, mostViewed, topSold, lowStock } =
    data;
  const monthlyChart = buildMonthlySeries(monthlySales);
  const pieData = (salesByCategory || []).filter((c) => c.value > 0);

  return (
    <div className="space-y-3 pb-2">
      <p className="text-[8px] uppercase tracking-[0.2em] text-gold-500/40">Website orders · live store data</p>

      {/* KPI row — sales + pending only, compact */}
      <div className="grid grid-cols-2 gap-2 max-w-sm">
        <StatCard label="Total Sales" value={stats.totalSales ?? stats.orders ?? 0} icon={ShoppingBag} accent="amber" />
        <StatCard label="Pending Orders" value={stats.pendingOrders ?? 0} icon={Clock} accent="rose" />
      </div>

      {/* Daily + Weekly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <ChartCard title="Daily Sales" subtitle="7 days">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales || []} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Sales" stroke={GOLD} strokeWidth={1.5} fill="url(#dailyGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Weekly Sales" subtitle="6 weeks">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySales || []} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Sales" fill={GOLD} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Monthly + Category */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <ChartCard title="Monthly Sales" subtitle="This year" className="md:col-span-3">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total" name="Sales" fill={GOLD_LIGHT} radius={[2, 2, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="By Category" subtitle="Share" className="md:col-span-2">
          <div className="h-[120px] w-full">
            {pieData.length === 0 ? (
              <p className="flex items-center justify-center h-full text-[9px] text-gold-500/35">No category sales yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="38%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={38}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => fmtKsh(value)}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(212,165,116,0.25)',
                      borderRadius: 8,
                      fontSize: 10,
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={6}
                    formatter={(value) => (
                      <span className="text-[8px] text-gold-200/75 uppercase tracking-wide">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Product intelligence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <ChartCard title="Fast Moving" subtitle="Cart adds · 30d">
          <ProductIntelList
            items={(fastMoving || []).map((p) => ({ ...p, count: p.count }))}
            metricKey="count"
            metricLabel="adds"
            emptyText="No cart activity yet."
            icon={Zap}
          />
        </ChartCard>

        <ChartCard title="Most Viewed" subtitle="Views · 30d">
          <ProductIntelList
            items={(mostViewed || []).map((p) => ({ ...p, count: p.count }))}
            metricKey="count"
            metricLabel="views"
            emptyText="No views tracked yet."
            icon={Eye}
          />
        </ChartCard>

        <ChartCard title="Best Sellers" subtitle="Units sold">
          <ProductIntelList
            items={(topSold || []).map((p) => ({ ...p, count: p.sales }))}
            metricKey="count"
            metricLabel="sold"
            emptyText="No sales yet."
            icon={TrendingUp}
          />
        </ChartCard>

        <ChartCard title="Low Stock" subtitle="Under 10">
          {lowStock?.length === 0 ? (
            <p className="text-center py-4 text-[9px] text-emerald-400/70 flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Well stocked
            </p>
          ) : (
            <div className="space-y-1 max-h-[140px] overflow-y-auto">
              {lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-1 px-1.5 rounded bg-navy-950/40 border border-gold-500/5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded overflow-hidden bg-navy-800 shrink-0">
                      {item.thumbnail && <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-[9px] font-medium text-gold-100 truncate">{item.name}</span>
                  </div>
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      item.stock === 0 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {item.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
