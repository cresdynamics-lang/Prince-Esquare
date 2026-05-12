const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.patch('/password', profileController.updatePassword);
router.get('/addresses', profileController.getAddresses);
router.post('/addresses', profileController.addAddress);
router.put('/addresses/:id', profileController.updateAddress);
router.delete('/addresses/:id', profileController.deleteAddress);

module.exports = router;
