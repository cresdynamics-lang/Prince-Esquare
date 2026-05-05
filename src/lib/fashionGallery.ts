import {
  catalogAssets,
  getCatalogAssetsForCategory,
  getRepresentativeImageForCategory,
} from "@/lib/catalogAssets";
import { getCatalogGroupBySlug } from "@/lib/catalogTaxonomy";

export type FashionGalleryItem = {
  id: string;
  image: string;
  category: string;
  categoryLabel: string;
  description: string;
  tags: string[];
  subcategoryName?: string | null;
};

export const fashionGalleryItems: FashionGalleryItem[] = catalogAssets.map((asset) => ({
  id: asset.id,
  image: asset.image,
  category: asset.categorySlug,
  categoryLabel: asset.categoryName,
  description: asset.title,
  tags: asset.tags,
  subcategoryName: asset.subcategoryName,
}));

export function getFashionGalleryForSlug(slug: string) {
  return fashionGalleryItems.filter((item) => item.category === slug);
}

export function getFashionCategoryFallback(slug: string) {
  const group = getCatalogGroupBySlug(slug);
  const items = getCatalogAssetsForCategory(slug);
  if (!group || items.length === 0) return null;

  return {
    name: group.name,
    description: group.description,
    image_url: getRepresentativeImageForCategory(slug),
  };
}
