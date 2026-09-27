import { MERCH_TAGS } from '../data/taxonomy';

const LABEL_BY_ID = Object.fromEntries(MERCH_TAGS.map((t) => [t.id, t]));
LABEL_BY_ID.new = { id: 'new', label: 'New' };

/**
 * Single badge slot priority (category grid / tiles):
 * New → Limited → Editor's Choice / Presidential Pick → Bespoke → Bestseller
 * Sale is never a badge.
 */
const PRIMARY_ORDER = [
  'new',
  'limited',
  'editors_choice',
  'presidential_pick',
  'bespoke',
  'bestseller',
];

const ALIASES = {
  'editors-choice': 'editors_choice',
  'presidential-pick': 'presidential_pick',
};

function normalizeTagId(id) {
  const key = String(id || '').toLowerCase();
  return ALIASES[key] || key;
}

/** Mirror backend isNewActive — auto New from get_new + new_until window. */
export function isNewActive(product, now = new Date()) {
  if (product?.get_new === true) {
    if (product.new_until) {
      const until = new Date(product.new_until);
      if (!Number.isNaN(until.getTime()) && until <= now) return false;
    }
    return true;
  }
  if (product?.new_until) {
    const until = new Date(product.new_until);
    if (!Number.isNaN(until.getTime()) && until > now) return true;
  }
  return false;
}

function effectiveTagSet(product) {
  const set = new Set(
    (Array.isArray(product?.merch_tags) ? product.merch_tags : [])
      .map(normalizeTagId)
      .filter((id) => id && id !== 'sale' && id !== 'new')
  );
  if (isNewActive(product)) set.add('new');
  // Bespoke Formal subcategory always carries Bespoke (Shoes page)
  if (String(product?.category_slug || '').toLowerCase() === 'bespoke-formal') {
    set.add('bespoke');
  }
  return set;
}

/**
 * Tile badges: one primary only (never stacked).
 * Bestseller chip → /sale#bestsellers.
 */
export function getProductMerchBadges(product) {
  const set = effectiveTagSet(product);
  let primary = null;
  for (const id of PRIMARY_ORDER) {
    if (!set.has(id)) continue;
    const meta = LABEL_BY_ID[id] || { id, label: id };
    primary = {
      id,
      label: meta.label,
      href: id === 'bestseller' ? '/sale#bestsellers' : meta.href || undefined,
      role: 'primary',
    };
    break;
  }

  // Bespoke lead-time is shown under price — not a second badge stack
  return { primary, secondary: null };
}

/** PDP — list every applicable tag (completeness). No Sale badge. */
export function getAllProductMerchBadges(product) {
  const set = effectiveTagSet(product);
  return PRIMARY_ORDER.filter((id) => set.has(id)).map((id) => {
    const meta = LABEL_BY_ID[id] || { id, label: id };
    return {
      id,
      label: meta.label,
      href: id === 'bestseller' ? '/sale#bestsellers' : meta.href || undefined,
    };
  });
}

/** Card-level line: "Made to order — [X] week lead time" */
export function bespokeLeadCopy(product) {
  if (!effectiveTagSet(product).has('bespoke')) return null;
  if (product?.merch_bespoke_lead) return product.merch_bespoke_lead;
  const days = Number(product?.bespoke_lead_time_days);
  const n = Number.isFinite(days) && days > 0 ? Math.round(days) : 14;
  const weeks = Math.max(1, Math.ceil(n / 7));
  return `Made to order — ${weeks} week${weeks === 1 ? '' : 's'} lead time`;
}

export function isBespokeProduct(product) {
  return effectiveTagSet(product).has('bespoke');
}

export function isEditorialPick(product) {
  const set = effectiveTagSet(product);
  return set.has('editors_choice') || set.has('presidential_pick');
}
