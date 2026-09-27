const db = require('./src/config/db');

async function updateTracksuitPrices() {
  try {
    // Get all products in Track Suits category
    const result = await db.query(`
      SELECT p.id, p.name, p.price, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.name ILIKE '%track%' OR c.name ILIKE '%suit%'
    `);
    
    console.log('Current tracksuits:');
    result.rows.forEach(p => {
      console.log(`- ${p.name}: KSh ${p.price} (${p.category_name})`);
    });
    
    // Update all to 8000
    const updateResult = await db.query(`
      UPDATE products p
      SET price = 8000
      FROM categories c
      WHERE p.category_id = c.id
      AND (c.name ILIKE '%track%' OR c.name ILIKE '%suit%')
      RETURNING p.id, p.name, p.price
    `);
    
    console.log(`\n✓ Updated ${updateResult.rows.length} tracksuits to KSh 8,000`);
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  }
}

updateTracksuitPrices();
