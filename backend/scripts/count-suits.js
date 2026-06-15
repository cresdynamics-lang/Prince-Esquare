require('dotenv').config();
const db = require('../src/config/db');
(async () => {
  const r = await db.query(`
    SELECT c.slug, COUNT(*)::int AS n
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE c.slug IN ('two-piece', 'three-piece')
    GROUP BY c.slug`);
  console.log(r.rows);
  const sample = await db.query(`
    SELECT p.name, p.price, b.name AS brand
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE c.slug = 'two-piece' AND p.slug LIKE 'tedd-terry%' OR p.slug LIKE 'fabio-bironin%'
    ORDER BY p.created_at DESC LIMIT 5`);
  console.log('new imports sample', sample.rows);
  const cats = await db.query("SELECT slug FROM categories WHERE slug IN ('two-piece','three-piece','suits')");
  console.log('categories', cats.rows);
  const t = await db.query('SELECT COUNT(*)::int AS n FROM products');
  console.log('total products', t.rows[0].n);
  process.exit(0);
})();
