const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

router.get('/', feedController.metaFeedRoot);
router.get('/meta-sale-catalog.tsv', feedController.metaSaleCatalogTsv);
router.get('/meta-sale-catalog.dat', feedController.metaSaleCatalogDat);
router.get('/meta-sale-catalog.csv', feedController.metaSaleCatalogCsv);
router.get('/meta-catalog.dat', feedController.metaFullCatalogDat);
router.get('/meta-catalog.csv', feedController.metaFullCatalogCsv);
router.get('/info.json', feedController.metaFeedInfo);

module.exports = router;
