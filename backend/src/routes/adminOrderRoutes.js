const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', orderController.adminGetOrders);
router.get('/:id', orderController.adminGetOrderDetail);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/payment', orderController.updatePaymentStatus);
router.post('/:id/refund', orderController.refundOrder);

module.exports = router;
