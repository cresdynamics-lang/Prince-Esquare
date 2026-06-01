const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);

cloudinary.config(
    hasCloudinaryUrl
        ? { secure: true }
        : {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        }
);

module.exports = cloudinary;
