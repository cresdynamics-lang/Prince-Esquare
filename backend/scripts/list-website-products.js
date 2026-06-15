require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const active = await db.query(
    `SELECT p.id, p.name, p.slug, p.is_active, p.created_at, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true
     ORDER BY p.created_at DESC`
  );
  const all = await db.query('SELECT COUNT(*)::int AS c FROM products');
  console.log(JSON.stringify({ activeCount: active.rows.length, totalCount: all.rows[0].c, products: active.rows }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
