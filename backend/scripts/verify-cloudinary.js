/**
 * Verify Cloudinary credentials and upload preset.
 * Usage: node scripts/verify-cloudinary.js
 */
require('dotenv').config();
const cloudinary = require('../src/config/cloudinary');
const { getMediaStorageStatus, isCloudinaryConfigured } = require('../src/lib/mediaStorage');

async function main() {
  const status = getMediaStorageStatus();

  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary is NOT configured.');
    console.error('Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in backend/.env');
    process.exit(1);
  }

  try {
    const ping = await cloudinary.api.ping();
    console.log('Cloudinary ping:', ping.status || 'ok');

    const preset = process.env.CLOUDINARY_UPLOAD_PRESET || 'PRINCE-eSQUIIRE';
    try {
      const uploadPreset = await cloudinary.api.upload_preset(preset);
      console.log(`Upload preset "${preset}":`, uploadPreset.name);
    } catch (presetErr) {
      console.warn(`Upload preset "${preset}" not found in dashboard — create an unsigned preset or use signed server uploads.`);
      console.warn(presetErr.message || presetErr);
    }

    console.log('Folder:', status.uploadFolder);
    console.log('Cloudinary is ready for production image hosting.');
    process.exit(0);
  } catch (err) {
    console.error('Cloudinary verification failed:', err.message || err);
    process.exit(1);
  }
}

main();
