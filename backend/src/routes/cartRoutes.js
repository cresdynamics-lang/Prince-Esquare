const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, cartController.getCart);
router.post('/items', protect, cartController.addItem);
router.patch('/items/:itemId', protect, cartController.updateQuantity);
router.delete('/items/:itemId', protect, cartController.removeItem);
router.delete('/clear', protect, cartController.clearCart);
router.post('/apply-coupon', protect, cartController.applyCoupon);
router.delete('/remove-coupon', protect, cartController.removeCoupon);

module.exports = router;
