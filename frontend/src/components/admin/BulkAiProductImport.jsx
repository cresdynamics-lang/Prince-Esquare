import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles, Trash2, X, Upload, RefreshCw, Check, Edit3 } from 'lucide-react';
import { adminProductAPI, adminUploadAPI } from '../../services/api';
import { compressImageFile } from '../../utils/compressImage';
import {
  getPersistImageUrl, getImageSrc, toImageJson, getUploadUrl, revokeBlobUrl,
} from '../../utils/cloudinary';
import {
  colorGroupsFromAi,
  flattenColorGroups,
  getSizeOptionsForCategory,
  withAllSizesForCategory,
} from '../../utils/inventoryVariants';
import { adminToast, apiErrorMessage, AI_RETRY_MESSAGE } from '../../lib/adminToast';
import {
  normalizeSetComponents,
  sumSetComponentsPrice,
  isSetsCategory,
  buildSetDescriptionAppendix,
} from '../../lib/setComponents';

const toStockIdPart = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const buildProductSku = (productName) => toStockIdPart(productName) || 'PRODUCT';

const STATUS_LABEL = {
  queued: 'Queued',
  uploading: 'Uploading photo…',
  analyzing: 'AI writing copy…',
  ready: 'Ready — edit & save',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Needs attention',
};

const uniqueSlug = (base) => {
  const stem = String(base || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'product';
  return `${stem}-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 4)}`;
};

const matchCategoryFromAi = (categories, data = {}) => {
  const list = Array.isArray(categories) ? categories : [];
  const slugOf = (c) => String(c.slug || '').toLowerCase();
  const parentSlug = String(data.parent_category_slug || '').toLowerCase();
  const leafSlug = String(data.category_slug || data.parent_category_slug || '').toLowerCase();

  let leaf = leafSlug ? list.find((c) => slugOf(c) === leafSlug) : null;
  let parent = parentSlug ? list.find((c) => slugOf(c) === parentSlug && !c.parent_id) : null;

  if (!leaf && leafSlug) {
    leaf = list.find((c) => slugOf(c).includes(leafSlug) || leafSlug.includes(slugOf(c)));
  }
  if (!parent && parentSlug) {
    parent = list.find((c) => !c.parent_id && (slugOf(c).includes(parentSlug) || parentSlug.includes(slugOf(c))));
  }
  if (leaf && !parent) {
    parent = leaf.parent_id
      ? list.find((c) => String(c.id) === String(leaf.parent_id))
      : leaf;
  }
  if (parent && !leaf) leaf = parent;

  return {
    parent_category_id: parent?.id || leaf?.id || '',
    category_id: leaf?.id || parent?.id || '',
    parentCat: parent || leaf || null,
    leafCat: leaf || parent || null,
  };
};

const emptyDraft = (file, index) => {
  const preview = URL.createObjectURL(file);
  return {
    id: `bulk-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    preview,
    status: 'queued',
    error: '',
    expanded: true,
    name: '',
    slug: '',
    focus_description: '',
    description: '',
    price: '',
    sku: '',
    parent_category_id: '',
    category_id: '',
    is_active: true,
    is_featured: false,
    thumbnail: '',
    images: [],
    color_groups: colorGroupsFromAi([], '', ''),
    set_components: [],
    savedId: null,
  };
};

/**
 * Sequential multi-photo import: upload + Gemini AI name/category/colors per image.
 * Each row stays editable while the queue continues down the list.
 */
export default function BulkAiProductImport({ open, onClose, categories, onSaved }) {
  const [items, setItems] = useState([]);
  const [running, setRunning] = useState(false);
  const queueLock = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (!open) {
      itemsRef.current.forEach((item) => revokeBlobUrl(item.preview));
      setItems([]);
      setRunning(false);
      queueLock.current = false;
    }
  }, [open]);

  const patchItem = (id, patch) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const resolveSizeNames = (item, cats = categories) => {
    const leaf = cats.find((c) => String(c.id) === String(item.category_id));
    const parent = cats.find((c) => String(c.id) === String(item.parent_category_id))
      || (leaf?.parent_id ? cats.find((c) => String(c.id) === String(leaf.parent_id)) : null);
    return {
      leafName: leaf?.name || leaf?.slug || '',
      parentName: parent?.name || parent?.slug || '',
      leaf,
      parent,
    };
  };

  /**
   * Two separate APIs:
   *  1) Cloudinary upload (always runs first if needed)
   *  2) AI describe (optional — failure leaves the row editable / retriable)
   * A failed AI step never blocks the rest of the batch queue.
   */
  const processOne = async (item, { aiOnly = false } = {}) => {
    const file = item.file;
    if (!file && !item.thumbnail) {
      patchItem(item.id, { status: 'error', error: 'Missing image file' });
      return;
    }

    let compressed = file;
    let thumbnail = item.thumbnail || '';
    let images = Array.isArray(item.images) ? item.images : [];
    let preview = item.preview;

    // —— API 1: photo upload (skipped on “retry AI” when already uploaded) ——
    if (!aiOnly || !thumbnail) {
      if (!file) {
        patchItem(item.id, { status: 'error', error: 'Missing image file' });
        return;
      }
      try {
        patchItem(item.id, { status: 'uploading', error: '' });
        compressed = await compressImageFile(file).catch(() => file);
        const uploadData = new FormData();
        uploadData.append('images', compressed);
        const upRes = await adminUploadAPI.upload(uploadData);
        if (!upRes.data?.success) {
          throw new Error(upRes.data?.message || 'Upload failed');
        }
        const uploaded = upRes.data.data?.[0];
        const persistUrl = getPersistImageUrl(uploaded) || getUploadUrl(uploaded);
        const displayUrl = getImageSrc(uploaded, 'thumbnail') || getImageSrc(uploaded) || persistUrl;
        const imageJson = toImageJson(uploaded);
        thumbnail = persistUrl;
        images = imageJson ? [imageJson] : persistUrl ? [persistUrl] : [];
        preview = displayUrl || item.preview;
        patchItem(item.id, {
          thumbnail,
          images,
          preview,
          status: 'analyzing',
          error: '',
        });
      } catch (err) {
        console.error('[bulk-ai-upload]', err);
        patchItem(item.id, {
          status: 'error',
          error: apiErrorMessage(err, 'Photo upload failed. You can remove this row and try again.'),
        });
        return;
      }
    } else {
      patchItem(item.id, { status: 'analyzing', error: '' });
      if (file) {
        compressed = await compressImageFile(file).catch(() => file);
      }
    }

    // —— API 2: AI copy (failure → still ready for manual fill / retry) ——
    try {
      if (!compressed && file) {
        compressed = await compressImageFile(file).catch(() => file);
      }
      if (!compressed && !thumbnail) {
        throw new Error('No image available for AI');
      }

      const aiPayload = new FormData();
      if (compressed) {
        aiPayload.append('image', compressed);
      } else {
        // Fall back: re-fetch is not possible from URL alone without CORS; ask user to re-add
        throw new Error('Please re-add the photo to run AI again.');
      }
      const aiRes = await adminProductAPI.aiDescribe(aiPayload);
      if (!aiRes.data?.success) {
        throw new Error(aiRes.data?.message || AI_RETRY_MESSAGE);
      }
      const data = aiRes.data?.data || {};
      const matched = matchCategoryFromAi(categories, data);
      const leafName = matched.leafCat?.name || matched.leafCat?.slug || '';
      const parentName = matched.parentCat?.name || matched.parentCat?.slug || '';
      const colors = data.colors || [];
      let color_groups = colorGroupsFromAi(colors, leafName, parentName);
      if (!colors?.length) {
        color_groups = withAllSizesForCategory(color_groups, leafName, parentName);
      }

      const components = Array.isArray(data.components) && data.components.length
        ? normalizeSetComponents(data.components)
        : [];
      let description = data.description || '';
      if (components.length) {
        const appendix = buildSetDescriptionAppendix(components);
        if (appendix && !description.includes("What's included")) {
          description = `${description}\n\n${appendix}`.trim();
        }
      }
      const asSet = isSetsCategory(
        matched.leafCat?.name,
        matched.parentCat?.name,
        matched.leafCat?.slug,
        matched.parentCat?.slug,
      ) || components.length > 0;
      const price = asSet ? sumSetComponentsPrice(components) : '';

      patchItem(item.id, {
        status: 'ready',
        name: data.name || '',
        slug: data.slug || '',
        focus_description: data.focus_description || '',
        description,
        sku: buildProductSku(data.name || 'PRODUCT'),
        parent_category_id: matched.parent_category_id,
        category_id: matched.category_id,
        color_groups,
        set_components: components,
        price: price || '',
        thumbnail,
        images,
        preview,
        error: '',
      });
    } catch (err) {
      console.error('[bulk-ai-describe]', err);
      // Photo is already on Cloudinary — keep row editable; batch continues
      patchItem(item.id, {
        status: 'ready',
        thumbnail,
        images,
        preview,
        error: apiErrorMessage(err, AI_RETRY_MESSAGE),
        color_groups: item.color_groups?.length
          ? item.color_groups
          : withAllSizesForCategory(colorGroupsFromAi([], '', ''), '', ''),
      });
    }
  };

  const runQueue = async () => {
    if (queueLock.current) return;
    queueLock.current = true;
    setRunning(true);
    try {
      // Always process top → bottom; skip rows already ready/saved unless re-queued
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const next = itemsRef.current.find((row) => row.status === 'queued');
        if (!next) break;
        const aiOnly = Boolean(next._aiOnly && next.thumbnail);
        // clear one-shot flag before work
        if (next._aiOnly) patchItem(next.id, { _aiOnly: false });
        // eslint-disable-next-line no-await-in-loop
        await processOne(next, { aiOnly });
        // Pace AI calls so free-tier Gemini/Groq limits don't wipe out a 16-photo batch
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 2500));
      }
    } finally {
      queueLock.current = false;
      setRunning(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const hasQueued = items.some((i) => i.status === 'queued');
    if (hasQueued && !queueLock.current) {
      runQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => `${i.id}:${i.status}`).join('|'), open]);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('image/'));
    if (!files.length) {
      adminToast.info('Choose image files (JPEG, PNG, WebP).');
      return;
    }
    const next = files.map((file, i) => emptyDraft(file, items.length + i));
    setItems((prev) => [...prev, ...next]);
    adminToast.success(
      `${files.length} photo${files.length === 1 ? '' : 's'} queued — uploading & AI analyzing one by one.`
    );
  };

  const reanalyze = (id) => {
    const row = itemsRef.current.find((i) => i.id === id);
    if (!row) return;
    if (!row.file) {
      adminToast.info('Original photo is gone from this session. Remove the row and add the photo again.');
      return;
    }
    // Always re-queue AI; keep Cloudinary image if present
    patchItem(id, {
      status: 'queued',
      error: '',
      _aiOnly: Boolean(row.thumbnail),
    });
    adminToast.info('Re-running AI on this photo…');
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const row = prev.find((i) => i.id === id);
      if (row) revokeBlobUrl(row.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const saveOne = async (id) => {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    if (!item.category_id) {
      adminToast.error('Select a category before saving.');
      return;
    }
    if (!item.name?.trim()) {
      adminToast.error('Add a product name before saving.');
      return;
    }
    if (!item.thumbnail) {
      adminToast.error('Image is still uploading. Wait for upload to finish.');
      return;
    }

    patchItem(id, { status: 'saving', error: '' });
    try {
      const { leaf, parent } = resolveSizeNames(item);
      const asSet = isSetsCategory(leaf?.name, parent?.name, leaf?.slug, parent?.slug)
        || (item.set_components || []).length > 0;
      const components = normalizeSetComponents(item.set_components);
      const payload = {
        name: item.name,
        // Unique slug so batch rows with the same AI name never collide
        slug: uniqueSlug(item.slug || item.name),
        description: item.description || '',
        focus_description: item.focus_description || '',
        price: asSet ? sumSetComponentsPrice(components) : item.price || 0,
        discount_price: null,
        sku: item.sku || buildProductSku(item.name),
        category_id: item.category_id,
        stock_quantity: 0,
        is_featured: Boolean(item.is_featured),
        is_active: item.is_active !== false,
        thumbnail: item.thumbnail,
        images: item.images || [],
        brand_id: null,
        set_components: components,
        variants: asSet
          ? []
          : flattenColorGroups(item.color_groups).map((row) => ({ ...row, stock: 0 })),
      };

      await adminProductAPI.create(payload);
      patchItem(id, { status: 'saved', error: '' });
      adminToast.success(`Saved: ${item.name}`);
      onSaved?.();
    } catch (err) {
      patchItem(id, {
        status: 'ready',
        error: apiErrorMessage(err, 'Could not save product'),
      });
      adminToast.error(apiErrorMessage(err, 'Could not save product'));
    }
  };

  const saveAllReady = async () => {
    const ready = itemsRef.current.filter((i) => i.status === 'ready');
    for (const row of ready) {
      // eslint-disable-next-line no-await-in-loop
      await saveOne(row.id);
    }
  };

  if (!open) return null;

  const parentCategories = (categories || []).filter((c) => !c.parent_id);
  const readyCount = items.filter((i) => i.status === 'ready').length;
  const savedCount = items.filter((i) => i.status === 'saved').length;
  const pendingCount = items.filter((i) =>
    ['queued', 'uploading', 'analyzing'].includes(i.status)
  ).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-navy-950 border border-gold-500/20 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-gold-500/10 shrink-0">
          <div>
            <h3 className="text-lg font-serif font-bold text-gold-100 flex items-center gap-2">
              <Sparkles size={18} className="text-gold-400" />
              Add products
            </h3>
            <p className="text-[11px] text-gold-500/50 mt-1 max-w-xl">
              Drop one photo or a full batch. Each photo is uploaded first, then AI fills name,
              category, colours and SEO copy. Large batches are paced automatically so free AI
              rate limits don’t reject every remaining photo. If AI still fails on a row, fill
              fields manually or re-run AI — the rest of the queue keeps going.
            </p>
            <p className="text-[10px] text-gold-500/35 mt-1">
              {items.length} in queue · {pendingCount} processing · {readyCount} ready · {savedCount} saved
              {running ? ' · working…' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gold-500/50 hover:text-gold-200 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 border-b border-gold-500/10 shrink-0 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-600 text-navy-950 rounded-xl text-xs font-black tracking-wider cursor-pointer hover:bg-gold-500">
            <Upload size={16} />
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            disabled={!readyCount}
            onClick={saveAllReady}
            className="px-4 py-2.5 border border-gold-500/30 text-gold-200 rounded-xl text-xs font-bold disabled:opacity-40 hover:border-gold-500/50"
          >
            Save all ready ({readyCount})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 && (
            <label className="flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-gold-500/25 rounded-2xl cursor-pointer hover:border-gold-500/40 text-center px-6">
              <Upload size={28} className="text-gold-500/40" />
              <span className="text-sm text-gold-200/80 font-medium">Drop or choose product photos</span>
              <span className="text-[11px] text-gold-500/40">No 10-image cap — queue runs top to bottom safely</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {items.map((item, idx) => {
            const leaf = categories.find((c) => String(c.id) === String(item.category_id));
            const parentId = item.parent_category_id || leaf?.parent_id || item.category_id;
            const subs = categories.filter((c) => String(c.parent_id) === String(parentId));
            const { leafName, parentName } = resolveSizeNames(item);
            const sizeOptions = getSizeOptionsForCategory(leafName, parentName);
            const busy = ['uploading', 'analyzing', 'saving'].includes(item.status);

            return (
              <div
                key={item.id}
                className="border border-gold-500/15 rounded-2xl bg-navy-900/50 overflow-hidden"
              >
                <div className="flex gap-3 p-3 sm:p-4 items-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-navy-950 border border-gold-500/10 shrink-0">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gold-500/30 text-[10px]">
                        #{idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-gold-500/40">#{idx + 1}</span>
                      <span
                        className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border ${
                          item.status === 'ready' || item.status === 'saved'
                            ? 'border-emerald-500/40 text-emerald-300/90'
                            : item.status === 'error'
                              ? 'border-red-500/40 text-red-300/90'
                              : 'border-gold-500/30 text-gold-400'
                        }`}
                      >
                        {busy && <Loader2 size={10} className="inline animate-spin mr-1" />}
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                      {item.name && (
                        <span className="text-sm text-gold-100 font-semibold truncate">{item.name}</span>
                      )}
                    </div>
                    {item.error && (
                      <p className="text-[11px] text-amber-200/90 mt-1">
                        {item.error}
                        {item.thumbnail ? ' — photo is saved; fill details or re-run AI.' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Expand / collapse edit"
                      onClick={() => patchItem(item.id, { expanded: !item.expanded })}
                      className="p-2 text-gold-500/50 hover:text-gold-200"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      title="Re-run AI only"
                      disabled={busy || !item.file || item.status === 'saved'}
                      onClick={() => reanalyze(item.id)}
                      className="p-2 text-gold-500/50 hover:text-gold-200 disabled:opacity-30"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      disabled={busy}
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-400/60 hover:text-red-300 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {item.expanded && item.status !== 'queued' && (
                  <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-gold-500/10 pt-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-500/40 font-black">Name</label>
                        <input
                          value={item.name}
                          onChange={(e) => patchItem(item.id, { name: e.target.value })}
                          className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm outline-none focus:border-gold-500/30"
                          disabled={item.status === 'saved'}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-500/40 font-black">SKU</label>
                        <input
                          value={item.sku}
                          onChange={(e) => patchItem(item.id, { sku: e.target.value.toUpperCase() })}
                          className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm font-mono outline-none"
                          disabled={item.status === 'saved'}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-500/40 font-black">Category</label>
                        <select
                          value={item.parent_category_id || ''}
                          disabled={item.status === 'saved'}
                          onChange={(e) => {
                            const pid = e.target.value;
                            const parent = categories.find((c) => String(c.id) === String(pid));
                            const pname = parent?.name || parent?.slug || '';
                            patchItem(item.id, {
                              parent_category_id: pid,
                              category_id: pid,
                              color_groups: withAllSizesForCategory(
                                item.color_groups,
                                pname,
                                pname,
                              ),
                            });
                          }}
                          className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm"
                        >
                          <option value="">Select…</option>
                          {parentCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-500/40 font-black">Sub-category</label>
                        <select
                          value={item.category_id || ''}
                          disabled={item.status === 'saved' || !subs.length}
                          onChange={(e) => {
                            const cid = e.target.value;
                            const leafCat = categories.find((c) => String(c.id) === String(cid));
                            const parent = categories.find((c) =>
                              String(c.id) === String(item.parent_category_id)
                            );
                            patchItem(item.id, {
                              category_id: cid,
                              color_groups: withAllSizesForCategory(
                                item.color_groups,
                                leafCat?.name || leafCat?.slug || '',
                                parent?.name || parent?.slug || '',
                              ),
                            });
                          }}
                          className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm"
                        >
                          {!subs.length && <option value={item.category_id || ''}>Same as parent</option>}
                          {subs.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-500/40 font-black">Price (KES)</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => patchItem(item.id, { price: e.target.value })}
                          className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm outline-none"
                          disabled={item.status === 'saved'}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-500/40 font-black">Short SEO blurb</label>
                      <input
                        value={item.focus_description}
                        onChange={(e) => patchItem(item.id, { focus_description: e.target.value })}
                        className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm outline-none"
                        disabled={item.status === 'saved'}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-500/40 font-black">Description</label>
                      <textarea
                        rows={3}
                        value={item.description}
                        onChange={(e) => patchItem(item.id, { description: e.target.value })}
                        className="w-full bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm outline-none resize-y"
                        disabled={item.status === 'saved'}
                      />
                    </div>

                    {(item.color_groups || []).map((group) => (
                      <div key={group._key} className="border border-gold-500/10 rounded-xl p-3 space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            value={group.color}
                            placeholder="Colour / pattern (e.g. Navy Striped)"
                            disabled={item.status === 'saved'}
                            onChange={(e) => {
                              const color = e.target.value;
                              patchItem(item.id, {
                                color_groups: item.color_groups.map((g) =>
                                  g._key === group._key ? { ...g, color } : g
                                ),
                              });
                            }}
                            className="flex-1 min-w-[140px] bg-navy-950 border border-gold-500/15 rounded-lg py-2 px-3 text-gold-100 text-sm outline-none"
                          />
                        </div>
                        {sizeOptions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {sizeOptions.map((sz) => {
                              const on = (group.sizes || []).some(
                                (s) => String(s.size).toUpperCase() === String(sz).toUpperCase()
                              );
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  disabled={item.status === 'saved'}
                                  onClick={() => {
                                    const sizes = [...(group.sizes || [])];
                                    const idxSz = sizes.findIndex(
                                      (s) => String(s.size).toUpperCase() === String(sz).toUpperCase()
                                    );
                                    let nextSizes;
                                    if (idxSz >= 0) {
                                      nextSizes = sizes.filter((_, i) => i !== idxSz);
                                    } else {
                                      nextSizes = [
                                        ...sizes,
                                        {
                                          _key: Math.random().toString(36).slice(2),
                                          id: null,
                                          size: String(sz).toUpperCase(),
                                          stock: 0,
                                          price_override: '',
                                        },
                                      ];
                                    }
                                    patchItem(item.id, {
                                      color_groups: item.color_groups.map((g) =>
                                        g._key === group._key ? { ...g, sizes: nextSizes } : g
                                      ),
                                    });
                                  }}
                                  className={`px-2.5 py-1 text-[10px] rounded border ${
                                    on
                                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-200'
                                      : 'border-gold-500/20 text-gold-500/40'
                                  }`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {item.status !== 'saved' && (
                      <button
                        type="button"
                        disabled={busy || item.status === 'uploading' || item.status === 'analyzing'}
                        onClick={() => saveOne(item.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-600 text-navy-950 rounded-xl text-xs font-black tracking-wider disabled:opacity-40 hover:bg-gold-500"
                      >
                        <Check size={14} /> Save this product
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
