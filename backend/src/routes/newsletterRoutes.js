const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { protect } = require('../middleware/auth');

router.post('/subscribe', newsletterController.subscribe);
router.delete('/unsubscribe', newsletterController.unsubscribe);

// Admin
router.get('/admin/subscribers', protect, newsletterController.adminGetSubscribers);

module.exports = router;
