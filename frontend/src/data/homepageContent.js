/**
 * Homepage editorial content — Prince Esquire display spec.
 * Collection CTAs use /shop/... canonical paths.
 */

export const BRAND_TAGLINE = "The Man's Shop";
export const BRAND_LOCATION = 'Yala Towers, Nairobi';

/** Section 2 — single full-bleed hero (no carousel). */
export const HOME_HERO = {
  title: 'Some men dress for the room. You dress for the entrance.',
  subhead:
    "Curated suits, shoes and tailoring for men who've stopped asking permission to stand out.",
  primaryCta: { label: 'Shop New Arrivals', href: '/new-arrivals' },
  secondaryCta: { label: 'Explore the Collection', href: '#shop-by-category' },
  image: '/hero/entrance-1600.jpg',
  imageSm: '/hero/entrance-800.jpg',
};

/**
 * Section 3 — Shop by Category (3×3 grid).
 * Suits moved off lead; Track Suits closes as card 9.
 */
export const HOME_CATEGORY_CARDS = [
  {
    name: 'Shirts',
    href: '/shop/shirts',
    image: '/models/categories/shirts.jpg',
    imageSm: '/models/categories/shirts.jpg',
  },
  {
    name: 'Shoes',
    href: '/shop/shoes',
    image: '/models/categories/shoes.jpg',
    imageSm: '/models/categories/shoes.jpg',
  },
  {
    name: 'Trousers',
    href: '/shop/trousers',
    image: '/models/categories/jeans.jpg',
    imageSm: '/models/categories/jeans.jpg',
  },
  {
    name: 'Suits',
    href: '/shop/suits',
    image: '/models/categories/suits.jpg',
    imageSm: '/models/categories/suits.jpg',
  },
  {
    name: 'Jackets & Outerwear',
    href: '/shop/jackets',
    image: '/models/categories/jackets.jpg',
    imageSm: '/models/categories/jackets.jpg',
  },
  {
    name: 'Accessories',
    href: '/shop/accessories',
    image: '/hero/belts-1600.webp',
    imageSm: '/hero/belts-800.webp',
  },
  {
    name: 'The Linen Edit',
    href: '/shop/linen-edit',
    image: '/hero/linen-1600.webp',
    imageSm: '/hero/linen-800.webp',
  },
  {
    name: 'Gift Sets & Boxes',
    href: '/shop/gift-sets',
    image: '/hero/polo-salon-1600.webp',
    imageSm: '/hero/polo-salon-800.webp',
  },
  {
    name: 'Track Suits',
    href: '/shop/jackets/track-tops',
    image: '/hero/tracksuits-1600.webp',
    imageSm: '/hero/tracksuits-800.webp',
  },
];

/** Fallback editorial captions when product has no focus_description. */
export const EDITORIAL_CAPTIONS = {
  presidential_pick: 'The piece we would put our name on without a second thought.',
  editors_choice: "Chosen for the man who already knows what he's looking for.",
  default: 'A handful of pieces we would put our name on.',
};

export const HOME_BESPOKE = {
  eyebrow: 'Made to You',
  title: 'Not off the rack. Made for your foot.',
  bodyTemplate:
    "Bespoke formal shoes are built to order — expect {weeks} weeks from fitting to delivery. This is the tier for men who've stopped accepting \"close enough.\"",
  cta: { label: 'Start a Bespoke Order', href: '/shop/shoes/bespoke-formal' },
  defaultLeadDays: 14,
};

export const HOME_LINEN_BANNER = {
  eyebrow: 'Season Edit',
  title: "Nairobi heat doesn't have to mean compromise.",
  cta: { label: 'Shop the Linen Edit', href: '/shop/linen-edit' },
  image: '/hero/linen-1600.webp',
  imageSm: '/hero/linen-800.webp',
};

export const HOME_GIFT_BANNER = {
  eyebrow: 'Gifting',
  title: 'Some gifts get worn once. This is the kind that gets remembered.',
  cta: { label: 'Shop Gift Sets', href: '/shop/gift-sets' },
  image: '/hero/polo-salon-1600.webp',
  imageSm: '/hero/polo-salon-800.webp',
};

export const HOME_SIGNUP = {
  title: 'The next drop lands before it\'s public.',
  body: 'Join The Prince Esquire List and see every new arrival first.',
  cta: 'Join The List',
};

/** @deprecated Prefer HOME_CATEGORY_CARDS — kept for any legacy imports. */
export const CATEGORY_TILES = HOME_CATEGORY_CARDS.map((c) => ({
  title: c.name,
  subtitle: 'Shop Collection',
  image: c.imageSm || c.image,
  span: 'md:col-span-1 md:row-span-1',
  category: c.href.replace(/^\/shop\//, '').split('/')[0],
  path: c.href,
}));
