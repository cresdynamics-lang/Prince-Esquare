const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');

router.get('/render', seoController.renderForCrawler);
router.get('/sitemap.xml', seoController.getSitemap);

module.exports = router;
