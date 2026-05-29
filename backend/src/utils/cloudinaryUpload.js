const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { UPLOAD_PRESET, UPLOAD_FOLDER } = require('./cloudinaryImage');

/**
 * Uploads a file buffer to Cloudinary using upload preset prince-esquire.
 */
const uploadToCloudinary = (buffer, folder = UPLOAD_FOLDER) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                upload_preset: UPLOAD_PRESET,
                resource_type: 'image',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

module.exports = { uploadToCloudinary, UPLOAD_PRESET, UPLOAD_FOLDER };
