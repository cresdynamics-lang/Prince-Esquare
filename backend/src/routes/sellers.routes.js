// NEW — POS seller management routes
const express = require('express');
const router = express.Router();
const sellersController = require('../controllers/pos/sellersController');
const { requireAdmin } = require('../middleware/auth');

router.post('/', requireAdmin, sellersController.createSeller);
router.get('/', requireAdmin, sellersController.listSellers);
router.patch('/:id/toggle', requireAdmin, sellersController.toggleSeller);
router.get('/:id/sales', requireAdmin, sellersController.sellerSales);

module.exports = router;
