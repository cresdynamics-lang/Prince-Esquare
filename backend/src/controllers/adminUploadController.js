const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { formatUploadResult } = require('../utils/cloudinaryImage');
const { formatResponse } = require('../utils/responseFormatter');

/**
 * Upload image(s) to Cloudinary (or local fallback).
 * Processes files in order so response order matches request order.
 * @route   POST /api/admin/upload
 * @access  Private/Admin
 */
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return formatResponse(res, 400, false, 'No files uploaded');
    }

    // One-by-one keeps memory and Cloudinary steady for large batches
    const results = [];
    for (const file of req.files) {
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadToCloudinary(file.buffer, undefined, file.mimetype);
      results.push(result);
    }

    const images = results.map(formatUploadResult);
    const usedLocal = results.some((r) => r.storage === 'local');

    return formatResponse(
      res,
      200,
      true,
      usedLocal
        ? 'Images saved locally (Cloudinary not configured)'
        : 'Images uploaded successfully',
      images
    );
  } catch (error) {
    console.error('Upload Error:', error);
    return formatResponse(res, 500, false, error.message || 'Error uploading images');
  }
};
