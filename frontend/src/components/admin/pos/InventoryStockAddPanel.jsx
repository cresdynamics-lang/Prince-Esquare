import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../../../services/api';
import { formatKES } from '../../../lib/format';
import {
  buildColorGroupsFromDetail,
  flattenColorGroups,
  getSizeOptionsForCategory,
  newColorGroup,
  newSizeRow,
} from '../../../utils/inventoryVariants';

const sizeKey = (color, size) => `${color || 'Original'}::${size}`;

const normSize = (s) => String(s || '').trim().toUpperCase();

const mergeColorGroups = (cardGroups = [], detailGroups = [], categoryName = '') => {
  const cardHasSizes = cardGroups.some((g) => (g.sizes || []).length > 0);
  const detailHasSizes = detailGroups.some((g) => (g.sizes || []).length > 0);

  const idLookup = new Map();
  for (const g of detailGroups) {
    for (const s of g.sizes || []) {
      idLookup.set(`${(g.color || 'Original').toLowerCase()}::${normSize(s.size)}`, s.id);
    }
  }

  const base = cardHasSizes ? cardGroups : detailHasSizes ? detailGroups : [];

  if (base.length > 0) {
    return base.map((g) => ({
      color: g.color || 'Original',
      image_url: g.image_url || '',
      sizes: (g.sizes || []).map((s) => ({
        id: s.id || idLookup.get(`${(g.color || 'Original').toLowerCase()}::${normSize(s.size)}`) || null,
        size: normSize(s.size),
        stock: Number(s.stock ?? s.physicalQty ?? 0) || 0,
        price_override: s.price_override ?? '',
      })),
    }));
  }

  const defaults = getSizeOptionsForCategory(categoryName);
  return [{
    ...newColorGroup('Original'),
    sizes: defaults.map((size) => newSizeRow(size)),
  }];
};

const InventoryStockAddPanel = ({ product, onDone, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [colorGroups, setColorGroups] = useState([]);
  const [additions, setAdditions] = useState({});
  const [storeAdd, setStoreAdd] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    inventoryAPI.getProductDetail(product.id)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        const d = data.details || {};
        setDetail(data);
        const detailGroups = buildColorGroupsFromDetail(d);
        const merged = mergeColorGroups(
          product.color_groups || [],
          detailGroups,
          data.category || product.category || d.category_name
        );
        setColorGroups(merged);
        const init = {};
        for (const g of merged) {
          for (const s of g.sizes || []) {
            init[sizeKey(g.color, s.size)] = '';
          }
        }
        setAdditions(init);
      })
      .catch((err) => {
        if (!cancelled) {
          const merged = mergeColorGroups(product.color_groups || [], [], product.category);
          setColorGroups(merged);
          const init = {};
          for (const g of merged) {
            for (const s of g.sizes || []) init[sizeKey(g.color, s.size)] = '';
          }
          setAdditions(init);
          toast.error(err.response?.data?.message || 'Could not refresh product — using card data');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [product.id, product.color_groups, product.category]);

  const hasSizes = useMemo(
    () => colorGroups.some((g) => (g.sizes || []).length > 0),
    [colorGroups]
  );

  const totalToAdd = useMemo(() => {
    let sum = 0;
    for (const group of colorGroups) {
      for (const row of group.sizes || []) {
        sum += parseInt(additions[sizeKey(group.color, row.size)], 10) || 0;
      }
    }
    return sum;
  }, [colorGroups, additions]);

  const setAdd = (key, value) => {
    setAdditions((prev) => ({ ...prev, [key]: value.replace(/[^\d]/g, '') }));
  };

  const handleSave = async () => {
    const perSizeAdds = [];
    let totalShopAdd = 0;

    for (const group of colorGroups) {
      for (const row of group.sizes || []) {
        const key = sizeKey(group.color, row.size);
        const add = parseInt(additions[key], 10) || 0;
        if (add > 0) {
          totalShopAdd += add;
          perSizeAdds.push({
            color: group.color,
            size: row.size,
            add,
            current: Number(row.stock) || 0,
            id: row.id,
          });
        }
      }
    }

    const storeQty = parseInt(storeAdd, 10) || 0;

    if (totalShopAdd < 1 && storeQty < 1) {
      toast.error('Enter quantity to add for at least one size or at store');
      return;
    }

    setBusy(true);
    try {
      const updatedGroups = colorGroups.map((g) => ({
        color: g.color,
        image_url: g.image_url || null,
        sizes: (g.sizes || []).map((s) => {
          const match = perSizeAdds.find((a) => a.color === g.color && a.size === s.size);
          const newStock = match ? (Number(s.stock) || 0) + match.add : (Number(s.stock) || 0);
          return {
            id: s.id,
            size: s.size,
            stock: newStock,
            price_override: s.price_override === '' || s.price_override == null
              ? 0
              : Number(s.price_override) || 0,
          };
        }),
      }));

      if (perSizeAdds.length > 0) {
        await inventoryAPI.saveProductDetails(product.id, {
          name: detail?.name || product.name,
          sku: detail?.sku || product.sku,
          category: detail?.category || product.category,
          shop_price: detail?.shop_price ?? product.shop_price,
          color_groups: updatedGroups,
          variants: flattenColorGroups(updatedGroups),
        });
      }

      if (storeQty > 0) {
        await inventoryAPI.receiveAtStore({
          productId: product.id,
          qty: storeQty,
          notes: 'Added via inventory',
        });
      }

      if (totalShopAdd > 0) {
        const newShopQty = (product.currentQty ?? 0) + totalShopAdd;
        await inventoryAPI.stockTake([{ productId: product.id, physicalQty: newShopQty }]);
      }

      const parts = [];
      if (totalShopAdd > 0) parts.push(`${totalShopAdd} to shop`);
      if (storeQty > 0) parts.push(`${storeQty} to store`);
      toast.success(`Added ${parts.join(', ')} — ${product.name}`);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add stock');
    } finally {
      setBusy(false);
    }
  };

  const displayName = detail?.name || product.name;
  const displaySku = detail?.sku || product.sku;
  const displayCategory = detail?.details?.category_name || detail?.category || product.website_category_name || product.category;
  const displayPrice = detail?.details?.price ?? product.website_price ?? product.shop_price;

  if (loading) {
    return (
      <div className="border-t border-emerald-500/20 bg-emerald-950/10 px-4 py-3 text-xs text-gold-500/50">
        Loading product sizes…
      </div>
    );
  }

  return (
    <div className="border-t border-emerald-500/25 bg-emerald-950/15 px-4 py-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-white leading-snug">{displayName}</p>
          <p className="text-[10px] text-gold-500/50 font-mono">{displaySku}</p>
          <p className="text-[10px] text-gold-500/40">{displayCategory}</p>
        </div>
        <div className="text-right text-[10px] space-y-0.5 shrink-0">
          <p className="text-gold-400">{formatKES(displayPrice)}</p>
          <p className="text-sky-300/90">Store {product.storeQty ?? 0}</p>
          <p className="text-gold-400/90">Shop {product.currentQty ?? 0}</p>
        </div>
      </div>

      <p className="text-[10px] text-emerald-300/80">
        Enter how many to add for each size. Current stock is shown — new total updates when you save.
      </p>

      {hasSizes ? (
        <div className="space-y-3">
          {colorGroups.map((group) => (
            <div key={group.color || 'default'} className="rounded-lg border border-gold-500/15 bg-navy-950/50 p-3 space-y-2">
              <p className="text-xs font-medium text-gold-300/90">{group.color || 'Original'}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] min-w-[260px]">
                  <thead>
                    <tr className="text-gold-500/50 border-b border-gold-500/10">
                      <th className="py-1 pr-2 text-left font-normal">Size</th>
                      <th className="py-1 pr-2 text-right font-normal">Now</th>
                      <th className="py-1 pr-2 text-center font-normal w-16">Add</th>
                      <th className="py-1 text-right font-normal">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(group.sizes || []).map((row) => {
                      const key = sizeKey(group.color, row.size);
                      const add = parseInt(additions[key], 10) || 0;
                      const now = Number(row.stock) || 0;
                      return (
                        <tr key={key} className="border-b border-gold-500/5">
                          <td className="py-1.5 pr-2 text-white font-medium">{row.size}</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums text-gold-400/80">{now}</td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={additions[key] ?? ''}
                              onChange={(e) => setAdd(key, e.target.value)}
                              placeholder="0"
                              className="w-full bg-navy-900 border border-gold-500/25 rounded px-2 py-1 text-white text-center text-xs"
                            />
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-emerald-300 font-medium">
                            {add > 0 ? now + add : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gold-500/50">No sizes found for this product. Use Edit details to set up sizes first.</p>
      )}

      <label className="block space-y-1 max-w-xs">
        <span className="text-[10px] text-gold-500/50">Receive at store (warehouse) — optional</span>
        <input
          type="number"
          min={0}
          value={storeAdd}
          onChange={(e) => setStoreAdd(e.target.value.replace(/[^\d]/g, ''))}
          className="w-full bg-navy-950 border border-gold-500/20 rounded px-2 py-1.5 text-white text-sm"
          placeholder="0"
        />
      </label>

      {totalToAdd > 0 && (
        <p className="text-xs text-emerald-300">
          Shop: +<span className="font-bold">{totalToAdd}</span>
          {' → '}
          <span className="font-bold">{(product.currentQty ?? 0) + totalToAdd}</span>
          {parseInt(storeAdd, 10) > 0 && (
            <>
              {' · Store: +'}
              <span className="font-bold">{storeAdd}</span>
              {' → '}
              <span className="font-bold">{(product.storeQty ?? 0) + parseInt(storeAdd, 10)}</span>
            </>
          )}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-1.5 border border-gold-500/25 text-gold-400 rounded text-xs disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || (totalToAdd < 1 && !(parseInt(storeAdd, 10) > 0))}
          className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? 'Adding…' : `Add${totalToAdd > 0 ? ` (${totalToAdd})` : ''}`}
        </button>
      </div>
    </div>
  );
};

export default InventoryStockAddPanel;
