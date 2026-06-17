import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ShoppingBag, Plus, Search, Trash2, Edit, X, Image as ImageIcon,
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
  getSizeOptionsForCategory,
} from '../../utils/inventoryVariants';
import { useConfirm } from './ConfirmDialog';
import { isFullAdmin } from '../../utils/staffPermissions';

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
  const [customSize, setCustomSize] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    pos_sell_price: '',
    inventory_opening_qty: '',
    show_offer: false,
    sku: '',
    parent_category_id: '',
    category_id: '',
    stock_quantity: 0,
    is_featured: false,
    is_active: true,
    thumbnail: '',
    images: [], // This will store the final URLs for saving
    color_groups: [newColorGroup('Original')],
    thumbnailFile: null,
    thumbnailPreview: '',
    gallery: [] // Combined state: { id, preview, url, isUploading }
  });

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    const skipUppercase = ['thumbnail', 'slug', 'description', 'image', 'logo', 'url', 'email', 'phone'];
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
    setFormData({ ...formData, thumbnail: '', thumbnailPreview: '' });
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
          thumbnailPreview: localPreview,
          thumbnail: prev.thumbnail && !isBlobUrl(prev.thumbnail) ? prev.thumbnail : '',
        };
      });

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
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    setUploading(true);
    const files = await Promise.all(
      rawFiles.map((f) => compressImageFile(f).catch(() => f))
    );

    // Add placeholders with local previews
    const newItems = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        preview: URL.createObjectURL(file),
        url: null,
        isUploading: true
    }));

    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, ...newItems]
    }));

    const uploadData = new FormData();
    files.forEach(file => uploadData.append('images', file));
    try {
      const res = await adminUploadAPI.upload(uploadData);
      if (res.data.success) {
        const uploadedUrls = res.data.data;
        setFormData(prev => {
            const nextGallery = [...prev.gallery];
            // Match uploaded URLs to our new items (simple sequential match for now)
            let urlIdx = 0;
            const updatedGallery = nextGallery.map(item => {
                if (item.isUploading && urlIdx < uploadedUrls.length) {
                    const uploaded = uploadedUrls[urlIdx++];
                    const url = getPersistImageUrl(uploaded) || getUploadUrl(uploaded);
                    revokeBlobUrl(item.preview);
                    return {
                      ...item,
                      url,
                      urlJson: toImageJson(uploaded),
                      preview: getImageSrc(uploaded, 'thumbnail') || getImageSrc(uploaded),
                      isUploading: false,
                    };
                }
                return item;
            });
            return { 
                ...prev, 
                gallery: updatedGallery,
                images: updatedGallery.map(i => i.urlJson || toImageJson(i.url)).filter(Boolean)
            };
        });
      }
    } catch (error) {
      console.error('Gallery upload failed:', error);
      adminToast.info('Gallery images could not be uploaded. You can still save the product without them.');
      setFormData((prev) => {
        prev.gallery.forEach((item) => {
          if (item.isUploading) revokeBlobUrl(item.preview);
        });
        return {
          ...prev,
          gallery: prev.gallery.filter((i) => !i.isUploading),
        };
      });
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
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parentCategories = categories.filter((category) => !category.parent_id);
  const selectedParentCategory = categories.find((category) => category.id === formData.parent_category_id);
  const selectedCategory = categories.find((category) => category.id === formData.category_id);
  const subCategories = formData.parent_category_id ? categories.filter((category) => category.parent_id === formData.parent_category_id) : [];
  const sizeOptions = getSizeOptionsForCategory(selectedCategory?.name || selectedParentCategory?.name || '');

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !(
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    )) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    const stock = Number(p.stock_quantity ?? 0);
    if (stockFilter === 'in_stock' && stock <= 0) return false;
    if (stockFilter === 'out_of_stock' && stock > 0) return false;
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
    setFormData({
      ...formData,
      parent_category_id: category.id,
      category_id: category.id,
      sizeRows: [],
      stock_quantity: 0,
    });
  };

  const handleSubCategorySelect = (category) => {
    setFormData({
      ...formData,
      category_id: category.id,
      color_groups: [newColorGroup('Original')],
      stock_quantity: 0,
    });
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
        price: product.price || '',
        discount_price: product.discount_price || '',
        pos_sell_price: product.pos_sell_price || '',
        show_offer: Boolean(product.discount_price),
        sku: productSku,
        parent_category_id: parentCategoryId,
        category_id: product.category_id || '',
        stock_quantity: totalVariantStock(productColorGroups) || product.stock_quantity || 0,
        is_featured: product.is_featured || false,
        is_active: product.is_active ?? true,
        thumbnail: product.thumbnail || '',
        images: Array.isArray(product.images) ? product.images : [],
        color_groups: productColorGroups,
        thumbnailPreview: product.thumbnail
          ? (getImageSrc(product.thumbnail, 'thumbnail') || resolveDisplayImageUrl(product.thumbnail))
          : '',
        gallery: parseProductImages(product.images).map((img) => ({
          id: Math.random().toString(36).substring(7),
          preview: getImageSrc(img),
          url: getImageSrc(img),
          urlJson: img,
          isUploading: false,
        }))
      });
    } else {
      setCurrentProduct(null);
      setCustomSize('');
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        discount_price: '',
        pos_sell_price: '',
        show_offer: false,
        sku: '',
        parent_category_id: '',
        category_id: '',
        stock_quantity: 0,
        is_featured: false,
        is_active: true,
        thumbnail: '',
        images: [],
        color_groups: [newColorGroup('Original')],
        thumbnailPreview: '',
        gallery: []
      });
    }
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
      adminToast.error('Please select a category before saving this product.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData };
      payload.variants = flattenColorGroups(formData.color_groups).map((row) => ({ ...row, stock: 0 }));
      payload.stock_quantity = 0;
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
      delete payload.cost_price;
      if (typeof payload.thumbnail === 'string' && payload.thumbnail.startsWith('blob:')) {
        payload.thumbnail = '';
      }
      payload.images = (payload.images || []).filter((img) => {
        const url = typeof img === 'string' ? img : img?.url;
        return url && !String(url).startsWith('blob:');
      });
      payload.discount_price = formData.show_offer ? formData.discount_price || null : null;
      payload.pos_sell_price = formData.pos_sell_price ? Number(formData.pos_sell_price) : null;
      payload.inventory_opening_qty = formData.inventory_opening_qty
        ? Number(formData.inventory_opening_qty)
        : null;

      if (currentProduct) {
        await adminProductAPI.update(currentProduct.id, payload);
      } else {
        await adminProductAPI.create(payload);
      }
      closeProductModal();
      fetchData();
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
        <h3 className="text-lg sm:text-xl font-serif font-bold text-gold-100 uppercase tracking-widest">
          Products ({filteredProducts.length}{filteredProducts.length !== products.length ? ` of ${products.length}` : ''})
        </h3>
        <button 
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gold-600 text-navy-950 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all shadow-lg shadow-gold-600/20 text-xs sm:text-sm"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <p className="text-xs text-gold-500/50 -mt-4 mb-2">
        Add product details, images, and sizes here. Web stock is adjusted by admin in Inventory after the item is saved.
      </p>

      {staffUser && (
        <p className="text-xs text-amber-400/80 mb-2">
          Staff: pick colors and sizes when adding a product. Website stock counts are set by admin in Inventory.
        </p>
      )}

      <div className="flex flex-wrap gap-3 p-4 bg-navy-900/40 border border-gold-500/10 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/40" size={14} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, SKU, slug…"
            className="w-full pl-9 pr-3 py-2.5 bg-navy-950 border border-gold-500/20 rounded-xl text-white text-sm outline-none focus:border-gold-500/40"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-navy-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-white text-sm min-w-[160px]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="bg-navy-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-white text-sm"
        >
          <option value="all">All stock</option>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
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
            className="px-3 py-1.5 text-xs font-black uppercase tracking-widest border border-green-500/30 text-green-400 rounded-lg hover:bg-navy-800/50 disabled:opacity-50"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulkAction('unpublish')}
            className="px-3 py-1.5 text-xs font-black uppercase tracking-widest border border-gold-500/20 text-gold-500/60 rounded-lg hover:bg-navy-800/50 disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulkAction('delete')}
            className="px-3 py-1.5 text-xs font-black uppercase tracking-widest border border-red-500/40 text-red-400 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
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
              <tr className="text-[10px] font-bold text-gold-500/40 uppercase tracking-[0.2em]">
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
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/5">
              {filteredProducts.map((p) => {
                const variantColors = [...new Set((p.variants || []).map((v) => v.color).filter(Boolean))];
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
                      <div className="w-12 h-12 bg-navy-800 rounded-xl border border-gold-500/10 overflow-hidden flex items-center justify-center">
                        {resolveDisplayImageUrl(p.thumbnail, { width: 96 }) ? (
                          <img
                            src={resolveDisplayImageUrl(p.thumbnail, { width: 96 })}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag size={24} className="text-gold-500/40" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gold-100 uppercase">{p.name}</div>
                        <div className="text-[10px] font-mono text-gold-500/40 uppercase mt-1">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-gold-500/70 uppercase">{p.sku || '—'}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-gold-500/60 uppercase">{p.category_name || 'Uncategorized'}</td>
                  <td className="px-6 py-4 font-bold text-gold-100">KSh {parseFloat(p.price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className={`text-[10px] font-black uppercase ${p.stock_quantity === 0 ? 'text-red-400' : p.stock_quantity < 10 ? 'text-gold-500' : 'text-green-400'}`}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : `${p.stock_quantity} units`}
                    </div>
                    {variantColors.length > 0 && (
                      <p className="text-[9px] text-gold-500/40 mt-1 uppercase tracking-wider">
                        {variantColors.length} color{variantColors.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.is_active ? 'bg-green-400/10 text-green-400' : 'bg-navy-800 text-gold-500/30'}`}>
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
          <div className="py-24 text-center text-gold-500/40 text-sm uppercase tracking-widest">
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
              <h4 className="text-2xl font-serif font-bold text-gold-100 uppercase tracking-widest">
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h4>
              <button type="button" onClick={closeProductModal} className="text-gold-500/40 hover:text-gold-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Info */}
              <div className="space-y-6">
                <h5 className="text-xs font-black text-gold-500 uppercase tracking-[0.3em] border-b border-gold-500/10 pb-2">General Information</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Product Name</label>
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
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Slug</label>
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
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Website Price (KSh)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">POS / Shop Price (KSh)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Same as website if empty"
                      value={formData.pos_sell_price}
                      onChange={(e) => setFormData({ ...formData, pos_sell_price: e.target.value })}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                    />
                    <p className="text-[9px] text-gold-500/35">In-store price for this product — not the category bucket average.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Store intake qty</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Units received in warehouse"
                      value={formData.inventory_opening_qty}
                      onChange={(e) => setFormData({ ...formData, inventory_opening_qty: e.target.value })}
                      className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all font-bold"
                    />
                    <p className="text-[9px] text-gold-500/35">Warehouse opening qty — transfer to shop in Inventory.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gold-500/10 bg-navy-950/60 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-400">Offers</p>
                      <p className="text-[9px] uppercase tracking-wider text-gold-500/35 mt-1">Enable when this product has a sale or special price.</p>
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
                      <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Offer Price (KSh)</label>
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

                <div className="rounded-2xl border border-gold-500/10 bg-navy-950/60 p-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-400">Category</p>
                    <p className="text-[9px] uppercase tracking-wider text-gold-500/35 mt-1">Tick the main category first, then tick a subcategory when it applies.</p>
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
                        <span className="text-[10px] font-black uppercase tracking-widest">{category.name}</span>
                      </label>
                    ))}
                  </div>

                  {subCategories.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gold-500/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gold-500/50">Subcategory</p>
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
                            <span className="text-[10px] font-black uppercase tracking-widest">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                    className="w-full bg-navy-950 border border-gold-500/10 rounded-xl py-3 px-4 text-gold-100 outline-none focus:border-gold-500/40 transition-all h-24 font-bold uppercase"
                  />
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-6">
                <h5 className="text-xs font-black text-gold-500 uppercase tracking-[0.3em] border-b border-gold-500/10 pb-2">Product Media</h5>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Main Thumbnail</label>
                    <div className="flex items-center gap-6 p-6 bg-navy-950 border-2 border-dashed border-gold-500/10 rounded-2xl group hover:border-gold-500/30 transition-all relative">
                      {uploading && (
                        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent animate-spin rounded-full" />
                             <span className="text-[8px] font-black uppercase text-gold-500 tracking-widest">Uploading to Cloudinary...</span>
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
                        <p className="text-[10px] font-black text-gold-100 uppercase tracking-widest">
                          {formData.thumbnailPreview ? 'Current Thumbnail' : 'Select Thumbnail'}
                        </p>
                        <p className="text-[9px] text-gold-500/40 uppercase tracking-wider">
                          {formData.thumbnailPreview ? 'Hover to remove and select a different one' : 'Drag and drop or click to upload'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Additional Gallery Images</label>
                      <div className="relative">
                        <button type="button" className="text-[10px] text-gold-500 hover:text-gold-300 font-black uppercase flex items-center gap-2 transition-colors">
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

              {/* Variants — colors & sizes */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gold-500/10 pb-2">
                  <div>
                    <h5 className="text-xs font-black text-gold-500 uppercase tracking-[0.3em]">Colors & Sizes</h5>
                    <p className="text-[9px] text-gold-500/40 uppercase tracking-wider mt-1">
                      Choose which sizes exist for each color. Admin sets website stock in Inventory — not here.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      color_groups: [...prev.color_groups, newColorGroup('')],
                    }))}
                    className="flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300 font-black uppercase tracking-widest"
                  >
                    <Plus size={14} /> Add color
                  </button>
                </div>

                <div className="bg-navy-950/50 border border-gold-500/15 rounded-2xl p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Base SKU</label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. CLARKS-TAN-WINGTIP"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="w-full bg-navy-900 border border-gold-500/5 rounded-lg py-3 px-4 text-gold-100 text-[11px] outline-none focus:border-gold-500/20 font-bold uppercase font-mono"
                    />
                  </div>

                  {formData.color_groups.map((group) => (
                    <div key={group._key} className="border border-gold-500/15 rounded-xl p-4 space-y-4 bg-navy-900/40">
                      <div className="flex flex-wrap gap-3 items-start">
                        <div className="flex-1 min-w-[160px] space-y-1">
                          <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Color name</label>
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
                          <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Color image</label>
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
                        <label className="text-[10px] text-gold-500/40 uppercase tracking-widest font-black">Sizes for this color</label>
                        <div className="flex flex-wrap gap-1.5">
                          {sizeOptions.map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => addSizeToGroup(group._key, sz)}
                              className="px-2.5 py-1 text-[10px] border border-gold-500/25 text-gold-400 rounded hover:bg-gold-500/10"
                            >
                              {sz}
                            </button>
                          ))}
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
                    <span className="text-[10px] font-black uppercase text-gold-100 tracking-widest group-hover:text-gold-500 transition-colors">Featured (homepage carousel)</span>
                  </label>
                  {canPublish && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-gold-500/20 bg-navy-950 text-gold-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black uppercase text-gold-100 tracking-widest group-hover:text-gold-500 transition-colors">Active / Published</span>
                  </label>
                  )}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={closeProductModal}
                    className="px-8 py-4 bg-navy-800 text-gold-500/60 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-navy-700 hover:text-gold-500 transition-all border border-gold-500/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-4 bg-gold-600 text-navy-950 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-gold-500 transition-all disabled:opacity-50 shadow-xl shadow-gold-600/20"
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


export default ProductsView;
