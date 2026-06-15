/**
 * DANGER: Removes products without Cloudinary thumbnails.
 * Most catalogue products use /public placeholder paths — do NOT run unless you
 * explicitly want to delete them. Requires --confirm DELETE.
 *
 * Usage: node scripts/purge-placeholder-products.js --dry-run
 *        node scripts/purge-placeholder-products.js --confirm DELETE
 */
require('dotenv').config();
const db = require('../src/config/db');

const dryRun = process.argv.includes('--dry-run');
const confirmed = process.argv.includes('--confirm') && process.argv.includes('DELETE');

if (!dryRun && !confirmed) {
  console.error('Refusing to run without --confirm DELETE (or use --dry-run first).');
  process.exit(1);
}

(async () => {
  const r = await db.query(`
    SELECT id, name, slug, thumbnail
    FROM products
    WHERE thumbnail IS NULL OR thumbnail NOT LIKE '%res.cloudinary%'
  `);

  if (!r.rows.length) {
    console.log('No placeholder products to remove.');
    process.exit(0);
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Removing ${r.rows.length} placeholder products:`);
  r.rows.forEach((p) => console.log(` - ${p.name} (${p.slug})`));

  if (dryRun) {
    process.exit(0);
  }

  const ids = r.rows.map((p) => p.id);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE pos_products SET ecommerce_product_id = NULL WHERE ecommerce_product_id = ANY($1::uuid[])`,
      [ids]
    );
    await client.query(
      `UPDATE products SET pos_stock_product_id = NULL WHERE id = ANY($1::uuid[])`,
      [ids]
    );
    const del = await client.query(`DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING id`, [ids]);
    await client.query('COMMIT');
    console.log(`Deleted ${del.rowCount} products.`);
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
