import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  productId: string;
  variantId: string | null;
  title: string;
  image: string;
  price: number;
  size: string | null;
  color: string | null;
  quantity: number;
  slug: string;
};

type CartContextValue = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  updateQty: (productId: string, variantId: string | null, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pe_cart_v1";

function keyOf(productId: string, variantId: string | null) {
  return `${productId}::${variantId ?? "null"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      add: (line, qty = 1) => {
        setLines((prev) => {
          const k = keyOf(line.productId, line.variantId);
          const existing = prev.find(
            (l) => keyOf(l.productId, l.variantId) === k,
          );
          if (existing) {
            return prev.map((l) =>
              keyOf(l.productId, l.variantId) === k
                ? { ...l, quantity: l.quantity + qty }
                : l,
            );
          }
          return [...prev, { ...line, quantity: qty }];
        });
      },
      remove: (productId, variantId) => {
        setLines((prev) =>
          prev.filter(
            (l) => keyOf(l.productId, l.variantId) !== keyOf(productId, variantId),
          ),
        );
      },
      updateQty: (productId, variantId, qty) => {
        setLines((prev) =>
          prev
            .map((l) =>
              keyOf(l.productId, l.variantId) === keyOf(productId, variantId)
                ? { ...l, quantity: Math.max(1, qty) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        );
      },
      clear: () => setLines([]),
      count: lines.reduce((a, l) => a + l.quantity, 0),
      subtotal: lines.reduce((a, l) => a + l.price * l.quantity, 0),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
