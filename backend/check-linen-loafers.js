require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  const r = await db.query("SELECT p.id, p.name, c.name as cat FROM products p JOIN categories c ON p.category_id = c.id WHERE c.slug = 'linen' OR c.slug = 'loafers' OR c.name ILIKE '%loaf%' OR c.name ILIKE '%linen%'");
  console.log('Remaining loafers/linen:', JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
