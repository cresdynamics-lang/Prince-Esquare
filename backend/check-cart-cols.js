const db = require('./src/config/db');

async function checkColumns() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cart_items'
    `);
    console.log('Columns in cart_items:');
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

checkColumns();
