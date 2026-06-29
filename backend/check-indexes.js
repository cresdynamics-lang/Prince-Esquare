require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  const idx = await db.query("SELECT tablename, indexname FROM pg_indexes WHERE tablename IN ('products','categories','brands','product_variants') ORDER BY tablename, indexname");
  console.log(JSON.stringify(idx.rows, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
