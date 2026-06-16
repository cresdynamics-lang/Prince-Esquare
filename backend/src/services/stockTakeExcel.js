/**
 * Stock take Excel export/import — physical count adjustments with variance like Excel.
 * Variance = Physical Count − System Qty (positive = surplus, negative = shortage).
 */
const ExcelJS = require('exceljs');
const db = require('../config/db');
const posDb = require('../lib/posDb');
const { applyStockTake, applyStoreStockTake } = require('./inventoryMovement');

const num = (v) => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
};

const readCellNumber = (cell) => {
  if (!cell) return null;
  const v = cell.value;
  if (typeof v === 'object' && v != null && v.result != null) return num(v.result);
  return num(v) ?? num(cellText(cell));
};

const cellText = (cell) => {
  const v = cell?.value;
  if (v == null) return '';
  if (typeof v === 'object' && v.text) return String(v.text).trim();
  if (typeof v === 'object' && v.result != null) return String(v.result).trim();
  return String(v).trim();
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
  'retail price': 'retailPrice',
  retail: 'retailPrice',
  'system qty': 'systemQty',
  system: 'systemQty',
  'system quantity': 'systemQty',
  'physical count': 'physicalQty',
  'physical qty': 'physicalQty',
  physical: 'physicalQty',
  count: 'physicalQty',
  'counted qty': 'physicalQty',
  variance: 'variance',
  'shop system qty': 'shopSystemQty',
  'shop system': 'shopSystemQty',
  'shop physical count': 'shopPhysicalQty',
  'shop physical qty': 'shopPhysicalQty',
  'shop count': 'shopPhysicalQty',
  'shop variance': 'shopVariance',
  'store system qty': 'storeSystemQty',
  'store system': 'storeSystemQty',
  'warehouse system qty': 'storeSystemQty',
  'warehouse system': 'storeSystemQty',
  'store physical count': 'storePhysicalQty',
  'store physical qty': 'storePhysicalQty',
  'warehouse physical count': 'storePhysicalQty',
  'warehouse physical qty': 'storePhysicalQty',
  'store count': 'storePhysicalQty',
  'warehouse count': 'storePhysicalQty',
  'store variance': 'storeVariance',
  'warehouse variance': 'storeVariance',
};

const mapHeaders = (row) => {
  const map = {};
  row.eachCell((cell, col) => {
    const key = HEADER_MAP[normalizeHeader(cellText(cell))];
    if (key) map[key] = col;
  });
  return map;
};

const retailForRow = (p) =>
  parseFloat(p.shop_price) ||
  parseFloat(p.website_discount_price) ||
  parseFloat(p.website_price) ||
  parseFloat(p.online_price) ||
  0;

const costForRow = (p) => {
  const c = p.cost_price ?? p.website_cost_price;
  return c != null ? parseFloat(c) : null;
};

const systemQtyFor = (p, location) =>
  location === 'store' ? (p.store_qty ?? p.storeQty ?? 0) : (p.current_qty ?? p.currentQty ?? 0);

/** Build stock-take workbook for shop or warehouse. */
const buildStockTakeWorkbook = async ({ category = null, location = 'shop' } = {}) => {
  const raw = await posDb.getStockLevels({ category });
  const wb = new ExcelJS.Workbook();
  const locLabel = location === 'store' ? 'Warehouse' : 'Shop';
  const ws = wb.addWorksheet(`Stock Take (${locLabel})`);

  const headers = [
    'Inventory ID',
    'SKU',
    'Product Name',
    'Category',
    'On Website',
    'Cost Price',
    'Retail Price',
    'System Qty',
    'Physical Count',
    'Variance',
    'Cost Value',
    'Retail Value',
    'Profit',
  ];
  ws.addRow(headers);

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFD4AF37' } };

  raw.forEach((p, idx) => {
    const rowNum = idx + 2;
    const system = systemQtyFor(p, location);
    const cost = costForRow(p);
    const retail = retailForRow(p);
    const onWeb = p.on_website ? 'Yes' : 'No';

    ws.addRow([
      p.id,
      p.sku || '',
      p.name || '',
      p.category || '',
      onWeb,
      cost ?? '',
      retail,
      system,
      system,
      null,
      null,
      null,
      null,
    ]);

    ws.getCell(`J${rowNum}`).value = { formula: `I${rowNum}-H${rowNum}`, result: 0 };
    ws.getCell(`K${rowNum}`).value = { formula: `F${rowNum}*I${rowNum}`, result: 0 };
    ws.getCell(`L${rowNum}`).value = { formula: `G${rowNum}*I${rowNum}`, result: 0 };
    ws.getCell(`M${rowNum}`).value = { formula: `L${rowNum}-K${rowNum}`, result: 0 };
  });

  ws.columns = [
    { width: 38 },
    { width: 22 },
    { width: 36 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ];

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return wb;
};

/** One workbook — shop floor + warehouse counts on the same rows. */
const buildCombinedStockTakeWorkbook = async ({ category = null } = {}) => {
  const raw = await posDb.getStockLevels({ category });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Stock');

  const headers = [
    'Inventory ID',
    'SKU',
    'Product Name',
    'Category',
    'On Website',
    'Cost Price',
    'Retail Price',
    'Shop System Qty',
    'Shop Physical Count',
    'Shop Variance',
    'Store System Qty',
    'Store Physical Count',
    'Store Variance',
  ];
  ws.addRow(headers);

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFD4AF37' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  raw.forEach((p, idx) => {
    const rowNum = idx + 2;
    const shopSystem = systemQtyFor(p, 'shop');
    const storeSystem = systemQtyFor(p, 'store');
    const cost = costForRow(p);
    const retail = retailForRow(p);
    const onWeb = p.on_website ? 'Yes' : 'No';

    ws.addRow([
      p.id,
      p.sku || '',
      p.name || '',
      p.category || '',
      onWeb,
      cost ?? '',
      retail,
      shopSystem,
      shopSystem,
      null,
      storeSystem,
      storeSystem,
      null,
    ]);

    ws.getCell(`J${rowNum}`).value = { formula: `I${rowNum}-H${rowNum}`, result: 0 };
    ws.getCell(`M${rowNum}`).value = { formula: `L${rowNum}-K${rowNum}`, result: 0 };
  });

  ws.columns = [
    { width: 38 },
    { width: 22 },
    { width: 36 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 12 },
  ];

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return wb;
};

const exportStockTakeBuffer = async ({ category = null, location = 'both' } = {}) => {
  const wb =
    location === 'shop' || location === 'store'
      ? await buildStockTakeWorkbook({ category, location })
      : await buildCombinedStockTakeWorkbook({ category });
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

const resolvePhysicalQty = (physicalCol, systemCol, varianceCol, row) => {
  let physicalQty = physicalCol ? readCellNumber(row.getCell(physicalCol)) : null;
  const systemQty = systemCol ? readCellNumber(row.getCell(systemCol)) : null;
  const variance = varianceCol ? readCellNumber(row.getCell(varianceCol)) : null;
  if (physicalQty == null && systemQty != null && variance != null) {
    physicalQty = systemQty + variance;
  }
  if (physicalQty == null) return null;
  return Math.max(0, Math.round(physicalQty));
};

const parseStockTakeWorksheet = (ws) => {
  if (!ws || ws.rowCount < 2) {
    throw new Error('Excel file is empty or missing data rows');
  }
  const cols = mapHeaders(ws.getRow(1));
  const combined = Boolean(cols.shopPhysicalQty || cols.storePhysicalQty);
  if (!combined && !cols.physicalQty && !cols.variance) {
    throw new Error('Missing physical count column(s) in row 1');
  }
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

    const costPrice = cols.costPrice ? readCellNumber(row.getCell(cols.costPrice)) : null;
    const retailPrice = cols.retailPrice ? readCellNumber(row.getCell(cols.retailPrice)) : null;

    if (combined) {
      const shopPhysicalQty = resolvePhysicalQty(
        cols.shopPhysicalQty,
        cols.shopSystemQty,
        cols.shopVariance,
        row
      );
      const storePhysicalQty = resolvePhysicalQty(
        cols.storePhysicalQty,
        cols.storeSystemQty,
        cols.storeVariance,
        row
      );
      if (shopPhysicalQty == null && storePhysicalQty == null) continue;
      rows.push({
        inventoryId: inventoryId || null,
        sku: sku || null,
        name: name || null,
        shopPhysicalQty,
        storePhysicalQty,
        costPrice,
        retailPrice,
        combined: true,
      });
      continue;
    }

    const physicalQty = resolvePhysicalQty(cols.physicalQty, cols.systemQty, cols.variance, row);
    if (physicalQty == null) continue;

    rows.push({
      inventoryId: inventoryId || null,
      sku: sku || null,
      name: name || null,
      physicalQty,
      costPrice,
      retailPrice,
      combined: false,
    });
  }

  if (!rows.length) throw new Error('No stock take rows found in Excel');
  return { rows, combined: rows[0]?.combined ?? combined };
};

const parseStockTakeBuffer = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  return parseStockTakeWorksheet(ws);
};

const applyCostAndRetail = async (row, productId, { updateRetail = true } = {}) => {
  let costChanged = false;
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
    costChanged = true;
  }
  if (updateRetail && row.retailPrice != null && row.retailPrice >= 0) {
    await db.query(`UPDATE pos_products SET shop_price = $1 WHERE id = $2`, [
      row.retailPrice,
      productId,
    ]);
  }
  return costChanged;
};

/** Apply uploaded stock take — updates POS, movements, audit, and website stock. */
const importStockTakeRows = async (rows, { location = 'shop', recordedBy = null } = {}) => {
  const { ensureAllEcommerceProductsInPos } = require('./inventoryChannel');
  await ensureAllEcommerceProductsInPos();

  const apply = location === 'store' ? applyStoreStockTake : applyStockTake;
  const adjustments = [];
  const skipped = [];
  let costUpdated = 0;

  for (const row of rows) {
    const productId = await resolveProductId(row);
    if (!productId) {
      skipped.push({ ...row, reason: 'Product not found' });
      continue;
    }

    if (await applyCostAndRetail(row, productId, { updateRetail: location === 'shop' })) {
      costUpdated += 1;
    }

    const result = await apply(productId, row.physicalQty, { recordedBy });
    if (result.variance !== 0) {
      adjustments.push({
        productId,
        location,
        physicalQty: location === 'shop' ? result.shopQty : result.storeQty,
        variance: result.variance,
      });
    }
  }

  return {
    processed: rows.length,
    adjusted: adjustments.length,
    adjustments,
    skipped,
    costUpdated,
    location,
  };
};

/** Shop + warehouse counts from one sheet. */
const importCombinedStockTakeRows = async (rows, { recordedBy = null } = {}) => {
  const { ensureAllEcommerceProductsInPos } = require('./inventoryChannel');
  await ensureAllEcommerceProductsInPos();

  const adjustments = [];
  const skipped = [];
  let costUpdated = 0;

  for (const row of rows) {
    const productId = await resolveProductId(row);
    if (!productId) {
      skipped.push({ ...row, reason: 'Product not found' });
      continue;
    }

    if (await applyCostAndRetail(row, productId)) {
      costUpdated += 1;
    }

    if (row.shopPhysicalQty != null) {
      const shop = await applyStockTake(productId, row.shopPhysicalQty, { recordedBy });
      if (shop.variance !== 0) {
        adjustments.push({
          productId,
          location: 'shop',
          physicalQty: shop.shopQty,
          variance: shop.variance,
        });
      }
    }

    if (row.storePhysicalQty != null) {
      const store = await applyStoreStockTake(productId, row.storePhysicalQty, { recordedBy });
      if (store.variance !== 0) {
        adjustments.push({
          productId,
          location: 'store',
          physicalQty: store.storeQty,
          variance: store.variance,
        });
      }
    }
  }

  return {
    processed: rows.length,
    adjusted: adjustments.length,
    adjustments,
    skipped,
    costUpdated,
    location: 'both',
  };
};

module.exports = {
  buildStockTakeWorkbook,
  buildCombinedStockTakeWorkbook,
  exportStockTakeBuffer,
  parseStockTakeBuffer,
  importStockTakeRows,
  importCombinedStockTakeRows,
};
