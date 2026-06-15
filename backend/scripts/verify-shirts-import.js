require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const counts = await db.query(`
    SELECT c.name as sub, COUNT(p.id) as cnt
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN categories parent ON c.parent_id = parent.id
    WHERE parent.name = 'Shirts' AND c.name IN ('Formal shirts', 'Casual')
    GROUP BY c.name ORDER BY c.name
  `);
  console.log('Counts:', counts.rows);

  const cats = await db.query(`
    SELECT c.id, c.name, c.slug, c.parent_id, p.name as parent
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE c.slug = 'casual' OR c.name ILIKE '%casual%'
  `);
  console.log('Casual categories:', cats.rows);

  const misc = await db.query(`
    SELECT c.name, COUNT(*)::int as cnt
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug LIKE '%comic%' OR p.slug LIKE '%hawaiian%' OR p.name ILIKE '%CASUAL%'
    GROUP BY c.name
  `);
  console.log('Casual product placement:', misc.rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
