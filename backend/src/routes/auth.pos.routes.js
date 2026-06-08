// NEW — POS seller authentication routes
const express = require('express');
const router = express.Router();
const authPosController = require('../controllers/pos/authPosController');

router.post('/login', authPosController.posLogin);

module.exports = router;
