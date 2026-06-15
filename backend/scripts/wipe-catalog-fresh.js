/**
 * DANGER: Wipes ALL website products and ALL POS inventory catalog rows.
 * Always creates a backup snapshot first (unless --skip-backup).
 *
 * Usage:
 *   node scripts/wipe-catalog-fresh.js --dry-run
 *   node scripts/wipe-catalog-fresh.js --confirm WIPE_ALL
 */
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const db = require('../src/config/db');
const { parseArgs } = require('./catalog-snapshot-utils');

const { dryRun, confirmed } = parseArgs();
const skipBackup = process.argv.includes('--skip-backup');

if (!dryRun && !confirmed) {
  console.error('Refusing to wipe without --confirm WIPE_ALL (or use --dry-run first).');
  process.exit(1);
}

(async () => {
  const before = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM product_variants) AS variants,
      (SELECT COUNT(*)::int FROM pos_products) AS pos_products,
      (SELECT COUNT(*)::int FROM pos_stock_levels) AS shop_stock,
      (SELECT COUNT(*)::int FROM pos_store_stock_levels) AS store_stock,
      (SELECT COUNT(*)::int FROM pos_stock_movements) AS movements
  `);

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Will wipe:`);
  console.log(before.rows[0]);

  if (dryRun) {
    process.exit(0);
  }

  if (!skipBackup) {
    console.log('Creating backup snapshot first…');
    execSync('node scripts/backup-catalog-snapshot.js', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Unlink before deletes
    await client.query(`UPDATE pos_products SET ecommerce_product_id = NULL`);
    await client.query(`UPDATE products SET pos_stock_product_id = NULL`);

    // POS sale line items block pos_products delete — remove lines (sales headers kept for audit)
    const saleItems = await client.query(`DELETE FROM pos_sale_items RETURNING id`);
    console.log(`Removed ${saleItems.rowCount} POS sale line items (sales headers kept)`);

    // POS inventory data
    await client.query(`DELETE FROM pos_stock_movements`);
    await client.query(`DELETE FROM pos_daily_stock_snapshots`);
    await client.query(`DELETE FROM pos_store_stock_levels`);
    await client.query(`DELETE FROM pos_stock_levels`);
    await client.query(`DELETE FROM pos_product_variants`);
    const posDel = await client.query(`DELETE FROM pos_products RETURNING id`);
    console.log(`Deleted ${posDel.rowCount} POS inventory products`);

    // Website catalog (cascades variants, cart, wishlist, reviews, etc.)
    const webDel = await client.query(`DELETE FROM products RETURNING id`);
    console.log(`Deleted ${webDel.rowCount} website products`);

    await client.query('COMMIT');

    try {
      const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
      invalidateCatalogueCache();
    } catch {
      /* optional */
    }

    const after = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM pos_products) AS pos_products
    `);
    console.log('After wipe:', after.rows[0]);
    console.log('Restore with: node scripts/restore-catalog-snapshot.js --confirm RESTORE_ALL');
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
