import { CATALOG_TAXONOMY, getCatalogGroupBySlug } from "@/lib/catalogTaxonomy";

export function defaultCarouselTitle(categoryName: string) {
  return `${categoryName} Collection`;
}

export function defaultCarouselDescription(categoryName: string) {
  const match = CATALOG_TAXONOMY.find(
    (group) => group.name.toLowerCase() === categoryName.toLowerCase(),
  );
  return (
    match?.description ??
    `Discover premium ${categoryName.toLowerCase()} styles curated for Nairobi gentlemen.`
  );
}

export function getCategorySubcategoryLinks(categorySlug: string) {
  return getCatalogGroupBySlug(categorySlug)?.subcategories ?? [];
}
