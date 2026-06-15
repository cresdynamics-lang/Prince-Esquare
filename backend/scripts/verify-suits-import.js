/**
 * Verify two-piece suit counts in database.
 * Usage: node scripts/verify-suits-import.js
 */
require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const r = await db.query(`
    SELECT c.name AS sub, COUNT(p.id)::text AS cnt
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN categories parent ON c.parent_id = parent.id
    WHERE parent.name = 'Suits' AND p.is_active = true
    GROUP BY c.name
    ORDER BY c.name
  `);
  console.log('Counts:', r.rows);

  const twoPiece = await db.query(`
    SELECT COUNT(p.id)::text AS cnt
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN categories parent ON c.parent_id = parent.id
    WHERE parent.name = 'Suits' AND c.name = 'Two piece' AND p.is_active = true
  `);
  console.log('Two piece total:', twoPiece.rows[0]?.cnt);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
