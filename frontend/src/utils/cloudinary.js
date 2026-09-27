export const CLOUDINARY_PRESET = 'PRINCE-eSQUIIRE';

export const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

export const isBlobUrl = (url) =>
  typeof url === 'string' && url.startsWith('blob:');

export const resolveDisplayImageUrl = (url, { width = 400 } = {}) => {
  if (!url || isBlobUrl(url)) return '';
  if (typeof url === 'object') return getImageSrc(url, width <= 480 ? 'thumbnail' : 'optimized');
  return isCloudinaryUrl(url) ? optimizeCloudinaryUrl(url, { width }) : url;
};

export const getPersistImageUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.url || item.secure_url || '';
};

export const revokeBlobUrl = (url) => {
  if (isBlobUrl(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
};

export const getImageSrc = (image, variant = 'optimized') => {
  if (!image) return '';
  if (typeof image === 'string') {
    return variant === 'thumbnail'
      ? optimizeCloudinaryUrl(image, { width: 400, quality: 'auto:eco' })
      : optimizeCloudinaryUrl(image, { width: 800 });
  }
  if (variant === 'thumbnail') return image.thumbnail || image.optimized || image.url || '';
  return image.optimized || image.url || image.thumbnail || '';
};

export const getUploadUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.optimized || item.url || item.secure_url || '';
};

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

const stripCloudinaryTransforms = (pathAfterUpload) => {
  const segments = pathAfterUpload.split('/');
  while (segments.length > 0 && segments[0] && !/^v\d+/.test(segments[0]) && segments[0].includes('_')) {
    segments.shift();
  }
  return segments.join('/');
};

export const optimizeCloudinaryUrl = (url, { width = 800, height, crop = 'limit', quality = 'auto:good' } = {}) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const base = url.slice(0, idx + marker.length);
  const assetPath = stripCloudinaryTransforms(url.slice(idx + marker.length));
  const q = String(quality).replace(/^q_/, '');
  const transforms = [
    'f_auto',
    `q_${q}`,
    `w_${Math.min(Number(width) || 800, 2000)}`,
    `c_${crop}`,
    'dpr_auto',
  ];
  if (height) transforms.push(`h_${height}`);
  return `${base}${transforms.join(',')}/${assetPath}`;
};

/** Responsive card image URLs for product grids */
export const productCardSrcSet = (url) => {
  if (!url) return { src: '', srcSet: '' };
  const base = typeof url === 'object'
    ? (url.url || url.secure_url || url.optimized || url.thumbnail || '')
    : url;
  if (!base || isBlobUrl(base)) return { src: '', srcSet: '' };
  if (!isCloudinaryUrl(base)) return { src: base, srcSet: '' };
  const w320 = optimizeCloudinaryUrl(base, { width: 320, quality: 'auto:eco' });
  const w480 = optimizeCloudinaryUrl(base, { width: 480, quality: 'auto:eco' });
  const w640 = optimizeCloudinaryUrl(base, { width: 640, quality: 'auto:good' });
  return {
    src: w480,
    srcSet: `${w320} 320w, ${w480} 480w, ${w640} 640w`,
  };
};

export const hasProductImage = (product) => {
  const t = product?.thumbnail || product?.image_url || product?.thumbnail_optimized;
  if (!t) return false;
  if (typeof t === 'string') return t.trim().length > 8 && !t.startsWith('blob:');
  if (typeof t === 'object') {
    const u = t.url || t.secure_url || t.optimized || t.thumbnail;
    return typeof u === 'string' && u.trim().length > 8;
  }
  return false;
};

export const heroImageUrl = (url) =>
  isCloudinaryUrl(url)
    ? optimizeCloudinaryUrl(url, { width: 1600, height: 900, crop: 'fill' })
    : url;

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
