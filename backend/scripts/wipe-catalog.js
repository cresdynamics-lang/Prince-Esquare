/**
 * DANGER: Deletes ALL website products after a full backup.
 *
 * Usage:
 *   node scripts/wipe-catalog.js --dry-run
 *   node scripts/wipe-catalog.js --confirm WIPE_ALL
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { buildSnapshot, LATEST_PATH, SNAPSHOT_DIR } = require('./backup-catalog-snapshot');

const dryRun = process.argv.includes('--dry-run');
const confirmed = process.argv.includes('--confirm') && process.argv.includes('WIPE_ALL');
const skipBackup = process.argv.includes('--skip-backup');

if (!dryRun && !confirmed) {
  console.error('Refusing to run without --confirm WIPE_ALL (or use --dry-run first).');
  process.exit(1);
}

(async () => {
  const countR = await db.query('SELECT COUNT(*)::int AS c FROM products');
  const variantR = await db.query('SELECT COUNT(*)::int AS c FROM product_variants');
  const total = countR.rows[0].c;
  const variants = variantR.rows[0].c;

  console.log(`Catalog: ${total} products, ${variants} variants`);

  if (total === 0) {
    console.log('Nothing to wipe.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('[DRY RUN] Would backup then delete all products and variants.');
    console.log('Orders are kept — order line product_id will be set NULL.');
    process.exit(0);
  }

  if (!skipBackup) {
    const snapshot = await buildSnapshot();
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const stampedPath = path.join(SNAPSHOT_DIR, `catalog-snapshot-${stamp}.json`);
    const json = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(stampedPath, json);
    fs.writeFileSync(LATEST_PATH, json);
    console.log(`Backup saved (${snapshot.product_count} products):`);
    console.log(`  ${stampedPath}`);
    console.log(`  ${LATEST_PATH}`);
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE pos_products SET ecommerce_product_id = NULL
       WHERE ecommerce_product_id IS NOT NULL`
    );

    const del = await client.query('DELETE FROM products RETURNING id');
    await client.query('COMMIT');

    try {
      const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');
      invalidateCatalogueCache();
    } catch {
      /* optional */
    }

    console.log(`Deleted ${del.rowCount} products (variants/reviews/cart lines cascaded).`);
    console.log('Restore with: node scripts/restore-catalog-snapshot.js');
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
