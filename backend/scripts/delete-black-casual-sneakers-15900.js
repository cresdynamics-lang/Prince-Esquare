/**
 * Delete BLACK CASUAL SNEAKERS at KSh 15,900 (exact name match).
 * Usage: node scripts/delete-black-casual-sneakers-15900.js [--dry-run]
 */
require('dotenv').config();
const db = require('../src/config/db');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const DRY_RUN = process.argv.includes('--dry-run');

(async () => {
  const found = await db.query(
    `SELECT id, name, slug, price FROM products
     WHERE UPPER(name) = 'BLACK CASUAL SNEAKERS' AND price = 15900`
  );

  if (!found.rows.length) {
    console.log('No matching products found.');
    process.exit(0);
  }

  console.log(`Found ${found.rows.length} product(s):`);
  for (const row of found.rows) {
    console.log(`  - ${row.name} (${row.slug}) KSh ${row.price}`);
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
      'DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING name, slug',
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
