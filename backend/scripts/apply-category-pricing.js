/**
 * Apply category pricing guide to active products.
 *
 * Usage:
 *   node scripts/apply-category-pricing.js --dry-run
 *   node scripts/apply-category-pricing.js --confirm APPLY_PRICING
 */
require('dotenv').config();
const db = require('../src/config/db');

const dryRun = process.argv.includes('--dry-run');
const confirmed = process.argv.includes('--confirm') && process.argv.includes('APPLY_PRICING');

if (!dryRun && !confirmed) {
  console.error('Use --dry-run or --confirm APPLY_PRICING');
  process.exit(1);
}

/** Fixed KSh price by category slug. */
const FIXED_BY_SLUG = {
  'caps-hats': 2500,
  polos: 3000,
  'knitted-polos': 3000,
  loafers: 6500,
  jeans: 2500,
  khaki: 3000,
  jackets: 5500,
  'half-jackets': 5500,
  't-shirts': 2000,
  'sweat-shirts': 2000,
  'round-neck-t-shirts': 2000,
  'v-neck-t-shirts': 2000,
};

/** Min/max KSh by category slug (stable per product slug). */
const RANGE_BY_SLUG = {
  casual: { min: 6000, max: 7000 },
  'two-piece': { min: 13000, max: 15000 },
  'three-piece': { min: 13000, max: 15000 },
};

/** Name overrides (e.g. capes / fedoras within mixed categories). */
const NAME_RULES = [
  { test: (name) => /\bcape\b/i.test(name), price: 2500, label: 'Capes' },
  { test: (name) => /\bfedora\b/i.test(name), price: 2500, label: 'Fedora hats' },
];

const hashSeed = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
};

const priceInRange = (min, max, seed) => min + (hashSeed(seed) % (max - min + 1));

const resolvePrice = (row) => {
  for (const rule of NAME_RULES) {
    if (rule.test(row.name)) return { price: rule.price, rule: rule.label };
  }
  if (FIXED_BY_SLUG[row.category_slug] != null) {
    return { price: FIXED_BY_SLUG[row.category_slug], rule: row.category_slug };
  }
  const range = RANGE_BY_SLUG[row.category_slug];
  if (range) {
    return {
      price: priceInRange(range.min, range.max, row.slug || row.id),
      rule: `${row.category_slug} (${range.min}-${range.max})`,
    };
  }
  return null;
};

(async () => {
  const result = await db.query(`
    SELECT p.id, p.slug, p.name, p.price, p.discount_price, p.pos_sell_price, p.pos_stock_product_id,
           c.slug AS category_slug, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
    ORDER BY c.slug, p.name
  `);

  const updates = [];
  const byRule = new Map();

  for (const row of result.rows) {
    const resolved = resolvePrice(row);
    if (!resolved) continue;

    const price = resolved.price;
    const current = parseFloat(row.price);
    if (Math.round(current) === price) continue;

    updates.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category_slug: row.category_slug,
      pos_stock_product_id: row.pos_stock_product_id,
      from: current,
      to: price,
      rule: resolved.rule,
    });
    byRule.set(resolved.rule, (byRule.get(resolved.rule) || 0) + 1);
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Pricing updates: ${updates.length} / ${result.rows.length} products`);
  for (const [rule, count] of [...byRule.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${rule}: ${count}`);
  }
  for (const u of updates.slice(0, 15)) {
    console.log(`  ${u.category_slug} | ${u.slug}: ${u.from} -> ${u.to}`);
  }
  if (updates.length > 15) console.log(`  ... and ${updates.length - 15} more`);

  if (dryRun) process.exit(0);

  const client = await db.pool.connect();
  let posSynced = 0;
  try {
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query(
        `UPDATE products
         SET price = $1, discount_price = NULL, pos_sell_price = $1, updated_at = NOW()
         WHERE id = $2`,
        [u.to, u.id]
      );
    }
    const ids = updates.map((u) => u.id);
    if (ids.length) {
      const posResult = await client.query(
        `UPDATE pos_products pp
         SET shop_price = p.price,
             online_price = p.price,
             name = p.name
         FROM products p
         WHERE p.pos_stock_product_id = pp.id AND p.id = ANY($1::uuid[])`,
        [ids]
      );
      posSynced = posResult.rowCount || 0;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  try {
    const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
    invalidateCatalogueCache();
  } catch {
    /* optional */
  }

  console.log(`Updated ${updates.length} prices. Synced ${posSynced} POS rows.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
