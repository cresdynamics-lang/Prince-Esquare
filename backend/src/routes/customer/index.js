const express = require('express');
const router = express.Router();
const productController = require('../../controllers/customer/productController');

router.get('/products', productController.getProducts);

module.exports = router;
