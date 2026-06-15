/**
 * Restore website products + POS inventory from a catalog snapshot.
 *
 * Usage:
 *   node scripts/restore-catalog-snapshot.js --dry-run
 *   node scripts/restore-catalog-snapshot.js --confirm RESTORE_ALL
 *   node scripts/restore-catalog-snapshot.js --confirm RESTORE_ALL --file=path/to/snapshot.json
 */
require('dotenv').config();
const db = require('../src/config/db');
const { parseArgs, readSnapshot } = require('./catalog-snapshot-utils');

const { dryRun, confirmed, file } = parseArgs();

if (!dryRun && !confirmed) {
  console.error('Refusing to restore without --confirm RESTORE_ALL (or use --dry-run first).');
  process.exit(1);
}

const jsonCol = (v) => {
  if (v == null) return '[]';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
};

(async () => {
  const snap = readSnapshot(file);
  const {
    products = [],
    variants = [],
    pos_products: posProducts = [],
    pos_stock_levels: shopStock = [],
    pos_store_stock_levels: storeStock = [],
    pos_stock_movements: movements = [],
    pos_daily_stock_snapshots: dailySnaps = [],
  } = snap;

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Restore from ${snap.exported_at}:`);
  console.log(`  ${products.length} products, ${variants.length} variants, ${posProducts.length} POS rows`);

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
           product_id = EXCLUDED.product_id, name = EXCLUDED.name, value = EXCLUDED.value,
           price_modifier = EXCLUDED.price_modifier, stock_quantity = EXCLUDED.stock_quantity,
           image_url = EXCLUDED.image_url, color = EXCLUDED.color, size = EXCLUDED.size,
           sku = EXCLUDED.sku, stock_id = EXCLUDED.stock_id, angle_images = EXCLUDED.angle_images`,
        [
          v.id, v.product_id, v.name, v.value, v.price_modifier ?? 0,
          v.stock_quantity ?? 0, v.image_url, v.color, v.size, v.sku, v.stock_id,
          jsonCol(v.angle_images), v.created_at,
        ]
      );
    }

    for (const pp of posProducts) {
      await client.query(
        `INSERT INTO pos_products (
           id, name, sku, category, shop_price, online_price, low_stock_threshold,
           ecommerce_product_id, website_details, cost_price, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category,
           shop_price = EXCLUDED.shop_price, online_price = EXCLUDED.online_price,
           low_stock_threshold = EXCLUDED.low_stock_threshold,
           ecommerce_product_id = EXCLUDED.ecommerce_product_id,
           website_details = EXCLUDED.website_details, cost_price = EXCLUDED.cost_price`,
        [
          pp.id, pp.name, pp.sku, pp.category, pp.shop_price, pp.online_price,
          pp.low_stock_threshold ?? 5, pp.ecommerce_product_id,
          pp.website_details ? jsonCol(pp.website_details) : null,
          pp.cost_price ?? null, pp.created_at,
        ]
      );
    }

    for (const row of shopStock) {
      await client.query(
        `INSERT INTO pos_stock_levels (id, product_id, current_qty, updated_at)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (product_id) DO UPDATE SET current_qty = EXCLUDED.current_qty, updated_at = EXCLUDED.updated_at`,
        [row.id, row.product_id, row.current_qty ?? 0, row.updated_at]
      );
    }

    for (const row of storeStock) {
      await client.query(
        `INSERT INTO pos_store_stock_levels (id, product_id, current_qty, updated_at)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (product_id) DO UPDATE SET current_qty = EXCLUDED.current_qty, updated_at = EXCLUDED.updated_at`,
        [row.id, row.product_id, row.current_qty ?? 0, row.updated_at]
      );
    }

    for (const m of movements) {
      await client.query(
        `INSERT INTO pos_stock_movements (
           id, product_id, variant_id, movement_type, qty, date, recorded_by, notes, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [
          m.id, m.product_id, m.variant_id, m.movement_type, m.qty,
          m.date, m.recorded_by, m.notes, m.created_at,
        ]
      );
    }

    for (const s of dailySnaps) {
      await client.query(
        `INSERT INTO pos_daily_stock_snapshots (
           id, product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (product_id, date) DO UPDATE SET
           opening_qty = EXCLUDED.opening_qty, stock_in_qty = EXCLUDED.stock_in_qty,
           stock_out_qty = EXCLUDED.stock_out_qty, sales_qty = EXCLUDED.sales_qty,
           closing_qty = EXCLUDED.closing_qty`,
        [
          s.id, s.product_id, s.date, s.opening_qty, s.stock_in_qty,
          s.stock_out_qty, s.sales_qty, s.closing_qty,
        ]
      );
    }

    // Re-link bidirectional FKs from product rows
    for (const p of products) {
      if (!p.pos_stock_product_id) continue;
      await client.query(
        `UPDATE products SET pos_stock_product_id = $1 WHERE id = $2`,
        [p.pos_stock_product_id, p.id]
      );
      await client.query(
        `UPDATE pos_products SET ecommerce_product_id = $1 WHERE id = $2`,
        [p.id, p.pos_stock_product_id]
      );
    }

    await client.query('COMMIT');

    try {
      const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
      invalidateCatalogueCache();
    } catch {
      /* optional */
    }

    console.log(`Restored ${products.length} products and ${posProducts.length} POS rows.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    process.exit(0);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
