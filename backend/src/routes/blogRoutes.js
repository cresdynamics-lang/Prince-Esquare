const express = require('express');
const blogController = require('../controllers/blogController');

const router = express.Router();

router.get('/', blogController.getPublishedBlogPosts);
router.get('/category/:category', blogController.getBlogPostsByCategory);
router.patch('/:id/views', blogController.updateBlogPostViews);
router.get('/:slug', blogController.getBlogPostBySlug);

module.exports = router;
