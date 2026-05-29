/**
 * Cloudinary image helpers (preset: prince-esquire)
 */

export const CLOUDINARY_PRESET = 'prince-esquire';

export const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

/**
 * @param {string|{ url?: string, optimized?: string, thumbnail?: string }} image
 */
export const getImageSrc = (image, variant = 'optimized') => {
  if (!image) return '';
  if (typeof image === 'string') {
    return variant === 'thumbnail'
      ? optimizeCloudinaryUrl(image, { width: 400 })
      : optimizeCloudinaryUrl(image, { width: 800 });
  }
  if (variant === 'thumbnail') return image.thumbnail || image.optimized || image.url || '';
  return image.optimized || image.url || image.thumbnail || '';
};

/**
 * Extract display URL from upload API response item (string legacy or JSON object).
 */
export const getUploadUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.optimized || item.url || item.secure_url || '';
};

/** Store-friendly JSON for product.images column */
export const toImageJson = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    return {
      url: item,
      optimized: optimizeCloudinaryUrl(item, { width: 800 }),
      thumbnail: optimizeCloudinaryUrl(item, { width: 400 }),
    };
  }
  return {
    url: item.url || item.secure_url,
    optimized: item.optimized || getUploadUrl(item),
    thumbnail: item.thumbnail || optimizeCloudinaryUrl(getUploadUrl(item), { width: 400 }),
    public_id: item.public_id,
  };
};

export const optimizeCloudinaryUrl = (url, { width = 800, height, crop = 'limit' } = {}) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  const transforms = [`f_auto`, `q_auto`, `w_${width}`, `c_${crop}`];
  if (height) transforms.push(`h_${height}`);
  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
};

export const parseProductImages = (images) => {
  if (!images) return [];
  let list = images;
  if (typeof images === 'string') {
    try {
      list = JSON.parse(images);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map((img) => (typeof img === 'string' ? toImageJson(img) : img)).filter(Boolean);
};
