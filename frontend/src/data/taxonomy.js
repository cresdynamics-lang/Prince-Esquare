/**
 * Prince Esquire storefront taxonomy (source of truth).
 *
 * Primaries (nav):
 * 1 Suits · 2 Shirts · 3 Trousers · 4 Jackets · 5 Shoes · 6 Accessories · 7 Gift Sets & Boxes
 *
 * Specials (anchors, outside the 7):
 * Linen Edit · Bestsellers → /sale · New Arrivals
 *
 * Products keep ONE home category (category_id). cross_tags surface them
 * in additional browse contexts without duplicating inventory/SEO.
 */

export const TAXONOMY_VERSION = 3;

/** Permanent anchors outside the 7 primary categories */
export const NAV_ANCHORS = [
  { id: 'new-arrivals', name: 'New Arrivals', href: '/new-arrivals', kind: 'anchor' },
  {
    id: 'bestsellers',
    name: 'Bestsellers',
    href: '/sale',
    kind: 'anchor',
    note: 'Best Seller always routes to the Sale page',
  },
  {
    id: 'linen-edit',
    name: 'Linen Edit',
    href: '/shop/linen-edit',
    kind: 'edit',
    note: 'Curated linen trousers, shirts, and sets',
  },
];

const ph = (slug) => `/placeholders/taxonomy/${slug}.svg`;

/**
 * @typedef {{ name: string, slug: string, copy?: string, children?: object[], isNavPrimary?: boolean }} Taxon
 */

/** @type {Taxon[]} */
export const TAXONOMY_TREE = [
  {
    name: 'Suits',
    slug: 'suits',
    copy: 'The rooms you walk into decide faster than the words you say. This is what you wear before you speak.',
    tileImage: ph('suits'),
    heroImage: ph('suits-hero'),
    children: [
      { name: 'Suits', slug: 'suit-sets', copy: 'Complete looks, ready for the day that matters.', tileImage: ph('suit-sets') },
      { name: 'Two-Piece', slug: 'two-piece', copy: 'Clean lines. Zero hesitation.', tileImage: ph('two-piece') },
      { name: 'Three-Piece', slug: 'three-piece', copy: 'When the occasion asks for more — and you deliver.', tileImage: ph('three-piece') },
      { name: 'Blazers', slug: 'blazers', copy: 'Structure without the full suit. Authority that travels.', tileImage: ph('blazers'), crossSurfaces: ['jackets'] },
      { name: 'Waistcoats', slug: 'waistcoats', copy: 'The layer that finishes the story.', tileImage: ph('waistcoats'), crossSurfaces: ['jackets'] },
      { name: 'Vests', slug: 'vests', copy: 'Sharp between the jacket and the shirt.', tileImage: ph('vests'), crossSurfaces: ['jackets'] },
    ],
  },
  {
    name: 'Shirts',
    slug: 'shirts',
    copy: 'The shirt that makes an entrance before you say a word.',
    tileImage: ph('shirts'),
    heroImage: ph('shirts-hero'),
    children: [
      { name: 'Formal Shirts', slug: 'formal-shirts', copy: 'The collar that closes the room before you speak.', tileImage: ph('formal-shirts') },
      { name: 'Casual Shirts', slug: 'shirts-casual', copy: 'Ease that still reads as intention.', tileImage: ph('shirts-casual') },
      { name: 'Polo Shirts', slug: 'polo-t-shirts', copy: 'Weekend polish without trying too hard.', tileImage: ph('polo-t-shirts') },
      { name: 'T-Shirts', slug: 't-shirts', copy: 'The quiet layer under everything sharp.', tileImage: ph('t-shirts') },
      { name: 'Sweatshirts', slug: 'sweat-shirts', copy: 'Soft structure for off-duty hours that still matter.', tileImage: ph('sweat-shirts') },
    ],
  },
  {
    name: 'Trousers',
    slug: 'trousers',
    copy: 'From the boardroom to the weekend — the foundation of a composed wardrobe.',
    tileImage: ph('trousers'),
    heroImage: ph('trousers-hero'),
    children: [
      { name: 'Chino', slug: 'chino', copy: 'The trouser that works the full day without asking for attention.', tileImage: ph('chino') },
      { name: 'Khaki', slug: 'khaki', copy: 'Grounded colour. Steady silhouette.', tileImage: ph('khaki') },
      { name: 'Linen', slug: 'linen-trousers', copy: 'Heat-proof composure for Nairobi days.', tileImage: ph('linen-trousers'), crossSurfaces: ['linen-edit'] },
      { name: 'Denim / Jeans', slug: 'jeans', copy: 'Denim that holds its line after the first wash.', tileImage: ph('jeans') },
      { name: 'Cargo', slug: 'cargo', copy: 'Utility cut with a cleaner finish.', tileImage: ph('cargo') },
    ],
  },
  {
    name: 'Jackets & Outerwear',
    slug: 'jackets',
    copy: 'What you put on last is what they remember first.',
    tileImage: ph('jackets'),
    heroImage: ph('jackets-hero'),
    children: [
      { name: 'Full Jackets', slug: 'full-jackets', copy: 'The last layer they remember.', tileImage: ph('full-jackets') },
      { name: 'Half Jackets', slug: 'half-jackets', copy: 'Lighter weight. Same presence.', tileImage: ph('half-jackets') },
      { name: 'Track Tops', slug: 'track-tops', copy: 'Off-duty polish that still photographs well.', tileImage: ph('track-tops') },
    ],
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    copy: 'Some men buy shoes. Others buy the sound of the room going quiet when they walk in.',
    tileImage: ph('shoes'),
    heroImage: ph('shoes-hero'),
    children: [
      { name: 'Formal', slug: 'formal-shoes', copy: 'The sound of the room going quiet.', tileImage: ph('formal-shoes') },
      { name: 'Bespoke Formal', slug: 'bespoke-formal', copy: 'Built to your measure — made to order.', tileImage: ph('bespoke-formal') },
      { name: 'Loafers', slug: 'loafers', copy: 'Slip-on ease with evening-ready finish.', tileImage: ph('loafers') },
      { name: 'Casual', slug: 'casual', copy: 'Weekend footing without losing the line.', tileImage: ph('casual') },
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    copy: 'The smallest details — noticed by the sharpest men.',
    tileImage: ph('accessories'),
    heroImage: ph('accessories-hero'),
    children: [
      { name: 'Belts', slug: 'belts', copy: 'The quiet line that finishes the waist.', tileImage: ph('belts') },
      { name: 'Ties', slug: 'ties', copy: 'Colour and knot — chosen, not accidental.', tileImage: ph('ties') },
      { name: 'Caps', slug: 'caps', copy: 'A sharper silhouette under the sun.', tileImage: ph('caps') },
      { name: 'Hats', slug: 'hats', copy: 'Presence from the crown down.', tileImage: ph('hats') },
    ],
  },
  {
    name: 'Gift Sets & Boxes',
    slug: 'gift-sets',
    copy: 'The gift that arrives already decided — curated, boxed, ready to impress.',
    tileImage: ph('gift-sets'),
    heroImage: ph('gift-sets'),
    children: [],
  },
  /**
   * Linen Edit — not a top-nav primary (see NAV_ANCHORS).
   * Home for linen-shirts / linen-set; linen-trousers live under Trousers + cross-tag here.
   */
  {
    name: 'Linen Edit',
    slug: 'linen-edit',
    isNavPrimary: false,
    copy: "Nairobi heat doesn't have to mean compromise. This is what composure looks like at 30 degrees.",
    tileImage: ph('linen-edit'),
    heroImage: ph('linen-edit'),
    children: [
      { name: 'Linen Trousers', slug: 'linen-trousers', copy: 'Breath that holds its crease.', tileImage: ph('linen-trousers'), crossSurfaces: ['linen-edit'] },
      { name: 'Linen Shirts', slug: 'linen-shirts', copy: 'Open weave. Closed impression.', tileImage: ph('linen-shirts'), crossSurfaces: ['linen-edit'] },
      { name: 'Linen Sets', slug: 'linen-set', copy: 'One decision — trousers and shirt, already matched.', tileImage: ph('linen-set'), crossSurfaces: ['linen-edit'] },
    ],
  },
];

/** Legacy slugs → new taxonomy paths (for redirects / product remap) */
export const LEGACY_SLUG_ALIASES = {
  'belts-ties': 'accessories',
  'track-suits': 'track-tops',
  linen: 'linen-edit',
  'jackets-outerwear': 'jackets',
  boots: 'formal-shoes',
  sandals: 'casual',
  sweaters: 'half-jackets',
  presidential: 'formal-shirts',
  polos: 'polo-t-shirts',
  'knitted-polos': 'polo-t-shirts',
  'round-neck-t-shirts': 't-shirts',
  'v-neck-t-shirts': 't-shirts',
  sets: 'suit-sets',
  gurkha: 'trousers',
  formal: 'trousers',
  'linen-shorts': 'linen-edit',
  boxers: 'accessories',
  socks: 'accessories',
};

export const MERCH_TAGS = [
  { id: 'limited', label: 'Limited' },
  { id: 'editors_choice', label: "Editor's Choice" },
  { id: 'presidential_pick', label: 'Presidential Pick' },
  { id: 'bespoke', label: 'Bespoke', defaultLeadDays: 14 },
  { id: 'bestseller', label: 'Bestseller', href: '/sale#bestsellers' },
];

/** Freshness is system-owned (get_new) — never shown in admin multi-select. */
export const MERCH_TAG_ADMIN_OPTIONS = MERCH_TAGS;

export const LIMITED_MAX_UNITS = 8;
export const EDITORIAL_TAG_CAP = 6;

/** Surfaces a product may appear in besides its single home category (no SKU dupes). */
export const CROSS_TAG_OPTIONS = [
  { slug: 'jackets', label: 'Jackets & Outerwear' },
  { slug: 'suits', label: 'Suits' },
  { slug: 'shirts', label: 'Shirts' },
  { slug: 'trousers', label: 'Trousers' },
  { slug: 'shoes', label: 'Shoes' },
  { slug: 'accessories', label: 'Accessories' },
  { slug: 'gift-sets', label: 'Gift Sets & Boxes' },
  { slug: 'linen-edit', label: 'Linen Edit' },
];

/** Build /shop/... path from a category slug using the locked tree (canonical browse URL). */
export function canonicalShopPath(slug) {
  if (!slug) return '/products';
  const flat = flattenTaxonomy(TAXONOMY_TREE);
  const node = flat.find((r) => r.slug === slug);
  if (!node) return `/shop/${slug}`;
  const chain = [node.slug];
  let parentSlug = node.parentSlug;
  while (parentSlug) {
    chain.unshift(parentSlug);
    const parent = flat.find((r) => r.slug === parentSlug);
    parentSlug = parent?.parentSlug ?? null;
  }
  return `/shop/${chain.join('/')}`;
}

export function flattenTaxonomy(tree = TAXONOMY_TREE, parent = null, depth = 0) {
  const rows = [];
  for (const node of tree) {
    const isNavPrimary =
      depth === 0 ? node.isNavPrimary !== false : false;
    rows.push({
      name: node.name,
      slug: node.slug,
      parentSlug: parent?.slug ?? null,
      depth,
      copy: node.copy || '',
      tileImage: node.tileImage || ph(node.slug),
      heroImage: node.heroImage || null,
      crossSurfaces: node.crossSurfaces || [],
      isNavPrimary,
    });
    if (node.children?.length) {
      rows.push(...flattenTaxonomy(node.children, node, depth + 1));
    }
  }
  return rows;
}

export function findTaxonBySlug(slug, tree = TAXONOMY_TREE) {
  for (const node of tree) {
    if (node.slug === slug) return node;
    if (node.children?.length) {
      const found = findTaxonBySlug(slug, node.children);
      if (found) return found;
    }
  }
  return null;
}

/** Clickable PDP crumbs: Home / Primary / Sub / Product */
export function productBreadcrumbs(product) {
  if (!product) return [{ name: 'Home', href: '/' }];
  const crumbs = [{ name: 'Home', href: '/' }];
  const parentSlug = product.parent_category_slug;
  const catSlug = product.category_slug;
  const parentName = product.parent_category_name;
  const catName = product.category_name;

  if (parentSlug) {
    crumbs.push({ name: parentName || parentSlug, href: `/shop/${parentSlug}` });
    if (catSlug && catSlug !== parentSlug) {
      crumbs.push({
        name: catName || catSlug,
        href: canonicalShopPath(catSlug),
      });
    }
  } else if (catSlug) {
    crumbs.push({ name: catName || catSlug, href: `/shop/${catSlug}` });
  } else {
    crumbs.push({ name: 'Shop', href: '/products' });
  }

  crumbs.push({
    name: product.name,
    href: `/product/${product.slug}`,
  });
  return crumbs;
}

/** SEO helpers for category landings — luxury tone, no hedging, no exclamation. */
export function landingSeo(category) {
  const name = category?.name || 'Shop';
  const raw = (category?.navCopy || category?.description || '').trim();
  const description =
    raw ||
    `Shop ${name} at Prince Esquire Kenya — curated menswear with Nairobi presence and delivery across the country.`;
  return {
    title: `${name} | Prince Esquire Kenya`,
    description: description.replace(/!+/g, '.').replace(/\?{2,}/g, '?').slice(0, 160),
  };
}

/** Top nav primaries only (excludes Linen Edit special). */
export function primaryNavItems() {
  return TAXONOMY_TREE.filter((n) => n.isNavPrimary !== false).map((n) => ({
    name: n.name,
    slug: n.slug,
    href: `/shop/${n.slug}`,
    children: n.children || [],
    tileImage: n.tileImage,
  }));
}
