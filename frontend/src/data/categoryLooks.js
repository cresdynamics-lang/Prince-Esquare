/**
 * Model photography for category pages. These override the placeholder and
 * mannequin tiles wherever a real model shot exists in /public/models.
 *
 * `looks` are the hero photos (first one loads eagerly). To upgrade a category,
 * add a new model photo to /public/models and list it here: nothing else changes.
 * Jackets, T-shirts, jeans, linen, accessories and gift sets are still waiting on
 * a model shoot, so they use the best product photography available.
 */
export const CATEGORY_LOOKS = {
  suits: ['/models/blazers/tan-lifestyle.jpg', '/models/blazers/burgundy-lifestyle.jpg', '/models/shoes/tan-brogue-lifestyle.jpg'],
  'suit-sets': ['/models/blazers/tan-lifestyle.jpg', '/models/blazers/burgundy-lifestyle.jpg'],
  'two-piece': ['/models/blazers/burgundy-lifestyle.jpg', '/models/blazers/tan-lifestyle.jpg'],
  blazers: ['/models/blazers/burgundy-lifestyle.jpg', '/models/blazers/tan-lifestyle.jpg'],
  shirts: ['/models/shirts/light-blue-gingham.jpg', '/models/shirts/lilac-contrast.jpg', '/models/shirts/mauve-contrast.jpg'],
  'formal-shirts': ['/models/shirts/lilac-contrast.jpg', '/models/shirts/light-blue-gingham.jpg', '/models/shirts/rose-contrast.jpg'],
  trousers: ['/models/shirts/rose-contrast.jpg', '/models/shirts/mauve-contrast.jpg', '/models/shirts/light-blue-gingham.jpg'],
  shoes: ['/models/shoes/tan-brogue-lifestyle.jpg', '/models/shoes/black-patent-lifestyle.jpg', '/models/shoes/brown-oxford-lifestyle.jpg'],
  'formal-shoes': ['/models/shoes/black-patent-lifestyle.jpg', '/models/shoes/tan-brogue-lifestyle.jpg', '/models/shoes/brown-oxford-lifestyle.jpg'],
  'bespoke-formal': ['/models/shoes/black-patent-closeup.jpg', '/models/shoes/tan-brogue-lifestyle.jpg'],
  loafers: ['/models/shoes/black-loafer-lifestyle.jpg', '/models/shoes/black-patent-lifestyle.jpg'],
  'wedding-suits': ['/models/blazers/burgundy-lifestyle.jpg', '/models/blazers/tan-lifestyle.jpg'],
  'chelsea-boots': ['/models/shoes/tan-brogue-lifestyle.jpg', '/models/shoes/black-patent-lifestyle.jpg'],
  brogues: ['/models/shoes/tan-brogue-lifestyle.jpg', '/models/shoes/black-patent-closeup.jpg'],
  'presidential-shirts': ['/hero/presidential-1600.webp'],
  tracksuits: ['/hero/tracksuits-1600.webp'],
  jackets: ['/models/categories/jackets.jpg', '/hero/outerwear-800.webp', '/hero/shoe-atelier-800.webp'],
  't-shirts': ['/models/tshirts/navy-jeans-look.jpg', '/models/tshirts/burgundy-jeans-look.jpg', '/models/tshirts/black-jeans-look.jpg'],
  jeans: ['/models/jeans/light-wash-modeled.jpg', '/models/tshirts/black-jeans-look.jpg', '/models/tshirts/burgundy-jeans-look.jpg'],
  accessories: ['/hero/belts-800.webp'],
  'gift-sets': ['/models/categories/gift-sets-800.jpg'],
  'linen-edit': ['/models/categories/linen-edit-800.jpg'],
};

/** Tile photo for a subcategory: model shot first, then whatever the API has. */
export const CATEGORY_TILE_IMAGES = {
  'suit-sets': '/models/blazers/tan-lifestyle.jpg',
  blazers: '/models/blazers/burgundy-lifestyle.jpg',
  'formal-shirts': '/models/shirts/lilac-contrast.jpg',
  'polo-t-shirts': null,
  't-shirts': '/models/tshirts/navy-jeans-look.jpg',
  jeans: '/models/jeans/light-wash-modeled.jpg',
  'formal-shoes': '/models/shoes/black-patent-lifestyle.jpg',
  'wedding-suits': '/models/blazers/burgundy-lifestyle.jpg',
  'chelsea-boots': '/models/shoes/black-loafer-lifestyle.jpg',
  brogues: '/models/shoes/tan-brogue-lifestyle.jpg',
  'presidential-shirts': '/hero/presidential-800.webp',
  'bespoke-formal': '/models/shoes/black-patent-closeup.jpg',
  loafers: '/models/shoes/black-loafer-lifestyle.jpg',
};

export function looksFor(slug, parentSlug) {
  return CATEGORY_LOOKS[slug] || CATEGORY_LOOKS[parentSlug] || [];
}

export function tileImageFor(slug, fallback) {
  return CATEGORY_TILE_IMAGES[slug] || fallback || null;
}
