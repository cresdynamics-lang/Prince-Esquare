require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  const name = 'The Kingsley Mahogany Derby';
  const r = await db.query('SELECT id, name, slug, price, thumbnail FROM products WHERE name = $1 ORDER BY created_at', [name]);
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
