// NEW — Parse Prince Esquire stock Excel (Item, Opening, sales, Stock Out, Stock In, Closing)
const ExcelJS = require('exceljs');

const num = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const cellText = (cell) => {
  const v = cell?.value;
  if (v == null) return '';
  if (typeof v === 'object' && v.text) return String(v.text).trim();
  return String(v).trim();
};

const normalizeHeader = (h) =>
  String(h || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const HEADER_MAP = {
  item: 'name',
  product: 'name',
  'product name': 'name',
  name: 'name',
  sku: 'sku',
  'shop price': 'shopPrice',
  'pos price': 'shopPrice',
  price: 'shopPrice',
  category: 'category',
  'opening qty': 'openingQty',
  'opening quantity': 'openingQty',
  'opening stock': 'opening',
  opening: 'opening',
  qty: 'openingQty',
  quantity: 'openingQty',
  'website sku': 'websiteSku',
  'web sku': 'websiteSku',
  'store qty': 'storeQty',
  'store quantity': 'storeQty',
  'store stock': 'storeQty',
  sales: 'sales',
  'stock out': 'stockOut',
  'stock in': 'stockIn',
  'closing stock': 'closing',
  closing: 'closing',
};

const CATALOG_REQUIRED = ['name', 'sku'];
const STOCK_REQUIRED = ['name'];

const mapHeaders = (row) => {
  const map = {};
  row.eachCell((cell, col) => {
    const key = HEADER_MAP[normalizeHeader(cellText(cell))];
    if (key) map[key] = col;
  });
  return map;
};

const parseStockWorksheet = (ws) => {
  if (!ws || ws.rowCount < 2) {
    throw new Error('Excel file is empty or missing data rows');
  }

  const headerRow = ws.getRow(1);
  const cols = mapHeaders(headerRow);
  if (!cols.name) {
    throw new Error('Missing "Item" column in row 1');
  }

  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = cellText(row.getCell(cols.name));
    if (!name || name.length < 2) continue;

    const opening = cols.opening ? num(row.getCell(cols.opening).value) : 0;
    const sales = cols.sales ? num(row.getCell(cols.sales).value) : 0;
    const stockOut = cols.stockOut ? num(row.getCell(cols.stockOut).value) : 0;
    const stockIn = cols.stockIn ? num(row.getCell(cols.stockIn).value) : 0;
    let closing = cols.closing ? row.getCell(cols.closing).value : null;
    closing = closing != null && closing !== '' ? num(closing) : opening - sales - stockOut + stockIn;

    rows.push({ name, opening, sales, stockOut, stockIn, closing });
  }

  if (!rows.length) throw new Error('No product rows found in Excel');
  return rows;
};

const skuFromName = (name) =>
  `POS-${name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

const detectWorksheetFormat = (ws) => {
  const headerRow = ws.getRow(1);
  const cols = mapHeaders(headerRow);
  if (cols.sku && (cols.shopPrice || cols.openingQty)) return 'catalog';
  return 'stock';
};

const parseCatalogWorksheet = (ws) => {
  if (!ws || ws.rowCount < 2) {
    throw new Error('Excel file is empty or missing data rows');
  }
  const headerRow = ws.getRow(1);
  const cols = mapHeaders(headerRow);
  if (!cols.name) throw new Error('Missing "Product Name" column in row 1');
  if (!cols.sku) throw new Error('Missing "SKU" column — use Product Catalog template');

  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = cellText(row.getCell(cols.name));
    const sku = cols.sku ? cellText(row.getCell(cols.sku)) : '';
    if (!name || name.length < 2) continue;

    rows.push({
      name,
      sku: sku || skuFromName(name),
      category: cols.category ? cellText(row.getCell(cols.category)) || 'General' : 'General',
      shopPrice: cols.shopPrice ? num(row.getCell(cols.shopPrice).value) : 0,
      openingQty: cols.openingQty ? num(row.getCell(cols.openingQty).value) : 0,
      websiteSku: cols.websiteSku ? cellText(row.getCell(cols.websiteSku)) : '',
      storeQty: cols.storeQty ? num(row.getCell(cols.storeQty).value) : 0,
    });
  }
  if (!rows.length) throw new Error('No product rows found in catalog Excel');
  return rows;
};

const pickCatalogWorksheet = (wb) => {
  const named = wb.getWorksheet('Inventory Catalog');
  if (named) return named;
  const match = wb.worksheets.find((ws) => detectWorksheetFormat(ws) === 'catalog');
  return match || wb.worksheets[0];
};

const parseStockExcelBuffer = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  return parseStockWorksheet(ws);
};

const parseExcelBuffer = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const first = wb.worksheets[0];
  const catalogWs = pickCatalogWorksheet(wb);
  if (detectWorksheetFormat(catalogWs) === 'catalog') {
    return { format: 'catalog', rows: parseCatalogWorksheet(catalogWs) };
  }
  return { format: 'stock', rows: parseStockWorksheet(first) };
};

module.exports = {
  parseStockExcelBuffer,
  parseStockWorksheet,
  parseCatalogWorksheet,
  parseExcelBuffer,
  detectWorksheetFormat,
  skuFromName,
  num,
};
