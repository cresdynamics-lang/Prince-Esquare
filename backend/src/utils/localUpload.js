const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );

const publicBaseUrl = () =>
  process.env.API_PUBLIC_URL ||
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || 8000}`;

const uploadToLocal = (buffer, mimetype = 'image/jpeg') => {
  ensureUploadDir();
  const ext = (mimetype.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg';
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(filePath, buffer);
  const url = `${publicBaseUrl()}/uploads/${name}`;
  return {
    secure_url: url,
    url,
    public_id: name,
    width: null,
    height: null,
    format: ext,
    storage: 'local',
  };
};

module.exports = {
  UPLOAD_DIR,
  isCloudinaryConfigured,
  uploadToLocal,
};
