require('dotenv').config();
const db = require('./src/config/db');

async function remove() {
  const result = await db.query(
    "SELECT id, name FROM products WHERE name ILIKE $1 OR name ILIKE $2",
    ['%loafer%', '%linen%']
  );
  
  console.log(`Found ${result.rows.length} products to delete`);
  for (const p of result.rows) {
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [p.id]);
    await db.query('DELETE FROM products WHERE id = $1', [p.id]);
    console.log(`Deleted: ${p.name}`);
  }
  console.log('Done');
  process.exit(0);
}

remove().catch(e => { console.error(e); process.exit(1); });
