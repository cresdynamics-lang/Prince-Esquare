const express = require('express');
const blogController = require('../controllers/blogController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/multer');

const router = express.Router();

router.get('/', protect, adminOnly, blogController.getAllBlogPosts);
router.get('/:id', protect, adminOnly, blogController.getBlogPostById);
router.post('/', protect, adminOnly, blogController.createBlogPost);
router.post('/upload-image', protect, adminOnly, upload.single('image'), blogController.uploadBlogImage);
router.put('/:id', protect, adminOnly, blogController.updateBlogPost);
router.delete('/:id', protect, adminOnly, blogController.deleteBlogPost);

module.exports = router;
