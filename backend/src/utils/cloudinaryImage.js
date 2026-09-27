/**
 * Cloudinary URL helpers — fast f_auto + quality + width-bounded delivery.
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

/** Square JPEG for Meta/IG: full product visible, white padding, no crop. */
const META_SQUARE_TRANSFORMS = 'f_jpg,q_auto:good,c_pad,b_white,g_center,w_1200,h_1200';

const toMetaSquareImageUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const base = url.slice(0, idx + marker.length);
  const assetPath = stripCloudinaryTransforms(url.slice(idx + marker.length));
  return `${base}${META_SQUARE_TRANSFORMS}/${assetPath}`;
};

/**
 * Optimized CDN URL. Uses WebP/AVIF when supported (f_auto) + quality auto.
 * quality: auto | auto:eco | auto:good | auto:best  (or a number)
 */
const optimizeCloudinaryUrl = (
  url,
  { width = 800, height, crop = 'limit', quality = 'auto:good' } = {},
) => {
  if (!url || !isCloudinaryUrl(url)) return url;

  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const base = url.slice(0, idx + marker.length);
  const assetPath = stripCloudinaryTransforms(url.slice(idx + marker.length));
  const q = String(quality).replace(/^q_/, '');
  const w = Math.min(Math.max(Number(width) || 800, 40), 2000);
  const transforms = ['f_auto', `q_${q}`, `w_${w}`, `c_${crop}`, 'dpr_auto'];
  if (height) transforms.push(`h_${Math.round(height)}`);
  return `${base}${transforms.join(',')}/${assetPath}`;
};

const formatUploadResult = (result) => {
  const url = result.secure_url || result.url;
  const eager = Array.isArray(result.eager) ? result.eager : [];
  const eagerUrl = (width) => eager.find((e) => e.width === width)?.secure_url;
  return {
    url,
    optimized: eagerUrl(800) || optimizeCloudinaryUrl(url, { width: 800 }),
    thumbnail: eagerUrl(400) || optimizeCloudinaryUrl(url, { width: 400, quality: 'auto:eco' }),
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    preset: UPLOAD_PRESET,
    folder: UPLOAD_FOLDER,
  };
};

const normalizeImageField = (image) => {
  if (!image) return null;
  if (typeof image === 'string') {
    return {
      url: image,
      optimized: optimizeCloudinaryUrl(image, { width: 800 }),
      thumbnail: optimizeCloudinaryUrl(image, { width: 400, quality: 'auto:eco' }),
    };
  }
  const url = image.url || image.secure_url;
  if (!url) return image;
  return {
    ...image,
    url,
    optimized: image.optimized || optimizeCloudinaryUrl(url, { width: 800 }),
    thumbnail: image.thumbnail || optimizeCloudinaryUrl(url, { width: 400, quality: 'auto:eco' }),
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
  const thumbUrl =
    typeof thumbnail === 'string'
      ? thumbnail
      : thumbnail && typeof thumbnail === 'object'
        ? thumbnail.url || thumbnail.secure_url || ''
        : '';
  product.thumbnail_optimized = thumbUrl
    ? optimizeCloudinaryUrl(thumbUrl, { width: 480, quality: 'auto:eco' })
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
                thumbnail: optimizeCloudinaryUrl(url, { width: 400, quality: 'auto:eco' }),
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
  META_SQUARE_TRANSFORMS,
  isCloudinaryUrl,
  optimizeCloudinaryUrl,
  toMetaSquareImageUrl,
  formatUploadResult,
  normalizeImageField,
  normalizeImagesArray,
  applyProductImageOptimization,
};
