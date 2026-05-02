import type { ProductCardData } from "@/components/site/ProductCard";
import { fashionGalleryItems, getFashionGalleryForSlug } from "@/lib/fashionGallery";

/**
 * URL slug aligned with `scripts/sync-image-products-to-db.cjs`: stem + extension token so
 * the same image in `.webp` / `.jfif` / `.avif` does not collapse to one product.
 */
export function fashionSlugFromFilename(newName: string): string {
  const stem = newName.replace(/\.[^.]+$/i, "");
  const ext = (newName.match(/\.([^.]+)$/i)?.[1] ?? "").toLowerCase();
  const combined = ext ? `${stem}-${ext}` : stem;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PRICE_RANGE_BY_CATEGORY: Record<string, { min: number; max: number }> = {
  shoes: { min: 10000, max: 18000 },
  suits: { min: 18000, max: 45000 },
  shirts: { min: 3000, max: 6000 },
  "t-shirts": { min: 1500, max: 3500 },
  jackets: { min: 8000, max: 15000 },
  outfits: { min: 12000, max: 22000 },
  casual: { min: 4500, max: 9000 },
  formal: { min: 10000, max: 20000 },
  trousers: { min: 4000, max: 8000 },
  "khaki-pants": { min: 4500, max: 9000 },
  "track-suits": { min: 6000, max: 14000 },
  belts: { min: 1500, max: 4500 },
  socks: { min: 500, max: 1800 },
};

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function estimateFashionPrice(category: string, slug: string): number {
  const range = PRICE_RANGE_BY_CATEGORY[category] ?? { min: 5000, max: 10000 };
  const steps = Math.max(1, Math.floor((range.max - range.min) / 500));
  const stepIndex = hashSeed(slug) % (steps + 1);
  return range.min + stepIndex * 500;
}

const staticAssetProducts: ProductCardData[] = [
  {
    id: "asset:cat-suits",
    slug: "cat-suits",
    title: "Tailored Suits Collection",
    price: estimateFashionPrice("formal", "cat-suits"),
    sale_price: null,
    image: "/src/assets/cat-suits.jpg",
    category_name: "Suits",
    category_slug: "suits",
  },
  {
    id: "asset:cat-shirts",
    slug: "cat-shirts",
    title: "Premium Shirts Collection",
    price: estimateFashionPrice("shirts", "cat-shirts"),
    sale_price: null,
    image: "/src/assets/cat-shirts.jpg",
    category_name: "Shirts",
    category_slug: "shirts",
  },
  {
    id: "asset:cat-trousers",
    slug: "cat-trousers",
    title: "Smart Trousers Collection",
    price: estimateFashionPrice("trousers", "cat-trousers"),
    sale_price: null,
    image: "/src/assets/cat-trousers.jpg",
    category_name: "Trousers",
    category_slug: "trousers",
  },
  {
    id: "asset:cat-shoes",
    slug: "cat-shoes",
    title: "Leather Shoes Collection",
    price: estimateFashionPrice("shoes", "cat-shoes"),
    sale_price: null,
    image: "/src/assets/cat-shoes.jpg",
    category_name: "Shoes",
    category_slug: "shoes",
  },
  {
    id: "asset:cat-belts",
    slug: "cat-belts",
    title: "Belts Collection",
    price: estimateFashionPrice("formal", "cat-belts"),
    sale_price: null,
    image: "/src/assets/cat-belts.jpg",
    category_name: "Belts",
    category_slug: "belts",
  },
  {
    id: "asset:cat-socks",
    slug: "cat-socks",
    title: "Socks Collection",
    price: estimateFashionPrice("casual", "cat-socks"),
    sale_price: null,
    image: "/src/assets/cat-socks.jpg",
    category_name: "Socks",
    category_slug: "socks",
  },
  {
    id: "asset:cat-casual",
    slug: "cat-casual",
    title: "Casual Collection",
    price: estimateFashionPrice("casual", "cat-casual"),
    sale_price: null,
    image: "/src/assets/cat-casual.jpg",
    category_name: "Casual",
    category_slug: "casual",
  },
  {
    id: "asset:cat-formal",
    slug: "cat-formal",
    title: "Formal Collection",
    price: estimateFashionPrice("formal", "cat-formal"),
    sale_price: null,
    image: "/src/assets/cat-formal.jpg",
    category_name: "Formal",
    category_slug: "formal",
  },
  {
    id: "asset:cat-sportswear",
    slug: "cat-sportswear",
    title: "Sportswear Collection",
    price: estimateFashionPrice("casual", "cat-sportswear"),
    sale_price: null,
    image: "/src/assets/cat-sportswear.jpg",
    category_name: "Sportswear",
    category_slug: "sportswear",
  },
  {
    id: "asset:hero-suit",
    slug: "hero-suit",
    title: "Signature Hero Suit Look",
    price: estimateFashionPrice("formal", "hero-suit"),
    sale_price: null,
    image: "/src/assets/hero-suit.jpg",
    category_name: "Formal",
    category_slug: "formal",
  },
];

/** Every image in `src/assets/fashions` (via metadata) as a shop product card. */
export function fashionProductsAsCards(): ProductCardData[] {
  const fromFashions = fashionGalleryItems.map((item) => {
    const slug = fashionSlugFromFilename(item.id);
    return {
      id: `fashion:${slug}`,
      slug,
      title: item.description,
      price: estimateFashionPrice(item.category, slug),
      sale_price: null,
      image: item.image,
      category_name: item.categoryLabel,
      category_slug: item.category,
    };
  });
  return dedupeProductsBySlugPreferOrder([...fromFashions, ...staticAssetProducts]);
}

/** Products from the fashions folder that belong on a category collection page. */
export function fashionProductsForCategorySlug(pageSlug: string): ProductCardData[] {
  const fromFashions = getFashionGalleryForSlug(pageSlug).map((item) => {
    const slug = fashionSlugFromFilename(item.id);
    return {
      id: `fashion:${slug}`,
      slug,
      title: item.description,
      price: estimateFashionPrice(item.category, slug),
      sale_price: null,
      image: item.image,
      category_name: item.categoryLabel,
      category_slug: item.category,
    };
  });
  const fromStaticAssets = staticAssetProducts.filter((p) => p.category_slug === pageSlug);
  return dedupeProductsBySlugPreferOrder([...fromFashions, ...fromStaticAssets]);
}

export type FashionProductDetail = {
  kind: "fashion";
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  categorySlug: string;
  categoryName: string;
};

export function getFashionProductBySlug(slug: string): FashionProductDetail | null {
  const item = fashionGalleryItems.find((i) => fashionSlugFromFilename(i.id) === slug);
  if (item) {
    const s = fashionSlugFromFilename(item.id);
    return {
      kind: "fashion",
      id: `fashion:${s}`,
      slug: s,
      title: item.description,
      description: item.description,
      image: item.image,
      categorySlug: item.category,
      categoryName: item.categoryLabel,
    };
  }

  const staticProduct = staticAssetProducts.find((p) => p.slug === slug);
  if (!staticProduct) return null;
  return {
    kind: "fashion",
    id: staticProduct.id,
    slug: staticProduct.slug,
    title: staticProduct.title,
    description: staticProduct.title,
    image: staticProduct.image ?? "/src/assets/cat-suits.jpg",
    categorySlug: staticProduct.category_slug ?? "formal",
    categoryName: staticProduct.category_name ?? "Collection",
  };
}

/** First occurrence wins; later rows with the same `slug` are skipped (DB can shadow fashions). */
export function dedupeProductsBySlugPreferOrder(products: ProductCardData[]): ProductCardData[] {
  const seen = new Set<string>();
  const out: ProductCardData[] = [];
  for (const p of products) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push(p);
  }
  return out;
}
