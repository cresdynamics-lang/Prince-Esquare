// NEW — Excel report styling helper
const ExcelJS = require('exceljs');

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0F1E' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };

const initWorkbook = (title, colCount) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Report');
  ws.mergeCells(1, 1, 1, colCount);
  ws.getCell('A1').value = 'Prince Esquire';
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, colCount - 1);
  ws.getCell('A2').value = title;
  ws.getCell(2, colCount).value = `Generated: ${new Date().toLocaleString()}`;
  return { wb, ws, headerRow: 4 };
};

const styleHeaderRow = (ws, rowNum, headers) => {
  headers.forEach((h, i) => {
    const cell = ws.getCell(rowNum, i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
};

const autoWidth = (ws) => {
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 40);
  });
};

const sendWorkbook = async (res, wb, filename) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
};

module.exports = { initWorkbook, styleHeaderRow, autoWidth, sendWorkbook };
