const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/dashboard/stats', protect, analyticsController.getDashboardStats);
router.get('/dashboard/sales-chart', protect, analyticsController.getSalesChart);
router.get('/dashboard/top-products', protect, analyticsController.getTopProducts);
router.get('/dashboard/low-stock', protect, analyticsController.getLowStock);
router.get('/reports/orders', protect, analyticsController.getOrderReport);

module.exports = router;
