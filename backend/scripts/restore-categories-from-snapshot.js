/**
 * Restore selected product categories from latest catalog snapshot.
 *
 * Usage:
 *   node scripts/restore-categories-from-snapshot.js --dry-run
 *   node scripts/restore-categories-from-snapshot.js --confirm RESTORE_CATEGORIES
 *   node scripts/restore-categories-from-snapshot.js --confirm RESTORE_CATEGORIES --slugs=polos,presidential
 */
require('dotenv').config();
const db = require('../src/config/db');
const { parseArgs, readSnapshot } = require('./catalog-snapshot-utils');

const DEFAULT_SLUGS = ['polos', 'presidential', 'formal-shoes', 'casual', 'caps-hats'];

const jsonCol = (v) => {
  if (v == null) return '[]';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
};

const { dryRun, confirmed, file } = parseArgs();
const restoreConfirmed = process.argv.includes('RESTORE_CATEGORIES');
const slugsArg = process.argv.find((a) => a.startsWith('--slugs='));
const categorySlugs = new Set(
  slugsArg ? slugsArg.slice('--slugs='.length).split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_SLUGS
);

if (!dryRun && !restoreConfirmed && !confirmed) {
  console.error('Use --confirm RESTORE_CATEGORIES (or --dry-run)');
  process.exit(1);
}

(async () => {
  const snap = readSnapshot(file);
  const products = snap.products.filter((p) => categorySlugs.has(p.category_slug));
  const productIds = new Set(products.map((p) => p.id));
  const variants = snap.variants.filter((v) => productIds.has(v.product_id));

  const byCategory = {};
  for (const slug of categorySlugs) {
    byCategory[slug] = products.filter((p) => p.category_slug === slug).length;
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Restore ${products.length} products (${variants.length} variants)`);
  for (const [slug, count] of Object.entries(byCategory).sort()) {
    if (count) console.log(`  ${slug}: ${count}`);
  }

  if (dryRun) process.exit(0);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (const p of products) {
      await client.query(
        `INSERT INTO products (
           id, name, slug, sku, description, price, discount_price, pos_sell_price, cost_price,
           category_id, brand_id, stock_quantity, is_featured, is_active, thumbnail, images,
           pos_stock_product_id, ratings_avg, ratings_count, created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,NULL,$17,$18,$19,$20
         )
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, slug = EXCLUDED.slug, sku = EXCLUDED.sku,
           description = EXCLUDED.description, price = EXCLUDED.price,
           discount_price = EXCLUDED.discount_price, pos_sell_price = EXCLUDED.pos_sell_price,
           cost_price = EXCLUDED.cost_price, category_id = EXCLUDED.category_id,
           brand_id = EXCLUDED.brand_id, stock_quantity = EXCLUDED.stock_quantity,
           is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
           thumbnail = EXCLUDED.thumbnail, images = EXCLUDED.images,
           updated_at = EXCLUDED.updated_at`,
        [
          p.id, p.name, p.slug, p.sku, p.description, p.price, p.discount_price,
          p.pos_sell_price, p.cost_price ?? null, p.category_id, p.brand_id,
          p.stock_quantity ?? 0, p.is_featured ?? false, p.is_active ?? true,
          p.thumbnail, jsonCol(p.images),
          p.ratings_avg ?? 0, p.ratings_count ?? 0, p.created_at, p.updated_at,
        ]
      );
    }

    for (const v of variants) {
      await client.query(
        `INSERT INTO product_variants (
           id, product_id, name, value, price_modifier, stock_quantity, image_url,
           color, size, sku, stock_id, angle_images, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
         ON CONFLICT (id) DO UPDATE SET
           product_id = EXCLUDED.product_id, stock_quantity = EXCLUDED.stock_quantity,
           image_url = EXCLUDED.image_url, color = EXCLUDED.color, size = EXCLUDED.size`,
        [
          v.id, v.product_id, v.name, v.value, v.price_modifier ?? 0,
          v.stock_quantity ?? 0, v.image_url, v.color, v.size, v.sku, v.stock_id,
          jsonCol(v.angle_images), v.created_at,
        ]
      );
    }

    await client.query('COMMIT');

    const { ensureAllEcommerceProductsInPos, seedPosOpeningStockIfEmpty } = require('../src/services/inventoryChannel');
    await ensureAllEcommerceProductsInPos();
    await seedPosOpeningStockIfEmpty();

    try {
      const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
      invalidateCatalogueCache();
    } catch {
      /* optional */
    }

    console.log(`Restored ${products.length} products with inventory links.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
