// High-quality premium images for Prince Esquire
// Sourced from local assets in public folder

const LOCAL_IMAGES = [
  '/WhatsApp Image 2026-05-12 at 8.07.10 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.12 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.12 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.13 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.13 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.14 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.14 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.15 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.16 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.17 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.20 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.20 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.21 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.21 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.22 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.22 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.25 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.26 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.27 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.29 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.30 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.30 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.31 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.33 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.36 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.37 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.37 PM (2).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.37 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.38 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.39 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.39 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.40 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.40 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.41 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.42 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.42 PM (2).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.42 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.43 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.43 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.44 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.44 PM.jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.45 PM (1).jpeg',
  '/WhatsApp Image 2026-05-12 at 8.07.45 PM.jpeg',
];

export const PREMIUM_IMAGES = {
  'polo-t-shirts': '/WhatsApp Image 2026-05-12 at 8.07.10 PM.jpeg',
  'knitted-polos': '/WhatsApp Image 2026-05-12 at 8.07.12 PM (1).jpeg',
  'shoes': '/WhatsApp Image 2026-05-12 at 8.07.12 PM.jpeg',
  'formal-shoes': '/WhatsApp Image 2026-05-12 at 8.07.13 PM (1).jpeg',
  'casual-shoes': '/WhatsApp Image 2026-05-12 at 8.07.13 PM.jpeg',
  'boots': '/WhatsApp Image 2026-05-12 at 8.07.14 PM (1).jpeg',
  'loafers': '/WhatsApp Image 2026-05-12 at 8.07.14 PM.jpeg',
  'shirts': '/WhatsApp Image 2026-05-12 at 8.07.15 PM.jpeg',
  'formal-shirts': '/WhatsApp Image 2026-05-12 at 8.07.16 PM.jpeg',
  'presidential': '/WhatsApp Image 2026-05-12 at 8.07.17 PM (1).jpeg',
  'suits': '/WhatsApp Image 2026-05-12 at 8.07.17 PM.jpeg',
  'three-piece': '/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg',
  'trousers': '/WhatsApp Image 2026-05-12 at 8.07.20 PM (1).jpeg',
  'gurkha': '/WhatsApp Image 2026-05-12 at 8.07.20 PM.jpeg',
  'jackets': '/WhatsApp Image 2026-05-12 at 8.07.21 PM (1).jpeg',
  'linen': '/WhatsApp Image 2026-05-12 at 8.07.21 PM.jpeg',
  'watch': '/WhatsApp Image 2026-05-12 at 8.07.22 PM (1).jpeg',
  'belt': '/WhatsApp Image 2026-05-12 at 8.07.22 PM.jpeg',
  'wallet': '/WhatsApp Image 2026-05-12 at 8.07.25 PM.jpeg',
};

export const getPremiumImage = (product) => {
  if (!product) return LOCAL_IMAGES[0];
  
  // If product has a custom thumbnail that isn't a placeholder, use it
  if (product.thumbnail && !product.thumbnail.includes('placeholder') && !product.thumbnail.includes('unsplash')) {
    return product.thumbnail;
  }

  const name = product.name?.toLowerCase() || '';
  const category = product.category_name?.toLowerCase() || '';
  const sub = product.subcategory?.toLowerCase() || '';

  // Try subcategory first
  if (PREMIUM_IMAGES[sub]) return PREMIUM_IMAGES[sub];
  
  // Then specific keywords in name
  if (name.includes('presidential')) return PREMIUM_IMAGES['presidential'];
  if (name.includes('gurkha')) return PREMIUM_IMAGES['gurkha'];
  if (name.includes('linen')) return PREMIUM_IMAGES['linen'];
  if (name.includes('suit')) return PREMIUM_IMAGES['suits'];
  if (name.includes('shoe') || name.includes('loafers')) return PREMIUM_IMAGES['shoes'];
  
  // Then category
  if (PREMIUM_IMAGES[category]) return PREMIUM_IMAGES[category];

  // If no match, use product ID to pick a consistent "random" local image
  const id = product.id || 0;
  return LOCAL_IMAGES[id % LOCAL_IMAGES.length];
};
