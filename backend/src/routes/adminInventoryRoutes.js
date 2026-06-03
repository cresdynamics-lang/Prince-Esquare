const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// Shops
router.get('/shops', inv.getShops);
router.post('/shops', inv.createShop);
router.put('/shops/:id', inv.updateShop);
router.delete('/shops/:id', inv.deleteShop);

// Opening stock (once only)
router.post('/opening-stock', inv.setOpeningStock);

// Stock movements
router.post('/sales', inv.recordSales);
router.post('/stock-in', inv.recordStockIn);
router.post('/stock-out', inv.recordStockOut);
router.post('/transfer', inv.transferStock);

// Reporting
router.get('/summary', inv.getStockSummary);
router.get('/movements', inv.getMovements);
router.get('/current-stock', inv.getCurrentStock);
router.get('/transfers', inv.getTransfers);

module.exports = router;
