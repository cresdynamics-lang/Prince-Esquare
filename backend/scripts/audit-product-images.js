require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const r = await db.query(`
    SELECT id, name, slug, thumbnail, created_at,
           thumbnail IS NULL OR thumbnail = '' AS no_thumb,
           thumbnail LIKE '%localhost%' AS local_thumb,
           thumbnail LIKE '%res.cloudinary%' AS cloudinary_thumb,
           thumbnail LIKE '/%' AS relative_thumb
    FROM products
    WHERE is_active = true
    ORDER BY created_at
  `);

  const cloudinary = r.rows.filter((p) => p.cloudinary_thumb);
  const local = r.rows.filter((p) => p.local_thumb);
  const relative = r.rows.filter((p) => p.relative_thumb);
  const placeholder = r.rows.filter((p) => !p.cloudinary_thumb && !p.local_thumb && !p.relative_thumb);

  console.log(JSON.stringify({
    total: r.rows.length,
    cloudinary: cloudinary.length,
    localhost: local.map((p) => p.slug),
    relative: relative.map((p) => ({ slug: p.slug, thumb: p.thumbnail })),
    other: placeholder.map((p) => ({ slug: p.slug, thumb: p.thumbnail })),
  }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
