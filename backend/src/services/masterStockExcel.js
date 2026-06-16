/**
 * Master stock workbook — one sheet per product with prices, opening/closing,
 * store↔shop movements, and warehouse qty.
 */
const ExcelJS = require('exceljs');
const db = require('../config/db');
const posDb = require('../lib/posDb');
const { toDateStr } = require('./dailyStockSnapshot');
const {
  transferStoreToShop,
  transferShopToStore,
  applyStockTake,
  applyStoreStockTake,
} = require('./inventoryMovement');

const num = (v) => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
};

const cellText = (cell) => {
  const v = cell?.value;
  if (v == null) return '';
  if (typeof v === 'object' && v.text) return String(v.text).trim();
  if (typeof v === 'object' && v.result != null) return String(v.result).trim();
  return String(v).trim();
};

const readCellNumber = (cell) => {
  if (!cell) return null;
  const v = cell.value;
  if (typeof v === 'object' && v != null && v.result != null) return num(v.result);
  return num(v) ?? num(cellText(cell));
};

const normalizeHeader = (h) =>
  String(h || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const HEADER_MAP = {
  'inventory id': 'inventoryId',
  'product id': 'inventoryId',
  id: 'inventoryId',
  sku: 'sku',
  'product name': 'name',
  name: 'name',
  item: 'name',
  product: 'name',
  category: 'category',
  'on website': 'onWebsite',
  'cost price': 'costPrice',
  cost: 'costPrice',
  'store price': 'storePrice',
  'warehouse price': 'storePrice',
  'retail price': 'retailPrice',
  'shop price': 'retailPrice',
  'sell price': 'retailPrice',
  retail: 'retailPrice',
  price: 'storePrice',
  'shop opening': 'shopOpening',
  'opening stock': 'shopOpening',
  opening: 'shopOpening',
  sales: 'sales',
  'stock out': 'stockOut',
  'stock out (shop→store)': 'stockOut',
  'stock out (shop->store)': 'stockOut',
  'stock in': 'stockIn',
  'stock in (store→shop)': 'stockIn',
  'stock in (store->shop)': 'stockIn',
  'shop closing': 'shopClosing',
  'closing stock': 'shopClosing',
  closing: 'shopClosing',
  'store qty': 'storeQty',
  'store quantity': 'storeQty',
  'warehouse qty': 'storeQty',
  store: 'storeQty',
};

const mapHeaders = (row) => {
  const map = {};
  row.eachCell((cell, col) => {
    const key = HEADER_MAP[normalizeHeader(cellText(cell))];
    if (key) map[key] = col;
  });
  return map;
};

const retailFor = (p) =>
  parseFloat(p.shop_price) ||
  parseFloat(p.website_discount_price) ||
  parseFloat(p.website_price) ||
  parseFloat(p.online_price) ||
  0;

const costFor = (p) => {
  const c = p.cost_price ?? p.website_cost_price;
  return c != null ? parseFloat(c) : null;
};

const MASTER_HEADERS = [
  'Inventory ID',
  'SKU',
  'Product Name',
  'Category',
  'On Website',
  'Cost Price',
  'Store Price',
  'Retail Price',
  'Shop Opening',
  'Sales',
  'Stock Out',
  'Stock In',
  'Shop Closing',
  'Store Qty',
];

const fetchMasterRows = async ({ category = null, dateStr } = {}) => {
  const params = [dateStr];
  let where = `WHERE p.sku NOT LIKE 'POS-%'`;
  if (category) {
    params.push(category);
    where += ` AND p.category = $${params.length}`;
  }

  const r = await db.query(
    `SELECT p.id, p.name, p.sku, p.category, p.cost_price, p.store_price, p.shop_price, p.online_price,
            ec.is_active AS website_published,
            COALESCE(s.current_qty, 0)::int AS shop_qty,
            COALESCE(st.current_qty, 0)::int AS store_qty,
            COALESCE(snap.opening_qty, s.current_qty, 0)::int AS shop_opening,
            COALESCE(snap.sales_qty, 0)::int AS sales_qty,
            COALESCE(snap.stock_out_qty, 0)::int AS stock_out_qty,
            COALESCE(snap.stock_in_qty, 0)::int AS stock_in_qty,
            COALESCE(snap.closing_qty, s.current_qty, 0)::int AS shop_closing
     FROM pos_products p
     LEFT JOIN pos_stock_levels s ON s.product_id = p.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
     LEFT JOIN products ec ON ec.id = p.ecommerce_product_id
     LEFT JOIN pos_daily_stock_snapshots snap
       ON snap.product_id = p.id AND snap.date = $1::date
     ${where}
     ORDER BY p.category ASC, p.name ASC`,
    params
  );
  return r.rows;
};

const buildMasterStockWorkbook = async ({ category = null, date = new Date() } = {}) => {
  const dateStr = toDateStr(date);
  const raw = await fetchMasterRows({ category, dateStr });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Stock');

  ws.addRow(MASTER_HEADERS);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFD4AF37' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  raw.forEach((p, idx) => {
    const rowNum = idx + 2;
    const cost = costFor(p);
    const storePrice = p.store_price != null ? parseFloat(p.store_price) : '';
    const retail = retailFor(p);
    const onWeb = p.website_published ? 'Yes' : 'No';

    ws.addRow([
      p.id,
      p.sku || '',
      p.name || '',
      p.category || '',
      onWeb,
      cost ?? '',
      storePrice,
      retail,
      p.shop_opening,
      p.sales_qty,
      p.stock_out_qty,
      p.stock_in_qty,
      p.shop_closing,
      p.store_qty,
    ]);

    ws.getCell(`M${rowNum}`).value = {
      formula: `I${rowNum}+L${rowNum}-K${rowNum}-J${rowNum}`,
      result: p.shop_closing,
    };
  });

  ws.columns = [
    { width: 38 },
    { width: 22 },
    { width: 34 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 8 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
  ];
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return wb;
};

const exportMasterStockBuffer = async (opts) => {
  const wb = await buildMasterStockWorkbook(opts);
  return wb.xlsx.writeBuffer();
};

const resolveProductId = async (row) => {
  if (row.inventoryId) {
    const r = await db.query(`SELECT id FROM pos_products WHERE id = $1`, [row.inventoryId]);
    if (r.rows.length) return r.rows[0].id;
  }
  if (row.sku) {
    const r = await db.query(
      `SELECT id FROM pos_products WHERE UPPER(sku) = UPPER($1) LIMIT 1`,
      [row.sku]
    );
    if (r.rows.length) return r.rows[0].id;
  }
  if (row.name) {
    const r = await db.query(
      `SELECT id FROM pos_products WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
      [row.name]
    );
    if (r.rows.length) return r.rows[0].id;
  }
  return null;
};

const parseMasterStockWorksheet = (ws) => {
  if (!ws || ws.rowCount < 2) {
    throw new Error('Excel file is empty or missing data rows');
  }
  const cols = mapHeaders(ws.getRow(1));
  if (!cols.inventoryId && !cols.sku && !cols.name) {
    throw new Error('Need Inventory ID, SKU, or Product Name column to match rows');
  }

  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = cols.name ? cellText(row.getCell(cols.name)) : '';
    const sku = cols.sku ? cellText(row.getCell(cols.sku)) : '';
    const inventoryId = cols.inventoryId ? cellText(row.getCell(cols.inventoryId)) : '';
    if (!name && !sku && !inventoryId) continue;

    const read = (key) => (cols[key] ? readCellNumber(row.getCell(cols[key])) : null);

    rows.push({
      inventoryId: inventoryId || null,
      sku: sku || null,
      name: name || null,
      costPrice: read('costPrice'),
      storePrice: read('storePrice'),
      retailPrice: read('retailPrice'),
      shopOpening: read('shopOpening'),
      sales: read('sales'),
      stockOut: read('stockOut'),
      stockIn: read('stockIn'),
      shopClosing: read('shopClosing'),
      storeQty: read('storeQty'),
    });
  }

  if (!rows.length) throw new Error('No stock rows found in Excel');
  return rows;
};

const parseMasterStockBuffer = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets.find((s) => s.name === 'Stock') || wb.worksheets[0];
  return parseMasterStockWorksheet(ws);
};

const upsertSnapshot = async (productId, dateStr, snapshot) => {
  await db.query(
    `INSERT INTO pos_daily_stock_snapshots
       (product_id, date, opening_qty, stock_in_qty, stock_out_qty, sales_qty, closing_qty)
     VALUES ($1, $2::date, $3, $4, $5, $6, $7)
     ON CONFLICT (product_id, date) DO UPDATE SET
       opening_qty = EXCLUDED.opening_qty,
       stock_in_qty = EXCLUDED.stock_in_qty,
       stock_out_qty = EXCLUDED.stock_out_qty,
       sales_qty = EXCLUDED.sales_qty,
       closing_qty = EXCLUDED.closing_qty`,
    [
      productId,
      dateStr,
      snapshot.opening,
      snapshot.stockIn,
      snapshot.stockOut,
      snapshot.sales,
      snapshot.closing,
    ]
  );
};

const importMasterStockRows = async (rows, { date = new Date(), recordedBy = null } = {}) => {
  const { ensureAllEcommerceProductsInPos } = require('./inventoryChannel');
  await ensureAllEcommerceProductsInPos();

  const dateStr = toDateStr(date);
  const adjustments = [];
  const skipped = [];
  let pricesUpdated = 0;

  for (const row of rows) {
    const productId = await resolveProductId(row);
    if (!productId) {
      skipped.push({ ...row, reason: 'Product not found' });
      continue;
    }

    if (row.costPrice != null && row.costPrice >= 0) {
      await db.query(`UPDATE pos_products SET cost_price = $1 WHERE id = $2`, [
        row.costPrice,
        productId,
      ]);
      const linkR = await db.query(
        `SELECT ecommerce_product_id FROM pos_products WHERE id = $1`,
        [productId]
      );
      if (linkR.rows[0]?.ecommerce_product_id) {
        await db.query(`UPDATE products SET cost_price = $1 WHERE id = $2`, [
          row.costPrice,
          linkR.rows[0].ecommerce_product_id,
        ]);
      }
      pricesUpdated += 1;
    }

    if (row.storePrice != null && row.storePrice >= 0) {
      await db.query(`UPDATE pos_products SET store_price = $1 WHERE id = $2`, [
        row.storePrice,
        productId,
      ]);
      pricesUpdated += 1;
    }

    if (row.retailPrice != null && row.retailPrice >= 0) {
      await db.query(`UPDATE pos_products SET shop_price = $1, online_price = $1 WHERE id = $2`, [
        row.retailPrice,
        productId,
      ]);
      const linkR = await db.query(
        `SELECT ecommerce_product_id FROM pos_products WHERE id = $1`,
        [productId]
      );
      if (linkR.rows[0]?.ecommerce_product_id) {
        await db.query(`UPDATE products SET price = $1 WHERE id = $2`, [
          row.retailPrice,
          linkR.rows[0].ecommerce_product_id,
        ]);
      }
      pricesUpdated += 1;
    }

    const levelsR = await db.query(
      `SELECT COALESCE(s.current_qty, 0)::int AS shop_qty,
              COALESCE(st.current_qty, 0)::int AS store_qty
       FROM pos_products p
       LEFT JOIN pos_stock_levels s ON s.product_id = p.id
       LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
       WHERE p.id = $1`,
      [productId]
    );
    const before = levelsR.rows[0] || { shop_qty: 0, store_qty: 0 };

    const hasShopActivity = [row.shopOpening, row.sales, row.stockOut, row.stockIn, row.shopClosing].some(
      (v) => v != null && v !== 0
    );

    if (hasShopActivity && row.stockIn != null && row.stockIn > 0) {
      try {
        await transferStoreToShop(productId, row.stockIn, {
          notes: 'Master stock sheet import',
          recordedBy,
        });
      } catch (e) {
        skipped.push({ ...row, reason: e.message || 'Stock in failed' });
        continue;
      }
    }

    if (hasShopActivity && row.stockOut != null && row.stockOut > 0) {
      try {
        await transferShopToStore(productId, row.stockOut, {
          notes: 'Master stock sheet import',
          recordedBy,
        });
      } catch (e) {
        skipped.push({ ...row, reason: e.message || 'Stock out failed' });
        continue;
      }
    }

    if (hasShopActivity && row.shopClosing != null && row.shopClosing !== before.shop_qty) {
      const result = await applyStockTake(productId, row.shopClosing, { recordedBy });
      if (result.variance !== 0) {
        adjustments.push({ productId, location: 'shop', variance: result.variance });
      }
    }

    if (row.storeQty != null && row.storeQty !== before.store_qty) {
      const result = await applyStoreStockTake(productId, row.storeQty, { recordedBy });
      if (result.variance !== 0) {
        adjustments.push({ productId, location: 'store', variance: result.variance });
      }
    }

    const afterR = await db.query(
      `SELECT COALESCE(s.current_qty, 0)::int AS shop_qty,
              COALESCE(st.current_qty, 0)::int AS store_qty
       FROM pos_products p
       LEFT JOIN pos_stock_levels s ON s.product_id = p.id
       LEFT JOIN pos_store_stock_levels st ON st.product_id = p.id
       WHERE p.id = $1`,
      [productId]
    );
    const after = afterR.rows[0] || { shop_qty: 0, store_qty: 0 };

    const opening = hasShopActivity && row.shopOpening != null ? row.shopOpening : before.shop_qty;
    const sales = hasShopActivity && row.sales != null ? row.sales : 0;
    const stockIn = hasShopActivity && row.stockIn != null ? row.stockIn : 0;
    const stockOut = hasShopActivity && row.stockOut != null ? row.stockOut : 0;
    const closing = hasShopActivity && row.shopClosing != null ? row.shopClosing : after.shop_qty;

    if (hasShopActivity || row.storeQty != null) {
      await upsertSnapshot(productId, dateStr, {
        opening,
        sales,
        stockIn,
        stockOut,
        closing,
      });
    }
  }

  return {
    processed: rows.length,
    adjusted: adjustments.length,
    adjustments,
    skipped,
    pricesUpdated,
    date: dateStr,
  };
};

module.exports = {
  MASTER_HEADERS,
  buildMasterStockWorkbook,
  exportMasterStockBuffer,
  parseMasterStockBuffer,
  importMasterStockRows,
  fetchMasterRows,
};
