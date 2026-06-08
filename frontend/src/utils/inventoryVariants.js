export const getSizeOptionsForCategory = (categoryName = '') => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('shoe') || name.includes('sneaker') || name.includes('loafer') || name.includes('boot')) {
    return ['38', '39', '40', '41', '42', '43', '44', '45', '46'];
  }
  if (name.includes('trouser') || name.includes('chino') || name.includes('pant') || name.includes('khaki')) {
    return ['28', '30', '32', '34', '36', '38', '40', '42'];
  }
  return ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
};

export const newColorGroup = (color = '') => ({
  _key: Math.random().toString(36).slice(2),
  color,
  image_url: '',
  imagePreview: '',
  sizes: [],
});

export const newSizeRow = (size = '') => ({
  _key: Math.random().toString(36).slice(2),
  id: null,
  size,
  stock: 0,
  price_override: '',
});

export const flattenColorGroups = (colorGroups = []) => {
  const variants = [];
  for (const group of colorGroups) {
    const color = group.color?.trim() || null;
    const image = group.image_url || null;
    for (const row of group.sizes || []) {
      if (!row.size?.trim()) continue;
      variants.push({
        id: row.id || null,
        color,
        size: String(row.size).trim(),
        stock: parseInt(row.stock, 10) || 0,
        price_override: row.price_override === '' || row.price_override == null
          ? 0
          : parseFloat(row.price_override) || 0,
        image_url: image,
      });
    }
  }
  return variants;
};

export const buildColorGroupsFromVariants = (variants = []) => {
  const groups = new Map();
  for (const variant of variants || []) {
    const color = (variant.color || 'Original').trim() || 'Original';
    if (!groups.has(color)) {
      groups.set(color, {
        _key: Math.random().toString(36).slice(2),
        color,
        image_url: variant.image_url || '',
        imagePreview: variant.image_url || '',
        sizes: [],
      });
    }
    const group = groups.get(color);
    if (!group.image_url && variant.image_url) {
      group.image_url = variant.image_url;
      group.imagePreview = variant.image_url;
    }
    if (!variant.size) continue;
    group.sizes.push({
      _key: Math.random().toString(36).slice(2),
      id: variant.id || null,
      size: String(variant.size).trim().toUpperCase(),
      stock: variant.stock ?? variant.stock_quantity ?? 0,
      price_override: variant.price_override ?? variant.price_modifier ?? '',
    });
  }
  return groups.size ? [...groups.values()] : [newColorGroup('Original')];
};

export const buildColorGroupsFromDetail = (detail) => {
  if (detail?.color_groups?.length) {
    return detail.color_groups.map((g) => ({
      _key: Math.random().toString(36).slice(2),
      color: g.color || '',
      image_url: g.image_url || '',
      imagePreview: g.image_url || '',
      sizes: (g.sizes || []).map((s) => ({
        _key: Math.random().toString(36).slice(2),
        id: s.id || null,
        size: s.size || '',
        stock: s.stock ?? 0,
        price_override: s.price_override ?? '',
      })),
    }));
  }
  return [newColorGroup('Original')];
};

export const emptyProductForm = () => ({
  name: '',
  sku: '',
  category_id: '',
  shop_price: '',
  opening_qty: 0,
  store_qty: 0,
  brand_id: '',
  description: '',
  price: '',
  discount_price: '',
  thumbnail: '',
  thumbnailPreview: '',
  images: [],
  color_groups: [newColorGroup('Original')],
});
