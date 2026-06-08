const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAdmin, requireSellerOrAdmin } = require('../middleware/auth');

router.get('/export', requireSellerOrAdmin, orderController.adminExportOrders);
router.get('/', requireSellerOrAdmin, orderController.adminGetOrders);
router.get('/:id', requireSellerOrAdmin, orderController.adminGetOrderDetail);
router.patch('/:id/status', requireAdmin, orderController.updateOrderStatus);
router.patch('/:id/payment', requireAdmin, orderController.updatePaymentStatus);
router.patch('/:id/cancel', requireAdmin, orderController.adminCancelOrder);
router.post('/:id/refund', requireAdmin, orderController.refundOrder);

module.exports = router;
