/**
 * Verify jeans counts in database.
 * Usage: node scripts/verify-jeans-import.js
 */
require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const r = await db.query(`
    SELECT c.name AS sub, COUNT(p.id)::text AS cnt
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN categories parent ON c.parent_id = parent.id
    WHERE parent.name = 'Trousers' AND p.is_active = true
    GROUP BY c.name
    ORDER BY c.name
  `);
  console.log('Trousers subcategory counts:', r.rows);

  const jeans = await db.query(`
    SELECT COUNT(p.id)::text AS cnt
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN categories parent ON c.parent_id = parent.id
    WHERE parent.name = 'Trousers' AND c.name = 'Jeans' AND p.is_active = true
  `);
  console.log('Jeans total:', jeans.rows[0]?.cnt);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
