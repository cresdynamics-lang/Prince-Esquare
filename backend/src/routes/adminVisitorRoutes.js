const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { protect } = require('../middleware/auth');

router.get('/live', protect, visitorController.getLiveVisitors);
router.get('/sale-catalog', protect, visitorController.getSaleCatalogAdmin);
router.get('/sale-catalog/picker', protect, visitorController.getSaleCatalogPicker);
router.patch('/sale-catalog', protect, visitorController.setSaleCatalogProducts);

module.exports = router;
