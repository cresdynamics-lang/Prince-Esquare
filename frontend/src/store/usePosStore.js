// MODIFIED — POS cart: individual products with own prices, stock from category bucket

import { create } from 'zustand';



export const usePosStore = create((set, get) => ({

  cart: [],

  activeShift: null,



  addToCart: (product, variant = null) => {

    if (!product.productId) return;

    const lineId = product.ecommerceProductId || product.productId;

    const key = variant ? `${lineId}-${variant.id}` : String(lineId);

    const cart = get().cart;

    const existing = cart.find((i) => i.key === key);

    const unitPrice = variant

      ? Number(product.shop_price) + Number(variant.price_modifier || 0)

      : Number(product.shop_price) || 0;



    if (existing) {

      set({

        cart: cart.map((i) =>

          i.key === key ? { ...i, qty: i.qty + 1 } : i

        ),

      });

    } else {

      set({

        cart: [

          ...cart,

          {

            key,

            productId: product.productId,

            ecommerceProductId: product.ecommerceProductId || null,

            variantId: variant?.id || null,

            name: product.name,

            lineName: product.name,

            channel: product.channel || 'inventory',

            websiteStatus: product.websiteStatus || 'none',

            stockCategory: product.stockCategory,

            variantLabel: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : null,

            unitPrice,

            qty: 1,

          },

        ],

      });

    }

  },



  removeFromCart: (key) => set({ cart: get().cart.filter((i) => i.key !== key) }),



  updateQty: (key, qty) => {

    if (qty < 1) return get().removeFromCart(key);

    set({

      cart: get().cart.map((i) => (i.key === key ? { ...i, qty } : i)),

    });

  },



  clearCart: () => set({ cart: [] }),

  setShift: (shift) => set({ activeShift: shift }),

  clearShift: () => set({ activeShift: null }),

}));

