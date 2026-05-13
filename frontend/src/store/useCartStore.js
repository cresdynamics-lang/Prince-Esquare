import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product, selectedSize, selectedColor) => {
        const currentItems = get().items;
        // Check for existing item with same ID, Size, and Color
        const existingItemIndex = currentItems.findIndex(
          (item) => 
            item.id === product.id && 
            item.selectedSize === selectedSize && 
            item.selectedColor === selectedColor
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += 1;
          set({ items: updatedItems });
        } else {
          set({ 
            items: [
              ...currentItems, 
              { 
                ...product, 
                quantity: 1, 
                selectedSize, 
                selectedColor 
              }
            ] 
          });
        }
      },
      removeFromCart: (productId, size, color) =>
        set({
          items: get().items.filter(
            (item) => 
              !(item.id === productId && item.selectedSize === size && item.selectedColor === color)
          ),
        }),
      updateQuantity: (productId, size, color, quantity) =>
        set({
          items: get().items.map((item) =>
            (item.id === productId && item.selectedSize === size && item.selectedColor === color)
              ? { ...item, quantity: Math.max(1, quantity) } 
              : item
          ),
        }),
      clearCart: () => set({ items: [] }),
      getTotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'prince-esquire-cart',
    }
  )
);
