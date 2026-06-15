/**
 * Delete website products by id (variants + product row).
 * Usage: node scripts/delete-products-by-ids.js id1 id2 ...
 */
require('dotenv').config();
const db = require('../src/config/db');

const ids = process.argv.slice(2).filter(Boolean);
if (!ids.length) {
  console.error('Pass product UUIDs to delete');
  process.exit(1);
}

(async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const id of ids) {
      await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
      const r = await client.query('DELETE FROM products WHERE id = $1 RETURNING name, slug', [id]);
      console.log(r.rows[0] ? `Deleted: ${r.rows[0].name}` : `Not found: ${id}`);
    }
    await client.query('COMMIT');
    console.log('Done.');
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
