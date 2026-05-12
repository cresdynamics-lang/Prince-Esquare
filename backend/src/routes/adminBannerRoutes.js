const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', bannerController.adminGetBanners);
router.post('/', bannerController.createBanner);
router.put('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;
