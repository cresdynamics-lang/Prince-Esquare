const toSkuPart = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const normalizeSku = (value) => toSkuPart(value) || null;

const generateProductSku = ({ name, slug, sku } = {}) => {
  const provided = normalizeSku(sku);
  if (provided) return provided;
  const fromSlug = normalizeSku(slug);
  if (fromSlug) return fromSlug;
  const fromName = normalizeSku(name);
  return fromName || 'PRODUCT';
};

const generateVariantSku = (productSku, variant = {}) => {
  const provided = normalizeSku(variant.sku || variant.stock_id);
  if (provided) return provided;

  const base = normalizeSku(productSku) || 'PRODUCT';
  const size = normalizeSku(variant.size);
  const color = normalizeSku(variant.color);

  if (size && color && color !== 'DEFAULT') return `${base}-${color}-${size}`;
  if (size) return `${base}-${size}`;
  if (color && color !== 'DEFAULT') return `${base}-${color}`;
  return base;
};

module.exports = {
  toSkuPart,
  normalizeSku,
  generateProductSku,
  generateVariantSku,
};
