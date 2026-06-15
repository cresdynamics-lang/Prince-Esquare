// NEW — POS inventory routes
const express = require('express');
const multer = require('multer');
const router = express.Router();
const inventoryController = require('../controllers/pos/inventoryController');
const { requireAdmin } = require('../middleware/auth');

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

router.post('/import-excel', requireAdmin, upload.single('file'), inventoryController.importExcel);
router.get('/export-stock', requireAdmin, inventoryController.exportStockSheet);
router.get('/export-catalog', requireAdmin, inventoryController.exportProductCatalog);
router.get('/export-variant-stock', requireAdmin, inventoryController.exportVariantStock);
router.post('/import-variant-stock', requireAdmin, upload.single('file'), inventoryController.importVariantStock);
router.get('/variant-stock-summary', requireAdmin, inventoryController.variantStockSummary);
router.get('/template', requireAdmin, inventoryController.downloadTemplate);
router.post('/products', requireAdmin, inventoryController.createInventoryItem);
router.get('/products/:id', requireAdmin, inventoryController.getProductDetail);
router.put('/products/:id/details', requireAdmin, inventoryController.saveProductDetail);
router.post('/products/:id/sync-website', requireAdmin, inventoryController.syncFromWebsite);
router.post('/stock-in', requireAdmin, inventoryController.stockIn);
router.post('/stock-out', requireAdmin, inventoryController.stockOut);
router.post('/store-receive', requireAdmin, inventoryController.receiveAtStore);
router.post('/close-day', requireAdmin, inventoryController.closeDay);
router.get('/daily-sheet', requireAdmin, inventoryController.dailySheet);
router.get('/movements', requireAdmin, inventoryController.movements);
router.get('/stock-levels', requireAdmin, inventoryController.stockLevels);
router.get('/category-pieces', requireAdmin, inventoryController.categoryPieces);
router.get('/category-summary', requireAdmin, inventoryController.categorySummary);
router.post('/stock-take', requireAdmin, inventoryController.stockTake);
router.post('/store-stock-take', requireAdmin, inventoryController.storeStockTake);
router.get('/export-stock-take', requireAdmin, inventoryController.exportStockTake);
router.post('/import-stock-take', requireAdmin, upload.single('file'), inventoryController.importStockTake);
router.patch('/products/:id/threshold', requireAdmin, inventoryController.updateThreshold);
router.post('/seed-demo', requireAdmin, inventoryController.seedDemo);
router.post('/sync-alignment', requireAdmin, inventoryController.syncAlignment);
router.post('/ensure-website-links', requireAdmin, inventoryController.ensureWebsiteLinks);
router.post('/products/:id/publish', requireAdmin, inventoryController.publishToWebsite);
router.post('/products/:id/unpublish', requireAdmin, inventoryController.unpublishFromWebsite);

module.exports = router;
