/**
 * Size chips for admin product form.
 * Pass both leaf + parent names — ambiguous subs like "Casual" under Shoes
 * must not fall through to S/M/L shirt sizes.
 */
export const getSizeOptionsForCategory = (categoryName = '', parentCategoryName = '') => {
  const leaf = (categoryName || '').toLowerCase();
  const parent = (parentCategoryName || '').toLowerCase();
  const name = `${parent} ${leaf}`.trim();

  if (
    name.includes('belt') ||
    name.includes('tie') ||
    parent.includes('belts') ||
    parent.includes('ties')
  ) {
    return [];
  }

  const underShoes =
    parent.includes('shoe') ||
    parent === 'shoes' ||
    leaf.includes('shoe') ||
    leaf.includes('sneaker') ||
    leaf.includes('loafer') ||
    leaf.includes('boot') ||
    leaf.includes('sandal');

  if (underShoes) {
    return ['38', '39', '40', '41', '42', '43', '44', '45', '46'];
  }

  if (
    parent.includes('trouser') ||
    name.includes('trouser') ||
    name.includes('chino') ||
    name.includes('pant') ||
    name.includes('khaki') ||
    name.includes('jean') ||
    name.includes('gurkha')
  ) {
    return ['28', '30', '32', '34', '36', '38', '40', '42'];
  }

  if (name.includes('boxer')) {
    return ['S', 'M', 'L', 'XL', 'XXL'];
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

/** Pre-select every size for a category (admin removes unavailable). */
export const sizeRowsForOptions = (sizeOptions = []) =>
  (sizeOptions || []).map((size) => newSizeRow(String(size).toUpperCase()));

export const withAllSizesForCategory = (
  colorGroups = [],
  categoryName = '',
  parentCategoryName = '',
) => {
  const options = getSizeOptionsForCategory(categoryName, parentCategoryName);
  const groups = Array.isArray(colorGroups) && colorGroups.length
    ? colorGroups
    : [newColorGroup('')];
  if (!options.length) return groups;
  return groups.map((group) => ({
    ...group,
    sizes: sizeRowsForOptions(options),
  }));
};

export const colorGroupsFromAi = (
  colors = [],
  categoryName = '',
  parentCategoryName = '',
) => {
  const list = (Array.isArray(colors) ? colors : [])
    .map((c) => String(c || '').trim())
    .filter((c) => c && c.toLowerCase() !== 'original');
  const names = list.length ? list : [''];
  const options = getSizeOptionsForCategory(categoryName, parentCategoryName);
  return names.map((color) => ({
    ...newColorGroup(color),
    sizes: sizeRowsForOptions(options),
  }));
};

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
    const color = (variant.color || '').trim() || '';
    if (!groups.has(color || '__empty__')) {
      groups.set(color || '__empty__', {
        _key: Math.random().toString(36).slice(2),
        color,
        image_url: variant.image_url || '',
        imagePreview: variant.image_url || '',
        sizes: [],
      });
    }
    const group = groups.get(color || '__empty__');
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
  if (detail?.variants?.length) {
    return buildColorGroupsFromVariants(detail.variants);
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
  cost_price: '',
  thumbnail: '',
  thumbnailPreview: '',
  images: [],
  color_groups: [newColorGroup('Original')],
});
