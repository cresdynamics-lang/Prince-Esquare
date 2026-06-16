import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import PosTerminalView from '../pos/PosTerminalView';
import { FinanceOverview } from '../../pages/AdminDashboard';
import { canUsePosTerminal } from '../../utils/staffPermissions';
import { AdminPosTerminalInfo, PosOverviewView, PosSalesView } from './pos/PosAdminViews';

const MODULES = [
  { id: 'revenue', label: 'Revenue', description: 'Sales totals, profit, and opening/closing stock' },
  { id: 'pos-overview', label: 'POS Overview', description: 'In-store KPIs and low-stock alerts' },
  { id: 'pos-sales', label: 'POS Sales', description: 'Receipts, voids, and in-store transactions' },
  { id: 'pos-terminal', label: 'POS Terminal', description: 'Checkout and shift management' },
];

const FinanceHub = ({ forcedModule, readOnly = false }) => {
  const user = useAuthStore((s) => s.user);
  const isSeller = useAuthStore((s) => s.isSeller);
  const isAdmin = useAuthStore((s) => s.isAdmin || user?.role === 'admin');
  const [module, setModule] = useState(forcedModule || 'revenue');
  const [adminTestPos, setAdminTestPos] = useState(false);

  const active = MODULES.find((m) => m.id === module) || MODULES[0];
  const canPos = isSeller || canUsePosTerminal(user, { isSeller });
  const isPosTerminal = module === 'pos-terminal' && (isSeller || canPos || adminTestPos);

  const renderModule = () => {
    switch (module) {
      case 'revenue':
        return <FinanceOverview />;
      case 'pos-overview':
        return <PosOverviewView />;
      case 'pos-sales':
        return <PosSalesView channel="POS" readOnly={readOnly || isSeller} />;
      case 'pos-terminal':
        if (isSeller || canPos || adminTestPos) {
          return <PosTerminalView embedded embeddedLayout="finance" />;
        }
        return (
          <AdminPosTerminalInfo
            onNavigateTab={(id) => setModule(id)}
            onEnableTestPos={() => setAdminTestPos(true)}
          />
        );
      default:
        return <FinanceOverview />;
    }
  };

  return (
    <div className={isPosTerminal ? 'space-y-3' : 'space-y-6'}>
      {adminTestPos && isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-xs text-amber-200">Admin test mode — POS checkout uses real shop stock.</p>
          <button
            type="button"
            onClick={() => setAdminTestPos(false)}
            className="text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:text-amber-100"
          >
            Exit test mode
          </button>
        </div>
      )}

      {!forcedModule && (
        <div className={`flex flex-wrap gap-2 ${isPosTerminal ? 'pb-0' : ''}`}>
          {MODULES.map((m) => {
            if (m.id === 'pos-terminal' && !canPos && !isAdmin) return null;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setModule(m.id);
                  if (m.id !== 'pos-terminal') setAdminTestPos(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                  module === m.id
                    ? 'bg-gold-600 text-navy-950 border-gold-600'
                    : 'bg-navy-900/50 text-gold-500/70 border-gold-500/15 hover:border-gold-500/40'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {!isPosTerminal && (
        <div className="bg-navy-900/50 border border-gold-500/10 rounded-2xl p-4 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500/40">Finance</p>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gold-100 mt-1">{active.label}</h2>
          <p className="text-xs text-gold-500/50 mt-1 max-w-xl">{active.description}</p>
        </div>
      )}

      <div className={isPosTerminal ? 'min-h-0' : 'min-h-[400px]'}>{renderModule()}</div>
    </div>
  );
};

export default FinanceHub;
