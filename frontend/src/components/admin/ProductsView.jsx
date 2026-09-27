import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ShoppingBag, Plus, Search, Trash2, Edit, X, Image as ImageIcon, Sparkles, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { adminToast, apiErrorMessage } from '../../lib/adminToast';
import { adminProductAPI, adminCategoryAPI, adminUploadAPI } from '../../services/api';
import { compressImageFile } from '../../utils/compressImage';
import {
  getPersistImageUrl, getImageSrc, parseProductImages, toImageJson,
  resolveDisplayImageUrl, revokeBlobUrl, isBlobUrl, getUploadUrl,
} from '../../utils/cloudinary';
import {
  newColorGroup, newSizeRow, flattenColorGroups, buildColorGroupsFromVariants,
  getSizeOptionsForCategory, withAllSizesForCategory, colorGroupsFromAi,
} from '../../utils/inventoryVariants';
import { useConfirm } from './ConfirmDialog';
import { isFullAdmin } from '../../utils/staffPermissions';
import AdminSectionErrorBoundary from './AdminSectionErrorBoundary';
import BulkAiProductImport from './BulkAiProductImport';
import {
  SET_CATEGORY_HINTS,
  newSetComponent,
  normalizeSetComponents,
  sumSetComponentsPrice,
  isSetsCategory,
  buildSetDescriptionAppendix,
} from '../../lib/setComponents';
import { CROSS_TAG_OPTIONS, MERCH_TAGS, LIMITED_MAX_UNITS, EDITORIAL_TAG_CAP } from '../../data/taxonomy';

const AdminTable = ({ children }) => (
  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">{children}</div>
);

const toStockIdPart = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const buildProductSku = (productName) => {
  const productPart = toStockIdPart(productName) || 'PRODUCT';
  return productPart;
};

const productImageUrl = (image, width = 96) => {
  if (!image) return '';
  let value = image;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('blob:')) return '';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        return resolveDisplayImageUrl(trimmed, { width }) || trimmed;
      }
    } else {
      return resolveDisplayImageUrl(trimmed, { width }) || getImageSrc(trimmed, 'thumbnail') || trimmed;
    }
  }
  if (typeof value === 'object') {
    return (
      resolveDisplayImageUrl(value, { width }) ||
      getImageSrc(value, 'thumbnail') ||
      value.thumbnail ||
      value.optimized ||
      value.url ||
      value.secure_url ||
      ''
    );
  }
  return '';
};

const sizesAvailableCount = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return 0;
  const sizes = new Set(
    variants
      .map((v) => String(v.size || v.value || '').split('/')[0].trim())
      .filter(Boolean)
  );
  return sizes.size || variants.length;
};

const ProductsView = () => {
  const confirm = useConfirm();
  const authUser = useAuthStore((s) => s.user);
  const staffUser = authUser?.role === 'staff';
  const canPublish = isFullAdmin(authUser);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [bulkAiOpen, setBulkAiOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    focus_description: '',
    price: '',
    discount_price: '',
    cost_price: '',
    inventory_opening_qty: '',
    show_offer: false,
    sku: '',
    parent_category_id: '',
    category_id: '',
    cross_tags: [],
    merch_tags: [],
    bespoke_lead_time_days: 14,
    stock_quantity: 0,
    is_featured: false,
    is_active: true,
    thumbnail: '',
    images: [], // This will store the final URLs for saving
    color_groups: [newColorGroup('')],
    thumbnailFile: null,
    thumbnailPreview: '',
    gallery: [], // Combined state: { id, preview, url, isUploading }
    set_components: [],
  });

  const toggleCrossTag = (slug) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.cross_tags) ? prev.cross_tags : [];
      const next = current.includes(slug)
        ? current.filter((t) => t !== slug)
        : [...current, slug];
      return { ...prev, cross_tags: next };
    });
  };

  const toggleMerchTag = (id) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.merch_tags) ? prev.merch_tags : [];
      const isOn = current.includes(id);
      if (!isOn && id === 'limited') {
        const stock = Number(prev.stock_quantity) || 0;
        if (stock > LIMITED_MAX_UNITS) {
          adminToast.error(
            `Limited is blocked while stock is above ${LIMITED_MAX_UNITS} units (current: ${stock}). Drop stock to ${LIMITED_MAX_UNITS} or below, then add Limited.`
          );
          return prev;
        }
      }
      const next = isOn ? current.filter((t) => t !== id) : [...current, id];
      return { ...prev, merch_tags: next };
    });
  };

  const normalizeMerchIds = (tags) => {
    const alias = {
      'editors-choice': 'editors_choice',
      'presidential-pick': 'presidential_pick',
      new: null,
    };
    return [...new Set(
      (Array.isArray(tags) ? tags : [])
        .map((t) => {
          const key = String(t).toLowerCase();
          if (key in alias) return alias[key];
          return key;
        })
        .filter(Boolean)
    )];
  };

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    const skipUppercase = ['thumbnail', 'slug', 'description', 'focus_description', 'image', 'logo', 'url', 'email', 'phone'];
    if (typeof value === 'string' && !skipUppercase.some(s => field.toLowerCase().includes(s))) {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [field]: value });
  };

  const removeGalleryFile = (index) => {
    const nextGallery = [...formData.gallery];
    const removedItem = nextGallery.splice(index, 1)[0];
    
    // Revoke blob if needed
    if (removedItem.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(removedItem.preview);
    }

    // Also update images array which is used for saving
    const nextImages = nextGallery.map(item => item.url).filter(Boolean);
    
    setFormData({ 
        ...formData, 
        gallery: nextGallery,
        images: nextImages
    });
  };

  const revokeFormBlobPreviews = (data) => {
    revokeBlobUrl(data.thumbnailPreview);
    (data.gallery || []).forEach((item) => revokeBlobUrl(item.preview));
  };

  const closeProductModal = () => {
    revokeFormBlobPreviews(formData);
    setIsModalOpen(false);
  };

  const removeThumbnail = () => {
    revokeBlobUrl(formData.thumbnailPreview);
    setFormData({ ...formData, thumbnail: '', thumbnailPreview: '', thumbnailFile: null });
  };

  const AI_RETRY_MESSAGE =
    'We could not finish reading that photo just now. Please wait about a minute, then try again.';

  const NAME_COLOR_PHRASES = [
    'Dark Brown', 'Light Brown', 'Dark Blue', 'Light Blue', 'Dark Grey', 'Light Grey',
    'Charcoal', 'Burgundy', 'Chocolate', 'Espresso', 'Mustard', 'Khaki', 'Camel', 'Stone',
    'Sand', 'Beige', 'Cream', 'Ivory', 'Navy', 'Black', 'Brown', 'Tan', 'Olive', 'Grey',
    'Gray', 'White', 'Maroon', 'Green', 'Blue', 'Red', 'Wine', 'Rust', 'Orange', 'Purple',
    'Silver', 'Gold', 'Slate', 'Indigo', 'Teal',
  ];

  const inferColorsFromName = (name = '') => {
    const lower = String(name || '').toLowerCase();
    if (!lower) return [];
    return NAME_COLOR_PHRASES.filter((phrase) => lower.includes(phrase.toLowerCase()));
  };

  const applyAiColors = (prevGroups, colors, productName = '', leafName = '', parentName = '') => {
    let list = Array.isArray(colors)
      ? colors.map((c) => String(c || '').trim()).filter((c) => c && c.toLowerCase() !== 'original')
      : [];
    if (!list.length) list = inferColorsFromName(productName);
    if (!list.length) {
      // Still preselect all business sizes for empty colour groups when category known
      if (leafName || parentName) {
        return withAllSizesForCategory(prevGroups, leafName, parentName);
      }
      return prevGroups;
    }

    const groups = Array.isArray(prevGroups) ? prevGroups : [];
    const isPlaceholder = (g) => {
      const c = String(g?.color || '').trim().toLowerCase();
      return !c || c === 'original';
    };

    if (list.length === 1 && groups.length === 1 && isPlaceholder(groups[0])) {
      const next = [{ ...groups[0], color: list[0] }];
      return withAllSizesForCategory(next, leafName, parentName);
    }

    // Prefer AI colour entries with all sizes for this category
    if (leafName || parentName) {
      return colorGroupsFromAi(list, leafName, parentName);
    }

    const existingByColor = new Map(
      groups.map((g) => [String(g.color || '').trim().toLowerCase(), g])
    );
    const next = list.map((colorName) => {
      const key = colorName.toLowerCase();
      const existing = existingByColor.get(key);
      if (existing) return { ...existing, color: colorName };
      return newColorGroup(colorName);
    });

    const placeholder = groups.find((g) => isPlaceholder(g) && (g.sizes || []).length > 0);
    if (placeholder && next[0] && !(next[0].sizes || []).length) {
      next[0] = { ...next[0], sizes: placeholder.sizes };
    }
    return next;
  };

  const resolveCategoryFromAi = (data = {}) => {
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
      leaf,
      parent,
    };
  };

  const runAiDescribe = async (file) => {
    if (!file) return;
    setAiGenerating(true);
    setAiError('');
    try {
      const payload = new FormData();
      payload.append('image', file);
      const selectedCategory = categories.find((c) => String(c.id) === String(formData.category_id));
      const selectedParent = categories.find((c) => String(c.id) === String(formData.parent_category_id));
      if (selectedCategory?.name) payload.append('category_name', selectedCategory.name);
      else if (selectedParent?.name) payload.append('category_name', selectedParent.name);

      const res = await adminProductAPI.aiDescribe(payload);
      const data = res.data?.data || {};
      const aiColors = data.colors || data.colour || data.colours || [];
      const matched = resolveCategoryFromAi(data);
      setFormData((prev) => {
        // Prefer explicit admin selection if already set; else use AI match
        const category_id = prev.category_id || matched.category_id;
        const parent_category_id = prev.parent_category_id || matched.parent_category_id;
        const leaf = categories.find((c) => String(c.id) === String(category_id)) || matched.leaf;
        const parent = categories.find((c) => String(c.id) === String(parent_category_id)) || matched.parent;
        const leafName = leaf?.name || leaf?.slug || '';
        const parentName = parent?.name || parent?.slug || '';

        const nextComponents = Array.isArray(data.components) && data.components.length
          ? normalizeSetComponents(data.components)
          : prev.set_components;
        const nextPrice = nextComponents.length
          ? sumSetComponentsPrice(nextComponents)
          : prev.price;
        let nextDescription = data.description || prev.description;
        if (nextComponents.length) {
          const appendix = buildSetDescriptionAppendix(nextComponents);
          if (appendix && !String(nextDescription).includes("What's included")) {
            nextDescription = `${nextDescription}\n\n${appendix}`.trim();
          }
        }
        return {
          ...prev,
          name: data.name || prev.name,
          slug: data.slug || prev.slug,
          focus_description: data.focus_description || prev.focus_description,
          description: nextDescription,
          sku: prev.sku || buildProductSku(data.name || prev.name),
          parent_category_id,
          category_id,
          color_groups: applyAiColors(
            prev.color_groups,
            aiColors,
            data.name || prev.name,
            leafName,
            parentName,
          ),
          set_components: nextComponents,
          price: nextPrice === 0 || nextPrice === '' ? prev.price : nextPrice,
        };
      });
      const appliedColors = applyAiColors(
        [{ color: 'Original', sizes: [] }],
        aiColors,
        data.name || '',
        matched.leaf?.name || '',
        matched.parent?.name || '',
      ).map((g) => g.color).filter((c) => c && c.toLowerCase() !== 'original');
      const colorNote = appliedColors.length
        ? ` and colour${appliedColors.length > 1 ? 's' : ''} (${appliedColors.join(', ')})`
        : '';
      const setNote = Array.isArray(data.components) && data.components.length
        ? ` and ${data.components.length} set piece${data.components.length === 1 ? '' : 's'}`
        : '';
      const catNote = (!formData.category_id && matched.category_id)
        ? ' and category'
        : '';
      adminToast.success(`AI filled name, slug, SEO description${catNote}${colorNote}${setNote}. All sizes for the category selected — remove any you don't stock.`);
    } catch (error) {
      console.error('AI describe failed:', error);
      const raw = apiErrorMessage(error) || '';
      const msg = /json|model|api|groq|gemini|timeout|network|failed|error/i.test(raw)
        ? AI_RETRY_MESSAGE
        : (raw || AI_RETRY_MESSAGE);
      setAiError(msg);
      adminToast.info(msg);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleThumbnailChange = async (e) => {
    const rawFile = e.target.files[0];
    if (rawFile) {
      setUploading(true);
      const file = await compressImageFile(rawFile).catch(() => rawFile);
      const localPreview = URL.createObjectURL(file);
      setFormData((prev) => {
        revokeBlobUrl(prev.thumbnailPreview);
        return {
          ...prev,
          thumbnailFile: file,
          thumbnailPreview: localPreview,
          thumbnail: prev.thumbnail && !isBlobUrl(prev.thumbnail) ? prev.thumbnail : '',
        };
      });

      // Kick off AI copy as soon as the photo is chosen (parallel with Cloudinary upload)
      runAiDescribe(file);

      const uploadData = new FormData();
      uploadData.append('images', file);
      try {
        const res = await adminUploadAPI.upload(uploadData);
        if (res.data.success) {
          const uploaded = res.data.data[0];
          const persistUrl = getPersistImageUrl(uploaded) || getUploadUrl(uploaded);
          setFormData((prev) => {
            revokeBlobUrl(prev.thumbnailPreview);
            return {
              ...prev,
              thumbnail: persistUrl,
              thumbnailPreview: getImageSrc(uploaded, 'thumbnail') || getImageSrc(uploaded),
            };
          });
        }
      } catch (error) {
        console.error('Thumbnail upload failed:', error);
        adminToast.info('Image could not be uploaded. You can still save the product — add the image later or configure Cloudinary.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleGalleryChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    e.target.value = '';

    setUploading(true);
    const files = await Promise.all(
      rawFiles.map((f) => compressImageFile(f).catch(() => f))
    );

    const newItems = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      url: null,
      isUploading: true,
      file,
    }));

    setFormData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...newItems],
    }));

    try {
      for (const item of newItems) {
        try {
          const uploadData = new FormData();
          uploadData.append('images', item.file);
          const res = await adminUploadAPI.upload(uploadData);
          if (!res.data?.success) throw new Error(res.data?.message || 'Upload failed');
          const uploaded = res.data.data?.[0];
          const url = getPersistImageUrl(uploaded) || getUploadUrl(uploaded);
          setFormData((prev) => {
            const updatedGallery = prev.gallery.map((g) => {
              if (g.id !== item.id) return g;
              revokeBlobUrl(g.preview);
              return {
                ...g,
                url,
                urlJson: toImageJson(uploaded),
                preview: getImageSrc(uploaded, 'thumbnail') || getImageSrc(uploaded) || url,
                isUploading: false,
                file: undefined,
              };
            });
            return {
              ...prev,
              gallery: updatedGallery,
              images: updatedGallery.map((i) => i.urlJson || toImageJson(i.url)).filter(Boolean),
            };
          });
        } catch (err) {
          console.error('Gallery image upload failed:', err);
          setFormData((prev) => {
            const failed = prev.gallery.find((g) => g.id === item.id);
            if (failed) revokeBlobUrl(failed.preview);
            return {
              ...prev,
              gallery: prev.gallery.filter((g) => g.id !== item.id),
              images: prev.gallery
                .filter((g) => g.id !== item.id)
                .map((i) => i.urlJson || toImageJson(i.url))
                .filter(Boolean),
            };
          });
          adminToast.info('One gallery photo could not upload; others continue.');
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const totalVariantStock = (groups) =>
    (groups || []).reduce(
      (sum, group) => sum + (group.sizes || []).reduce((s, row) => s + (parseInt(row.stock, 10) || 0), 0),
      0
    );

  const addSizeToGroup = (groupKey, size) => {
    const nextSize = String(size || '').trim().toUpperCase();
    if (!nextSize) return;
    setFormData((prev) => {
      const color_groups = prev.color_groups.map((group) => {
        if (group._key !== groupKey) return group;
        if (group.sizes.some((row) => row.size === nextSize)) return group;
        return { ...group, sizes: [...group.sizes, newSizeRow(nextSize)] };
      });
      return { ...prev, color_groups, stock_quantity: totalVariantStock(color_groups) };
    });
    setCustomSize('');
  };

  const updateSizeInGroup = (groupKey, sizeKey, field, value) => {
    setFormData((prev) => {
      const color_groups = prev.color_groups.map((group) => {
        if (group._key !== groupKey) return group;
        return {
          ...group,
          sizes: group.sizes.map((row) => (row._key === sizeKey ? { ...row, [field]: value } : row)),
        };
      });
      return {
        ...prev,
        color_groups,
        stock_quantity: field === 'stock' ? totalVariantStock(color_groups) : prev.stock_quantity,
      };
    });
  };

  const removeSizeFromGroup = (groupKey, sizeKey) => {
    setFormData((prev) => {
      const color_groups = prev.color_groups.map((group) => {
        if (group._key !== groupKey) return group;
        return { ...group, sizes: group.sizes.filter((row) => row._key !== sizeKey) };
      });
      return { ...prev, color_groups, stock_quantity: totalVariantStock(color_groups) };
    });
  };

  const handleColorImage = async (groupKey, e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    const file = await compressImageFile(rawFile).catch(() => rawFile);
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      color_groups: prev.color_groups.map((group) =>
        group._key === groupKey ? { ...group, imagePreview: localPreview } : group
      ),
    }));
    const uploadData = new FormData();
    uploadData.append('images', file);
    try {
      const res = await adminUploadAPI.upload(uploadData);
      if (res.data.success) {
        const uploaded = res.data.data[0];
        const url = getPersistImageUrl(uploaded) || getUploadUrl(uploaded);
        setFormData((prev) => ({
          ...prev,
          color_groups: prev.color_groups.map((group) => {
            if (group._key !== groupKey) return group;
            revokeBlobUrl(group.imagePreview);
            return {
              ...group,
              image_url: url,
              imagePreview: getImageSrc(uploaded, 'thumbnail') || getImageSrc(uploaded),
            };
          }),
        }));
      }
    } catch {
      adminToast.error('Color image upload failed.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminProductAPI.getAll({ lite: 1 }),
        adminCategoryAPI.getAll(),
      ]);
      const nextProducts = prodRes?.data?.data;
      const nextCategories = catRes?.data?.data;
      setProducts(Array.isArray(nextProducts) ? nextProducts : []);
      setCategories(Array.isArray(nextCategories) ? nextCategories : []);
      if (!Array.isArray(nextProducts) || !Array.isArray(nextCategories)) {
        adminToast.error('Could not load products. Please refresh and try again.');
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      setProducts([]);
      setCategories([]);
      adminToast.error(apiErrorMessage(error, 'Could not load products'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const PARENT_CATEGORY_ORDER = [
    'polo-t-shirts', 'shoes', 'shirts', 'suits', 'blazers', 'track-suits',
    'jackets', 'vests', 'boxers', 'trousers', 'linen', 'sets', 'caps-hats',
    'belts-ties', 'sweaters', 't-shirts',
  ];

  const parentCategories = (Array.isArray(categories) ? categories : [])
    .filter((category) => !category.parent_id)
    .sort((a, b) => {
      const ai = PARENT_CATEGORY_ORDER.indexOf(a.slug);
      const bi = PARENT_CATEGORY_ORDER.indexOf(b.slug);
      if (ai === -1 && bi === -1) return (a.name || '').localeCompare(b.name || '');
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  const selectedParentCategory = (Array.isArray(categories) ? categories : []).find((category) => category.id === formData.parent_category_id);
  const selectedCategory = (Array.isArray(categories) ? categories : []).find((category) => category.id === formData.category_id);
  const subCategories = formData.parent_category_id
    ? (Array.isArray(categories) ? categories : [])
        .filter((category) => category.parent_id === formData.parent_category_id)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    : [];
  const sizeOptions = getSizeOptionsForCategory(
    selectedCategory?.name || selectedCategory?.slug || '',
    selectedParentCategory?.name || selectedParentCategory?.slug || '',
  );
  const editingAsSet = isSetsCategory(
    selectedCategory?.name,
    selectedParentCategory?.name,
    selectedCategory?.slug,
    selectedParentCategory?.slug,
  );
  const setTotalPrice = sumSetComponentsPrice(formData.set_components);

  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !(
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    )) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    if (statusFilter === 'active' && !p.is_active) return false;
    if (statusFilter === 'inactive' && p.is_active) return false;
    return true;
  });

  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredProducts.forEach((p) => next.delete(p.id));
      } else {
        filteredProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulkAction = async (action) => {
    const ids = [...selectedIds];
    if (!ids.length) return;

    if (action === 'delete') {
      const ok = await confirm({
        title: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}`,
        message:
          `Permanently remove ${ids.length} selected product${ids.length === 1 ? '' : 's'} from your store? This cannot be undone.`,
        confirmLabel: `Delete ${ids.length}`,
        variant: 'danger',
      });
      if (!ok) return;
    }

    setBulkBusy(true);
    try {
      await adminProductAPI.bulkAction({ ids, action });
      if (action === 'delete') {
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        adminToast.success(`${ids.length} product${ids.length === 1 ? '' : 's'} removed`);
      } else {
        const patchByAction = {
          publish: { is_active: true },
          unpublish: { is_active: false },
        };
        const patch = patchByAction[action];
        if (patch) {
          setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, ...patch } : p)));
          adminToast.success('Products updated');
        }
      }
      clearSelection();
    } catch (error) {
      adminToast.error(apiErrorMessage(error, 'Bulk action failed'));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleCategorySelect = (category) => {
    const parentName = category.name || category.slug || '';
    setFormData((prev) => ({
      ...prev,
      parent_category_id: category.id,
      category_id: category.id,
      sizeRows: [],
      stock_quantity: 0,
      // New products: start with every business size selected
      color_groups: currentProduct
        ? prev.color_groups
        : withAllSizesForCategory(prev.color_groups, parentName, parentName),
    }));
  };

  const handleSubCategorySelect = (category) => {
    const parent = categories.find((c) => String(c.id) === String(formData.parent_category_id));
    const leafName = category.name || category.slug || '';
    const parentName = parent?.name || parent?.slug || '';
    setFormData((prev) => ({
      ...prev,
      category_id: category.id,
      color_groups: currentProduct
        ? [newColorGroup('')]
        : withAllSizesForCategory(
            prev.color_groups.map((g) => ({
              ...g,
              // keep colour names when switching leaf under same product draft
            })),
            leafName,
            parentName,
          ),
      stock_quantity: 0,
    }));
  };

  const handleOpenModal = (product = null) => {
    const productCategory = categories.find((category) => category.id === product?.category_id);
    const parentCategoryId = productCategory?.parent_id || productCategory?.id || '';
    const productColorGroups = buildColorGroupsFromVariants(Array.isArray(product?.variants) ? product.variants : []);
    const productSku = product?.sku || product?.variants?.find((variant) => variant.sku || variant.stock_id)?.sku || product?.variants?.find((variant) => variant.stock_id)?.stock_id || buildProductSku(product?.name);

    if (product) {
      setCurrentProduct(product);
      setCustomSize('');
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        focus_description: product.focus_description || '',
        price: product.price || '',
        discount_price: product.discount_price || '',
        cost_price: product.cost_price ?? '',
        show_offer: Boolean(product.discount_price),
        sku: productSku,
        parent_category_id: parentCategoryId,
        category_id: product.category_id || '',
        cross_tags: Array.isArray(product.cross_tags) ? product.cross_tags : [],
        merch_tags: normalizeMerchIds(product.merch_tags),
        bespoke_lead_time_days: product.bespoke_lead_time_days ?? 14,
        stock_quantity: totalVariantStock(productColorGroups) || product.stock_quantity || 0,
        is_featured: product.is_featured || false,
        is_active: product.is_active ?? true,
        thumbnail: product.thumbnail || '',
        images: Array.isArray(product.images) ? product.images : [],
        thumbnailFile: null,
        thumbnailPreview: productImageUrl(product.thumbnail, 400),
        gallery: parseProductImages(product.images).map((img) => {
          const src = productImageUrl(img, 400) || getImageSrc(img);
          return {
            id: Math.random().toString(36).substring(7),
            preview: src,
            url: src,
            urlJson: img,
            isUploading: false,
          };
        }).filter((item) => item.preview),
        color_groups: productColorGroups.map((group) => ({
          ...group,
          imagePreview: productImageUrl(group.image_url || group.imagePreview, 160) || group.imagePreview || '',
        })),
        set_components: normalizeSetComponents(product.set_components),
      });
    } else {
      setCurrentProduct(null);
      setCustomSize('');
      setFormData({
        name: '',
        slug: '',
        description: '',
        focus_description: '',
        price: '',
        discount_price: '',
        cost_price: '',
        show_offer: false,
        sku: '',
        parent_category_id: '',
        category_id: '',
        cross_tags: [],
        merch_tags: [],
        bespoke_lead_time_days: 14,
        stock_quantity: 0,
        is_featured: false,
        is_active: true,
        thumbnail: '',
        images: [],
        color_groups: [newColorGroup('')],
        thumbnailFile: null,
        thumbnailPreview: '',
        gallery: [],
        set_components: [],
      });
    }
    setAiError('');
    setAiGenerating(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete product',
      message: 'This product will be permanently removed from your store. This action cannot be undone.',
      confirmLabel: 'Delete product',
      variant: 'danger',
    });
    if (!ok) return;

    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await adminProductAPI.remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      adminToast.success('Product removed');
    } catch (error) {
      adminToast.error(apiErrorMessage(error, 'Could not delete this product'));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      adminToast.error('Please select a home category before saving this product.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData };
      const components = normalizeSetComponents(formData.set_components);
      const asSet = editingAsSet || components.length > 0;
      payload.set_components = components;
      payload.cross_tags = Array.isArray(formData.cross_tags)
        ? [...new Set(formData.cross_tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))]
        : [];
      payload.merch_tags = normalizeMerchIds(formData.merch_tags);
      payload.bespoke_lead_time_days = payload.merch_tags.includes('bespoke')
        ? (Number(formData.bespoke_lead_time_days) > 0
            ? Math.round(Number(formData.bespoke_lead_time_days))
            : 14)
        : null;
      if (asSet) {
        payload.price = sumSetComponentsPrice(components);
        payload.variants = [];
        payload.stock_quantity = 0;
      } else {
        payload.variants = flattenColorGroups(formData.color_groups).map((row) => ({ ...row, stock: 0 }));
        payload.stock_quantity = sizeOptions.length ? 0 : Number(formData.stock_quantity || currentProduct?.stock_quantity || 0);
      }
      payload.brand_id = null;

      // Remove frontend-only state fields
      delete payload.thumbnailPreview;
      delete payload.galleryPreviews;
      delete payload.gallery;
      delete payload.thumbnailFile;
      delete payload.galleryFiles;
      delete payload.galleryPreviews;
      delete payload.color_groups;
      delete payload.parent_category_id;
      delete payload.show_offer;
      if (currentProduct) {
        payload.cost_price = formData.cost_price !== '' && formData.cost_price != null
          ? Number(formData.cost_price)
          : null;
        payload.discount_price = null;
      } else {
        delete payload.cost_price;
        payload.discount_price = formData.show_offer ? formData.discount_price || null : null;
      }
      if (typeof payload.thumbnail === 'string' && payload.thumbnail.startsWith('blob:')) {
        payload.thumbnail = '';
      }
      payload.images = (payload.images || []).filter((img) => {
        const url = typeof img === 'string' ? img : img?.url;
        return url && !String(url).startsWith('blob:');
      });
      delete payload.inventory_opening_qty;

      if (asSet && !components.length) {
        adminToast.error('Add at least one piece in the set (trousers, shirt, shoes, etc.) with a price.');
        setSubmitting(false);
        return;
      }

      if (currentProduct) {
        await adminProductAPI.update(currentProduct.id, payload);
      } else {
        await adminProductAPI.create(payload);
      }
      closeProductModal();
      fetchData();
      window.dispatchEvent(new Event('inventory:reload'));
      adminToast.success(currentProduct ? 'Product updated' : 'Product added');
    } catch (error) {
      console.error('Error saving product:', error);
      adminToast.error(apiErrorMessage(error, 'Error saving product'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-gold-100  ">
            Products ({filteredProducts.length}{filteredProducts.length !== products.length ? ` of ${products.length}` : ''})
          </h3>
          <p className="text-xs text-gold-500/50 mt-1">
            Add product details, photos, and available sizes. Availability is based on sizes you add — not stock counts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setBulkAiOpen(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-black tracking-[0.2em] hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20 text-xs sm:text-sm"
          >
            <Plus size={20} />
            <Sparkles size={18} />
            Add Product
          </button>
        </div>
      </div>

      <BulkAiProductImport
        open={bulkAiOpen}
        onClose={() => setBulkAiOpen(false)}
        categories={categories}
        onSaved={fetchData}
      />

      <div className="flex flex-wrap gap-3 p-4 bg-navy-900/40 border border-gold-500/10 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/40" size={14} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, SKU, slugâ€¦"
            className="w-full pl-9 pr-3 py-2.5 bg-navy-950 border border-gold-500/20 rounded-xl text-white text-sm outline-none focus:border-gold-500/40"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-navy-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-white text-sm min-w-[160px]"
        >
          <option value="">All categories</option>
          { (Array.isArray(categories) ? categories : []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-navy-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-white text-sm"
        >
          <option value="all">All status</option>
          <option value="active">Published</option>
          <option value="inactive">Unpublished</option>
        </select>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gold-600/10 border border-gold-500/30 rounded-2xl">
          <span className="text-sm font-bold text-gold-200">
            {selectedCount} selected
          </span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulkAction('publish')}
            className="px-3 py-1.5 text-xs font-black   border border-green-500/30 text-green-400 rounded-lg hover:bg-navy-800/50 disabled:opacity-50"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulkAction('unpublish')}
            className="px-3 py-1.5 text-xs font-black   border border-gold-500/20 text-gold-500/60 rounded-lg hover:bg-navy-800/50 disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulkAction('delete')}
            className="px-3 py-1.5 text-xs font-black   border border-red-500/40 text-red-400 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
          >
            <Trash2 size={12} className="inline mr-1 -mt-0.5" />
            Delete selected
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={clearSelection}
            className="ml-auto text-xs text-gold-500/50 hover:text-gold-400 underline"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="bg-navy-900/40 border border-gold-500/10 rounded-2xl overflow-hidden backdrop-blur-sm text-gold-100">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <AdminTable>
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-navy-800/50">
              <tr className="text-[10px] font-bold text-gold-500/40  tracking-[0.2em]">
                <th className="px-4 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    aria-label="Select all filtered products"
                    className="w-4 h-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                  />
                </th>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Sizes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {filteredProducts.map((p) => {
                const variantColors = [...new Set((p.variants || []).map((v) => v.color).filter(Boolean))];
                const sizeCount = sizesAvailableCount(p);
                const thumbUrl = productImageUrl(p.thumbnail, 96);
                return (
                <tr
                  key={p.id}
                  className={`hover:bg-navy-800/30 transition-colors ${selectedIds.has(p.id) ? 'bg-gold-600/5' : ''}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelected(p.id)}
                      aria-label={`Select ${p.name}`}
                      className="w-4 h-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-navy-800 rounded-xl border border-gold-500/10 overflow-hidden flex items-center justify-center shrink-0">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <ShoppingBag size={24} className={`text-gold-500/40 ${thumbUrl ? 'hidden' : ''}`} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gold-100 ">{p.name}</div>
                        <div className="text-[10px] font-mono text-gold-500/40  mt-1">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-gold-500/70 ">{p.sku || '—'}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-gold-500/60 ">{p.category_name || 'Uncategorized'}</td>
                  <td className="px-6 py-4 font-bold text-gold-100">KSh {parseFloat(p.price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className={`text-[10px] font-black ${sizeCount > 0 ? 'text-green-400' : 'text-gold-500/50'}`}>
                      {sizeCount > 0 ? `${sizeCount} size${sizeCount !== 1 ? 's' : ''} available` : 'No sizes set'}
                    </div>
                    {variantColors.length > 0 && (
                      <p className="text-[9px] text-gold-500/40 mt-1  tracking-wider">
                        {variantColors.length} color{variantColors.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold  px-2 py-1 rounded-full ${p.is_active ? 'bg-green-400/10 text-green-400' : 'bg-navy-800 text-gold-500/30'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingIds.has(p.id)}
                        className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-40"
                      >
                        {deletingIds.has(p.id) ? (
                          <span className="inline-block w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          </AdminTable>
        ) : (
          <div className="py-24 text-center text-gold-500/40 text-sm  ">
            No products match your filters.
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 bg-navy-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy-900 border border-gold-500/20 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-2xl font-serif font-bold text-gold-100  ">
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h4>
              <button type="button" onClick={closeProductModal} className="text-gold-500/40 hover:text-gold-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Info */}
              <div className="space-y-6">
                <h5 className="text-xs font-black text-gold-500  tracking-[0.3em] border-b border-gold-500/10 pb-2">General Information</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40   font-black">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData({
                          ...formData,
                          name: val,
                          slug: val.toLowerCase().replace(/ /g, '-'),
                          sku: formData.sku ? formData.sku : buildProductSku(val),
                        });
                      }}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold "
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40   font-black">Slug</label>
                    <input 
                      type="text" 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {currentProduct ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gold-500/40   font-black">
                          {editingAsSet ? 'Set total (KSh)' : 'Retail Price (KSh)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          required={!editingAsSet}
                          readOnly={editingAsSet}
                          value={editingAsSet ? setTotalPrice : formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className={`w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold ${editingAsSet ? 'opacity-80' : ''}`}
                        />
                        {editingAsSet && (
                          <p className="text-[9px] text-gold-500/40">Auto-sum of set piece prices</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gold-500/40   font-black">Cost Price (KSh)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                          placeholder="What you paid"
                          className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                        />
                      </div>
                      <div className="md:col-span-2 rounded-xl border border-gold-500/10 bg-navy-950/80 p-4 flex flex-col justify-center">
                        <p className="text-[10px] text-gold-500/40 font-black mb-1">Profit estimate</p>
                        {(() => {
                          const retail = Number(formData.price) || 0;
                          const cost = Number(formData.cost_price) || 0;
                          const profit = retail - cost;
                          const margin = retail > 0 ? ((profit / retail) * 100).toFixed(1) : '0.0';
                          return (
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="text-green-400 font-bold">KSh {profit.toLocaleString()}</span>
                              <span className="text-gold-500/60">Margin {margin}%</span>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gold-500/40   font-black">
                          {editingAsSet ? 'Set total (KSh)' : 'Website Price (KSh)'}
                        </label>
                        <input
                          type="number"
                          required={!editingAsSet}
                          readOnly={editingAsSet}
                          value={editingAsSet ? setTotalPrice : formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className={`w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold ${editingAsSet ? 'opacity-80' : ''}`}
                        />
                      </div>
                    </>
                  )}
                </div>

                {!currentProduct && (
                <div className="rounded-2xl border border-gold-500/10 bg-navy-950/60 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black  tracking-[0.25em] text-gold-400">Offers</p>
                      <p className="text-[9px]  tracking-wider text-gold-500/35 mt-1">
                        Discount price only — does not add a Sale badge. Use Sale Catalog to put items on /sale.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        show_offer: !formData.show_offer,
                        discount_price: formData.show_offer ? '' : formData.discount_price
                      })}
                      className={`relative h-8 w-16 rounded-full border transition-all ${formData.show_offer ? 'bg-gold-600 border-gold-500' : 'bg-navy-900 border-gold-500/20'}`}
                      aria-pressed={formData.show_offer}
                    >
                      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${formData.show_offer ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>

                  {formData.show_offer && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-500/40   font-black">Offer Price (KSh)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                        className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                      />
                    </div>
                  )}
                </div>
                )}

                <div className="rounded-2xl border border-gold-500/10 bg-navy-950/60 p-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-black  tracking-[0.25em] text-gold-400">Home category</p>
                    <p className="text-[9px]  tracking-wider text-gold-500/35 mt-1">One home only — SEO, Meta feed, and canonical URL use this. Tick a primary, then a subcategory when it applies.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {parentCategories.map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                          formData.parent_category_id === category.id
                            ? 'border-gold-500 bg-gold-600/10 text-gold-100'
                            : 'border-gold-500/10 bg-navy-900/50 text-gold-500/60 hover:border-gold-500/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.parent_category_id === category.id}
                          onChange={() => handleCategorySelect(category)}
                          className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                        />
                        <span className="text-[10px] font-black  ">{category.name}</span>
                      </label>
                    ))}
                  </div>

                  {subCategories.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gold-500/10">
                      <p className="text-[9px] font-black  tracking-[0.25em] text-gold-500/50">Subcategory</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {subCategories.map((category) => (
                          <label
                            key={category.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                              formData.category_id === category.id
                                ? 'border-gold-500 bg-gold-600/10 text-gold-100'
                                : 'border-gold-500/10 bg-navy-900/50 text-gold-500/60 hover:border-gold-500/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.category_id === category.id}
                              onChange={() => handleSubCategorySelect(category)}
                              className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                            />
                            <span className="text-[10px] font-black  ">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-gold-500/10">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.25em] text-gold-500/50">Also show in</p>
                      <p className="text-[9px] tracking-wider text-gold-500/35 mt-1">
                        Cross-tags surface this SKU on other landings (e.g. blazers → Jackets) without duplicating the product.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CROSS_TAG_OPTIONS.map((opt) => {
                        const checked = (formData.cross_tags || []).includes(opt.slug);
                        return (
                          <label
                            key={opt.slug}
                            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                              checked
                                ? 'border-gold-500 bg-gold-600/10 text-gold-100'
                                : 'border-gold-500/10 bg-navy-900/50 text-gold-500/60 hover:border-gold-500/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCrossTag(opt.slug)}
                              className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0"
                            />
                            <span className="text-[10px] font-black">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gold-500/10">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.25em] text-gold-500/50">Merch tags</p>
                      <p className="text-[9px] tracking-wider text-gold-500/35 mt-1">
                        New appears automatically for 21 days (get_new / new_until) — not selectable.
                        Limited blocked above {LIMITED_MAX_UNITS} units. Editorial picks · {EDITORIAL_TAG_CAP} each.
                        Bestseller badge → /sale#bestsellers. Sale is catalog-only (no badge).
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {MERCH_TAGS.map((opt) => {
                        const checked = (formData.merch_tags || []).includes(opt.id);
                        const stock = Number(formData.stock_quantity) || 0;
                        const limitedBlocked = opt.id === 'limited' && !checked && stock > LIMITED_MAX_UNITS;
                        return (
                          <label
                            key={opt.id}
                            title={limitedBlocked ? `Stock must be ≤ ${LIMITED_MAX_UNITS} to tag Limited` : undefined}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                              limitedBlocked
                                ? 'cursor-not-allowed opacity-40 border-gold-500/5 bg-navy-900/30 text-gold-500/30'
                                : checked
                                  ? 'cursor-pointer border-gold-500 bg-gold-600/10 text-gold-100'
                                  : 'cursor-pointer border-gold-500/10 bg-navy-900/50 text-gold-500/60 hover:border-gold-500/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={limitedBlocked}
                              onChange={() => toggleMerchTag(opt.id)}
                              className="h-4 w-4 rounded border-gold-500/30 bg-navy-950 text-gold-600 focus:ring-0 disabled:cursor-not-allowed"
                            />
                            <span className="text-[10px] font-black">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {(formData.merch_tags || []).includes('bespoke') ? (
                      <div className="space-y-2 pt-2">
                        <label className="text-[9px] font-black tracking-[0.2em] text-gold-500/50">
                          Bespoke lead time (working days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={formData.bespoke_lead_time_days ?? 14}
                          onChange={(e) =>
                            setFormData({ ...formData, bespoke_lead_time_days: e.target.value })
                          }
                          className="w-full max-w-[160px] bg-navy-950 border border-gold-500/10 rounded-xl py-2.5 px-4 text-gold-100 outline-none focus:border-gold-500/40 font-bold"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500/40   font-black">Focus Description</label>
                  <textarea
                    value={formData.focus_description}
                    onChange={(e) => setFormData({ ...formData, focus_description: e.target.value })}
                    placeholder="Short who-it's-for hook for Kenyan men — filled by AI from the photo"
                    className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all h-20 font-light leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500/40   font-black">SEO Product Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Full SEO description — filled by AI from the product photo"
                    className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all h-36 font-light leading-relaxed"
                  />
                </div>

                {editingAsSet && (
                  <div className="rounded-2xl border border-gold-500/20 bg-navy-950/70 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black tracking-[0.25em] text-gold-400">Set pieces</p>
                        <p className="text-[9px] text-gold-500/40 mt-1">
                          One image, multiple items — add each garment with size and price. Total updates automatically.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-gold-500/50">Set total</p>
                        <p className="text-xl font-serif text-gold-300">
                          KSh {Number(setTotalPrice || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(formData.set_components || []).map((piece, index) => {
                        const pieceSizes = getSizeOptionsForCategory(piece.category_hint || '', 'sets');
                        return (
                          <div
                            key={piece.id || index}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-xl border border-gold-500/10 bg-navy-900/40 p-3"
                          >
                            <input
                              type="text"
                              value={piece.name}
                              onChange={(e) => {
                                const name = e.target.value;
                                setFormData((prev) => {
                                  const next = [...(prev.set_components || [])];
                                  next[index] = { ...next[index], name };
                                  return { ...prev, set_components: next, price: sumSetComponentsPrice(next) };
                                });
                              }}
                              placeholder="Piece name (e.g. Sand Khaki Trousers)"
                              className="md:col-span-4 bg-navy-950 border border-gold-500/10 rounded-lg py-2.5 px-3 text-sm text-gold-100 outline-none focus:border-gold-500/40"
                            />
                            <select
                              value={piece.category_hint || 'other'}
                              onChange={(e) => {
                                const category_hint = e.target.value;
                                setFormData((prev) => {
                                  const next = [...(prev.set_components || [])];
                                  next[index] = { ...next[index], category_hint };
                                  return { ...prev, set_components: next };
                                });
                              }}
                              className="md:col-span-3 bg-navy-950 border border-gold-500/10 rounded-lg py-2.5 px-3 text-sm text-gold-100 outline-none"
                            >
                              {SET_CATEGORY_HINTS.map((hint) => (
                                <option key={hint.value} value={hint.value}>{hint.label}</option>
                              ))}
                            </select>
                            <select
                              value={piece.size || ''}
                              onChange={(e) => {
                                const size = e.target.value;
                                setFormData((prev) => {
                                  const next = [...(prev.set_components || [])];
                                  next[index] = { ...next[index], size };
                                  return { ...prev, set_components: next };
                                });
                              }}
                              className="md:col-span-2 bg-navy-950 border border-gold-500/10 rounded-lg py-2.5 px-3 text-sm text-gold-100 outline-none"
                            >
                              <option value="">Size</option>
                              {(pieceSizes.length ? pieceSizes : ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38', '40', '42', '43', '44', '45']).map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={piece.price}
                              onChange={(e) => {
                                const price = e.target.value;
                                setFormData((prev) => {
                                  const next = [...(prev.set_components || [])];
                                  next[index] = { ...next[index], price };
                                  return { ...prev, set_components: next, price: sumSetComponentsPrice(next) };
                                });
                              }}
                              placeholder="Price"
                              className="md:col-span-2 bg-navy-950 border border-gold-500/10 rounded-lg py-2.5 px-3 text-sm text-gold-100 outline-none focus:border-gold-500/40"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const next = (prev.set_components || []).filter((_, i) => i !== index);
                                  return { ...prev, set_components: next, price: sumSetComponentsPrice(next) };
                                });
                              }}
                              className="md:col-span-1 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
                              aria-label="Remove piece"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        set_components: [...(prev.set_components || []), newSetComponent()],
                      }))}
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold-400 hover:text-gold-300"
                    >
                      <Plus size={14} /> Add piece
                    </button>
                  </div>
                )}
              </div>

              {/* Media Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gold-500/10 pb-2">
                  <h5 className="text-xs font-black text-gold-500  tracking-[0.3em]">Product Media</h5>
                  {aiGenerating && (
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold-400">
                      <Loader2 size={14} className="animate-spin" />
                      AI writing SEO copy…
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40   font-black">Main Thumbnail</label>
                    <div className="flex items-center gap-6 p-6 bg-navy-950 border-2 border-dashed border-gold-500/10 rounded-2xl group hover:border-gold-500/30 transition-all relative">
                      {(uploading || aiGenerating) && (
                        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent animate-spin rounded-full" />
                             <span className="text-[8px] font-black  text-gold-500 ">
                               {aiGenerating ? 'AI reading photo…' : 'Uploading to Cloudinary...'}
                             </span>
                          </div>
                        </div>
                      )}
                      <div className="w-24 h-24 rounded-xl border border-gold-500/20 overflow-hidden bg-navy-900 flex items-center justify-center relative group">
                        {formData.thumbnailPreview ? (
                          <>
                            <img src={formData.thumbnailPreview} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={removeThumbnail}
                              className="absolute inset-0 bg-red-500/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="text-gold-500/20" size={32} />
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleThumbnailChange}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                          </>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] font-black text-gold-100  ">
                          {formData.thumbnailPreview ? 'Current Thumbnail' : 'Select Thumbnail'}
                        </p>
                        <p className="text-[9px] text-gold-500/40  tracking-wider">
                          AI reads the photo and fills name, slug, colours, focus line, and SEO description for Prince Esquire menswear.
                        </p>
                        <button
                          type="button"
                          disabled={aiGenerating || !(formData.thumbnailFile || formData.thumbnail)}
                          onClick={async () => {
                            if (formData.thumbnailFile) {
                              runAiDescribe(formData.thumbnailFile);
                              return;
                            }
                            // Existing Cloudinary URL — fetch and re-analyze
                            try {
                              setAiGenerating(true);
                              setAiError('');
                              const imgRes = await fetch(formData.thumbnail);
                              const blob = await imgRes.blob();
                              const file = new File([blob], 'product.jpg', { type: blob.type || 'image/jpeg' });
                              await runAiDescribe(file);
                            } catch (err) {
                              setAiError('Could not re-analyze this image.');
                              setAiGenerating(false);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-600 text-navy-950 text-[9px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-gold-500 transition-all"
                        >
                          {aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          {aiGenerating ? 'Generating…' : 'Generate SEO copy with AI'}
                        </button>
                        {aiError && <p className="text-[10px] text-red-400">{aiError}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-gold-500/40   font-black">Additional Gallery Images</label>
                      <div className="relative">
                        <button type="button" className="text-[10px] text-gold-500 hover:text-gold-300 font-black  flex items-center gap-2 transition-colors">
                          <Plus size={14} /> {uploading ? 'Processing...' : 'Attach Photos'}
                        </button>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={handleGalleryChange}
                          disabled={uploading}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.gallery.map((item, idx) => (
                        <div key={item.id || item.preview || idx} className="aspect-square rounded-xl border border-gold-500/10 overflow-hidden relative group">
                          <img src={item.preview || item.url} className={`w-full h-full object-cover ${item.isUploading ? 'opacity-40 grayscale blur-[2px]' : ''}`} />
                          {item.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent animate-spin rounded-full" />
                            </div>
                          )}
                          <button 
                            type="button" 
                            onClick={() => removeGalleryFile(idx)} 
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants — colors & sizes (single products only; Sets use pieces editor) */}
              {!editingAsSet && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gold-500/10 pb-2">
                  <div>
                    <h5 className="text-xs font-black text-gold-500  tracking-[0.3em]">Colors & Sizes</h5>
                    <p className="text-[9px] text-gold-500/40  tracking-wider mt-1">
                      All sizes for this category start selected on new products — remove sizes you don’t stock. A listed size is available to order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      color_groups: [...prev.color_groups, newColorGroup('')],
                    }))}
                    className="flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300 font-black  "
                  >
                    <Plus size={14} /> Add color
                  </button>
                </div>

                <div className="bg-navy-950/50 border border-gold-500/15 rounded-2xl p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40   font-black">Base SKU</label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. CLARKS-TAN-WINGTIP"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="w-full bg-navy-900 border border-gold-500/5 rounded-lg py-3 px-4 text-gold-100 text-[11px] outline-none focus:border-gold-500/20 font-bold  font-mono"
                    />
                  </div>

                  {formData.color_groups.map((group) => (
                    <div key={group._key} className="border border-gold-500/15 rounded-xl p-4 space-y-4 bg-navy-900/40">
                      <div className="flex flex-wrap gap-3 items-start">
                        <div className="flex-1 min-w-[160px] space-y-1">
                          <label className="text-[10px] text-gold-500/40   font-black">Color name</label>
                          <input
                            type="text"
                            placeholder="e.g. Black, Navy, Tan"
                            value={group.color}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              color_groups: prev.color_groups.map((g) =>
                                g._key === group._key ? { ...g, color: e.target.value } : g
                              ),
                            }))}
                            className="w-full bg-navy-950 border border-gold-500/10 rounded-lg py-2.5 px-3 text-gold-100 text-sm outline-none focus:border-gold-500/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gold-500/40   font-black">Color image</label>
                          <div className="flex items-center gap-2">
                            {group.imagePreview && (
                              <img src={group.imagePreview} alt="" className="w-12 h-12 object-cover rounded border border-gold-500/20" />
                            )}
                            <label className="px-3 py-2 border border-gold-500/20 rounded-lg text-[10px] text-gold-500/70 cursor-pointer hover:border-gold-500/40">
                              Upload
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorImage(group._key, e)} />
                            </label>
                          </div>
                        </div>
                        {formData.color_groups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({
                              ...prev,
                              color_groups: prev.color_groups.filter((g) => g._key !== group._key),
                            }))}
                            className="text-red-400/70 hover:text-red-400 p-2 mt-5"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-gold-500/40   font-black">
                          Sizes for this color (selected = available — tap to remove)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {sizeOptions.map((sz) => {
                            const active = (group.sizes || []).some(
                              (row) => String(row.size).toUpperCase() === String(sz).toUpperCase()
                            );
                            const row = (group.sizes || []).find(
                              (r) => String(r.size).toUpperCase() === String(sz).toUpperCase()
                            );
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  if (active && row) removeSizeFromGroup(group._key, row._key);
                                  else addSizeToGroup(group._key, sz);
                                }}
                                className={`px-2.5 py-1 text-[10px] rounded border ${
                                  active
                                    ? 'bg-gold-500/20 border-gold-500/50 text-gold-100'
                                    : 'border-gold-500/25 text-gold-400 hover:bg-gold-500/10'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSizeToGroup(group._key, customSize);
                              }
                            }}
                            placeholder="Custom size"
                            className="max-w-[120px] bg-navy-950 border border-gold-500/10 rounded-lg py-2 px-3 text-gold-100 text-[10px] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => addSizeToGroup(group._key, customSize)}
                            className="px-3 py-2 text-[10px] border border-gold-500/30 text-gold-400 rounded-lg"
                          >
                            Add size
                          </button>
                        </div>
                      </div>

                      {group.sizes.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-gold-500/40">
                              <tr>
                                <th className="text-left p-2">Size</th>
                                <th className="p-2 w-10" />
                              </tr>
                            </thead>
                            <tbody>
                              {group.sizes.map((row) => (
                                <tr key={row._key} className="border-t border-gold-500/10">
                                  <td className="p-2 font-bold text-gold-100">{row.size}</td>
                                  <td className="p-2 text-right">
                                    <button type="button" onClick={() => removeSizeFromGroup(group._key, row._key)} className="text-red-400/60 hover:text-red-400">
                                      <Trash2 size={14} />
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
                </div>
              </div>
              )}

              {/* Status & Submit */}
              <div className="pt-10 border-t border-gold-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black  text-gold-100  group-hover:text-gold-500 transition-colors">Featured (homepage carousel)</span>
                  </label>
                  {canPublish && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black  text-gold-100  group-hover:text-gold-500 transition-colors">Active / Published</span>
                  </label>
                  )}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={closeProductModal}
                    className="px-8 py-4 bg-navy-800 text-gold-500/60 rounded-xl font-black  tracking-[0.2em] hover:bg-navy-700 hover:text-gold-500 transition-all border border-gold-500/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-4 bg-gold-600 text-navy-950 rounded-xl font-black  tracking-[0.2em] hover:bg-gold-500 transition-all disabled:opacity-50 shadow-xl shadow-gold-600/20"
                  >
                    {submitting ? 'COMMITTING...' : 'SAVE PRODUCT'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};


export default function ProductsViewWithBoundary(props) {
  return (
    <AdminSectionErrorBoundary label="Products">
      <ProductsView {...props} />
    </AdminSectionErrorBoundary>
  );
}
