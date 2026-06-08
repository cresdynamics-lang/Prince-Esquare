// NEW — Live stock levels for admin/POS
import { create } from 'zustand';

export const useInventoryStore = create((set) => ({
  stockLevels: [],
  lowStockItems: [],

  setStockLevels: (levels) => set({ stockLevels: levels }),
  updateProductQty: (productId, newQty) =>
    set((state) => ({
      stockLevels: state.stockLevels.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentQty: newQty,
              stock_level: { ...p.stock_level, current_qty: newQty },
              isLow: newQty <= (p.low_stock_threshold || 5),
              isOut: newQty === 0,
            }
          : p
      ),
    })),
  setLowStockItems: (items) => set({ lowStockItems: items }),
}));
