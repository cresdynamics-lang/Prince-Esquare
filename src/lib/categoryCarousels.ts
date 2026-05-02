import { CATALOG_TAXONOMY } from "@/lib/catalogTaxonomy";

export function defaultCarouselTitle(categoryName: string) {
  return `${categoryName} Collection`;
}

export function defaultCarouselDescription(categoryName: string) {
  return `Discover premium ${categoryName.toLowerCase()} styles curated for Nairobi gentlemen.`;
}

export function getCategorySubcategoryLinks(categorySlug: string) {
  return CATALOG_TAXONOMY.find((c) => c.slug === categorySlug)?.subcategories ?? [];
}
