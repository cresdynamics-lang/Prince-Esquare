const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

router.post('/track', visitorController.trackEvent);

module.exports = router;
