const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
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

        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        const results = await Promise.all(uploadPromises);

        const urls = results.map(result => result.secure_url);

        return formatResponse(res, 200, true, 'Images uploaded successfully', urls);
    } catch (error) {
        console.error('Upload Error:', error);
        return formatResponse(res, 500, false, 'Error uploading images');
    }
};
