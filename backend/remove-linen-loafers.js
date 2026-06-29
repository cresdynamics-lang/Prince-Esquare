require('dotenv').config();
const db = require('./src/config/db');

async function removeProducts() {
  const loafersResult = await db.query(`
    SELECT p.id, p.name FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = 'loafers' OR c.name ILIKE '%loaf%'
  `);
  
  const linenResult = await db.query(`
    SELECT p.id, p.name FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = 'linen' OR c.name ILIKE '%linen%'
  `);
  
  const toDelete = [...loafersResult.rows, ...linenResult.rows];
  console.log(`Found ${toDelete.length} products to delete`);
  
  for (const p of toDelete) {
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [p.id]);
    await db.query('DELETE FROM products WHERE id = $1', [p.id]);
    console.log(`Deleted: ${p.name}`);
  }
  
  console.log('Done');
  process.exit(0);
}

removeProducts().catch(e => { console.error(e); process.exit(1); });
