require('dotenv').config();
const db = require('../src/config/db');
(async () => {
  const r = await db.query(`
    SELECT c.slug, c.name, COUNT(*)::int AS n,
           MIN(p.price)::numeric AS min_p, MAX(p.price)::numeric AS max_p
    FROM products p
    JOIN categories c ON c.id = p.category_id
    GROUP BY c.slug, c.name
    ORDER BY c.slug`);
  console.table(r.rows);
  process.exit(0);
})();
