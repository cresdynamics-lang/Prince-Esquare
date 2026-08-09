import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryAPI, adminCategoryAPI, adminBrandAPI, adminUploadAPI } from '../../../services/api';
import { getUploadUrl, toImageJson, revokeBlobUrl } from '../../../utils/cloudinary';
import {
  buildColorGroupsFromDetail,
  emptyProductForm,
  flattenColorGroups,
  getSizeOptionsForCategory,
  newColorGroup,
  newSizeRow,
} from '../../../utils/inventoryVariants';

const inputCls = 'w-full bg-navy-950 border border-gold-500/20 rounded p-2 text-white text-sm';
const labelCls = 'text-gold-500/50 text-xs block mb-1';

const InventoryProductModal = ({ itemId, defaultCategoryId, onClose, onSaved }) => {
  const isNew = !itemId;
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [source, setSource] = useState('draft');
  const [websiteLinked, setWebsiteLinked] = useState(false);
  const [form, setForm] = useState(emptyProductForm());
  const [customSize, setCustomSize] = useState('');

  useEffect(() => {
    adminCategoryAPI.getAll().then((r) => setCategories(r.data?.data || r.data || [])).catch(() => {});
    adminBrandAPI.getAll().then((r) => setBrands(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (itemId) return;
    if (defaultCategoryId) {
      setForm((f) => ({ ...f, category_id: defaultCategoryId }));
    }
  }, [itemId, defaultCategoryId]);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    inventoryAPI.getProductDetail(itemId)
      .then((res) => {
        const data = res.data?.data;
        const d = data?.details || {};
        setSource(data?.source || 'draft');
        setWebsiteLinked(Boolean(data?.website_product_id));
        setForm({
          name: data?.name || '',
          sku: data?.sku || '',
          category_id: d.category_id || '',
          shop_price: String(data?.shop_price ?? ''),
          cost_price: data?.cost_price != null ? String(data.cost_price) : '',
          opening_qty: data?.shop_qty ?? 0,
          store_qty: data?.store_qty ?? 0,
          brand_id: d.brand_id || '',
          description: d.description || '',
          price: String(d.price ?? data?.shop_price ?? ''),
          discount_price: d.discount_price != null ? String(d.discount_price) : '',
          thumbnail: d.thumbnail || '',
          thumbnailPreview: d.thumbnail || '',
          images: d.images || [],
          color_groups: buildColorGroupsFromDetail(d),
        });
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [itemId]);

  const selectedCategory = categories.find((c) => c.id === form.category_id);
  const sizeOptions = getSizeOptionsForCategory(selectedCategory?.name || '');

  const retailPrice = Number(form.shop_price) || 0;
  const costPrice = Number(form.cost_price) || 0;
  const profit = retailPrice - costPrice;
  const margin = retailPrice > 0 ? ((profit / retailPrice) * 100).toFixed(1) : '0.0';

  const buildPayload = () => ({
    name: form.name,
    sku: form.sku,
    category: selectedCategory?.name || 'General',
    shop_price: retailPrice,
    category_id: form.category_id || null,
    brand_id: form.brand_id || null,
    description: form.description,
    price: retailPrice,
    discount_price: form.discount_price ? Number(form.discount_price) : null,
    cost_price: form.cost_price !== '' && form.cost_price != null ? Number(form.cost_price) : null,
    thumbnail: form.thumbnail || null,
    images: form.images,
    color_groups: form.color_groups.map((g) => ({
      color: g.color,
      image_url: g.image_url,
      sizes: g.sizes.map((s) => ({
        id: s.id,
        size: s.size,
        stock: Number(s.stock) || 0,
        price_override: s.price_override === '' ? 0 : Number(s.price_override) || 0,
      })),
    })),
    variants: flattenColorGroups(form.color_groups),
  });

  const variantStockTotal = () =>
    flattenColorGroups(form.color_groups).reduce((sum, row) => sum + (Number(row.stock) || 0), 0);

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('images', file);
    const res = await adminUploadAPI.upload(fd);
    return getUploadUrl(res.data?.data?.[0] || res.data?.data);
  };

  const handleThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setForm((f) => {
      revokeBlobUrl(f.thumbnailPreview);
      return { ...f, thumbnailPreview: localPreview };
    });
    try {
      const url = await uploadFile(file);
      setForm((f) => {
        revokeBlobUrl(f.thumbnailPreview);
        return { ...f, thumbnail: url, thumbnailPreview: url, images: [toImageJson(url)] };
      });
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleColorImage = async (groupKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm((f) => ({
        ...f,
        color_groups: f.color_groups.map((g) =>
          g._key === groupKey ? { ...g, image_url: url, imagePreview: url } : g
        ),
      }));
      toast.success('Color image uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const addSizeToGroup = (groupKey, size) => {
    if (!sizeOptions.length || !size?.trim()) return;
    setForm((f) => ({
      ...f,
      color_groups: f.color_groups.map((g) => {
        if (g._key !== groupKey) return g;
        if (g.sizes.some((s) => String(s.size).toUpperCase() === size.toUpperCase())) return g;
        return { ...g, sizes: [...g.sizes, newSizeRow(size.toUpperCase())] };
      }),
    }));
    setCustomSize('');
  };

  const handleSave = async (andPublish = false) => {
    if (!form.name || !form.sku || !form.shop_price) {
      toast.error('Name, SKU and retail price are required');
      return;
    }
    if (!form.category_id) {
      toast.error('Select a website category');
      return;
    }
    setBusy(true);
    try {
      const payload = buildPayload();
      const stockTotal = variantStockTotal();
      const openingQty = Math.max(stockTotal, Number(form.opening_qty) || 0);
      const storeQty = Number(form.store_qty) || 0;
      let savedId = itemId;

      if (isNew) {
        const res = await inventoryAPI.createItem({
          ...payload,
          opening_qty: openingQty,
          store_qty: storeQty,
        });
        savedId = res.data?.data?.productId;
        if (andPublish && savedId) {
          await inventoryAPI.publishToWebsite(savedId, payload);
          toast.success('Product added and published to website');
        } else {
          toast.success('Product added to inventory');
        }
      } else {
        await inventoryAPI.saveProductDetails(itemId, payload);
        if (stockTotal > 0) {
          await inventoryAPI.stockTake([{ productId: itemId, physicalQty: stockTotal }]);
        }
        if (andPublish) {
          await inventoryAPI.publishToWebsite(itemId, payload);
          toast.success(websiteLinked ? 'Saved and website updated' : 'Saved and published to website');
        } else {
          toast.success('Product saved');
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    if (!itemId) return;
    setBusy(true);
    try {
      const res = await inventoryAPI.syncFromWebsite(itemId);
      const data = res.data?.data;
      const d = data?.details || {};
      setSource('live');
      setForm((f) => ({
        ...f,
        name: data?.name || f.name,
        shop_price: String(data?.shop_price ?? f.shop_price),
        cost_price: data?.cost_price != null ? String(data.cost_price) : f.cost_price,
        description: d.description || '',
        discount_price: d.discount_price != null ? String(d.discount_price) : '',
        thumbnail: d.thumbnail || '',
        thumbnailPreview: d.thumbnail || '',
        images: d.images || [],
        category_id: d.category_id || f.category_id,
        brand_id: d.brand_id || '',
        color_groups: buildColorGroupsFromDetail(d),
      }));
      toast.success('Synced from live website');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-navy-900 border border-gold-500/20 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-navy-900/95 backdrop-blur border-b border-gold-500/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-gold-400 font-medium">
              {isNew ? 'Add product' : 'Product details'}
            </h3>
            {!isNew && (
              <p className="text-[10px] text-gold-500/40 mt-0.5  ">
                Data source: {source === 'live' ? 'Live website' : 'Inventory draft'}
                {websiteLinked && ' · Linked'}
              </p>
            )}
          </div>
          {websiteLinked && !isNew && (
            <button type="button" onClick={handleSync} disabled={busy} className="flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200">
              <RefreshCw size={14} /> Sync live
            </button>
          )}
        </div>

        {loading ? (
          <p className="p-8 text-center text-gold-500/50 text-sm">Loading…</p>
        ) : (
          <div className="p-6 space-y-6">
            <section className="space-y-3">
              <h4 className="text-xs font-bold   text-gold-500/70">Basics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Product name</label>
                  <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>SKU</label>
                  <input className={`${inputCls} font-mono`} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className={labelCls}>Website category</label>
                  <select className={inputCls} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Brand (optional)</label>
                  <select className={inputCls} value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="">No brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Retail price KES</label>
                  <input type="number" min={0} className={inputCls} value={form.shop_price} onChange={(e) => setForm({ ...form, shop_price: e.target.value })} />
                  <p className="text-[9px] text-gold-500/40 mt-1">Same price for shop and website.</p>
                </div>
                <div>
                  <label className={labelCls}>Cost price KES</label>
                  <input type="number" min={0} className={inputCls} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="What you paid" />
                </div>
                <div className="md:col-span-2 rounded-lg border border-gold-500/15 bg-navy-950/60 p-3">
                  <p className="text-[10px] text-gold-500/50 mb-1">Profit (retail − cost)</p>
                  <p className="text-sm text-green-400 font-medium">
                    KSh {profit.toLocaleString()} <span className="text-gold-500/50 font-normal">· {margin}% margin</span>
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Sale price (optional)</label>
                  <input type="number" min={0} className={inputCls} value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
                </div>
                {isNew && (
                  <>
                    <div>
                      <label className={labelCls}>Shop opening qty</label>
                      <input type="number" min={0} className={inputCls} value={form.opening_qty} onChange={(e) => setForm({ ...form, opening_qty: e.target.value })} placeholder={String(variantStockTotal() || 0)} />
                      <p className="text-[9px] text-gold-500/40 mt-1">Defaults to total of size stocks if left empty.</p>
                    </div>
                    <div>
                      <label className={labelCls}>Store qty (warehouse)</label>
                      <input type="number" min={0} className={inputCls} value={form.store_qty} onChange={(e) => setForm({ ...form, store_qty: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-bold   text-gold-500/70">Images & description</h4>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={5}
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product story, key features, available colors and sizes…"
                />
              </div>
              <div>
                <label className={labelCls}>Main thumbnail</label>
                <div className="flex items-center gap-3 mt-1">
                  {form.thumbnailPreview && (
                    <img src={form.thumbnailPreview} alt="" className="w-20 h-20 object-cover rounded border border-gold-500/20" />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 border border-gold-500/30 rounded text-xs text-gold-400 cursor-pointer hover:bg-gold-500/5">
                    <Upload size={14} /> Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                  </label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold   text-gold-500/70">Colors & sizes</h4>
                  <p className="text-[10px] text-gold-500/40 mt-0.5">Set stock and optional price override per size.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color_groups: [...f.color_groups, newColorGroup('')] }))}
                  className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300"
                >
                  <Plus size={14} /> Add color
                </button>
              </div>

              {form.color_groups.map((group) => (
                <div key={group._key} className="border border-gold-500/15 rounded-lg p-4 space-y-3 bg-navy-950/40">
                  <div className="flex flex-wrap gap-3 items-start">
                    <div className="flex-1 min-w-[140px]">
                      <label className={labelCls}>Color / variant name</label>
                      <input
                        className={inputCls}
                        placeholder="e.g. Core Black / Gold Accent"
                        value={group.color}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          color_groups: f.color_groups.map((g) =>
                            g._key === group._key ? { ...g, color: e.target.value } : g
                          ),
                        }))}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Color image</label>
                      <div className="flex items-center gap-2">
                        {group.imagePreview && (
                          <img src={group.imagePreview} alt="" className="w-12 h-12 object-cover rounded border border-gold-500/20" />
                        )}
                        <label className="px-2 py-1.5 border border-gold-500/20 rounded text-[10px] text-gold-500/60 cursor-pointer">
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorImage(group._key, e)} />
                        </label>
                      </div>
                    </div>
                    {form.color_groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({
                          ...f,
                          color_groups: f.color_groups.filter((g) => g._key !== group._key),
                        }))}
                        className="text-red-400/70 hover:text-red-400 p-1 mt-5"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Quick add sizes</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {sizeOptions.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => addSizeToGroup(group._key, sz)}
                          className="px-2 py-1 text-[10px] border border-gold-500/25 text-gold-400 rounded hover:bg-gold-500/10"
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        className={`${inputCls} max-w-[100px]`}
                        placeholder="Custom"
                        value={customSize}
                        onChange={(e) => setCustomSize(e.target.value)}
                      />
                      <button type="button" onClick={() => addSizeToGroup(group._key, customSize)} className="px-3 py-1 text-xs border border-gold-500/30 text-gold-400 rounded">
                        Add size
                      </button>
                    </div>
                  </div>

                  {group.sizes.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-gold-500/40">
                          <tr>
                            <th className="text-left p-1">Size</th>
                            <th className="p-1">Stock</th>
                            <th className="p-1">Price +/-</th>
                            <th className="p-1" />
                          </tr>
                        </thead>
                        <tbody>
                          {group.sizes.map((row) => (
                            <tr key={row._key} className="border-t border-gold-500/10">
                              <td className="p-1 font-mono">{row.size}</td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  min={0}
                                  className="w-16 bg-navy-950 border border-gold-500/20 rounded px-1 py-0.5 text-white"
                                  value={row.stock}
                                  onChange={(e) => setForm((f) => ({
                                    ...f,
                                    color_groups: f.color_groups.map((g) =>
                                      g._key === group._key
                                        ? {
                                            ...g,
                                            sizes: g.sizes.map((s) =>
                                              s._key === row._key ? { ...s, stock: e.target.value } : s
                                            ),
                                          }
                                        : g
                                    ),
                                  }))}
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  className="w-16 bg-navy-950 border border-gold-500/20 rounded px-1 py-0.5 text-white"
                                  value={row.price_override}
                                  placeholder="0"
                                  onChange={(e) => setForm((f) => ({
                                    ...f,
                                    color_groups: f.color_groups.map((g) =>
                                      g._key === group._key
                                        ? {
                                            ...g,
                                            sizes: g.sizes.map((s) =>
                                              s._key === row._key ? { ...s, price_override: e.target.value } : s
                                            ),
                                          }
                                        : g
                                    ),
                                  }))}
                                />
                              </td>
                              <td className="p-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => setForm((f) => ({
                                    ...f,
                                    color_groups: f.color_groups.map((g) =>
                                      g._key === group._key
                                        ? { ...g, sizes: g.sizes.filter((s) => s._key !== row._key) }
                                        : g
                                    ),
                                  }))}
                                  className="text-red-400/60 hover:text-red-400"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gold-500/10">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gold-500/30 text-gold-400 rounded text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSave(false)}
                className="px-4 py-2 bg-sky-600 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save details'}
              </button>
              {!isNew && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSave(true)}
                  className="px-4 py-2 bg-gold-600 text-navy-950 rounded text-sm font-medium disabled:opacity-50"
                >
                  {busy ? 'Publishing…' : websiteLinked ? 'Save & update website' : 'Save & publish'}
                </button>
              )}
              {isNew && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSave(true)}
                  className="ml-auto px-4 py-2 bg-gold-600 text-navy-950 rounded text-sm font-medium disabled:opacity-50"
                >
                  Save & publish to website
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryProductModal;
