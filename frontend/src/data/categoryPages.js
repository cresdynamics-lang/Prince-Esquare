/**
 * Per-primary category page config — Suits is the locked template;
 * Shirts / Trousers / etc. plug in the same shape.
 */

import { HOME_CATEGORY_CARDS } from './homepageContent';
import { FABRIC_OPTIONS } from '../utils/fabric';

const suitsCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/suits');
const shirtsCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/shirts');
const trousersCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/trousers');
const jacketsCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/jackets');
const shoesCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/shoes');
const accessoriesCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/accessories');
const giftSetsCard = HOME_CATEGORY_CARDS.find((c) => c.href === '/shop/gift-sets');

const ph = (slug) => `/placeholders/taxonomy/${slug}.svg`;

/** Cross-tag secondary line under a subcategory tile label. */
export const CROSS_SURFACE_LABELS = {
  jackets: 'Also in Jackets & Outerwear',
  suits: 'Also in Suits & Tailoring',
  'linen-edit': 'Also in The Linen Edit',
};

/**
 * @typedef {{
 *   slug: string,
 *   eyebrow: string,
 *   h1: string,
 *   subhead: string,
 *   heroImage: string,
 *   heroImageSm?: string,
 *   subTilesLayout?: 'scroll' | 'grid' | 'split',
 *   showFabricFilter?: boolean,
 *   showSubcategoryFilter?: boolean,
 *   showColorFilter?: boolean,
 *   sizeFilterWhenSubs?: string[],
 *   gridNativeSlugs?: string[],
 *   crossLinkHeading?: string,
 *   crossLinkTiles?: { name: string, slug: string, href: string, tileImage?: string }[],
 *   hideBestsellingWhenSubs?: string[],
 *   editorialFallbackEyebrow?: string,
 *   editorialFallbackLine?: string,
 *   editorialFallbackCtas?: { label: string, href: string }[],
 *   completeLook?: {
 *     eyebrow: string,
 *     title: string,
 *     sources: string[],
 *     limit?: number,
 *     compact?: boolean,
 *     bestsellerOnly?: boolean,
 *     cta?: { label: string, href: string },
 *   },
 * }} CategoryPageConfig
 */

/** @type {Record<string, CategoryPageConfig>} */
export const CATEGORY_PAGE_CONFIG = {
  suits: {
    slug: 'suits',
    eyebrow: 'Suits & Tailoring',
    h1: 'The rooms you walk into decide faster than the words you say.',
    subhead: 'This is what you wear before you speak.',
    heroImage: suitsCard?.image || '/hero/suits-1600.webp',
    heroImageSm: suitsCard?.imageSm || '/hero/suits-800.webp',
    subTilesLayout: 'scroll',
    editorialFallbackEyebrow: 'Suits & Tailoring',
    editorialFallbackCtas: [
      { label: 'Shop Two-Piece', href: '/shop/suits/two-piece' },
      { label: 'Shop Three-Piece', href: '/shop/suits/three-piece' },
    ],
    completeLook: {
      eyebrow: 'Complete the Look',
      title: 'A suit is only half the entrance.',
      sources: ['formal-shoes', 'belts', 'ties'],
      cta: { label: 'Shop formal shoes', href: '/shop/shoes/formal-shoes' },
    },
  },
  shirts: {
    slug: 'shirts',
    eyebrow: 'Shirts',
    h1: "The first thing anyone reads about you, before you've said a word.",
    subhead:
      'Formal, casual, polo and beyond — cut for men who understand that the shirt does half the talking.',
    heroImage: shirtsCard?.image || '/hero/presidential-1600.webp',
    heroImageSm: shirtsCard?.imageSm || '/hero/presidential-800.webp',
    subTilesLayout: 'grid',
    showFabricFilter: true,
    editorialFallbackEyebrow: 'Shirts',
    editorialFallbackLine:
      "There's a difference between owning a shirt and being remembered for wearing it.",
    editorialFallbackCtas: [
      { label: 'Shop Formal Shirts', href: '/shop/shirts/formal-shirts' },
    ],
    completeLook: {
      eyebrow: 'Complete the Look',
      title: 'A sharp shirt deserves the right finish.',
      sources: ['chino', 'ties'],
      cta: { label: 'Shop chino & ties', href: '/shop/trousers/chino' },
    },
  },
  trousers: {
    slug: 'trousers',
    eyebrow: 'Trousers',
    h1: 'The details no one comments on are the ones they notice most.',
    subhead:
      'Chino, khaki, linen, denim and cargo — cut for men who know that fit is the whole argument.',
    heroImage: trousersCard?.image || '/hero/trousers-1600.webp',
    heroImageSm: trousersCard?.imageSm || '/hero/trousers-800.webp',
    subTilesLayout: 'grid',
    // No fabric filter — subcategories already encode fabric/construction
    showFabricFilter: false,
    editorialFallbackEyebrow: 'Trousers',
    editorialFallbackLine:
      "Fit is the one thing money can't fake, and the one thing everyone can see.",
    editorialFallbackCtas: [
      { label: 'Shop Chino', href: '/shop/trousers/chino' },
    ],
    completeLook: {
      eyebrow: 'Complete the Look',
      title: 'The right pair only works with the right pairing.',
      sources: ['formal-shirts', 'shirts-casual', 'casual', 'formal-shoes'],
      limit: 6,
      cta: { label: 'Shop shirts & shoes', href: '/shop/shirts' },
    },
  },
  jackets: {
    slug: 'jackets',
    eyebrow: 'Jackets & Outerwear',
    h1: 'Off-duty was never permission to look unfinished.',
    subhead:
      "Full jackets, half jackets and track tops — for the days the suit stays in the closet but the standard doesn't.",
    heroImage: jacketsCard?.image || '/hero/outerwear-1600.webp',
    heroImageSm: jacketsCard?.imageSm || '/hero/outerwear-800.webp',
    subTilesLayout: 'split',
    showFabricFilter: false,
    // Product grid + filters: native three only — never Blazers/Vests
    gridNativeSlugs: ['full-jackets', 'half-jackets', 'track-tops'],
    crossLinkHeading: 'Also Wearable as Outerwear',
    crossLinkTiles: [
      {
        name: 'Blazers',
        slug: 'blazers',
        href: '/shop/suits/blazers',
        tileImage: ph('blazers'),
      },
      {
        name: 'Waistcoats & Vests',
        slug: 'waistcoats',
        href: '/shop/suits/waistcoats',
        tileImage: ph('waistcoats'),
      },
    ],
    editorialFallbackEyebrow: 'Jackets & Outerwear',
    editorialFallbackLine:
      "The best outerwear doesn't announce itself. It just makes everything under it look intentional.",
    editorialFallbackCtas: [
      { label: 'Shop Half Jackets', href: '/shop/jackets/half-jackets' },
    ],
    completeLook: {
      eyebrow: 'Complete the Look',
      title: 'Layer it over something worth showing.',
      sources: ['formal-shirts', 'shirts-casual', 'chino', 'jeans'],
      cta: { label: 'Shop shirts & trousers', href: '/shop/shirts' },
    },
  },
  shoes: {
    slug: 'shoes',
    eyebrow: 'Shoes',
    h1: 'The last thing anyone notices is often the first thing that gives you away.',
    subhead:
      'Formal, bespoke, loafers and casual — built for men who understand that the details at the bottom carry the whole look.',
    heroImage: shoesCard?.image || '/hero/santoni-1600.webp',
    heroImageSm: shoesCard?.imageSm || '/hero/shoe-atelier-800.webp',
    subTilesLayout: 'grid',
    showFabricFilter: false,
    // Drop Bestselling when the view is Bespoke-only
    hideBestsellingWhenSubs: ['bespoke-formal'],
    editorialFallbackEyebrow: 'Shoes',
    editorialFallbackLine:
      'Some men buy shoes. Others buy the sound of the room going quiet when they walk in.',
    editorialFallbackCtas: [
      { label: 'Shop Formal', href: '/shop/shoes/formal-shoes' },
    ],
    completeLook: {
      eyebrow: 'Complete the Look',
      title: 'The right shoe deserves the right trouser.',
      sources: ['chino', 'two-piece', 'three-piece'],
      limit: 6,
      cta: { label: 'Shop trousers & suits', href: '/shop/trousers/chino' },
    },
  },
  accessories: {
    slug: 'accessories',
    eyebrow: 'Accessories',
    h1: 'The smallest thing in the outfit is the first thing a sharp man notices about another.',
    subhead:
      'Belts, ties, caps and hats — the details that finish what the rest of the outfit started.',
    heroImage: accessoriesCard?.image || '/hero/belts-1600.webp',
    heroImageSm: accessoriesCard?.imageSm || '/hero/belts-800.webp',
    subTilesLayout: 'grid',
    showFabricFilter: false,
    // Accessories: sub + color in bar; size only when Belts is in play
    showSubcategoryFilter: true,
    showColorFilter: true,
    sizeFilterWhenSubs: ['belts'],
    editorialFallbackEyebrow: 'Accessories',
    editorialFallbackLine:
      'The smallest thing in the outfit, and the first thing a sharp man notices about another sharp man.',
    editorialFallbackCtas: [
      { label: 'Shop Ties', href: '/shop/accessories/ties' },
    ],
    completeLook: {
      eyebrow: 'Complete the Look',
      title: 'Finished, not just dressed.',
      sources: ['formal-shirts', 'two-piece', 'three-piece'],
      limit: 4,
      compact: true,
      cta: { label: 'Shop shirts & suits', href: '/shop/shirts/formal-shirts' },
    },
  },
  'gift-sets': {
    slug: 'gift-sets',
    eyebrow: 'Gifting',
    h1: "Some gifts get worn once. This is the kind that gets remembered every time he reaches for it.",
    subhead: "Curated boxed sets — put together so you don't have to guess.",
    heroImage: giftSetsCard?.image || '/hero/polo-salon-1600.webp',
    heroImageSm: giftSetsCard?.imageSm || '/hero/polo-salon-800.webp',
    // No subcategory tiles — children empty; Section 3 skips
    subTilesLayout: 'grid',
    showFabricFilter: false,
    showSubcategoryFilter: false,
    showColorFilter: false,
    editorialFallbackEyebrow: 'Gifting',
    editorialFallbackLine:
      "The right gift doesn't need an explanation. It just needs to be right.",
    editorialFallbackCtas: [
      { label: 'Browse the sets', href: '#category-grid-continue' },
    ],
    // Self-referential nudge — bestsellers within Gift Sets, not outward upsell
    completeLook: {
      eyebrow: 'Not Sure Which Set?',
      title: "Still deciding? Here's what's going fast.",
      sources: ['gift-sets'],
      bestsellerOnly: true,
      limit: 5,
      cta: { label: 'See all gift sets', href: '/shop/gift-sets' },
    },
  },
};

export function getCategoryPageConfig(slug) {
  const key = slug === 'jackets-outerwear' ? 'jackets' : slug;
  return CATEGORY_PAGE_CONFIG[key] || null;
}

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', api: 'newest' },
  { id: 'price_asc', label: 'Price · low to high', api: 'price_asc' },
  { id: 'price_desc', label: 'Price · high to low', api: 'price_desc' },
  { id: 'bestselling', label: 'Bestselling', api: 'bestselling' },
];

export { FABRIC_OPTIONS };

/**
 * Editorial mid-grid insert index — roughly midpoint of the current set,
 * clamped into the 8–12 band for larger catalogs (CASA note from Jackets).
 */
export function getEditorialInsertAfter(productCount) {
  if (productCount <= 0) return 0;
  if (productCount <= 12) return Math.max(1, Math.ceil(productCount / 2));
  return 10;
}

/** @deprecated Prefer getEditorialInsertAfter(count) */
export const EDITORIAL_INSERT_AFTER = 8;
