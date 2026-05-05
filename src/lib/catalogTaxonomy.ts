export type CatalogGroup = {
  slug: string;
  name: string;
  subcategories: string[];
  description: string;
  heroTitle: string;
  heroBody: string;
};

export const CATALOG_TAXONOMY: CatalogGroup[] = [
  {
    slug: "polo-t-shirts",
    name: "Polo T-shirts",
    subcategories: ["Knitted Polos", "Polos"],
    description:
      "Smart polos in clean everyday fits, from textured knitted options to classic pique essentials.",
    heroTitle: "Polos That Keep Smart Style Easy",
    heroBody:
      "Explore knitted polos and classic polo shirts built for refined casual dressing, travel, and polished weekend looks.",
  },
  {
    slug: "shoes",
    name: "Shoes",
    subcategories: ["Formal shoes", "Casual", "Boots", "Sandals", "Loafers"],
    description:
      "Formal shoes, loafers, boots, sandals, and casual pairs chosen to finish every outfit with confidence.",
    heroTitle: "Footwear Built For Sharp First Impressions",
    heroBody:
      "From polished formal shoes to relaxed loafers and everyday casual pairs, this edit covers every smart step.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    subcategories: ["Formal shirts", "Casual", "Presidential"],
    description:
      "Formal, casual, and presidential shirts selected for clean tailoring, easy layering, and all-day comfort.",
    heroTitle: "Shirts That Carry The Whole Look",
    heroBody:
      "Discover crisp formal shirts, easy casual options, and presidential statement pieces for office, events, and after-hours plans.",
  },
  {
    slug: "suits",
    name: "Suits",
    subcategories: ["Two piece", "Three piece"],
    description:
      "Tailored two-piece and three-piece suits for weddings, business dressing, and premium formal moments.",
    heroTitle: "Tailored Suits For Every Big Occasion",
    heroBody:
      "Shop sharp two-piece and three-piece suits made for weddings, corporate polish, celebrations, and elevated evening wear.",
  },
  {
    slug: "blazers",
    name: "Blazers",
    subcategories: [],
    description:
      "Structured blazers that add instant refinement to trousers, denim, and dressed-up off-duty looks.",
    heroTitle: "Blazers That Instantly Elevate A Look",
    heroBody:
      "Layer up with sharp blazers designed for smart-casual dressing, dinner plans, meetings, and standout polished style.",
  },
  {
    slug: "track-suits",
    name: "Track Suits",
    subcategories: [],
    description:
      "Matching track suits and athleisure sets that combine comfort, movement, and a clean modern profile.",
    heroTitle: "Track Suits With A Cleaner Finish",
    heroBody:
      "Comfort-first sets designed for travel, active days, easy layering, and relaxed style that still looks put together.",
  },
  {
    slug: "jackets",
    name: "Jackets",
    subcategories: ["Jackets", "Denim Jackets", "Half jackets"],
    description:
      "Outerwear edits spanning everyday jackets, denim layers, and half jackets for cooler days and smarter layering.",
    heroTitle: "Layering Pieces That Hold Their Shape",
    heroBody:
      "Browse clean-cut jackets, rugged denim layers, and half jackets built for transitional weather and versatile styling.",
  },
  {
    slug: "trousers",
    name: "Trousers",
    subcategories: ["Khaki", "Formal", "Chino", "Jeans", "Gurkha"],
    description:
      "Khaki, formal, chino, denim, and gurkha trousers tailored for daily wear, office polish, and sharper casual outfits.",
    heroTitle: "Trousers That Keep The Fit Clean",
    heroBody:
      "From formal pairs to denim, khaki, and gurkha styles, these trousers are built for balance, comfort, and repeat wear.",
  },
  {
    slug: "linen",
    name: "Linen",
    subcategories: ["Linen Set", "Linen Trousers", "Linen shirts", "Linen shorts"],
    description:
      "Breathable linen sets, trousers, shirts, and shorts made for warm weather and effortless refinement.",
    heroTitle: "Linen For Warm Days And Light Dressing",
    heroBody:
      "Explore breathable linen pieces designed for holidays, sunny city days, relaxed events, and easy polished comfort.",
  },
  {
    slug: "caps-hats",
    name: "Caps & Hats",
    subcategories: ["Caps", "Hats"],
    description:
      "Caps and hats that add texture, shade, and personality to casual and elevated everyday outfits.",
    heroTitle: "Headwear That Finishes The Outfit",
    heroBody:
      "Choose from clean caps and statement hats designed to sharpen weekend dressing, travel fits, and relaxed city looks.",
  },
  {
    slug: "belts-ties",
    name: "Belts & Ties",
    subcategories: ["Belts", "Ties"],
    description:
      "Belts and ties selected to sharpen suiting, smart-casual looks, and everyday finishing details.",
    heroTitle: "Accessories That Pull Everything Together",
    heroBody:
      "Shop polished belts and ties that add structure, colour, and a finished look to formalwear and smart everyday dressing.",
  },
  {
    slug: "socks",
    name: "Socks",
    subcategories: [],
    description:
      "Comfort-led socks for daily wear, office dressing, and the finishing detail that keeps smarter looks complete.",
    heroTitle: "The Small Essential That Matters Daily",
    heroBody:
      "Discover socks chosen for comfort, reliable wear, and easy pairing with business, casual, and occasion outfits.",
  },
  {
    slug: "sweaters",
    name: "Sweaters",
    subcategories: [],
    description:
      "Sweaters and knitwear built for warmth, texture, and dependable layering through cooler mornings and evenings.",
    heroTitle: "Knitwear With Warmth And Structure",
    heroBody:
      "Layer into sweaters that feel soft, look clean, and work across office dressing, travel, and off-duty wardrobes.",
  },
  {
    slug: "t-shirts",
    name: "T-shirts",
    subcategories: ["Sweat-shirts", "Round-neck T-shirts", "V-neck T-shirts"],
    description:
      "Round-neck, V-neck, and sweat-shirt styles for easy everyday dressing with a cleaner menswear edge.",
    heroTitle: "T-Shirts That Still Feel Considered",
    heroBody:
      "Browse everyday tees and sweat-shirts designed for layering, comfort, and casual outfits that stay sharp.",
  },
];

export const PRIMARY_NAV_CATEGORY_SLUGS = [
  "shoes",
  "shirts",
  "suits",
  "trousers",
  "track-suits",
] as const;

export const ALLOWED_CATEGORY_SLUGS = new Set(CATALOG_TAXONOMY.map((item) => item.slug));

export function getCatalogGroupBySlug(slug: string) {
  return CATALOG_TAXONOMY.find((item) => item.slug === slug) ?? null;
}
