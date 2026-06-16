// NEW — POS inventory routes
const express = require('express');
const multer = require('multer');
const router = express.Router();
const inventoryController = require('../controllers/pos/inventoryController');
const { requireInventoryView, requireInventoryManage } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.endsWith('.xlsx');
    cb(ok ? null : new Error('Only .xlsx files allowed'), ok);
  },
});

// Read-only (view + download)
router.get('/export-stock', requireInventoryView, inventoryController.exportStockSheet);
router.get('/export-catalog', requireInventoryView, inventoryController.exportProductCatalog);
router.get('/export-variant-stock', requireInventoryView, inventoryController.exportVariantStock);
router.get('/variant-stock-summary', requireInventoryView, inventoryController.variantStockSummary);
router.get('/template', requireInventoryView, inventoryController.downloadTemplate);
router.get('/products/:id', requireInventoryView, inventoryController.getProductDetail);
router.get('/daily-sheet', requireInventoryView, inventoryController.dailySheet);
router.get('/movements', requireInventoryView, inventoryController.movements);
router.get('/stock-levels', requireInventoryView, inventoryController.stockLevels);
router.get('/category-pieces', requireInventoryView, inventoryController.categoryPieces);
router.get('/category-summary', requireInventoryView, inventoryController.categorySummary);
router.get('/export-stock-take', requireInventoryView, inventoryController.exportStockTake);
router.get('/export-master-stock', requireInventoryView, inventoryController.exportMasterStock);

// Admin-only mutations (inventory manage)
router.post('/import-excel', requireInventoryManage, upload.single('file'), inventoryController.importExcel);
router.post('/import-variant-stock', requireInventoryManage, upload.single('file'), inventoryController.importVariantStock);
router.post('/products', requireInventoryManage, inventoryController.createInventoryItem);
router.put('/products/:id/details', requireInventoryManage, inventoryController.saveProductDetail);
router.post('/products/:id/sync-website', requireInventoryManage, inventoryController.syncFromWebsite);
router.post('/stock-in', requireInventoryManage, inventoryController.stockIn);
router.post('/stock-in/bulk', requireInventoryManage, inventoryController.bulkStockIn);
router.post('/stock-out', requireInventoryManage, inventoryController.stockOut);
router.post('/stock-out/bulk', requireInventoryManage, inventoryController.bulkStockOut);
router.post('/store-receive', requireInventoryManage, inventoryController.receiveAtStore);
router.post('/close-day', requireInventoryManage, inventoryController.closeDay);
router.post('/stock-take', requireInventoryManage, inventoryController.stockTake);
router.post('/store-stock-take', requireInventoryManage, inventoryController.storeStockTake);
router.post('/import-stock-take', requireInventoryManage, upload.single('file'), inventoryController.importStockTake);
router.post('/import-master-stock', requireInventoryManage, upload.single('file'), inventoryController.importMasterStock);
router.patch('/products/:id/threshold', requireInventoryManage, inventoryController.updateThreshold);
router.post('/seed-demo', requireInventoryManage, inventoryController.seedDemo);
router.post('/sync-alignment', requireInventoryManage, inventoryController.syncAlignment);
router.post('/ensure-website-links', requireInventoryManage, inventoryController.ensureWebsiteLinks);
router.post('/products/:id/publish', requireInventoryManage, inventoryController.publishToWebsite);
router.post('/products/:id/unpublish', requireInventoryManage, inventoryController.unpublishFromWebsite);

module.exports = router;
