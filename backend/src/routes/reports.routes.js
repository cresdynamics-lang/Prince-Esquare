// NEW — POS Excel report routes
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/pos/reportsController');
const { requireAdmin } = require('../middleware/auth');

router.get('/daily-sales', requireAdmin, reportsController.dailySales);
router.get('/stock-report', requireAdmin, reportsController.stockReport);
router.get('/stock-movements', requireAdmin, reportsController.stockMovements);
router.get('/shift-report', requireAdmin, reportsController.shiftReport);
router.get('/low-stock', requireAdmin, reportsController.lowStock);
router.get('/end-of-day', requireAdmin, reportsController.endOfDay);

module.exports = router;
