import { CATALOG_TAXONOMY } from "@/lib/catalogTaxonomy";

function hasAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

export function getSubcategoriesForCategory(categorySlug: string) {
  return CATALOG_TAXONOMY.find((c) => c.slug === categorySlug)?.subcategories ?? [];
}

export function inferSubcategory(categorySlug: string | null | undefined, titleOrSlug: string) {
  const category = categorySlug ?? "";
  const text = titleOrSlug.toLowerCase();

  if (category === "polo-t-shirts") {
    return hasAny(text, ["knitted", "knit"]) ? "Knitted Polos" : "Polos";
  }
  if (category === "shoes") {
    if (hasAny(text, ["oxford", "derby", "formal"])) return "Formal shoes";
    if (hasAny(text, ["boot"])) return "Boots";
    if (hasAny(text, ["sandal"])) return "Sandals";
    if (hasAny(text, ["loafer"])) return "Loafers";
    return "Casual";
  }
  if (category === "shirts") {
    if (hasAny(text, ["presidential"])) return "Presidential";
    if (hasAny(text, ["formal", "dress"])) return "Formal shirts";
    return "Casual";
  }
  if (category === "suits") {
    return hasAny(text, ["three", "3-piece", "three-piece"]) ? "Three piece" : "Two piece";
  }
  if (category === "jackets") {
    return hasAny(text, ["half"]) ? "Half jackets" : "Jackets";
  }
  if (category === "trousers") {
    if (hasAny(text, ["khaki"])) return "Khaki";
    if (hasAny(text, ["chino"])) return "Chino";
    if (hasAny(text, ["jean", "denim"])) return "Jeans";
    if (hasAny(text, ["gurkha"])) return "Gurkha";
    return "Formal";
  }
  if (category === "linen") {
    if (hasAny(text, ["trouser", "pant"])) return "Linen Trousers";
    if (hasAny(text, ["shirt"])) return "Linen shirts";
    if (hasAny(text, ["short"])) return "Linen shorts";
    return "Linen Set";
  }
  if (category === "t-shirts") {
    if (hasAny(text, ["sweat-shirt", "sweatshirt"])) return "Sweat-shirts";
    if (hasAny(text, ["v-neck", "v neck"])) return "V-neck T-shirts";
    return "Round-neck T-shirts";
  }
  return null;
}

/** Prefer a stored DB label when present; otherwise infer from title/slug. */
export function resolveSubcategory(
  stored: string | null | undefined,
  categorySlug: string | null | undefined,
  titleOrSlug: string,
) {
  const trimmed = typeof stored === "string" ? stored.trim() : "";
  if (trimmed) return trimmed;
  return inferSubcategory(categorySlug, titleOrSlug);
}

