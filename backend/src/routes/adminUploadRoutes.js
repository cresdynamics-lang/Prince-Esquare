const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadImages } = require('../controllers/adminUploadController');

// Large batches are fine — frontend also uploads one-by-one to avoid client timeouts.
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 12 * 1024 * 1024, // 12MB per file
    files: 40,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
});

router.post('/', protect, adminOnly, upload.array('images', 40), uploadImages);

module.exports = router;
