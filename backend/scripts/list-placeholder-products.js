require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const keep = await db.query(`
    SELECT id, name, slug, thumbnail FROM products
    WHERE is_active = true
      AND thumbnail IS NOT NULL
      AND thumbnail LIKE '%res.cloudinary%'
  `);
  const remove = await db.query(`
    SELECT id, name, slug, thumbnail FROM products
    WHERE is_active = true
      AND (thumbnail IS NULL OR thumbnail NOT LIKE '%res.cloudinary%')
  `);
  console.log(JSON.stringify({ keep: keep.rows, remove: remove.rows }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
