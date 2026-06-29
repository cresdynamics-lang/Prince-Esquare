require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  const r = await db.query("SELECT name, price FROM products WHERE name ILIKE $1 OR name ILIKE $2", ['%loafer%', '%linen%']);
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
