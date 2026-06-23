export const SITE_URL = 'https://prince-esquire.co.ke';
export const SITE_NAME = 'Prince Esquire';
export const DEFAULT_IMAGE = `${SITE_URL}/LOGO.jpeg`;
export const CONTACT_PHONE = '+254724494089';
export const CONTACT_EMAIL = 'prince.esquire.staff@gmail.com';
export const SOCIAL_INSTAGRAM = 'https://www.instagram.com/prince_esquire.1/';
export const SOCIAL_FACEBOOK = 'https://www.facebook.com/prince.esquire254';

export const routeSeo = {
  home: {
    title: 'Luxury Fashion Kenya | Prince Esquire',
    description: 'Shop curated luxury fashion in Kenya at Prince Esquire. Discover refined menswear, footwear and accessories with Nairobi delivery. Explore now.',
    path: '/',
    keywords: [
      'luxury fashion Kenya',
      'premium clothing Nairobi',
      'designer brands Kenya online',
      'luxury menswear Nairobi',
      'online luxury boutique Kenya',
    ],
  },
  products: {
    title: 'Designer Clothing Kenya | Prince Esquire',
    description: 'Browse premium clothing, shoes and accessories at Prince Esquire. Curated luxury fashion for discerning Kenyan wardrobes. Shop the edit.',
    path: '/products',
    keywords: ['designer clothing Kenya', 'premium fashion Kenya', 'luxury clothing Nairobi'],
  },
  'polo-t-shirts': {
    title: 'Luxury Polo Shirts Kenya | Prince Esquire',
    description: 'Shop luxury polo shirts in Kenya, from refined knitted polos to elegant casual pieces curated for modern Nairobi style. Discover yours.',
    path: '/polo-t-shirts',
    introTitle: 'Luxury Polo Shirts Kenya',
    introCopy: 'Explore luxury polo shirts in Kenya curated for the man who values ease without losing polish. Prince Esquire selects premium polos, knitted styles and refined casual essentials that move comfortably from Nairobi business lunches to relaxed weekend occasions. Each piece is chosen for confident colour, clean structure and a finish that feels considered rather than ordinary. Pair yours with tailored trousers, linen separates or luxury shoes for a complete wardrobe with quiet presence. Discover the polo edit and choose the piece that fits your rhythm.',
  },
  shoes: {
    title: 'Designer Shoes Nairobi | Prince Esquire',
    description: 'Discover designer shoes in Nairobi, including loafers, formal leather shoes and refined casual footwear for elegant Kenyan wardrobes. Shop now.',
    path: '/shoes',
    introTitle: 'Designer Shoes Nairobi',
    introCopy: 'Step into designer shoes in Nairobi selected for elegance, comfort and lasting impression. From polished formal shoes to luxury loafers and refined casual footwear, Prince Esquire curates pairs that complete a sophisticated Kenyan wardrobe. Each silhouette is chosen for material character, versatile styling and the confidence it brings to boardrooms, weddings, private events and weekend dressing. Explore premium footwear crafted for men who notice detail and expect their shoes to speak with restraint.',
  },
  shirts: {
    title: 'Premium Shirts Kenya | Prince Esquire',
    description: 'Shop premium shirts in Kenya, from formal shirts to refined casual designs selected for discerning Nairobi style. Explore the collection.',
    path: '/shirts',
    introTitle: 'Premium Shirts Kenya',
    introCopy: 'Discover premium shirts in Kenya for refined days, important evenings and every occasion that deserves precision. Prince Esquire brings together formal shirts, casual shirts and statement pieces with a sharp eye for fit, fabric and finish. Built for the style-conscious Kenyan gentleman, the collection pairs easily with suits, chinos, denim or linen. Choose shirts that feel composed, photograph beautifully and carry a sense of quiet luxury from the first wear.',
  },
  suits: {
    title: 'Luxury Suits Nairobi | Prince Esquire',
    description: 'Find luxury suits in Nairobi for weddings, business and formal occasions. Shop curated two-piece and three-piece tailoring today.',
    path: '/suits',
    introTitle: 'Luxury Suits Nairobi',
    introCopy: 'Prince Esquire curates luxury suits in Nairobi for men who understand the power of presence. Explore two-piece and three-piece tailoring selected for clean lines, elevated fabrics and formal confidence. Whether dressing for a wedding, executive engagement, gala or private celebration, each suit is chosen to bring structure, poise and distinction to your wardrobe. Complete the look with premium shirts, leather shoes and accessories from our Nairobi luxury fashion edit.',
  },
  trousers: {
    title: 'Premium Trousers Kenya | Prince Esquire',
    description: 'Shop premium trousers in Kenya, including chinos, formal trousers and refined casual fits for polished everyday style. Browse now.',
    path: '/trousers',
    introTitle: 'Premium Trousers Kenya',
    introCopy: 'Refine your wardrobe with premium trousers in Kenya chosen for fit, movement and understated style. Prince Esquire offers chinos, formal trousers, khakis and elevated casual cuts for men who want every outfit to feel intentional. These pieces work across Nairobi offices, evening plans and travel days, pairing naturally with shirts, polos, blazers and leather shoes. Explore trousers that bring balance to your wardrobe and polish to daily dressing.',
  },
  linen: {
    title: 'Luxury Linen Kenya | Prince Esquire',
    description: 'Shop luxury linen in Kenya for warm-weather elegance, from linen shirts to relaxed sets curated for refined Nairobi style. Explore now.',
    path: '/linen',
    introTitle: 'Luxury Linen Kenya',
    introCopy: 'Luxury linen in Kenya belongs in a wardrobe built for climate, comfort and effortless polish. Prince Esquire curates linen shirts, sets, trousers and shorts with a relaxed sophistication suited to Nairobi weekends, coastal escapes and warm-weather events. The collection favours breathable textures, calm colour and silhouettes that feel composed without stiffness. Explore linen pieces that make ease look deliberate.',
  },
  blog: {
    title: 'Prince Esquire Style Journal',
    description: 'Read styling notes, wardrobe guides and fashion editorial from Prince Esquire. Discover practical style advice for premium menswear in Kenya.',
    path: '/blog',
    keywords: ['fashion blog Kenya', 'menswear style tips', 'wardrobe guide Nairobi', 'Prince Esquire blog'],
  },
};

export const categoryFallbackIntro = {
  title: "Men's Luxury Fashion",
  copy: 'Browse men\'s luxury fashion in Kenya curated for elegant, modern dressing. Prince Esquire brings together premium clothing, designer shoes and polished accessories for affluent Kenyan customers who value detail, confidence and timeless style. Explore refined pieces for business, leisure, travel and formal occasions, then build a wardrobe that feels distinctly yours.',
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  sameAs: [
    SOCIAL_INSTAGRAM,
    SOCIAL_FACEBOOK,
    'https://www.tiktok.com/@princeesquire',
  ],
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: SITE_NAME,
  image: DEFAULT_IMAGE,
  url: SITE_URL,
  telephone: CONTACT_PHONE,
  email: CONTACT_EMAIL,
  priceRange: 'KSh',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Prince Esquire Boutique',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -1.2921,
    longitude: 36.8219,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
};

export const websiteSchema = {
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

export const buildBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

export const buildProductSchema = (product, image, price) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  image: image ? [image.startsWith('http') ? image : `${SITE_URL}${image}`] : [DEFAULT_IMAGE],
  description: product.description || `Luxury ${product.name} from Prince Esquire Kenya.`,
  sku: String(product.sku || product.slug || product.name),
  brand: {
    '@type': 'Brand',
    name: product.brand_name || product.brand || SITE_NAME,
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/product/${product.slug}`,
    priceCurrency: 'KES',
    price: String(price || product.price || ''),
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '24',
  },
});

export const buildBlogPostingSchema = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt || post.title,
  image: post.featured_image_url ? [post.featured_image_url] : [DEFAULT_IMAGE],
  datePublished: post.published_date || post.created_at,
  dateModified: post.updated_at || post.published_date || post.created_at,
  author: {
    '@type': 'Person',
    name: post.author_name || SITE_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_IMAGE,
    },
  },
  mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  articleSection: post.category || 'Style',
});
