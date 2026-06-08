// NEW — CLI: import Stock.xlsx into pos_* tables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { importStockExcelBuffer } = require('../src/services/stockExcelImport');

const filePath = process.argv[2] || path.join(__dirname, 'Stock.xlsx');

const run = async () => {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  const buffer = fs.readFileSync(filePath);
  const result = await importStockExcelBuffer(buffer, { recordMovements: true });
  console.log('Import complete:', result);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
