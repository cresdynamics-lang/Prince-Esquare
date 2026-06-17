// NEW — POS shift routes
const express = require('express');
const router = express.Router();
const shiftsController = require('../controllers/pos/shiftsController');
const { requireSeller, requireAdmin } = require('../middleware/auth');

router.post('/clock-in', requireSeller, shiftsController.clockIn);
router.post('/clock-out', requireSeller, shiftsController.clockOut);
router.get('/my/current', requireSeller, shiftsController.myCurrentShift);
router.get('/my/summary', requireSeller, shiftsController.myShiftSummary);
router.get('/', requireAdmin, shiftsController.listShifts);
router.post('/:id/force-close', requireAdmin, shiftsController.forceCloseShift);
router.get('/:id', requireAdmin, shiftsController.getShift);

module.exports = router;
