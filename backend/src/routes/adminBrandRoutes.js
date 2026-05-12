const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', brandController.createBrand);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;
