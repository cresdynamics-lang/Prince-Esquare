/**
 * Full backup of website products + POS inventory catalog (restorable).
 *
 * Usage: node scripts/backup-catalog-snapshot.js
 */
require('dotenv').config();
const db = require('../src/config/db');
const { writeSnapshot } = require('./catalog-snapshot-utils');

const exportTable = async (query, params = []) => {
  const r = await db.query(query, params);
  return r.rows;
};

(async () => {
  const [
    products,
    variants,
    posProducts,
    shopStock,
    storeStock,
    movements,
    snapshots,
    posLinks,
    counts,
  ] = await Promise.all([
    exportTable(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             b.name AS brand_name, b.slug AS brand_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ORDER BY p.created_at ASC
    `),
    exportTable('SELECT * FROM product_variants ORDER BY product_id, color, size'),
    exportTable('SELECT * FROM pos_products ORDER BY created_at ASC'),
    exportTable('SELECT * FROM pos_stock_levels ORDER BY product_id'),
    exportTable('SELECT * FROM pos_store_stock_levels ORDER BY product_id'),
    exportTable('SELECT * FROM pos_stock_movements ORDER BY created_at ASC'),
    exportTable('SELECT * FROM pos_daily_stock_snapshots ORDER BY date ASC, product_id'),
    exportTable(`
      SELECT p.id AS product_id, p.slug AS product_slug, p.pos_stock_product_id,
             pp.id AS pos_id, pp.sku AS pos_sku, pp.ecommerce_product_id
      FROM products p
      LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
      UNION
      SELECT p.id, p.slug, p.pos_stock_product_id, pp.id, pp.sku, pp.ecommerce_product_id
      FROM pos_products pp
      LEFT JOIN products p ON p.id = pp.ecommerce_product_id
      WHERE pp.ecommerce_product_id IS NOT NULL
        AND (p.pos_stock_product_id IS NULL OR p.pos_stock_product_id <> pp.id)
    `),
    db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM product_variants) AS variants,
        (SELECT COUNT(*)::int FROM pos_products) AS pos_products,
        (SELECT COUNT(*)::int FROM pos_stock_levels) AS shop_stock_rows,
        (SELECT COUNT(*)::int FROM pos_store_stock_levels) AS store_stock_rows
    `),
  ]);

  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    database_url_hint: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'local',
    counts: counts.rows[0],
    products,
    variants,
    pos_products: posProducts,
    pos_stock_levels: shopStock,
    pos_store_stock_levels: storeStock,
    pos_stock_movements: movements,
    pos_daily_stock_snapshots: snapshots,
    pos_links: posLinks,
  };

  const { stamped, latest } = writeSnapshot(payload, 'catalog-snapshot');
  console.log(`Backed up ${products.length} products, ${variants.length} variants, ${posProducts.length} POS rows`);
  console.log(`  Shop stock rows: ${shopStock.length}, Store stock rows: ${storeStock.length}`);
  console.log(`  → ${stamped}`);
  console.log(`  → ${latest}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
