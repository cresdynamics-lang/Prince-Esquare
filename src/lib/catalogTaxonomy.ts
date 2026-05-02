export type CatalogGroup = {
  slug: string;
  name: string;
  subcategories: string[];
};

export const CATALOG_TAXONOMY: CatalogGroup[] = [
  { slug: "polo-t-shirts", name: "Polo T-shirts", subcategories: ["Knitted Polos", "Polos"] },
  {
    slug: "shoes",
    name: "Shoes",
    subcategories: ["Formal shoes", "Casual", "Boots", "Sandals", "Loafers"],
  },
  {
    slug: "shirts",
    name: "Shirts",
    subcategories: ["Formal shirts", "Casual", "Presidential"],
  },
  { slug: "suits", name: "Suits", subcategories: ["Two piece", "Three piece"] },
  { slug: "blazers", name: "Blazers", subcategories: [] },
  { slug: "track-suits", name: "Track Suits", subcategories: [] },
  { slug: "jackets", name: "Jackets", subcategories: ["Jackets", "Half jackets"] },
  {
    slug: "trousers",
    name: "Trousers",
    subcategories: ["Khaki", "Formal", "Chino", "Jeans", "Gurkha"],
  },
  {
    slug: "linen",
    name: "Linen",
    subcategories: ["Linen Set", "Linen Trousers", "Linen shirts", "Linen shorts"],
  },
  { slug: "caps-hats", name: "Caps & Hats", subcategories: [] },
  { slug: "belts-ties", name: "Belts & Ties", subcategories: [] },
  { slug: "sweaters", name: "Sweaters", subcategories: [] },
  {
    slug: "t-shirts",
    name: "T-shirts",
    subcategories: ["Sweat-shirts", "Round-neck T-shirts", "V-neck T-shirts"],
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
