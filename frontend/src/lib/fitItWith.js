import { canonicalShopPath } from '../data/taxonomy';

/**
 * Leaf-category pairings for PDP “Fit it with”.
 * Prefer smaller shop leaves (formal-shirts, loafers) over giant primaries.
 */
const TILE = {
  'formal-shirts': {
    name: 'Formal Shirts',
    image: '/models/categories/formal-shirts.jpg',
    alt: 'formal-shirts-to-fit-with-outfit-nairobi',
  },
  'shirts-casual': {
    name: 'Casual Shirts',
    image: '/models/shirts/light-blue-gingham.jpg',
    alt: 'casual-shirts-to-pair-with-menswear',
  },
  shirts: {
    name: 'Shirts',
    image: '/models/categories/shirts.jpg',
    alt: 'mens-shirts-category-prince-esquire',
  },
  'formal-shoes': {
    name: 'Formal Shoes',
    image: '/models/categories/formal-shoes.jpg',
    alt: 'formal-shoes-to-finish-the-look',
  },
  loafers: {
    name: 'Loafers',
    image: '/models/categories/loafers.jpg',
    alt: 'loafers-to-pair-with-trousers',
  },
  shoes: {
    name: 'Shoes',
    image: '/models/categories/shoes.jpg',
    alt: 'mens-shoes-category-nairobi',
  },
  chino: {
    name: 'Chinos',
    image: '/models/categories/jeans.jpg',
    alt: 'chino-trousers-to-fit-with-shirt',
  },
  khaki: {
    name: 'Khaki',
    image: '/models/categories/jeans.jpg',
    alt: 'khaki-trousers-menswear-kenya',
  },
  trousers: {
    name: 'Trousers',
    image: '/models/categories/jeans.jpg',
    alt: 'mens-trousers-to-complete-the-outfit',
  },
  blazers: {
    name: 'Blazers',
    image: '/models/categories/blazers.jpg',
    alt: 'blazers-to-layer-over-shirts',
  },
  'full-jackets': {
    name: 'Jackets',
    image: '/models/categories/jackets.jpg',
    alt: 'jackets-to-layer-the-look',
  },
  suits: {
    name: 'Suits',
    image: '/models/categories/suits.jpg',
    alt: 'suits-category-prince-esquire',
  },
  't-shirts': {
    name: 'T-Shirts',
    image: '/models/categories/t-shirts.jpg',
    alt: 't-shirts-casual-layer',
  },
  'polo-t-shirts': {
    name: 'Polos',
    image: '/models/shirts/lilac-contrast.jpg',
    alt: 'polo-shirts-smart-casual',
  },
};

function blobOf(product) {
  return [
    product?.category_slug,
    product?.parent_category_slug,
    product?.category_name,
    product?.parent_category_name,
    product?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function detectFamily(blob) {
  if (/blazer|suit jacket|sport coat/.test(blob)) return 'blazer';
  if (/waistcoat|vest/.test(blob) && !/track/.test(blob)) return 'blazer';
  if (/\bsuit\b|two-piece|three-piece/.test(blob)) return 'suit';
  if (/shoe|loafer|oxford|brogue|derby|sandal|boot|sneaker/.test(blob)) return 'shoe';
  if (/trouser|chino|khaki|jean|denim|pant|gurkha|cargo/.test(blob)) return 'trouser';
  if (/sweater|knit|cardigan|quarter.?zip/.test(blob)) return 'sweater';
  if (/jacket|bomber|outer|coat/.test(blob) && !/blazer/.test(blob)) return 'jacket';
  if (/shirt|polo|oxford cloth/.test(blob)) return 'shirt';
  if (/track|jogger/.test(blob)) return 'track';
  if (/belt|tie|cap|hat/.test(blob)) return 'accessory';
  return 'default';
}

/** Ordered leaf slugs to pair with the viewed product family */
function pairSlugsFor(family) {
  switch (family) {
    case 'blazer':
      return ['formal-shirts', 'formal-shoes'];
    case 'suit':
      return ['formal-shirts', 'formal-shoes'];
    case 'shoe':
      return ['formal-shirts', 'chino'];
    case 'trouser':
      return ['formal-shirts', 'formal-shoes'];
    case 'shirt':
      return ['blazers', 'chino', 'formal-shoes'];
    case 'sweater':
      return ['chino', 'loafers'];
    case 'jacket':
      return ['shirts', 'trousers'];
    case 'track':
      return ['t-shirts', 'loafers'];
    case 'accessory':
      return ['formal-shirts', 'formal-shoes'];
    default:
      return ['formal-shirts', 'formal-shoes'];
  }
}

/**
 * @param {object} product
 * @returns {{ family: string, items: Array<{ slug: string, name: string, href: string, image: string, alt: string }> }}
 */
export function getFitItWithItems(product) {
  if (!product) return { family: 'default', items: [] };
  const family = detectFamily(blobOf(product));
  const slugs = pairSlugsFor(family).slice(0, 3);
  const items = slugs
    .map((slug) => {
      const meta = TILE[slug];
      if (!meta) return null;
      return {
        slug,
        name: meta.name,
        href: canonicalShopPath(slug),
        image: meta.image,
        alt: meta.alt,
      };
    })
    .filter(Boolean);
  return { family, items };
}
