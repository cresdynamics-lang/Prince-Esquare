require('dotenv').config();
const db = require('./src/config/db');

async function updatePrices() {
  const updates = [
    { cat: 'knitted-polos', minPrice: 3000, maxPrice: 3000 },
    { cat: 'jackets', minPrice: 5500, maxPrice: 5500 },
    { cat: 'boots', minPrice: 7000, maxPrice: 7000 },
    { cat: 'formal-shoes', minPrice: 6500, maxPrice: 6500 },
    { cat: 'khaki', minPrice: 3000, maxPrice: 3000 },
  ];

  for (const u of updates) {
    const result = await db.query(
      'UPDATE products SET price = $1 WHERE category_id = (SELECT id FROM categories WHERE slug = $2) AND price <> $1 RETURNING id, name, price',
      [u.maxPrice, u.cat]
    );
    for (const row of result.rows) {
      console.log(`Updated ${row.name}: ${row.price} → ${u.maxPrice}`);
    }
  }

  console.log('Done');
  process.exit(0);
}

updatePrices().catch(e => { console.error(e); process.exit(1); });
