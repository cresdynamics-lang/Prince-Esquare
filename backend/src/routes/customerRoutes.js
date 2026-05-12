const express = require('express');
const router = express.Router();
const adminCustomerController = require('../controllers/adminCustomerController');
const { protect } = require('../middleware/auth');

router.get('/admin/all', protect, adminCustomerController.getCustomers);
router.get('/admin/:id', protect, adminCustomerController.getCustomerDetail);
router.patch('/admin/:id/status', protect, adminCustomerController.updateCustomerStatus);

module.exports = router;
