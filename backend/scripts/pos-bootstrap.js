/**
 * Load REAL POS data (not demo):
 * 1. Import Stock.xlsx (live shop stock sheet)
 * 2. Link ecommerce catalog → POS stock categories
 * 3. Sync shop prices from store products
 * 4. Remove demo seller + optional test sales
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const { importStockExcelBuffer } = require('../src/services/stockExcelImport');
const { autoLinkAllProducts, syncPosPricesFromEcommerce } = require('../src/services/productPosLink');

const STOCK_FILE = process.argv[2] || path.join(__dirname, 'Stock.xlsx');
const PURGE_DEMO = process.env.PURGE_POS_DEMO !== 'false';

const removeDemoSeller = async () => {
  const demoEmail = 'seller@prince-esquire.co.ke';
  const r = await db.query(
    `UPDATE pos_profiles SET is_active = false, full_name = '[removed] Demo Seller'
     WHERE email = $1 AND role = 'SELLER' AND full_name ILIKE '%demo seller%'
     RETURNING email`,
    [demoEmail]
  );
  if (r.rowCount) console.log(`Deactivated demo seller: ${demoEmail}`);
};

const purgeTestSales = async () => {
  const demo = await db.query(
    `SELECT id FROM pos_profiles WHERE email = 'seller@prince-esquire.co.ke' OR full_name ILIKE 'demo seller'`
  );
  if (!demo.rows.length) return;

  const sellerIds = demo.rows.map((r) => r.id);
  const sales = await db.query(
    `SELECT id FROM pos_sales WHERE seller_id = ANY($1::uuid[])`,
    [sellerIds]
  );
  if (!sales.rows.length) return;

  const saleIds = sales.rows.map((r) => r.id);
  await db.query(`DELETE FROM pos_sale_items WHERE sale_id = ANY($1::uuid[])`, [saleIds]);
  await db.query(`DELETE FROM pos_sales WHERE id = ANY($1::uuid[])`, [saleIds]);
  console.log(`Purged ${saleIds.length} test sale(s) from demo seller`);
};

const ensureRealSeller = async () => {
  const email = process.env.SELLER_EMAIL;
  const password = process.env.SELLER_PASSWORD;
  const name = process.env.SELLER_NAME || 'Shop Seller';
  if (!email || !password) {
    console.log('SELLER_EMAIL / SELLER_PASSWORD not set — skip seller creation (add real seller in admin UI)');
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const existing = await db.query(`SELECT id FROM pos_profiles WHERE email = $1`, [email.toLowerCase()]);
  if (existing.rows.length) {
    await db.query(
      `UPDATE pos_profiles SET full_name = $1, password_hash = $2, is_active = true WHERE email = $3`,
      [name, hash, email.toLowerCase()]
    );
    console.log(`Updated seller: ${email}`);
  } else {
    await db.query(
      `INSERT INTO pos_profiles (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'SELLER', true)`,
      [name, email.toLowerCase(), hash]
    );
    console.log(`Created seller: ${email}`);
  }
};

const seedSettings = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@prince-esquire.co.ke';
  await db.query(
    `INSERT INTO settings (key, value) VALUES
      ('pos_sellers_can_discount', 'false'),
      ('pos_low_stock_threshold', '5'),
      ('pos_low_stock_email', $1)
     ON CONFLICT (key) DO NOTHING`,
    [adminEmail]
  );
};

const run = async () => {
  console.log('=== POS bootstrap (real data) ===\n');

  if (!fs.existsSync(STOCK_FILE)) {
    throw new Error(`Stock file not found: ${STOCK_FILE}\nPlace Stock.xlsx in backend/scripts/ or pass a path.`);
  }

  await seedSettings();

  const buffer = fs.readFileSync(STOCK_FILE);
  const stock = await importStockExcelBuffer(buffer, {
    mode: 'full',
    recordMovements: false,
  });
  console.log(`Stock imported from ${path.basename(STOCK_FILE)}: ${stock.products.length} categories`);
  console.log(`  created: ${stock.created}, updated: ${stock.updated}`);

  const link = await autoLinkAllProducts();
  console.log(`Ecommerce linked: ${link.linked} of ${link.scanned} products`);
  console.log(`Prices synced: ${link.pricesUpdated} POS categories`);

  if (PURGE_DEMO) {
    await purgeTestSales();
    await removeDemoSeller();
  }

  await ensureRealSeller();

  const summary = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM pos_products) AS categories,
      (SELECT COUNT(*)::int FROM pos_stock_levels WHERE current_qty > 0) AS in_stock,
      (SELECT COUNT(*)::int FROM products WHERE pos_stock_product_id IS NOT NULL) AS linked_products,
      (SELECT COUNT(*)::int FROM pos_profiles WHERE role = 'SELLER' AND is_active) AS active_sellers
  `);
  console.log('\nPOS ready:', summary.rows[0]);
  console.log('\nSellers in system:');
  const sellers = await db.query(
    `SELECT full_name, email FROM pos_profiles WHERE role = 'SELLER' ORDER BY email`
  );
  sellers.rows.forEach((s) => console.log(`  - ${s.full_name} <${s.email}>`));

  process.exit(0);
};

run().catch((e) => {
  console.error('POS bootstrap failed:', e.message);
  process.exit(1);
});
