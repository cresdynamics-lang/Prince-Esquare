const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/guest', orderController.createGuestOrder);
router.get('/checkout/:id', optionalAuth, orderController.getCheckoutOrder);

router.use(protect);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetail);
router.patch('/:id/cancel', orderController.cancelOrder);
router.get('/:id/tracking', orderController.trackOrder);

module.exports = router;
