const SITE_URL = 'https://prince-esquire.co.ke';
const SITE_NAME = 'Prince Esquire';
const DEFAULT_IMAGE = `${SITE_URL}/LOGO.jpeg`;

const routeSeo = {
  home: {
    title: "Luxury Menswear in Nairobi, Kenya | Prince Esquire",
    description:
      "Prince Esquire, The Man's Shop at Yala Towers, Nairobi. Luxury men's suits, shirts, shoes and accessories, with delivery across Kenya.",
    path: '/',
    h1: 'Luxury Menswear in Nairobi, Kenya',
    intro:
      "Prince Esquire is The Man's Shop at Yala Towers, Nairobi. Shop men's suits, blazers, formal and casual shirts, trousers, jackets, shoes and accessories, in store or online with delivery across Kenya.",
  },
  products: {
    title: "All Men's Clothing & Shoes in Kenya | Prince Esquire",
    description:
      "Browse the full Prince Esquire collection of men's clothing, shoes and accessories. Visit us at Yala Towers, Nairobi, or order online for delivery across Kenya.",
    path: '/products',
    h1: "All Men's Clothing and Shoes",
    intro: "The complete Prince Esquire collection, from tailored suits and formal shirts to shoes and accessories.",
  },
  sale: {
    title: "Men's Clothing & Shoes on Sale in Kenya | Prince Esquire",
    description:
      "Shop best-selling men's track suits, official shoes and boots on sale at Prince Esquire, Nairobi. Delivery across Kenya.",
    path: '/sale',
    h1: "Men's Best Sellers on Sale",
    intro: 'Our most in-demand pieces, ranked by what clients buy most.',
  },
  'new-arrivals': {
    title: "New Arrivals in Men's Fashion, Kenya | Prince Esquire",
    description:
      "The latest men's clothing, shoes and accessories at Prince Esquire, Yala Towers, Nairobi. See what just landed, with delivery across Kenya.",
    path: '/new-arrivals',
    h1: "New Arrivals in Men's Fashion",
    intro: 'The newest pieces added to the Prince Esquire collection, most recent first.',
  },
  blog: {
    title: "Men's Style Journal: Kenya Dressing Guides | Prince Esquire",
    description:
      "Wedding guest outfits, office wear, shoes and suit advice for men in Kenya, from the Prince Esquire Style Journal.",
    path: '/blog',
    h1: 'The Style Journal',
    intro: 'Practical styling guides and wardrobe advice for men in Kenya.',
  },
  'contact-us': {
    title: 'Contact Prince Esquire | Yala Towers, Nairobi',
    description:
      'Visit Prince Esquire at Yala Towers, Nairobi, or reach us by WhatsApp, phone or email for orders, sizing and styling help.',
    path: '/contact-us',
    h1: 'Contact Prince Esquire',
    intro: 'Find us at Yala Towers, Nairobi, or call and WhatsApp +254 724 494089.',
  },
  'bespoke-services': {
    title: 'Bespoke Tailoring in Nairobi | Prince Esquire',
    description:
      'Bespoke tailoring and personal styling from Prince Esquire: menswear made to your measure at Yala Towers, Nairobi.',
    path: '/bespoke-services',
    h1: 'Bespoke Tailoring and Styling in Nairobi',
    intro: 'Menswear made to your measure, with personal styling from the Prince Esquire team.',
  },
  'shipping-returns': {
    title: 'Delivery & Returns in Kenya | Prince Esquire',
    description:
      'Same-day delivery in Nairobi, within 1-2 hours, and 1-2 days countrywide. Returns and free size exchanges within 5 days of delivery.',
    path: '/shipping-returns',
    h1: 'Shipping and Returns',
    intro:
      'Delivery within Nairobi is same day, in just 1-2 hours, and countrywide delivery takes 1-2 days. Returns are accepted within 5 days of delivery.',
  },
  'size-guide': {
    title: "Men's Size Guide: Shirts, Suits & Shoes | Prince Esquire",
    description:
      'Find your fit with the Prince Esquire size guide for shirts, suits, trousers and shoes before you order.',
    path: '/size-guide',
    h1: "Men's Size Guide",
    intro: 'How to find your size in shirts, suits, trousers and shoes.',
  },
  'privacy-policy': {
    title: 'Privacy Policy | Prince Esquire',
    description: 'How Prince Esquire collects and protects your personal information when you shop with us.',
    path: '/privacy-policy',
    h1: 'Privacy Policy',
  },
};

/** Old flat URLs → current collection pages. Served as real 301s. */
const LEGACY_REDIRECTS = {
  '/contact': '/contact-us',
  '/shirts': '/shop/shirts',
  '/shirts/formal': '/shop/shirts/formal-shirts',
  '/shirts/casual': '/shop/shirts/shirts-casual',
  '/shirts/polo': '/shop/shirts/polo-t-shirts',
  '/shirts/t-shirts': '/shop/shirts/t-shirts',
  '/shirts/sweatshirts': '/shop/shirts/sweat-shirts',
  '/polo-t-shirts': '/shop/shirts/polo-t-shirts',
  '/shoes': '/shop/shoes',
  '/shoes/formal': '/shop/shoes/formal-shoes',
  '/shoes/bespoke-formal': '/shop/shoes/bespoke-formal',
  '/shoes/loafers': '/shop/shoes/loafers',
  '/shoes/casual': '/shop/shoes/casual',
  '/suits': '/shop/suits',
  '/trousers': '/shop/trousers',
  '/trousers/chino': '/shop/trousers/chino',
  '/trousers/khaki': '/shop/trousers/khaki',
  '/trousers/linen': '/shop/trousers/linen-trousers',
  '/trousers/denim-jeans': '/shop/trousers/jeans',
  '/trousers/cargo': '/shop/trousers/cargo',
  '/jackets-outerwear': '/shop/jackets',
  '/jackets-outerwear/full-jackets': '/shop/jackets/full-jackets',
  '/jackets-outerwear/half-jackets': '/shop/jackets/half-jackets',
  '/jackets-outerwear/track-tops': '/shop/tracksuits',
  '/shop/jackets-outerwear': '/shop/jackets',
  '/shop/jackets-outerwear/full-jackets': '/shop/jackets/full-jackets',
  '/shop/jackets-outerwear/half-jackets': '/shop/jackets/half-jackets',
  '/shop/jackets-outerwear/track-tops': '/shop/tracksuits',
  '/shop/jackets/track-tops': '/shop/tracksuits',
  '/track-suits': '/shop/tracksuits',
  '/accessories': '/shop/accessories',
  '/accessories/belts': '/shop/accessories/belts',
  '/accessories/ties': '/shop/accessories/ties',
  '/accessories/caps': '/shop/accessories/caps',
  '/accessories/hats': '/shop/accessories/hats',
  '/gift-sets': '/shop/gift-sets',
  '/gifts': '/shop/gift-sets',
  '/linen': '/shop/linen-edit',
  '/admin': '/admin/login',
};

/** Real app pages that must never appear in search results. */
const PRIVATE_ROUTES = [
  { test: /^\/cart$/, title: 'Your cart' },
  { test: /^\/checkout$/, title: 'Checkout' },
  { test: /^\/payment\/[^/]+$/, title: 'Payment' },
  { test: /^\/login$/, title: 'Sign in' },
  { test: /^\/signup$/, title: 'Create an account' },
  { test: /^\/profile$/, title: 'Your account' },
  { test: /^\/admin\/(login|dashboard)$/, title: 'Admin' },
];

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  alternateName: "Prince Esquire — The Man's Shop",
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  email: 'prince.esquire.staff@gmail.com',
  telephone: '+254724494089',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Yala Towers',
    addressLocality: 'Nairobi',
    addressRegion: 'Nairobi',
    addressCountry: 'KE',
  },
  sameAs: [
    'https://www.instagram.com/prince_esquire.1/',
    'https://www.facebook.com/prince.esquire254',
    'https://www.tiktok.com/@princeesquire',
  ],
};

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Prince+Esquire+Yala+Towers+Nairobi';

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: "Prince Esquire — The Man's Shop",
  image: DEFAULT_IMAGE,
  url: SITE_URL,
  telephone: '+254724494089',
  priceRange: 'KSh',
  hasMap: MAP_URL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Yala Towers',
    addressLocality: 'Nairobi',
    addressRegion: 'Nairobi',
    addressCountry: 'KE',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '18:00',
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
  '/new-arrivals',
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
  LEGACY_REDIRECTS,
  MAP_URL,
  PRIVATE_ROUTES,
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
  staticPaths,
};
