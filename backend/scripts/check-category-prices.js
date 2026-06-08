require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');
const slugs = ['belts-ties', 'blazers', 'casual', 'formal-shoes', 'jeans', 'sweaters', 'linen-trousers', 'gurkha', 'knitted-polos', 'caps-hats'];
(async () => {
  for (const slug of slugs) {
    const r = await db.query(
      `SELECT COUNT(*)::int AS c,
              ROUND(AVG(COALESCE(NULLIF(p.discount_price, 0), p.price))::numeric, 2) AS avg
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE c.slug = $1 AND p.is_active = true`,
      [slug]
    );
    console.log(slug, r.rows[0]);
  }
  process.exit(0);
})();
