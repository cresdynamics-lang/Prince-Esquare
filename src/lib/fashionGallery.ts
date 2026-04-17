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

const CATEGORY_COPY: Record<string, CategoryCopy> = {
  shoes: {
    name: "Shoes",
    description: "Formal pairs, loafers, sneakers, and everyday leather options.",
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

export const fashionGalleryItems: FashionGalleryItem[] = (metadataModule?.images ?? []).map(
  (item) => ({
    id: item.newName,
    image: `/src/assets/fashions/${item.newName}`,
    category: item.category,
    categoryLabel: CATEGORY_COPY[item.category]?.name ?? titleCase(item.category),
    description: item.description,
    tags: item.tags,
  }),
);

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
