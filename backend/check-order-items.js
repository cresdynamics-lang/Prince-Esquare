require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  const r = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY ordinal_position");
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
