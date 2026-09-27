/**
 * Merch tag system — three independent flags on a product:
 * 1. Pricing / catalog: is_on_sale → appears on /sale (never a tile badge)
 * 2. Freshness:         get_new + new_until → auto "New" badge + /new-arrivals
 * 3. Merch tags:        merch_tags[] admin multi-select (bestseller, bespoke, limited, editorial)
 */

const NEW_AUTO_DAYS = 21;
const LIMITED_MAX_UNITS = 8;
/** Cap is per tag — 6 Editor's Choice AND 6 Presidential Pick. */
const EDITORIAL_TAG_CAP = 6;
const DEFAULT_BESPOKE_LEAD_DAYS = 14;

const TAG_ALIASES = {
  'editors-choice': 'editors_choice',
  editors_choice: 'editors_choice',
  'presidential-pick': 'presidential_pick',
  presidential_pick: 'presidential_pick',
  limited: 'limited',
  bespoke: 'bespoke',
  bestseller: 'bestseller',
  // 'new' deliberately omitted — freshness is get_new, not a merch tag
};

const ALLOWED_MERCH_TAGS = new Set([
  'limited',
  'editors_choice',
  'presidential_pick',
  'bespoke',
  'bestseller',
]);

/** Tile primary badge order — first match wins. */
const PRIMARY_BADGE_ORDER = [
  'presidential_pick',
  'editors_choice',
  'limited',
  'bestseller',
  'new', // synthetic from get_new
];

const TAG_LABELS = {
  new: 'New',
  limited: 'Limited',
  editors_choice: "Editor's Choice",
  presidential_pick: 'Presidential Pick',
  bespoke: 'Bespoke',
  bestseller: 'Bestseller',
};

function normalizeMerchTags(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const key = String(item || '').trim().toLowerCase();
    const mapped = TAG_ALIASES[key];
    if (mapped && ALLOWED_MERCH_TAGS.has(mapped) && !out.includes(mapped)) {
      out.push(mapped);
    }
  }
  return out;
}

function computeNewUntil(from = new Date(), days = NEW_AUTO_DAYS) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function isNewActive(product, now = new Date()) {
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

function bespokeLeadDays(product) {
  const n = Number(product?.bespoke_lead_time_days);
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return DEFAULT_BESPOKE_LEAD_DAYS;
}

function bespokeLeadCopy(product) {
  const days = bespokeLeadDays(product);
  return `Made to order — allow ${days} working days before delivery.`;
}

/**
 * Effective merch tags for API responses.
 * Includes synthetic 'new' when get_new is active; never returns 'new' as stored merch.
 */
function resolveEffectiveMerchTags(product, { stockQty = null } = {}) {
  const tags = new Set(normalizeMerchTags(product?.merch_tags));

  if (isNewActive(product)) tags.add('new');
  else tags.delete('new');

  if (tags.has('limited') && stockQty != null && Number(stockQty) > LIMITED_MAX_UNITS) {
    tags.delete('limited');
  }

  return [...tags];
}

function withEffectiveMerchTags(product) {
  if (!product || typeof product !== 'object') return product;
  const stockQty =
    product.pos_stock_qty != null
      ? Number(product.pos_stock_qty)
      : product.stock_quantity != null
        ? Number(product.stock_quantity)
        : null;
  const merch_tags = resolveEffectiveMerchTags(product, { stockQty });
  const isBespoke = merch_tags.includes('bespoke');
  return {
    ...product,
    merch_tags,
    get_new: isNewActive(product),
    merch_bespoke_lead: isBespoke ? bespokeLeadCopy(product) : null,
    bespoke_lead_time_days: isBespoke ? bespokeLeadDays(product) : product.bespoke_lead_time_days ?? null,
  };
}

async function countLiveTag(db, tag, excludeProductId = null) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM products
     WHERE is_active = true
       AND $1 = ANY(COALESCE(merch_tags, '{}'))
       AND ($2::uuid IS NULL OR id <> $2)`,
    [tag, excludeProductId || null]
  );
  return r.rows[0]?.n || 0;
}

/**
 * Save-time validation — clear messages, no silent rejects.
 * @returns {{ ok: true, tags: string[] } | { ok: false, message: string }}
 */
async function validateMerchTagsForSave(db, {
  merchTags,
  productId = null,
  stockQty = null,
  previousTags = [],
} = {}) {
  const tags = normalizeMerchTags(merchTags);
  const prev = new Set(normalizeMerchTags(previousTags));

  if (tags.includes('limited') && stockQty != null && Number(stockQty) > LIMITED_MAX_UNITS) {
    return {
      ok: false,
      message: `Limited is blocked while stock is above ${LIMITED_MAX_UNITS} units (current: ${stockQty}). Drop stock to ${LIMITED_MAX_UNITS} or below, then add Limited.`,
    };
  }

  for (const tag of ['editors_choice', 'presidential_pick']) {
    if (!tags.includes(tag)) continue;
    const alreadyHad = prev.has(tag);
    if (alreadyHad) continue;
    const live = await countLiveTag(db, tag, productId);
    if (live >= EDITORIAL_TAG_CAP) {
      const label = TAG_LABELS[tag];
      return {
        ok: false,
        message: `${label} is at its cap of ${EDITORIAL_TAG_CAP} — remove one before adding another.`,
      };
    }
  }

  return { ok: true, tags };
}

/** Expire get_new past new_until — keep new_until for history. */
async function expireStaleNewFlags(db) {
  const r = await db.query(
    `UPDATE products
     SET get_new = false,
         updated_at = NOW()
     WHERE get_new = true
       AND new_until IS NOT NULL
       AND new_until < NOW()
     RETURNING id`
  );
  return r.rowCount;
}

/** Auto-clear Limited when stock rises above the honesty threshold. */
async function clearInvalidLimitedTags(db) {
  const r = await db.query(
    `UPDATE products
     SET merch_tags = array_remove(COALESCE(merch_tags, '{}'), 'limited'),
         updated_at = NOW()
     WHERE 'limited' = ANY(COALESCE(merch_tags, '{}'))
       AND COALESCE(stock_quantity, 0) > $1
     RETURNING id`,
    [LIMITED_MAX_UNITS]
  );
  return r.rowCount;
}

async function runMerchMaintenance(db) {
  const expiredNew = await expireStaleNewFlags(db);
  const clearedLimited = await clearInvalidLimitedTags(db);
  return { expiredNew, clearedLimited };
}

module.exports = {
  NEW_AUTO_DAYS,
  LIMITED_MAX_UNITS,
  EDITORIAL_TAG_CAP,
  DEFAULT_BESPOKE_LEAD_DAYS,
  ALLOWED_MERCH_TAGS,
  PRIMARY_BADGE_ORDER,
  TAG_LABELS,
  normalizeMerchTags,
  computeNewUntil,
  isNewActive,
  bespokeLeadDays,
  bespokeLeadCopy,
  resolveEffectiveMerchTags,
  withEffectiveMerchTags,
  validateMerchTagsForSave,
  expireStaleNewFlags,
  clearInvalidLimitedTags,
  runMerchMaintenance,
  // backwards-compatible alias
  expireStaleNewTags: expireStaleNewFlags,
};
