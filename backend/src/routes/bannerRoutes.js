const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

router.get('/active', bannerController.getActiveBanners);

module.exports = router;
