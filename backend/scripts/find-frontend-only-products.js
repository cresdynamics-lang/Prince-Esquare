require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const all = await db.query(`
    SELECT p.id, p.name, p.slug, p.created_at::date AS created,
           p.pos_stock_product_id,
           p.thumbnail,
           (SELECT COUNT(*)::int FROM product_variants v WHERE v.product_id = p.id) AS variants
    FROM products p
    WHERE p.is_active = true
    ORDER BY p.created_at
  `);

  const noPosLink = all.rows.filter((p) => !p.pos_stock_product_id);
  const seedBatch = all.rows.filter((p) => String(p.created) === '2026-05-29');
  const brokenThumb = all.rows.filter(
    (p) => !p.thumbnail || p.thumbnail.includes('localhost') || p.thumbnail.startsWith('/')
  );

  console.log(JSON.stringify({
    total: all.rows.length,
    noPosLink: noPosLink.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
    seedBatchCount: seedBatch.length,
    seedBatchSlugs: seedBatch.map((p) => p.slug),
    brokenThumbCount: brokenThumb.length,
  }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
