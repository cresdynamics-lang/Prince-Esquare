const express = require('express');
const router = express.Router();
const catalogueController = require('../controllers/catalogueController');

router.get('/', catalogueController.getCatalogue);
router.get('/ads', catalogueController.getCatalogueAds);

module.exports = router;
