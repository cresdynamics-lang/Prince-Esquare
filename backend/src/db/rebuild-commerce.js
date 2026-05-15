/**
 * Drops storefront/commerce tables so schema.sql can recreate them.
 * Preserves users (admin & customers). Run: node src/db/rebuild-commerce.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const drops = [
  'DROP TABLE IF EXISTS order_items CASCADE',
  'DROP TABLE IF EXISTS orders CASCADE',
  'DROP TABLE IF EXISTS cart_items CASCADE',
  'DROP TABLE IF EXISTS wishlist CASCADE',
  'DROP TABLE IF EXISTS reviews CASCADE',
  'DROP TABLE IF EXISTS notifications CASCADE',
  'DROP TABLE IF EXISTS newsletter_subscribers CASCADE',
  'DROP TABLE IF EXISTS banners CASCADE',
  'DROP TABLE IF EXISTS coupons CASCADE',
  'DROP TABLE IF EXISTS product_variants CASCADE',
  'DROP TABLE IF EXISTS products CASCADE',
  'DROP TABLE IF EXISTS categories CASCADE',
  'DROP TABLE IF EXISTS brands CASCADE',
];

async function main() {
  const client = await db.pool.connect();
  try {
    for (const sql of drops) {
      await client.query(sql);
    }
    const schemaPath = path.join(__dirname, 'migrations', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    const extraPath = path.join(__dirname, 'migrations', '002_cart_order_size_label.sql');
    if (fs.existsSync(extraPath)) {
      await client.query(fs.readFileSync(extraPath, 'utf8'));
    }
    console.log('Commerce tables rebuilt from schema.sql');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
  }
}

main();
