const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/auth');

router.post('/stk-push', optionalAuth, paymentController.stkPush);
router.post('/verify/:orderId', optionalAuth, paymentController.verifyPayment);

module.exports = router;
