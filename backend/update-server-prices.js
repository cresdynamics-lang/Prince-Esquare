require('dotenv').config();
const db = require('./src/config/db');

async function updatePrices() {
  const updates = [
    { cat: 'knitted-polos', price: 3000 },
    { cat: 'jackets', price: 5500 },
    { cat: 'boots', price: 7000 },
    { cat: 'formal-shoes', price: 6500 },
    { cat: 'khaki', price: 3000 },
    { cat: 'casual', price: 7000 },
  ];

  for (const u of updates) {
    const result = await db.query(
      'UPDATE products SET price = $1 WHERE category_id = (SELECT id FROM categories WHERE slug = $2) AND price <> $1 RETURNING id, name, price',
      [u.price, u.cat]
    );
    for (const row of result.rows) {
      console.log(`Updated ${row.name}: ${row.price} → ${u.price}`);
    }
  }

  console.log('Done');
  process.exit(0);
}

updatePrices().catch(e => { console.error(e); process.exit(1); });
