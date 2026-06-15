/**
 * Delete products by exact name match.
 * Usage: node scripts/delete-products-by-names.js [--dry-run]
 */
require('dotenv').config();
const db = require('../src/config/db');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const DRY_RUN = process.argv.includes('--dry-run');

const NAMES = [
  'Santoni Black Leather Oxford Shoes',
  'Santoni Grey Suede Double Monk-Strap Shoes (V2)',
  'Santoni Grey Suede Double Monk-Strap Shoes',
  'Santoni Oxford Shoes - Black',
  'Santoni Double Monk-Strap - Grey',
  'Santoni Double Monk-Strap - Brown',
  'Clarks Gereld Tie - Tan',
  'Santoni Dark Brown Leather Double Monk-Strap Shoes',
  'Clarks Dark Brown Leather Oxford Shoes',
  'Santoni Dark Brown Double Monk-Strap Shoes (V2)',
  'Santoni Dark Brown Double Monk-Strap Shoes',
  'Clarks Gereld Tie in Dark Brown Leather (V2)',
  'Clarks Gereld Tie in Dark Brown Leather',
  'Clarks Gereld Tie in Tan Leather (V3)',
  'Clarks Gereld Tie in Tan Leather (V2)',
  'Clarks Gereld Tie in Tan Leather',
  'Clarks Gereld Tie in Black Leather',
  'Santoni Navy Blue Loafers',
  'Santoni Black Leather Loafers',
  'Santoni Dark Brown Leather Slip-on Loafers',
  'Santoni Black Leather Slip-on Loafers',
  'Santoni Dark Brown Loafers',
  'Santoni Slip-on Loafers - Brown',
  'Santoni Slip-on Loafers - Black',
];

(async () => {
  const found = await db.query(
    `SELECT id, name, slug, price FROM products
     WHERE UPPER(name) = ANY($1::text[])
     ORDER BY name`,
    [NAMES.map((n) => n.toUpperCase())]
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

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const ids = found.rows.map((r) => r.id);
    await client.query('DELETE FROM product_variants WHERE product_id = ANY($1::uuid[])', [ids]);
    const del = await client.query(
      'DELETE FROM products WHERE id = ANY($1::uuid[]) RETURNING name',
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
