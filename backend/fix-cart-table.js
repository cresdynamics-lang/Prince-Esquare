const db = require('./src/config/db');

async function fixCartTable() {
  try {
    console.log('Adding size_label column to cart_items...');
    await db.query(`
      ALTER TABLE cart_items 
      ADD COLUMN IF NOT EXISTS size_label VARCHAR(50);
    `);
    console.log('Column added successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

fixCartTable();
