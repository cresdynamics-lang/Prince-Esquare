const express = require('express');
const router = express.Router();
const adminCustomerController = require('../controllers/adminCustomerController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/all', protect, adminOnly, adminCustomerController.getCustomers);
router.get('/:id', protect, adminOnly, adminCustomerController.getCustomerDetail);
router.patch('/:id/status', protect, adminOnly, adminCustomerController.updateCustomerStatus);

module.exports = router;
