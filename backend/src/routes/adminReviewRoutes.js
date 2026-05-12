const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', reviewController.adminGetReviews);
router.patch('/:id/approve', reviewController.approveReview);
router.delete('/:id', reviewController.adminDeleteReview);

module.exports = router;
