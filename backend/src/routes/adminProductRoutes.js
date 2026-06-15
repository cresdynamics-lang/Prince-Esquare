const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', productController.adminGetProducts);
router.post('/bulk', productController.bulkProductAction);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/flags', productController.patchProductFlags);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/images', productController.uploadProductImages);
router.delete('/:id/images/:imgId', productController.deleteProductImage);

module.exports = router;
