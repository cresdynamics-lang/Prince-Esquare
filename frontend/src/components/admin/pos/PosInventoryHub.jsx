// NEW — Unified POS & Inventory control center (single dashboard entry)
import { useState } from 'react';
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

const TABS = [
  { id: 'pos-terminal', label: 'POS Terminal' },
  { id: 'overview', label: 'Overview' },
  { id: 'finance', label: 'Sales & Finance' },
  { id: 'pos-sales', label: 'POS Sales' },
  { id: 'online-sales', label: 'Online Sales' },
  { id: 'stock', label: 'Stock Management' },
  { id: 'movements', label: 'Movements' },
  { id: 'daily-sheet', label: 'Stock Summary' },
  { id: 'stock-take', label: 'Stock Take' },
  { id: 'shifts', label: 'Shifts' },
  { id: 'sellers', label: 'Sellers' },
  { id: 'reports', label: 'Reports' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'settings', label: 'Settings' },
];

const resolveInitialTab = (fallback) => {
  try {
    const stored = sessionStorage.getItem('pos-hub-tab');
    if (stored) {
      sessionStorage.removeItem('pos-hub-tab');
      return stored;
    }
  } catch { /* ignore */ }
  return fallback;
};

const PosInventoryHub = ({ initialTab = 'overview' }) => {
  const isSeller = useAuthStore((s) => s.isSeller);
  const [tab, setTab] = useState(() => (isSeller ? 'pos-terminal' : resolveInitialTab(initialTab)));
  const sellerTabs = ['pos-terminal', 'pos-sales', 'online-sales'];
  const visibleTabs = isSeller ? TABS.filter((t) => sellerTabs.includes(t.id)) : TABS;

  const renderTab = () => {
    switch (tab) {
      case 'pos-terminal':
        if (isSeller) return <PosTerminalView embedded />;
        return <AdminPosTerminalInfo onNavigateTab={setTab} />;
      case 'overview': return <PosOverviewView />;
      case 'finance': return <FinanceOverview />;
      case 'pos-sales': return <PosSalesView channel="POS" readOnly={isSeller} />;
      case 'online-sales': return <PosSalesView channel="ONLINE" readOnly={isSeller} />;
      case 'stock': return <StockOverviewView />;
      case 'movements': return <StockMovementsView />;
      case 'daily-sheet': return <DailyStockSheetView />;
      case 'stock-take': return <StockTakeView />;
      case 'shifts': return <ShiftsView />;
      case 'sellers': return <SellersView />;
      case 'reports': return <PosReportsView />;
      case 'audit': return <AuditLogView />;
      case 'settings': return <PosSettingsView />;
      default: return <PosOverviewView />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gold-500/10 custom-scrollbar">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              tab === t.id
                ? 'bg-gold-600 text-navy-950 border-gold-600'
                : 'bg-navy-900/50 text-gold-500/60 border-gold-500/10 hover:border-gold-500/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">{renderTab()}</div>
    </div>
  );
};

export default PosInventoryHub;
