const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/stk-push', protect, paymentController.stkPush);
router.post('/callback', paymentController.callback);
router.get('/status/:id', protect, paymentController.status);
router.get('/history', protect, paymentController.history);
router.post('/refund', protect, paymentController.refund);

module.exports = router;
