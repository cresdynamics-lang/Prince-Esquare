// NEW — POS admin overview
const express = require('express');
const router = express.Router();
const overviewController = require('../controllers/pos/overviewController');
const auditController = require('../controllers/pos/auditController');
const { requireAdmin } = require('../middleware/auth');

router.get('/overview', requireAdmin, overviewController.getOverview);
router.get('/audit-log', requireAdmin, auditController.listAuditLogs);

module.exports = router;
