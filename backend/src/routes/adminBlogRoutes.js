const express = require('express');
const blogController = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/multer');

const router = express.Router();

// Admin endpoints (authentication required, admin/staff role required)
router.get('/', protect, authorize('admin', 'staff'), blogController.getAllBlogPosts);
router.get('/:id', protect, authorize('admin', 'staff'), blogController.getBlogPostById);
router.post('/', protect, authorize('admin', 'staff'), blogController.createBlogPost);
router.post('/upload-image', protect, authorize('admin', 'staff'), upload.single('image'), blogController.uploadBlogImage);
router.put('/:id', protect, authorize('admin', 'staff'), blogController.updateBlogPost);
router.delete('/:id', protect, authorize('admin', 'staff'), blogController.deleteBlogPost);

module.exports = router;

