const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { UPLOAD_PRESET, UPLOAD_FOLDER } = require('./cloudinaryImage');
const { isCloudinaryConfigured, allowLocalStorage, uploadToLocal } = require('./localUpload');

const uploadStreamToCloudinary = (buffer, folder = UPLOAD_FOLDER) =>
  new Promise((resolve, reject) => {
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

/**
 * Upload image buffer — Cloudinary when configured, otherwise local /uploads storage.
 */
const uploadToCloudinary = async (buffer, folder = UPLOAD_FOLDER, mimetype = 'image/jpeg') => {
  if (!isCloudinaryConfigured()) {
    if (!allowLocalStorage()) {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL in production.');
    }
    return uploadToLocal(buffer, mimetype);
  }
  try {
    return await uploadStreamToCloudinary(buffer, folder);
  } catch (error) {
    if (!allowLocalStorage()) throw error;
    console.warn('Cloudinary upload failed, using local storage:', error.message || error);
    return uploadToLocal(buffer, mimetype);
  }
};

module.exports = { uploadToCloudinary, UPLOAD_PRESET, UPLOAD_FOLDER, isCloudinaryConfigured };
