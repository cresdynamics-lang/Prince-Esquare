/**
 * Cloudinary URL helpers — preset folder: prince-esquire
 */

const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'PRINCE-eSQUIIRE';
const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER || 'PRINCE-eSQUIIRE';

const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

/**
 * Build an optimized delivery URL (f_auto, q_auto, WebP when supported).
 */
const optimizeCloudinaryUrl = (url, { width = 800, height, crop = 'limit' } = {}) => {
  if (!url || !isCloudinaryUrl(url)) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transforms = [`f_auto`, `q_auto`, `w_${width}`, `c_${crop}`];
  if (height) transforms.push(`h_${height}`);
  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
};

/**
 * Normalize upload API result into JSON-friendly image object.
 */
const formatUploadResult = (result) => {
  const url = result.secure_url || result.url;
  return {
    url,
    optimized: optimizeCloudinaryUrl(url, { width: 1200 }),
    thumbnail: optimizeCloudinaryUrl(url, { width: 400 }),
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    preset: UPLOAD_PRESET,
    folder: UPLOAD_FOLDER,
  };
};

/**
 * Normalize a stored image (string or object) for API responses.
 */
const normalizeImageField = (image) => {
  if (!image) return null;
  if (typeof image === 'string') {
    return {
      url: image,
      optimized: optimizeCloudinaryUrl(image, { width: 800 }),
      thumbnail: optimizeCloudinaryUrl(image, { width: 400 }),
    };
  }
  const url = image.url || image.secure_url;
  if (!url) return image;
  return {
    ...image,
    url,
    optimized: image.optimized || optimizeCloudinaryUrl(url, { width: 800 }),
    thumbnail: image.thumbnail || optimizeCloudinaryUrl(url, { width: 400 }),
  };
};

const normalizeImagesArray = (images) => {
  if (!images) return [];
  let parsed = images;
  if (typeof images === 'string') {
    try {
      parsed = JSON.parse(images);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeImageField).filter(Boolean);
};

const applyProductImageOptimization = (product) => {
  if (!product) return product;
  const thumbnail = product.thumbnail;
  product.thumbnail_optimized = thumbnail
    ? optimizeCloudinaryUrl(thumbnail, { width: 800 })
    : thumbnail;
  product.images = normalizeImagesArray(product.images);
  if (product.variants && Array.isArray(product.variants)) {
    product.variants = product.variants.map((v) => ({
      ...v,
      image_url_optimized: v.image_url
        ? optimizeCloudinaryUrl(v.image_url, { width: 800 })
        : v.image_url,
    }));
  }
  return product;
};

module.exports = {
  UPLOAD_PRESET,
  UPLOAD_FOLDER,
  isCloudinaryUrl,
  optimizeCloudinaryUrl,
  formatUploadResult,
  normalizeImageField,
  normalizeImagesArray,
  applyProductImageOptimization,
};
