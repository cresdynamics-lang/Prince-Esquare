import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type WishlistContextValue = {
  ids: Set<string>;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
};

const STORAGE_KEY = "pe_wishlist_v1";
const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // ignore
    }
  }, [ids, hydrated]);

  const value: WishlistContextValue = {
    ids,
    has: (id) => ids.has(id),
    toggle: (id) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
