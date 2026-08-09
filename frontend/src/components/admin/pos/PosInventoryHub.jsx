import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { canManageInventory, INVENTORY_MODULES } from '../../../utils/staffPermissions';
import {
  StockOverviewView,
  StockMovementsView,
  DailyStockSheetView,
  StockTakeView,
} from './PosAdminViews';

const MODULE_META = {
  stock: { label: 'Stock', description: 'Browse items, transfer store ↔ shop, stock sheet' },
  'daily-sheet': { label: 'Summary', description: 'Daily opening, sales, moves, and closing by category' },
  movements: { label: 'Movements', description: 'History of stock in, out, sales, and adjustments' },
  'stock-take': { label: 'Stock Take', description: 'Physical count — shop or warehouse' },
};

const PosInventoryHub = ({ initialTab = 'stock', forcedModule, hideModulePicker = false, readOnlyInventory = false }) => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin || user?.role === 'admin');
  const [searchParams, setSearchParams] = useSearchParams();

  const inventoryReadOnly = readOnlyInventory || (!isAdmin && !canManageInventory(user));
  const defaultModule = initialTab || 'stock';
  const module = forcedModule || searchParams.get('module') || defaultModule;
  const current = MODULE_META[module] || MODULE_META.stock;

  const setModule = (id) => {
    if (!forcedModule) setSearchParams({ module: id }, { replace: true });
  };

  const renderModule = () => {
    switch (module) {
      case 'stock':
        return <StockOverviewView readOnly={inventoryReadOnly} />;
      case 'movements':
        return <StockMovementsView readOnly={inventoryReadOnly} />;
      case 'daily-sheet':
        return <DailyStockSheetView readOnly={inventoryReadOnly} />;
      case 'stock-take':
        return <StockTakeView readOnly={inventoryReadOnly} />;
      default:
        return <StockOverviewView readOnly={inventoryReadOnly} />;
    }
  };

  return (
    <div className="space-y-6">
      {inventoryReadOnly && (
        <div className="px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs text-blue-200">
          View-only — contact an admin to change stock or sizes.
        </div>
      )}

      {!hideModulePicker && (
        <div className="flex flex-wrap gap-2">
          {INVENTORY_MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModule(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold   border transition-all ${
                module === m.id
                  ? 'bg-gold-600 text-navy-950 border-gold-600'
                  : 'bg-navy-900/50 text-gold-500/70 border-gold-500/15 hover:border-gold-500/40'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-navy-900/50 border border-gold-500/10 rounded-2xl p-4 sm:p-6">
        <p className="text-[10px] font-black  tracking-[0.3em] text-gold-500/40">Inventory</p>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-gold-100 mt-1">{current.label}</h2>
        <p className="text-xs text-gold-500/50 mt-1 max-w-xl">{current.description}</p>
      </div>

      <div className="min-h-[400px]">{renderModule()}</div>
    </div>
  );
};

export default PosInventoryHub;
