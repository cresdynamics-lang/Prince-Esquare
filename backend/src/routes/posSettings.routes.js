// NEW — POS settings routes (uses existing settings table)
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/pos/settingsController');
const { requireAdmin, requireSeller } = require('../middleware/auth');

router.get('/terminal', requireSeller, settingsController.getTerminalSettings);
router.get('/', requireAdmin, settingsController.getSettings);
router.patch('/', requireAdmin, settingsController.updateSetting);

module.exports = router;
