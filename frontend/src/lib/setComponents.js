/** Outfit set pieces helpers (admin + storefront). */

export const SET_CATEGORY_HINTS = [
  { value: 'khaki', label: 'Khaki trousers' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'gurkha', label: 'Gurkha trousers' },
  { value: 'chino', label: 'Chinos' },
  { value: 'formal', label: 'Formal trousers' },
  { value: 'formal-shirts', label: 'Formal shirt' },
  { value: 'shirts-casual', label: 'Casual shirt' },
  { value: 'polo-t-shirts', label: 'Polo' },
  { value: 'belts-ties', label: 'Belt / Tie' },
  { value: 'formal-shoes', label: 'Formal shoes' },
  { value: 'casual', label: 'Casual shoes' },
  { value: 'loafers', label: 'Loafers' },
  { value: 'boots', label: 'Boots' },
  { value: 'caps-hats', label: 'Cap / Hat' },
  { value: 'blazers', label: 'Blazer' },
  { value: 'jackets', label: 'Jacket' },
  { value: 'other', label: 'Other' },
];

export const newSetComponent = (partial = {}) => ({
  id: partial.id || `set-${Math.random().toString(36).slice(2, 9)}`,
  name: partial.name || '',
  category_hint: partial.category_hint || partial.categoryHint || 'other',
  size: partial.size || '',
  price: partial.price ?? '',
  note: partial.note || '',
});

export const normalizeSetComponents = (raw) => {
  if (!raw) return [];
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => newSetComponent(item))
    .filter((c) => String(c.name || '').trim());
};

export const sumSetComponentsPrice = (components = []) =>
  normalizeSetComponents(components).reduce((sum, c) => sum + (Number(c.price) || 0), 0);

export const isSetsCategory = (categoryName = '', parentName = '', slug = '', parentSlug = '') => {
  const s = String(slug || '').toLowerCase();
  const ps = String(parentSlug || '').toLowerCase();
  if (s === 'sets' || ps === 'sets' || s === 'gift-sets' || ps === 'gift-sets') return true;
  const name = `${categoryName || ''} ${parentName || ''}`.toLowerCase();
  if (/\bgift\s*sets?\b/.test(name)) return true;
  if (/\bsets\b/.test(name) && !/linen/.test(name) && !/track/.test(name) && !/belt/.test(name)) return true;
  return false;
};

/** Card line: "Shirt + Tie + Cufflinks" from set_components */
export const formatSetContentsLine = (raw) => {
  const list = normalizeSetComponents(raw);
  if (!list.length) return null;
  const parts = list.map((c) => {
    const name = String(c.name || '').trim();
    if (name && name.length <= 28) return name;
    const hint = SET_CATEGORY_HINTS.find((h) => h.value === c.category_hint);
    if (hint?.label && hint.value !== 'other') {
      return hint.label
        .replace(/\s+trousers$/i, '')
        .replace(/^Formal\s+/i, '')
        .replace(/\s+\/\s+/g, ' / ');
    }
    return name ? `${name.slice(0, 26)}…` : null;
  }).filter(Boolean);
  if (!parts.length) return null;
  return parts.join(' + ');
};

export const buildSetDescriptionAppendix = (components = []) => {
  const list = normalizeSetComponents(components);
  if (!list.length) return '';
  const lines = list.map((c, i) => {
    const bits = [c.name];
    if (c.size) bits.push(`size ${c.size}`);
    if (c.price !== '' && c.price != null) bits.push(`KSh ${Number(c.price).toLocaleString()}`);
    return `${i + 1}. ${bits.join(' — ')}`;
  });
  return `What's included in this set:\n${lines.join('\n')}`;
};
