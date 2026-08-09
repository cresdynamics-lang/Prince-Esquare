const SITE_URL = 'https://prince-esquire.co.ke';
const SITE_NAME = 'Prince Esquire';
const DEFAULT_IMAGE = `${SITE_URL}/LOGO.jpeg`;

const routeSeo = {
  home: {
    title: 'Luxury Fashion Kenya | Prince Esquire',
    description:
      'Shop curated luxury fashion in Kenya at Prince Esquire. Discover refined menswear, footwear and accessories with Nairobi delivery. Explore now.',
    path: '/',
    h1: 'Curated Luxury Fashion in Kenya',
    intro:
      'Prince Esquire is Nairobi\'s destination for luxury fashion in Kenya — premium menswear, designer shoes, tailored suits, track suits and polished accessories.',
  },
  products: {
    title: 'Designer Clothing Kenya | Prince Esquire',
    description:
      'Browse premium clothing, shoes and accessories at Prince Esquire. Curated luxury fashion for discerning Kenyan wardrobes. Shop the edit.',
    path: '/products',
    h1: 'Our Collections',
  },
  sale: {
    title: 'Sale — Best Sellers | Prince Esquire Kenya',
    description:
      'Shop best-selling tracksuits, official shoes and official boots at Prince Esquire Kenya. Curated sale picks with Nairobi delivery.',
    path: '/sale',
    h1: 'Best Sellers on Sale',
    intro:
      'Our most in-demand pieces — luxury track suits, formal shoes and Chelsea boots — ranked by what clients buy most.',
  },
  'polo-t-shirts': {
    title: 'Luxury Polo Shirts Kenya | Prince Esquire',
    description:
      'Shop luxury polo shirts in Kenya, from refined knitted polos to elegant casual pieces curated for modern Nairobi style.',
    path: '/polo-t-shirts',
    h1: 'Luxury Polo Shirts Kenya',
  },
  shoes: {
    title: 'Designer Shoes Nairobi | Prince Esquire',
    description:
      'Discover designer shoes in Nairobi — loafers, formal leather shoes and refined casual footwear for elegant Kenyan wardrobes.',
    path: '/shoes',
    h1: 'Designer Shoes Nairobi',
  },
  shirts: {
    title: 'Premium Shirts Kenya | Prince Esquire',
    description:
      'Shop premium shirts in Kenya, from formal shirts to refined casual designs selected for discerning Nairobi style.',
    path: '/shirts',
    h1: 'Premium Shirts Kenya',
  },
  suits: {
    title: 'Luxury Suits Nairobi | Prince Esquire',
    description:
      'Find luxury suits in Nairobi for weddings, business and formal occasions. Shop curated two piece and three piece tailoring.',
    path: '/suits',
    h1: 'Luxury Suits Nairobi',
  },
  trousers: {
    title: 'Premium Trousers Kenya | Prince Esquire',
    description:
      'Shop premium trousers in Kenya — chinos, formal trousers and refined casual fits for polished everyday style.',
    path: '/trousers',
    h1: 'Premium Trousers Kenya',
  },
  linen: {
    title: 'Luxury Linen Kenya | Prince Esquire',
    description:
      'Shop luxury linen in Kenya for warm weather elegance — linen shirts, sets and trousers curated for refined Nairobi style.',
    path: '/linen',
    h1: 'Luxury Linen Kenya',
  },
  blog: {
    title: 'Prince Esquire Style Journal',
    description:
      'Read styling notes, wardrobe guides and fashion editorial from Prince Esquire. Style advice for premium menswear in Kenya.',
    path: '/blog',
    h1: 'Style Journal',
  },
  'contact-us': {
    title: 'Contact Prince Esquire | Luxury Fashion Nairobi',
    description:
      'Contact Prince Esquire in Nairobi for luxury fashion enquiries, orders and styling support. WhatsApp, phone and email.',
    path: '/contact-us',
    h1: 'Contact Us',
  },
  'bespoke-services': {
    title: 'Bespoke Services | Prince Esquire Nairobi',
    description:
      'Bespoke tailoring and personal styling services from Prince Esquire — refined menswear made for you in Nairobi, Kenya.',
    path: '/bespoke-services',
    h1: 'Bespoke Services',
  },
  'shipping-returns': {
    title: 'Shipping & Returns | Prince Esquire Kenya',
    description:
      'Delivery across Kenya, order support and returns information for Prince Esquire online luxury fashion orders.',
    path: '/shipping-returns',
    h1: 'Shipping & Returns',
  },
  'size-guide': {
    title: 'Size Guide | Prince Esquire Kenya',
    description:
      'Find your fit with the Prince Esquire size guide for shirts, shoes, suits and casual wear. Luxury fashion Kenya.',
    path: '/size-guide',
    h1: 'Size Guide',
  },
  'privacy-policy': {
    title: 'Privacy Policy | Prince Esquire',
    description: 'How Prince Esquire collects and protects your personal information when you shop luxury fashion in Kenya.',
    path: '/privacy-policy',
    h1: 'Privacy Policy',
  },
};

const categoryFilters = {
  '/polo-t-shirts': { parentSlug: 'polo-t-shirts' },
  '/shoes': { parentSlug: 'shoes' },
  '/shirts': { parentSlug: 'shirts' },
  '/suits': { parentSlug: 'suits' },
  '/trousers': { parentSlug: 'trousers' },
  '/linen': { parentSlug: 'linen' },
  '/products': {},
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  email: 'prince.esquire.staff@gmail.com',
  telephone: '+254724494089',
  address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' },
  sameAs: [
    'https://www.instagram.com/prince_esquire.1/',
    'https://www.facebook.com/prince.esquire254',
    'https://www.tiktok.com/@princeesquire',
  ],
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: SITE_NAME,
  image: DEFAULT_IMAGE,
  url: SITE_URL,
  telephone: '+254724494089',
  priceRange: 'KSh',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/products?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const staticPaths = [
  '/',
  '/products',
  '/sale',
  '/polo-t-shirts',
  '/shoes',
  '/shirts',
  '/suits',
  '/trousers',
  '/linen',
  '/blog',
  '/contact-us',
  '/bespoke-services',
  '/shipping-returns',
  '/size-guide',
  '/privacy-policy',
];

module.exports = {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  routeSeo,
  categoryFilters,
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
  staticPaths,
};
