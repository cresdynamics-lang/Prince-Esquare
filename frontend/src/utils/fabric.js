/**
 * Fabric filter helpers — site-wide (Shirts first; reusable where needed).
 * Linen aligns with The Linen Edit via cross_tags / linen-* categories.
 */

export const FABRIC_OPTIONS = [
  { id: 'cotton', label: 'Cotton' },
  { id: 'linen', label: 'Linen' },
  { id: 'blend', label: 'Blend' },
];

function productText(product) {
  return [
    product?.name,
    product?.description,
    product?.focus_description,
    product?.category_name,
    product?.category_slug,
    product?.parent_category_slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Infer fabric tags for a product.
 * Linen is authoritative when cross-tagged linen-edit or home category is linen-*.
 */
export function getProductFabrics(product) {
  if (!product) return [];
  const fabrics = new Set();
  const tags = Array.isArray(product.cross_tags)
    ? product.cross_tags.map((t) => String(t).toLowerCase())
    : [];
  const slug = String(product.category_slug || '').toLowerCase();
  const text = productText(product);

  if (
    tags.includes('linen-edit') ||
    slug.startsWith('linen') ||
    /\blinen\b/.test(text)
  ) {
    fabrics.add('linen');
  }
  if (/\bcotton\b/.test(text)) fabrics.add('cotton');
  if (/\bblend\b|\bwool[\s-]?blend\b|\bcotton[\s-]?blend\b/.test(text)) {
    fabrics.add('blend');
  }

  return [...fabrics];
}

export function productMatchesFabrics(product, selectedFabrics) {
  if (!selectedFabrics || selectedFabrics.size === 0) return true;
  const fabrics = getProductFabrics(product);
  return fabrics.some((f) => selectedFabrics.has(f));
}
