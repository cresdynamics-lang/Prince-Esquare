const fs = require('fs');
const path = require('path');

const isProduction = () => process.env.NODE_ENV === 'production';

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );

const allowLocalStorage = () =>
  !isProduction() || process.env.STORAGE_ALLOW_LOCAL === 'true';

const requireCloudinaryInProduction = () =>
  isProduction() && process.env.REQUIRE_CLOUDINARY !== 'false';

const getMediaStorageStatus = () => {
  const cloudinary = isCloudinaryConfigured();
  const localAllowed = allowLocalStorage();
  const productionReady = cloudinary || (localAllowed && !requireCloudinaryInProduction());

  return {
    provider: cloudinary ? 'cloudinary' : localAllowed ? 'local' : 'none',
    cloudinaryConfigured: cloudinary,
    localAllowed,
    productionReady,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'PRINCE-eSQUIIRE',
    uploadFolder: process.env.CLOUDINARY_FOLDER || 'PRINCE-eSQUIIRE',
  };
};

const validateMediaStorageOnStartup = () => {
  const status = getMediaStorageStatus();

  if (requireCloudinaryInProduction() && !status.cloudinaryConfigured) {
    throw new Error(
      'Cloudinary is required in production. Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). ' +
        'Local /uploads storage is ephemeral on Render/Railway. Override only for testing with STORAGE_ALLOW_LOCAL=true.'
    );
  }

  if (!status.cloudinaryConfigured && !status.localAllowed) {
    throw new Error('No image storage configured. Set Cloudinary credentials or enable local dev storage.');
  }

  if (!status.cloudinaryConfigured && status.localAllowed) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return {
      ...status,
      warning:
        'Using local /uploads storage. Images will be lost on redeploy unless Cloudinary is configured.',
    };
  }

  return status;
};

module.exports = {
  isProduction,
  isCloudinaryConfigured,
  allowLocalStorage,
  requireCloudinaryInProduction,
  getMediaStorageStatus,
  validateMediaStorageOnStartup,
};
