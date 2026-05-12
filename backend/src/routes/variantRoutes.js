const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');
const { protect } = require('../middleware/auth');

router.get('/products/:id/variants', protect, variantController.getVariants);
router.post('/products/:id/variants', protect, variantController.addVariant);
router.patch('/:variantId', protect, variantController.updateVariant);
router.delete('/:variantId', protect, variantController.deleteVariant);

module.exports = router;
