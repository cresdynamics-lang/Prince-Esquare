import { getImageSrc } from './cloudinary';

export const ANGLE_ORDER = ['front', 'side', 'back'];

export const ANGLE_LABELS = {
  front: 'Front View',
  side: 'Side View',
  back: 'Back View',
};

const parseRaw = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
};

export const parseAngleImages = (variant, product) => {
  const fromVariant = parseRaw(variant?.angle_images);
  if (fromVariant.length >= 3) {
    return normalizeAngles(fromVariant);
  }

  const fromProduct = parseRaw(product?.images).filter(
    (img) => img?.angle && ANGLE_ORDER.includes(img.angle)
  );
  if (fromProduct.length >= 3) {
    return normalizeAngles(fromProduct);
  }

  return [];
};

const normalizeAngles = (images) =>
  ANGLE_ORDER.map((angle) => {
    const match = images.find((img) => img.angle === angle);
    if (!match) return null;
    const url = match.optimized || getImageSrc(match) || match.url;
    const thumb = match.thumbnail || getImageSrc(match, 'thumbnail') || url;
    return {
      angle,
      label: match.label || ANGLE_LABELS[angle],
      url,
      thumb,
    };
  }).filter(Boolean);

export const getDefaultAngleImage = (variant, product) => {
  const angles = parseAngleImages(variant, product);
  return angles[0]?.url || null;
};
