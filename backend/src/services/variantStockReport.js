/**
 * Variant-level stock report: physical pieces by category/color/size
 * and website product variants with transfer/reorder suggestions.
 */
const db = require('../config/db');
const ExcelJS = require('exceljs');
const { LEGACY_SKU_TO_CATEGORY } = require('./inventoryWarehouseSync');

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const norm = (s) => String(s || '').trim();
const normSize = (s) => norm(s).replace(/^size\s+/i, '');

const parsePieceMeta = (row) => {
  const draft = parseJson(row.website_details);
  const v = draft.variants?.[0] || {};
  const cg = draft.color_groups?.[0];
  const sz = cg?.sizes?.[0];
  let color = norm(v.color || cg?.color);
  let size = normSize(v.size || sz?.size);

  const name = norm(row.name);
  if (!size && name) {
    const m = name.match(/[—–-]\s*([^—–-]+?)\s+(\d{2}(?:\.\d)?|\d{2}\/\d{2}|[XSML]{1,3})\s*$/i);
    if (m) {
      if (!color) color = norm(m[1]);
      size = normSize(m[2]);
    }
  }
  if (!color && name) {
    const colors = ['Black', 'Brown', 'Tan', 'Navy', 'Burgundy', 'White', 'Grey', 'Gray', 'Khaki', 'Blue', 'Red'];
    for (const c of colors) {
      if (name.toLowerCase().includes(c.toLowerCase())) {
        color = c;
        break;
      }
    }
  }

  return {
    category: norm(row.category),
    color: color || 'Unspecified',
    size: size || 'Standard',
    isWarehouse: String(row.sku || '').includes('-W-'),
  };
};

const aggKey = (category, color, size) =>
  `${category}||${color.toLowerCase()}||${size.toLowerCase()}`;

const suggestAction = ({ shopQty, warehouseQty, webStock }) => {
  const shop = shopQty ?? 0;
  const wh = warehouseQty ?? 0;
  const web = webStock ?? 0;
  if (shop <= 0 && wh > 0) return 'Transfer warehouse → shop';
  if (shop <= 0 && wh <= 0) return web > 0 ? 'Out — fix web stock & reorder' : 'Out — receive / reorder';
  if (wh <= 0 && shop > 0 && shop < 3) return 'Low warehouse backup — receive at store';
  if (web !== shop && shop > 0) return 'Update web stock to match shop';
  if (web > shop) return 'Web over-counted vs shop';
  return 'OK';
};

const fetchPhysicalAggregates = async (categoryFilter = '') => {
  const params = [];
  let where = `WHERE pp.sku LIKE 'PE-CAT-%'`;
  if (categoryFilter) {
    params.push(categoryFilter);
    where += ` AND pp.category = $${params.length}`;
  }

  const r = await db.query(
    `SELECT pp.category, pp.name, pp.sku, pp.website_details,
            COALESCE(sl.current_qty, 0)::int AS shop_qty,
            COALESCE(st.current_qty, 0)::int AS store_qty
     FROM pos_products pp
     LEFT JOIN pos_stock_levels sl ON sl.product_id = pp.id
     LEFT JOIN pos_store_stock_levels st ON st.product_id = pp.id
     ${where}`,
    params
  );

  const map = new Map();
  for (const row of r.rows) {
    const meta = parsePieceMeta(row);
    const key = aggKey(meta.category, meta.color, meta.size);
    if (!map.has(key)) {
      map.set(key, {
        category: meta.category,
        color: meta.color,
        size: meta.size,
        shopQty: 0,
        warehouseQty: 0,
      });
    }
    const entry = map.get(key);
    if (meta.isWarehouse) {
      entry.warehouseQty += row.store_qty ?? 0;
    } else {
      entry.shopQty += row.shop_qty ?? 0;
    }
  }

  return map;
};

const fetchWebsiteVariantRows = async (categoryFilter = '') => {
  const params = [];
  let where = `WHERE p.is_active = true`;
  if (categoryFilter) {
    params.push(categoryFilter);
    where += ` AND (c.name = $${params.length} OR pp.category = $${params.length})`;
  }

  const withVariants = await db.query(
    `SELECT p.id AS product_id,
            p.name AS product_name,
            p.sku AS website_sku,
            c.name AS category_name,
            pp.category AS stock_category,
            pp.sku AS pos_sku,
            v.id AS variant_id,
            v.color,
            v.size,
            v.stock_quantity AS web_stock
     FROM products p
     JOIN product_variants v ON v.product_id = p.id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     ${where}
     ORDER BY c.name NULLS LAST, p.name, v.color, v.size`,
    params
  );

  const noVariants = await db.query(
    `SELECT p.id AS product_id,
            p.name AS product_name,
            p.sku AS website_sku,
            c.name AS category_name,
            pp.category AS stock_category,
            pp.sku AS pos_sku,
            NULL::uuid AS variant_id,
            NULL AS color,
            NULL AS size,
            p.stock_quantity AS web_stock
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN pos_products pp ON pp.id = p.pos_stock_product_id
     ${where}
       AND NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
     ORDER BY c.name NULLS LAST, p.name`,
    params
  );

  return [...withVariants.rows, ...noVariants.rows];
};

const resolveStockCategory = (row) => {
  const posSku = row.pos_sku || '';
  if (LEGACY_SKU_TO_CATEGORY[posSku]) return LEGACY_SKU_TO_CATEGORY[posSku];
  return row.stock_category || row.category_name || 'General';
};

const buildReport = async ({ category = '' } = {}) => {
  const physical = await fetchPhysicalAggregates(category);
  const websiteRows = await fetchWebsiteVariantRows(category);

  const physicalRows = [...physical.values()].sort((a, b) => {
    const c = a.category.localeCompare(b.category);
    if (c) return c;
    const col = a.color.localeCompare(b.color);
    if (col) return col;
    return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
  });

  const productRows = websiteRows.map((row) => {
    const stockCategory = resolveStockCategory(row);
    const color = norm(row.color) || 'Unspecified';
    const size = normSize(row.size) || 'Standard';
    const phys = physical.get(aggKey(stockCategory, color, size)) || {
      shopQty: 0,
      warehouseQty: 0,
    };
    const shopQty = phys.shopQty;
    const warehouseQty = phys.warehouseQty;
    const webStock = row.web_stock ?? 0;
    return {
      productId: row.product_id,
      variantId: row.variant_id,
      productName: row.product_name,
      websiteSku: row.website_sku,
      category: row.category_name || stockCategory,
      stockCategory,
      posSku: row.pos_sku,
      color,
      size,
      shopQty,
      warehouseQty,
      webStock,
      status: shopQty > 0 ? (webStock > 0 ? 'In stock' : 'Shop only') : 'Out of stock',
      action: suggestAction({ shopQty, warehouseQty, webStock }),
    };
  });

  return { physicalRows, productRows };
};

const EXPORT_HEADERS_PHYSICAL = [
  'Category',
  'Color',
  'Size',
  'Shop Qty',
  'Warehouse Qty',
  'Total Available',
  'Suggested Action',
];

const EXPORT_HEADERS_PRODUCTS = [
  'Variant ID',
  'Product Name',
  'Website SKU',
  'Category',
  'Stock Category',
  'Color',
  'Size',
  'Shop Qty (physical)',
  'Warehouse Qty',
  'Web Stock',
  'Status',
  'Suggested Action',
];

const styleHeaderRow = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
};

const styleActionCell = (cell, action) => {
  if (!action || action === 'OK') return;
  if (action.includes('Transfer')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.font = { color: { argb: 'FFBFDBFE' } };
  } else if (action.includes('Out') || action.includes('reorder')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7F1D1D' } };
    cell.font = { color: { argb: 'FFFECACA' } };
  } else if (action.includes('Update web') || action.includes('over-counted')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF78350F' } };
    cell.font = { color: { argb: 'FFFDE68A' } };
  } else if (action.includes('Low warehouse')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF713F12' } };
    cell.font = { color: { argb: 'FFFEF3C7' } };
  }
};

const exportVariantStockWorkbook = async ({ category = '' } = {}) => {
  const { physicalRows, productRows } = await buildReport({ category });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Prince Esquare';
  wb.created = new Date();

  const wsPhys = wb.addWorksheet('Physical by Category');
  wsPhys.addRow(EXPORT_HEADERS_PHYSICAL);
  styleHeaderRow(wsPhys.getRow(1));
  for (const r of physicalRows) {
    const total = r.shopQty + r.warehouseQty;
    const action = suggestAction({
      shopQty: r.shopQty,
      warehouseQty: r.warehouseQty,
      webStock: r.shopQty,
    });
    const row = wsPhys.addRow([
      r.category,
      r.color,
      r.size,
      r.shopQty,
      r.warehouseQty,
      total,
      action,
    ]);
    styleActionCell(row.getCell(7), action);
  }
  wsPhys.columns = [
    { width: 18 }, { width: 16 }, { width: 10 }, { width: 10 },
    { width: 14 }, { width: 14 }, { width: 28 },
  ];

  const wsProd = wb.addWorksheet('Website Products');
  wsProd.addRow(EXPORT_HEADERS_PRODUCTS);
  styleHeaderRow(wsProd.getRow(1));
  for (const r of productRows) {
    const row = wsProd.addRow([
      r.variantId || '',
      r.productName,
      r.websiteSku || '',
      r.category,
      r.stockCategory,
      r.color,
      r.size,
      r.shopQty,
      r.warehouseQty,
      r.webStock,
      r.status,
      r.action,
    ]);
    styleActionCell(row.getCell(12), r.action);
  }
  wsProd.columns = [
    { width: 38 }, { width: 32 }, { width: 22 }, { width: 16 }, { width: 16 },
    { width: 14 }, { width: 10 }, { width: 16 }, { width: 14 }, { width: 10 },
    { width: 14 }, { width: 28 },
  ];

  const transferCount = physicalRows.filter((r) => r.shopQty <= 0 && r.warehouseQty > 0).length;
  const outCount = physicalRows.filter((r) => r.shopQty <= 0 && r.warehouseQty <= 0).length;
  const mismatchCount = productRows.filter((r) => r.webStock !== r.shopQty && r.shopQty > 0).length;

  const wsSum = wb.addWorksheet('Summary');
  wsSum.addRow(['Variant Stock Report', new Date().toISOString().slice(0, 10)]);
  wsSum.addRow(['Category filter', category || 'All']);
  wsSum.addRow(['Physical combinations', physicalRows.length]);
  wsSum.addRow(['Website variant rows', productRows.length]);
  wsSum.addRow(['Need warehouse → shop transfer', transferCount]);
  wsSum.addRow(['Completely out (shop + warehouse)', outCount]);
  wsSum.addRow(['Web stock ≠ shop (needs update)', mismatchCount]);
  wsSum.addRow([]);
  wsSum.addRow(['How to use']);
  wsSum.addRow(['Physical by Category', 'True counts from shop floor + warehouse pieces. Use for transfers.']);
  wsSum.addRow(['Website Products', 'Each listing size/color. Shop Qty = physical count for that category. Edit Web Stock and re-import.']);
  wsSum.columns = [{ width: 36 }, { width: 60 }];

  return { wb, stats: { physicalRows: physicalRows.length, productRows: productRows.length, transferCount, outCount, mismatchCount } };
};

const VARIANT_HEADER_MAP = {
  'variant id': 'variantId',
  'product name': 'productName',
  product: 'productName',
  name: 'productName',
  'website sku': 'websiteSku',
  sku: 'websiteSku',
  category: 'category',
  color: 'color',
  size: 'size',
  'shop qty': 'shopQty',
  'shop qty (physical)': 'shopQty',
  'warehouse qty': 'warehouseQty',
  'web stock': 'webStock',
  'web stock qty': 'webStock',
};

const normalizeHeader = (h) =>
  String(h || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const cellText = (cell) => {
  const v = cell?.value;
  if (v == null) return '';
  if (typeof v === 'object' && v.text) return String(v.text).trim();
  return String(v).trim();
};

const parseVariantImportSheet = (ws) => {
  if (!ws || ws.rowCount < 2) {
    throw new Error('Excel file is empty or missing data rows');
  }
  const headerRow = ws.getRow(1);
  const cols = {};
  headerRow.eachCell((cell, col) => {
    const key = VARIANT_HEADER_MAP[normalizeHeader(cellText(cell))];
    if (key) cols[key] = col;
  });
  if (!cols.webStock && !cols.variantId) {
    throw new Error('Sheet must include "Web Stock" column or "Variant ID"');
  }
  if (!cols.variantId && !(cols.websiteSku && cols.color && cols.size)) {
    throw new Error('Include Variant ID, or Website SKU + Color + Size to match rows');
  }

  const rows = [];
  for (let r = 2; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    const get = (key) => (cols[key] ? cellText(row.getCell(cols[key])) : '');
    const variantId = get('variantId');
    const productName = get('productName');
    const websiteSku = get('websiteSku');
    const color = norm(get('color')) || 'Unspecified';
    const size = normSize(get('size')) || 'Standard';
    const webRaw = cols.webStock ? row.getCell(cols.webStock).value : null;
    if (webRaw == null || webRaw === '') continue;
    const webStock = Math.max(0, parseInt(webRaw, 10) || 0);
    if (!variantId && !websiteSku && !productName) continue;

    rows.push({ variantId: variantId || null, websiteSku, productName, color, size, webStock });
  }
  if (!rows.length) throw new Error('No variant rows with Web Stock values found');
  return rows;
};

const importVariantStockRows = async (rows, { performedBy = null } = {}) => {
  const client = await db.pool.connect();
  const result = { updated: 0, skipped: 0, products: new Set(), warnings: [] };

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      let variantId = row.variantId;
      if (!variantId) {
        const match = await client.query(
          `SELECT v.id, v.product_id
           FROM product_variants v
           JOIN products p ON p.id = v.product_id
           WHERE p.is_active = true
             AND (
               ($1 <> '' AND UPPER(p.sku) = UPPER($1))
               OR ($2 <> '' AND p.name ILIKE $2)
             )
             AND LOWER(COALESCE(v.color, 'unspecified')) = LOWER($3)
             AND LOWER(COALESCE(v.size, 'standard')) = LOWER($4)
           LIMIT 1`,
          [
            row.websiteSku || '',
            row.productName ? row.productName : '',
            row.color,
            row.size,
          ]
        );
        if (!match.rows.length) {
          result.skipped += 1;
          result.warnings.push(`No match: ${row.websiteSku || row.productName} ${row.color} ${row.size}`);
          continue;
        }
        variantId = match.rows[0].id;
      }

      const upd = await client.query(
        `UPDATE product_variants SET stock_quantity = $1 WHERE id = $2 RETURNING product_id`,
        [row.webStock, variantId]
      );
      if (!upd.rows.length) {
        result.skipped += 1;
        continue;
      }
      result.updated += 1;
      result.products.add(upd.rows[0].product_id);
    }

    for (const productId of result.products) {
      const sumR = await client.query(
        `SELECT COALESCE(SUM(stock_quantity), 0)::int AS total FROM product_variants WHERE product_id = $1`,
        [productId]
      );
      await client.query(
        `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`,
        [sumR.rows[0]?.total ?? 0, productId]
      );
    }

    await client.query(
      `INSERT INTO pos_audit_logs (action, entity, performed_by, details)
       VALUES ('VARIANT_STOCK_IMPORT', 'product_variants', $1, $2)`,
      [performedBy, JSON.stringify({ updated: result.updated, skipped: result.skipped })]
    );

    await client.query('COMMIT');
    return {
      ...result,
      productsUpdated: result.products.size,
      products: undefined,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const parseVariantImportBuffer = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws =
    wb.getWorksheet('Website Products')
    || wb.worksheets.find((s) => /website/i.test(s.name))
    || wb.worksheets[0];
  return parseVariantImportSheet(ws);
};

module.exports = {
  buildReport,
  exportVariantStockWorkbook,
  importVariantStockRows,
  parseVariantImportBuffer,
  fetchPhysicalAggregates,
  suggestAction,
  aggKey,
  parsePieceMeta,
};
