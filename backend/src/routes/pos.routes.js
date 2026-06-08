// NEW — POS sales routes
const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos/posController');
const { requireSeller, requirePosCatalog, requireSellerOrAdmin, requireAdmin, internalKey } = require('../middleware/auth');

router.get('/products', requirePosCatalog, posController.searchProducts);
router.post('/sale', requireSeller, posController.createSale);
router.post('/online-sale', internalKey, posController.createOnlineSale);
router.patch('/sales/:id/void', requireAdmin, posController.voidSale);
router.get('/sales', requireSellerOrAdmin, posController.listSales);

module.exports = router;
