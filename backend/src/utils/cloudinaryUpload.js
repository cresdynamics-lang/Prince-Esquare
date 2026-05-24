const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer.
 * @param {string} folder - Optional folder name in Cloudinary.
 * @returns {Promise<Object>} - Cloudinary upload result.
 */
const uploadToCloudinary = (buffer, folder = 'prince-esquire') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, upload_preset: 'prince-esquire' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

module.exports = { uploadToCloudinary };
