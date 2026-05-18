const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, analyticsController.getDashboardStats);
router.get('/sales-chart', protect, analyticsController.getSalesChart);
router.get('/top-products', protect, analyticsController.getTopProducts);
router.get('/low-stock', protect, analyticsController.getLowStock);
router.get('/reports/orders', protect, analyticsController.getOrderReport);

module.exports = router;
