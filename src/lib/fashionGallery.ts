type FashionMetadataEntry = {
  originalName: string;
  newName: string;
  category: string;
  description: string;
  tags: string[];
};

type FashionMetadataFile = {
  images: FashionMetadataEntry[];
};

type CategoryCopy = {
  name: string;
  description: string;
};

const metadataModule = Object.values(
  import.meta.glob("../assets/fashions/image-metadata.json", {
    eager: true,
    import: "default",
  }),
)[0] as FashionMetadataFile | undefined;

const catalogImageModules = import.meta.glob("../assets/catalog/*/*.{jpg,jpeg,png,webp,jfif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CATEGORY_COPY: Record<string, CategoryCopy> = {
  shoes: {
    name: "Shoes",
    description: "Formal pairs, loafers, sneakers, and everyday leather options.",
  },
  suits: {
    name: "Suits",
    description: "Tailored suits for business, events, and premium formalwear.",
  },
  shirts: {
    name: "Shirts",
    description: "Dress shirts and casual button-downs from the current studio collection.",
  },
  jackets: {
    name: "Jackets",
    description: "Blazers, leather jackets, and layered outerwear for the modern gentleman.",
  },
  outfits: {
    name: "Outfits",
    description: "Complete looks styled from the Prince Esquare rails.",
  },
  casual: {
    name: "Casual",
    description: "Relaxed weekend looks, easy layers, and smart everyday pieces.",
  },
  formal: {
    name: "Formal",
    description: "Dress-ready layers, polished footwear, and refined business looks.",
  },
  trousers: {
    name: "Trousers",
    description: "Trouser-led looks and coordinated business-ready separates.",
  },
  "khaki-pants": {
    name: "Khaki Pants",
    description: "Khaki chinos and neutral pants for versatile styling.",
  },
  "track-suits": {
    name: "Track Suits",
    description: "Athletic-inspired matching sets with modern fits.",
  },
  belts: {
    name: "Belts",
    description: "Leather belts and buckle styles to complete each outfit.",
  },
  socks: {
    name: "Socks",
    description: "Comfort-focused socks for dress and everyday wear.",
  },
};

export type FashionGalleryItem = {
  id: string;
  image: string;
  category: string;
  categoryLabel: string;
  description: string;
  tags: string[];
};

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function hasTag(item: FashionGalleryItem, tags: string[]) {
  return item.tags.some((tag) => tags.includes(tag));
}

function normalizeCategory(category: string) {
  return category === "t-shirts" ? "shirts" : category;
}

const metadataItems: FashionGalleryItem[] = (metadataModule?.images ?? []).map(
  (item) => {
    const category = normalizeCategory(item.category);
    return {
      id: item.newName,
      image: `/src/assets/fashions/${item.newName}`,
      category,
      categoryLabel: CATEGORY_COPY[category]?.name ?? titleCase(category),
      description: item.description,
      tags: [category, ...item.tags.filter((tag) => tag !== "t-shirts")],
    };
  },
);

const catalogItems: FashionGalleryItem[] = Object.entries(catalogImageModules).map(([path]) => {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const category = normalizeCategory(parts[parts.length - 2] ?? "misc");
  const fileName = parts[parts.length - 1] ?? "";
  const descriptionBase = fileName.replace(/\.[^.]+$/, "").replace(/^[a-z-]+-/, "");
  const description = titleCase(descriptionBase.replace(/-/g, " "));
  const words = descriptionBase.split(/[-_\s]+/).filter(Boolean);
  return {
    id: fileName,
    image: `/src/assets/catalog/${category}/${fileName}`,
    category,
    categoryLabel: CATEGORY_COPY[category]?.name ?? titleCase(category),
    description,
    tags: [category, ...words],
  };
});

export const fashionGalleryItems: FashionGalleryItem[] = [
  ...metadataItems,
  ...catalogItems,
];

export function getFashionGalleryForSlug(slug: string): FashionGalleryItem[] {
  switch (slug) {
    case "casual":
      return fashionGalleryItems.filter((item) =>
        hasTag(item, ["casual", "everyday", "denim", "sneaker", "loafer"]),
      );
    case "formal":
      return fashionGalleryItems.filter((item) =>
        hasTag(item, ["formal", "business", "dress", "professional", "blazer", "premium"]),
      );
    case "trousers":
      return fashionGalleryItems.filter((item) =>
        hasTag(item, ["trouser", "trousers", "pant", "pants"]),
      );
    default:
      return fashionGalleryItems.filter(
        (item) => item.category === slug || item.tags.includes(slug),
      );
  }
}

export function getFashionCategoryFallback(slug: string) {
  const items = getFashionGalleryForSlug(slug);
  if (items.length === 0) return null;

  const categoryCopy = CATEGORY_COPY[slug];
  return {
    name: categoryCopy?.name ?? titleCase(slug),
    description:
      categoryCopy?.description ?? "Handpicked looks from the Prince Esquare studio collection.",
    image_url: items[0]?.image ?? null,
  };
}
