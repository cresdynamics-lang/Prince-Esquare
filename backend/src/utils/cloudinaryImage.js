/**
 * Cloudinary URL helpers — preset folder: prince-esquire
 */

const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'PRINCE-eSQUIIRE';
const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER || 'PRINCE-eSQUIIRE';

const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

const stripCloudinaryTransforms = (pathAfterUpload) => {
  const segments = pathAfterUpload.split('/');
  while (segments.length > 0 && segments[0] && !/^v\d+/.test(segments[0]) && segments[0].includes('_')) {
    segments.shift();
  }
  return segments.join('/');
};

/**
 * Build an optimized delivery URL (f_auto, q_auto, WebP when supported).
 */
const optimizeCloudinaryUrl = (url, { width = 800, height, crop = 'limit' } = {}) => {
  if (!url || !isCloudinaryUrl(url)) return url;

  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const base = url.slice(0, idx + marker.length);
  const assetPath = stripCloudinaryTransforms(url.slice(idx + marker.length));
  const transforms = [`f_auto`, `q_auto`, `w_${width}`, `c_${crop}`];
  if (height) transforms.push(`h_${height}`);
  return `${base}${transforms.join(',')}/${assetPath}`;
};

/**
 * Normalize upload API result into JSON-friendly image object.
 */
const formatUploadResult = (result) => {
  const url = result.secure_url || result.url;
  const eager = Array.isArray(result.eager) ? result.eager : [];
  const eagerUrl = (width) => eager.find((e) => e.width === width)?.secure_url;
  return {
    url,
    optimized: eagerUrl(800) || optimizeCloudinaryUrl(url, { width: 800 }),
    thumbnail: eagerUrl(400) || optimizeCloudinaryUrl(url, { width: 400 }),
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
    product.variants = product.variants.map((v) => {
      let angleImages = v.angle_images;
      if (typeof angleImages === 'string') {
        try {
          angleImages = JSON.parse(angleImages);
        } catch {
          angleImages = [];
        }
      }
      return {
        ...v,
        image_url_optimized: v.image_url
          ? optimizeCloudinaryUrl(v.image_url, { width: 800 })
          : v.image_url,
        angle_images: Array.isArray(angleImages)
          ? angleImages.map((img) => {
              const url = img.url || img;
              return {
                ...img,
                url,
                optimized: optimizeCloudinaryUrl(url, { width: 800 }),
                thumbnail: optimizeCloudinaryUrl(url, { width: 400 }),
              };
            })
          : [],
      };
    });
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
