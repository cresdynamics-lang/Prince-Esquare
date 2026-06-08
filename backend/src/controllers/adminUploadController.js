const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { formatUploadResult } = require('../utils/cloudinaryImage');
const { formatResponse } = require('../utils/responseFormatter');

/**
 * @desc    Upload image(s) to Cloudinary
 * @route   POST /api/admin/upload
 * @access  Private/Admin
 */
exports.uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return formatResponse(res, 400, false, 'No files uploaded');
        }

        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, undefined, file.mimetype)
        );
        const results = await Promise.all(uploadPromises);

        const images = results.map(formatUploadResult);
        const usedLocal = results.some((r) => r.storage === 'local');

        return formatResponse(
          res,
          200,
          true,
          usedLocal ? 'Images saved locally (Cloudinary not configured)' : 'Images uploaded successfully',
          images
        );
    } catch (error) {
        console.error('Upload Error:', error);
        return formatResponse(res, 500, false, error.message || 'Error uploading images');
    }
};
