import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import PosTerminalView from '../../pos/PosTerminalView';
import { FinanceOverview } from '../../../pages/AdminDashboard';
import {
  AdminPosTerminalInfo,
  PosOverviewView,
  PosSalesView,
  StockOverviewView,
  StockMovementsView,
  DailyStockSheetView,
  StockTakeView,
  ShiftsView,
  SellersView,
  PosReportsView,
  PosSettingsView,
  AuditLogView,
} from './PosAdminViews';

const SELLER_MODULE_IDS = new Set(['pos-terminal', 'pos-sales', 'online-sales']);

const MODULE_GROUPS = [
  {
    label: 'Point of Sale',
    modules: [
      { id: 'pos-terminal', label: 'POS Terminal', description: 'Checkout, shifts, and in-store sales' },
    ],
  },
  {
    label: 'Sales & Reports',
    modules: [
      { id: 'overview', label: 'Overview', description: 'KPIs, revenue charts, and low-stock alerts' },
      { id: 'finance', label: 'Sales & Finance', description: 'Combined online and POS revenue analytics' },
      { id: 'pos-sales', label: 'POS Sales', description: 'In-store receipts, voids, and returns' },
      { id: 'online-sales', label: 'Online Sales', description: 'Website orders synced to POS' },
      { id: 'reports', label: 'Reports', description: 'Download sales, stock, and end-of-day reports' },
    ],
  },
  {
    label: 'Inventory',
    modules: [
      { id: 'stock', label: 'Stock Management', description: 'Catalog pieces, publish, and store ↔ shop moves' },
      { id: 'daily-sheet', label: 'Stock Summary', description: 'Daily sheet with per-category piece detail' },
      { id: 'movements', label: 'Movements', description: 'Full history of stock in, out, sales, and adjustments' },
      { id: 'stock-take', label: 'Stock Take', description: 'Physical counts for shop floor and warehouse' },
    ],
  },
  {
    label: 'Operations',
    modules: [
      { id: 'shifts', label: 'Shifts', description: 'Seller clock-in history and shift totals' },
      { id: 'sellers', label: 'Sellers', description: 'Create and manage POS seller accounts' },
      { id: 'audit', label: 'Audit Log', description: 'Track admin and inventory actions' },
    ],
  },
  {
    label: 'System',
    modules: [
      { id: 'settings', label: 'Settings', description: 'POS discounts, low-stock email, and thresholds' },
    ],
  },
];

const ALL_MODULES = MODULE_GROUPS.flatMap((group) => group.modules);
const MODULE_BY_ID = Object.fromEntries(ALL_MODULES.map((m) => [m.id, m]));

const consumeStoredModule = () => {
  try {
    const stored = sessionStorage.getItem('pos-hub-tab');
    if (stored) {
      sessionStorage.removeItem('pos-hub-tab');
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const PosInventoryHub = ({ initialTab = 'overview' }) => {
  const isSeller = useAuthStore((s) => s.isSeller);
  const isAdmin = useAuthStore((s) => s.isAdmin || s.user?.role === 'admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminTestPos, setAdminTestPos] = useState(false);

  const visibleGroups = useMemo(
    () =>
      isSeller
        ? MODULE_GROUPS.map((group) => ({
            ...group,
            modules: group.modules.filter((m) => SELLER_MODULE_IDS.has(m.id)),
          })).filter((group) => group.modules.length > 0)
        : MODULE_GROUPS,
    [isSeller]
  );

  const visibleModuleIds = useMemo(
    () => new Set(visibleGroups.flatMap((g) => g.modules.map((m) => m.id))),
    [visibleGroups]
  );

  const defaultModule = isSeller ? 'pos-terminal' : initialTab || 'overview';

  const resolveModule = (candidate) => {
    if (candidate && visibleModuleIds.has(candidate)) return candidate;
    return visibleModuleIds.has(defaultModule) ? defaultModule : [...visibleModuleIds][0];
  };

  const module = resolveModule(searchParams.get('module') || consumeStoredModule());

  useEffect(() => {
    if (searchParams.get('module') !== module) {
      setSearchParams({ module }, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setModule = (id) => {
    const next = resolveModule(id);
    setSearchParams({ module: next }, { replace: true });
    if (next !== 'pos-terminal') setAdminTestPos(false);
  };

  const current = MODULE_BY_ID[module] || MODULE_BY_ID[defaultModule];

  const renderModule = () => {
    switch (module) {
      case 'pos-terminal':
        if (isSeller || adminTestPos) return <PosTerminalView embedded />;
        return <AdminPosTerminalInfo onNavigateTab={setModule} onEnableTestPos={() => setAdminTestPos(true)} />;
      case 'overview':
        return <PosOverviewView />;
      case 'finance':
        return <FinanceOverview />;
      case 'pos-sales':
        return <PosSalesView channel="POS" readOnly={isSeller} />;
      case 'online-sales':
        return <PosSalesView channel="ONLINE" readOnly={isSeller} />;
      case 'stock':
        return <StockOverviewView />;
      case 'movements':
        return <StockMovementsView />;
      case 'daily-sheet':
        return <DailyStockSheetView />;
      case 'stock-take':
        return <StockTakeView />;
      case 'shifts':
        return <ShiftsView />;
      case 'sellers':
        return <SellersView />;
      case 'reports':
        return <PosReportsView />;
      case 'audit':
        return <AuditLogView />;
      case 'settings':
        return <PosSettingsView />;
      default:
        return <PosOverviewView />;
    }
  };

  return (
    <div className="space-y-6">
      {adminTestPos && isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-xs text-amber-200">
            Admin test mode — POS checkout is live. Sales deduct real shop stock.
          </p>
          <button
            type="button"
            onClick={() => setAdminTestPos(false)}
            className="text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:text-amber-100"
          >
            Exit test mode
          </button>
        </div>
      )}

      <div className="bg-navy-900/50 border border-gold-500/10 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500/40">
              POS &amp; Inventory
            </p>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-gold-100 truncate">
              {current?.label}
            </h2>
            <p className="text-xs text-gold-500/50 max-w-xl">{current?.description}</p>
          </div>

          <label className="relative w-full lg:w-72 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold-500/40 block mb-1.5">
              Go to module
            </span>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full appearance-none bg-navy-950 border border-gold-500/20 rounded-xl px-4 py-3 pr-10 text-sm text-gold-100 outline-none focus:border-gold-500/50 transition-colors cursor-pointer"
            >
              {visibleGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 bottom-3 text-gold-500/50 pointer-events-none"
            />
          </label>
        </div>
      </div>

      <div className="min-h-[400px]">{renderModule()}</div>
    </div>
  );
};

export default PosInventoryHub;
