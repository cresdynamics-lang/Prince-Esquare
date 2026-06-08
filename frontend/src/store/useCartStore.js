import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartAPI } from '../services/api';
import { useAuthStore } from './useAuthStore';
import { toCartVariantId } from '../utils/ids';

const isCustomerSession = () => {
  const { isAuthenticated, token, isSeller, user } = useAuthStore.getState();
  return isAuthenticated && token && !isSeller && user?.accountType !== 'pos';
};

function lineKey(item) {
  if (item.cartItemId) return `s:${item.cartItemId}`;
  return `g:${item.productId}:${item.variantId}:${item.sizeLabel || ''}`;
}

function mergeKey(item) {
  return `${item.productId}:${item.variantId || ''}:${item.sizeLabel || ''}`;
}

const isRealProductId = (id) => typeof id === 'string' && id.length >= 32;

function mergeServerAndLocal(serverItems, localItems) {
  const serverKeys = new Set(serverItems.map(mergeKey));
  const unsyncedLocal = localItems.filter(
    (it) => !it.cartItemId && isRealProductId(it.productId) && !serverKeys.has(mergeKey(it))
  );
  return [...serverItems, ...unsyncedLocal];
}

export function mapCartRow(row) {
  const unit = parseFloat(row.price) + parseFloat(row.price_modifier || 0);
  return {
    cartItemId: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    variantName: row.variant_name,
    variantValue: row.variant_value,
    sizeLabel: row.size_label || '',
    quantity: row.quantity,
    name: row.name,
    price: unit,
    image: row.thumbnail,
    slug: row.slug,
    brandName: row.brand_name,
  };
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getCheckoutTotals: () => {
        const subtotal = get().getTotal();
        const tax = Math.round(subtotal * 0.16);
        const shipping = 250;
        const total = subtotal + tax + shipping;
        return { subtotal, tax, shipping, total };
      },

      loadCart: async () => {
        if (!isCustomerSession()) return;
        try {
          const res = await cartAPI.get();
          if (!res.data?.success) return;
          const rows = Array.isArray(res.data.data) ? res.data.data : [];
          const serverItems = rows.map(mapCartRow);
          set({ items: mergeServerAndLocal(serverItems, get().items) });
        } catch (e) {
          console.error('loadCart', e);
        }
      },

      mergeGuestCartToServer: async () => {
        if (!isCustomerSession()) return;
        const items = get().items;
        for (const it of items) {
          const isDummy = !isRealProductId(it.productId);
          if (!it.productId || it.cartItemId || isDummy) continue;
          try {
            await cartAPI.addItem({
              product_id: it.productId,
              variant_id: toCartVariantId(it.variantId),
              quantity: it.quantity,
              size_label: it.sizeLabel || null,
            });
          } catch (e) {
            console.error('mergeGuestCartToServer', e);
          }
        }
        await get().loadCart();
      },

      prepareForCheckout: async () => {
        if (isCustomerSession()) {
          await get().mergeGuestCartToServer();
        }
        return get().items;
      },

      addToCart: async (payload) => {
        const qty = Math.max(1, payload.quantity || 1);
        const isDummy = !isRealProductId(payload.productId);
        if (isDummy) {
          throw new Error('This item is not available for checkout. Please browse the shop catalogue.');
        }
        const items = get().items;
        const idx = items.findIndex(
          (i) =>
            i.productId === payload.productId &&
            i.variantId === payload.variantId &&
            (i.sizeLabel || '') === (payload.sizeLabel || '')
        );
        const snapshot = items;

        if (idx !== -1) {
          const next = [...items];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          set({ items: next });
        } else {
          set({
            items: [
              ...items,
              {
                productId: payload.productId,
                variantId: payload.variantId,
                sizeLabel: payload.sizeLabel || '',
                quantity: qty,
                name: payload.name,
                price: payload.price,
                image: payload.image,
                slug: payload.slug,
                brandName: payload.brandName,
              },
            ],
          });
        }

        if (isCustomerSession()) {
          try {
            await cartAPI.addItem({
              product_id: payload.productId,
              variant_id: toCartVariantId(payload.variantId),
              quantity: qty,
              size_label: payload.sizeLabel || null,
            });
            await get().loadCart();
          } catch (e) {
            console.error('addToCart', e);
            set({ items: snapshot });
            throw e;
          }
        }
      },

      updateQuantity: async (item, newQty) => {
        const q = Math.max(1, newQty);
        if (isCustomerSession() && item.cartItemId) {
          await cartAPI.updateItem(item.cartItemId, { quantity: q });
          await get().loadCart();
          return;
        }
        const k = lineKey(item);
        set({
          items: get().items.map((i) => (lineKey(i) === k ? { ...i, quantity: q } : i)),
        });
      },

      removeFromCart: async (item) => {
        if (isCustomerSession() && item.cartItemId) {
          await cartAPI.removeItem(item.cartItemId);
          await get().loadCart();
          return;
        }
        const k = lineKey(item);
        set({ items: get().items.filter((i) => lineKey(i) !== k) });
      },

      clearLocalItems: () => set({ items: [] }),
    }),
    {
      name: 'prince-esquire-cart-v2',
    }
  )
);
