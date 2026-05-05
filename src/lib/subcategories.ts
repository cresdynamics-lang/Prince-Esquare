import { CATALOG_TAXONOMY } from "@/lib/catalogTaxonomy";

function hasAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function canonicalizeSubcategory(
  categorySlug: string | null | undefined,
  value: string | null | undefined,
) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed || !categorySlug) return trimmed || null;

  const exact = getSubcategoriesForCategory(categorySlug).find(
    (subcategory) => subcategory.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exact) return exact;

  const text = trimmed.toLowerCase();
  if (categorySlug === "polo-t-shirts") {
    if (hasAny(text, ["knitted", "knit"])) return "Knitted Polos";
    if (hasAny(text, ["polo", "polos"])) return "Polos";
  }
  if (categorySlug === "shoes") {
    if (hasAny(text, ["formal"])) return "Formal shoes";
    if (hasAny(text, ["casual"])) return "Casual";
    if (hasAny(text, ["boot"])) return "Boots";
    if (hasAny(text, ["sandal"])) return "Sandals";
    if (hasAny(text, ["loafer"])) return "Loafers";
  }
  if (categorySlug === "shirts") {
    if (hasAny(text, ["formal", "dress"])) return "Formal shirts";
    if (hasAny(text, ["presidential"])) return "Presidential";
    if (hasAny(text, ["casual"])) return "Casual";
  }
  if (categorySlug === "suits") {
    if (hasAny(text, ["three", "3-piece", "three-piece"])) return "Three piece";
    if (hasAny(text, ["two", "2-piece", "two-piece"])) return "Two piece";
  }
  if (categorySlug === "jackets") {
    if (hasAny(text, ["denim"])) return "Denim Jackets";
    if (hasAny(text, ["half", "vest", "gilet"])) return "Half jackets";
    if (hasAny(text, ["jacket"])) return "Jackets";
  }
  if (categorySlug === "trousers") {
    if (hasAny(text, ["khaki"])) return "Khaki";
    if (hasAny(text, ["chino"])) return "Chino";
    if (hasAny(text, ["jean", "denim"])) return "Jeans";
    if (hasAny(text, ["gurkha"])) return "Gurkha";
    if (hasAny(text, ["formal"])) return "Formal";
  }
  if (categorySlug === "linen") {
    if (hasAny(text, ["set", "line set"])) return "Linen Set";
    if (hasAny(text, ["trouser", "pant"])) return "Linen Trousers";
    if (hasAny(text, ["shirt"])) return "Linen shirts";
    if (hasAny(text, ["short"])) return "Linen shorts";
  }
  if (categorySlug === "caps-hats") {
    if (hasAny(text, ["cap"])) return "Caps";
    if (hasAny(text, ["hat"])) return "Hats";
  }
  if (categorySlug === "belts-ties") {
    if (hasAny(text, ["belt"])) return "Belts";
    if (hasAny(text, ["tie"])) return "Ties";
  }
  if (categorySlug === "t-shirts") {
    if (hasAny(text, ["sweat-shirt", "sweatshirt"])) return "Sweat-shirts";
    if (hasAny(text, ["v-neck", "v neck"])) return "V-neck T-shirts";
    if (hasAny(text, ["round-neck", "round neck"])) return "Round-neck T-shirts";
  }

  return trimmed;
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
    if (hasAny(text, ["denim"])) return "Denim Jackets";
    return hasAny(text, ["half", "vest", "gilet"]) ? "Half jackets" : "Jackets";
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
  if (category === "caps-hats") {
    return hasAny(text, ["hat"]) ? "Hats" : "Caps";
  }
  if (category === "belts-ties") {
    return hasAny(text, ["tie"]) ? "Ties" : "Belts";
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
  const canonicalStored = canonicalizeSubcategory(categorySlug, stored);
  if (canonicalStored) return canonicalStored;
  return inferSubcategory(categorySlug, titleOrSlug);
}

