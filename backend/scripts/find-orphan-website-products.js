require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const r = await db.query(`
    SELECT p.id, p.name, p.slug, p.category_id, p.thumbnail, p.created_at,
           c.name AS category_name,
           (SELECT COUNT(*)::int FROM product_variants v WHERE v.product_id = p.id) AS variant_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    ORDER BY p.created_at DESC
  `);

  const noCategory = r.rows.filter((p) => !p.category_id);
  const noThumb = r.rows.filter((p) => !p.thumbnail);
  const recentFailed = r.rows.filter((p) => {
    const d = new Date(p.created_at);
    return d > new Date('2026-06-10');
  });

  console.log(JSON.stringify({
    total: r.rows.length,
    noCategory,
    noThumb: noThumb.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
    june10: recentFailed.map((p) => ({ id: p.id, name: p.name, slug: p.slug, category: p.category_name })),
  }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
