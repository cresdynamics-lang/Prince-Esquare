/**
 * Delete all "CLASSIC SINGLE-BREASTED THREE-PIECE SUIT" products.
 * Usage: node scripts/delete-classic-three-piece-suits.js [--dry-run]
 */
require('dotenv').config();
const db = require('../src/config/db');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const DRY_RUN = process.argv.includes('--dry-run');
const NAME = 'CLASSIC SINGLE-BREASTED THREE-PIECE SUIT';

(async () => {
  const found = await db.query(
    `SELECT p.id, p.name, p.slug, p.price, b.name AS brand
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE UPPER(p.name) = $1
     ORDER BY p.price, p.slug`,
    [NAME.toUpperCase()]
  );

  if (!found.rows.length) {
    console.log('No matching products found.');
    process.exit(0);
  }

  console.log(`Found ${found.rows.length} product(s):`);
  for (const row of found.rows) {
    console.log(`  - ${row.brand || '—'} | ${row.name} | KSh ${row.price} | ${row.slug}`);
  }

  if (DRY_RUN) {
    console.log('Dry run — nothing deleted.');
    process.exit(0);
  }

  const ids = found.rows.map((r) => r.id);
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
    await client.query('DELETE FROM product_variants WHERE product_id = ANY($1::uuid[])', [ids]);
    const del = await client.query(
      'DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING id, name, price',
      [ids]
    );
    await client.query('COMMIT');
    invalidateCatalogueCache();
    console.log(`Deleted ${del.rows.length} product(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
