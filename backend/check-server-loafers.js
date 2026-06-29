require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  const r = await db.query("SELECT c.slug, c.name as cat, p.name, p.price FROM products p JOIN categories c ON p.category_id = c.id WHERE p.name ILIKE $1 OR p.name ILIKE $2 OR c.slug = $3", ['%loaf%', '%linen%', 'loafers']);
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
