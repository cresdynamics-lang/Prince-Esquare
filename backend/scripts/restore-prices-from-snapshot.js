/**
 * Restore product prices from catalog snapshot (undo bulk repricing).
 *
 * Usage:
 *   node scripts/restore-prices-from-snapshot.js --dry-run
 *   node scripts/restore-prices-from-snapshot.js --confirm RESTORE_PRICES
 */
require('dotenv').config();
const db = require('../src/config/db');
const { readSnapshot } = require('./catalog-snapshot-utils');

const dryRun = process.argv.includes('--dry-run');
const confirmed = process.argv.includes('--confirm') && process.argv.includes('RESTORE_PRICES');

if (!dryRun && !confirmed) {
  console.error('Use --dry-run or --confirm RESTORE_PRICES');
  process.exit(1);
}

(async () => {
  const snap = readSnapshot();
  const byId = new Map(snap.products.map((p) => [p.id, p]));
  const bySlug = new Map(snap.products.map((p) => [p.slug, p]));

  const live = await db.query(`
    SELECT p.id, p.slug, p.name, p.price, p.discount_price, p.pos_sell_price, p.pos_stock_product_id
    FROM products p
  `);

  const updates = [];
  for (const row of live.rows) {
    const src = byId.get(row.id) || bySlug.get(row.slug);
    if (!src) continue;
    const price = parseFloat(src.price);
    const discount = src.discount_price != null ? parseFloat(src.discount_price) : null;
    const posSell = src.pos_sell_price != null ? parseFloat(src.pos_sell_price) : price;
    if (
      parseFloat(row.price) === price &&
      (row.discount_price == null ? discount == null : parseFloat(row.discount_price) === discount)
    ) {
      continue;
    }
    updates.push({ ...row, price, discount, posSell });
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Restore prices for ${updates.length} / ${live.rows.length} products`);
  for (const u of updates.slice(0, 12)) {
    const was = live.rows.find((r) => r.id === u.id);
    console.log(`  ${u.slug}: ${was?.price} -> ${u.price}`);
  }
  if (updates.length > 12) console.log(`  ... and ${updates.length - 12} more`);

  if (dryRun) process.exit(0);

  const client = await db.pool.connect();
  let posSynced = 0;
  try {
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query(
        `UPDATE products
         SET price = $1, discount_price = $2, pos_sell_price = $3, updated_at = NOW()
         WHERE id = $4`,
        [u.price, u.discount, u.posSell, u.id]
      );
    }
    const ids = updates.map((u) => u.id);
    if (ids.length) {
      const posResult = await client.query(
        `UPDATE pos_products pp
         SET shop_price = COALESCE(p.discount_price, p.price),
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

  console.log(`Restored ${updates.length} prices. Synced ${posSynced} POS rows.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
