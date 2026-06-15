require('dotenv').config();
const db = require('../src/config/db');
(async () => {
  const r = await db.query(`
    SELECT c.slug, c.name, COUNT(*)::int AS n
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE c.slug IN ('polos','presidential','formal-shoes','casual','caps-hats','two-piece','three-piece','khaki','formal','track-suits','belts-ties')
    GROUP BY c.slug, c.name
    ORDER BY c.slug`);
  console.log(r.rows);
  const t = await db.query('SELECT COUNT(*)::int AS n FROM products');
  console.log('total products', t.rows[0].n);
  process.exit(0);
})();
