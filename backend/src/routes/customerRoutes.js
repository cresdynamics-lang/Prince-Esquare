const express = require('express');
const router = express.Router();
const adminCustomerController = require('../controllers/adminCustomerController');
const { protect, adminOnly, requireAdmin } = require('../middleware/auth');

router.get('/all', protect, adminOnly, adminCustomerController.getCustomers);
router.get('/:id', protect, adminOnly, adminCustomerController.getCustomerDetail);
router.patch('/:id/status', protect, requireAdmin, adminCustomerController.updateCustomerStatus);
router.post('/staff', protect, requireAdmin, adminCustomerController.createStaff);
router.patch('/staff/:id/permissions', protect, requireAdmin, adminCustomerController.updateStaffPermissions);
router.patch('/staff/:id', protect, requireAdmin, adminCustomerController.updateStaff);
router.delete('/staff/:id', protect, requireAdmin, adminCustomerController.deleteStaff);

module.exports = router;
