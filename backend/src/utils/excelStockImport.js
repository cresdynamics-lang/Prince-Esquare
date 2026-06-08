// NEW — Parse & build Prince Esquire stock Excel format
const ExcelJS = require('exceljs');

const HEADERS = ['Item', 'Opening Stock', 'sales', 'Stock Out', 'Stock In', 'Closing Stock'];

const toNum = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const slugSku = (name) =>
  `POS-${name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

const normalizeHeader = (h) => String(h || '').trim().toLowerCase();

const parseStockWorkbook = async (bufferOrPath) => {
  const wb = new ExcelJS.Workbook();
  if (Buffer.isBuffer(bufferOrPath)) {
    await wb.xlsx.load(bufferOrPath);
  } else {
    await wb.xlsx.readFile(bufferOrPath);
  }

  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Excel file has no worksheets');

  const headerRow = ws.getRow(1).values.slice(1).map(normalizeHeader);
  const col = {};
  headerRow.forEach((h, i) => {
    if (h.includes('item') || h === 'product') col.item = i + 1;
    if (h.includes('opening')) col.opening = i + 1;
    if (h === 'sales' || h.includes('sale')) col.sales = i + 1;
    if (h.includes('stock out') || h === 'out') col.stockOut = i + 1;
    if (h.includes('stock in') || h === 'in') col.stockIn = i + 1;
    if (h.includes('closing')) col.closing = i + 1;
  });

  if (!col.item) {
    col.item = 1;
    col.opening = 2;
    col.sales = 3;
    col.stockOut = 4;
    col.stockIn = 5;
    col.closing = 6;
  }

  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const rawName = row.getCell(col.item).value;
    const name =
      typeof rawName === 'object' && rawName?.text
        ? String(rawName.text).trim()
        : String(rawName || '').trim();
    if (!name || name.length < 2) continue;

    const opening = toNum(row.getCell(col.opening || 2).value);
    const sales = toNum(row.getCell(col.sales || 3).value);
    const stockOut = toNum(row.getCell(col.stockOut || 4).value);
    const stockIn = toNum(row.getCell(col.stockIn || 5).value);
    const closingCell = col.closing ? row.getCell(col.closing).value : null;
    const closing =
      closingCell != null && closingCell !== ''
        ? toNum(closingCell)
        : opening - sales - stockOut + stockIn;

    rows.push({
      name,
      sku: slugSku(name),
      opening,
      sales,
      stockOut,
      stockIn,
      closing,
      currentQty: Math.max(0, closing),
    });
  }

  if (!rows.length) throw new Error('No product rows found in Excel file');
  return rows;
};

const buildStockWorkbook = async (rows, title = 'Stock Report') => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');

  ws.mergeCells(1, 1, 1, HEADERS.length);
  ws.getCell('A1').value = 'Prince Esquire';
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getCell(2, HEADERS.length).value = `Generated: ${new Date().toLocaleString()}`;

  const headerRowNum = 4;
  HEADERS.forEach((h, i) => {
    const cell = ws.getCell(headerRowNum, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0F1E' } };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  rows.forEach((row, idx) => {
    const r = headerRowNum + 1 + idx;
    ws.getCell(r, 1).value = row.name;
    ws.getCell(r, 2).value = row.opening;
    ws.getCell(r, 3).value = row.sales;
    ws.getCell(r, 4).value = row.stockOut;
    ws.getCell(r, 5).value = row.stockIn;
    ws.getCell(r, 6).value = row.closing;
  });

  ws.columns.forEach((col) => {
    let max = 12;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 36);
  });

  return wb;
};

module.exports = { parseStockWorkbook, buildStockWorkbook, slugSku, HEADERS };
