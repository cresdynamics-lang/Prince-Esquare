// NEW — Socket.io live POS stock on storefront
import { useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';

export const useLiveStock = (productId, onUpdate) => {
  const handler = useCallback(
    (payload) => {
      if (!payload) return;
      const matches =
        payload.ecommerceProductIds?.includes(productId) ||
        payload.productId === productId;
      if (matches) onUpdate?.(payload);
    },
    [productId, onUpdate]
  );

  useEffect(() => {
    if (!productId) return undefined;
    socket.on('stock:updated', handler);
    return () => socket.off('stock:updated', handler);
  }, [productId, handler]);
};

export const useLiveStockMap = (setStockMap) => {
  useEffect(() => {
    const handler = (payload) => {
      if (!payload?.ecommerceProductIds?.length) return;
      setStockMap((prev) => {
        const next = { ...prev };
        for (const id of payload.ecommerceProductIds) {
          next[id] = {
            qty: payload.newQty,
            inStock: payload.newQty > 0,
            posProductName: payload.posProductName,
          };
        }
        return next;
      });
    };
    socket.on('stock:updated', handler);
    return () => socket.off('stock:updated', handler);
  }, [setStockMap]);
};
