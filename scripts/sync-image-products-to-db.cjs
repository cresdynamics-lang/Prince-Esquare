/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ASSETS_ROOT = path.join(ROOT, "src", "assets");
const CATALOG_ROOT = path.join(ASSETS_ROOT, "catalog");
const FASHIONS_ROOT = path.join(ASSETS_ROOT, "fashions");
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".jfif", ".webp", ".avif"]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hashSeed(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

const TARGET_CATEGORIES = [
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

const TARGET_CATEGORY_SLUG_SET = new Set(TARGET_CATEGORIES.map((c) => c.slug));

const PRICE_RANGE_BY_CATEGORY = {
  "polo-t-shirts": { min: 2200, max: 5200 },
  shoes: { min: 8500, max: 22000 },
  shirts: { min: 2500, max: 8500 },
  suits: { min: 15000, max: 55000 },
  blazers: { min: 10000, max: 30000 },
  "track-suits": { min: 5500, max: 18000 },
  jackets: { min: 7000, max: 28000 },
  trousers: { min: 3200, max: 12000 },
  linen: { min: 3800, max: 18000 },
  "caps-hats": { min: 900, max: 4500 },
  "belts-ties": { min: 1200, max: 6000 },
  sweaters: { min: 2500, max: 12000 },
  "t-shirts": { min: 1500, max: 6000 },
  misc: { min: 3000, max: 10000 },
};

function estimatePrice(category, slug) {
  const range = PRICE_RANGE_BY_CATEGORY[category] ?? { min: 5000, max: 10000 };
  const steps = Math.max(1, Math.floor((range.max - range.min) / 500));
  const stepIndex = hashSeed(slug) % (steps + 1);
  return range.min + stepIndex * 500;
}

async function readEnvFile(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeCatalogCategory(folderName) {
  const slug = slugify(folderName);
  if (TARGET_CATEGORY_SLUG_SET.has(slug)) return slug;
  if (slug.includes("shoe")) return "shoes";
  if (slug.includes("suit") && !slug.includes("track")) return "suits";
  if (slug.includes("track")) return "track-suits";
  if (slug.includes("shirt") && slug.includes("polo")) return "polo-t-shirts";
  if (slug.includes("shirt") && !slug.includes("t-shirt")) return "shirts";
  if (slug.includes("blazer")) return "blazers";
  if (slug.includes("jacket")) return "jackets";
  if (slug.includes("trouser") || slug.includes("jean") || slug.includes("chino") || slug.includes("khaki")) {
    return "trousers";
  }
  if (slug.includes("linen")) return "linen";
  if (slug.includes("cap") || slug.includes("hat")) return "caps-hats";
  if (slug.includes("belt") || slug.includes("tie")) return "belts-ties";
  if (slug.includes("sweater")) return "sweaters";
  if (slug.includes("t-shirt") || slug.includes("tee") || slug.includes("sweat-shirt")) return "t-shirts";
  return "shirts";
}

function inferCategoryFromText(text) {
  const t = String(text || "").toLowerCase();
  if (/(polo)/.test(t)) return "polo-t-shirts";
  if (/(shoe|loafer|oxford|boot|sandal)/.test(t)) return "shoes";
  if (/(three-piece|two-piece|wedding suit|suit)/.test(t) && !/(track)/.test(t)) return "suits";
  if (/(blazer)/.test(t)) return "blazers";
  if (/(track|jogger|athleisure)/.test(t)) return "track-suits";
  if (/(jacket|coat|bomber)/.test(t)) return "jackets";
  if (/(khaki|chino|jean|gurkha|trouser|pant)/.test(t)) return "trousers";
  if (/(linen)/.test(t)) return "linen";
  if (/(cap|hat)/.test(t)) return "caps-hats";
  if (/(belt|tie)/.test(t)) return "belts-ties";
  if (/(sweater|knitwear|cardigan|pullover)/.test(t)) return "sweaters";
  if (/(t-shirt|tee|sweat-shirt|round-neck|v-neck)/.test(t)) return "t-shirts";
  if (/(shirt|presidential)/.test(t)) return "shirts";
  return "shirts";
}

function productTitleFromFilename(fileName, categorySlug) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const cleaned = base
    .replace(new RegExp(`^${categorySlug}-`), "")
    .replace(/^cat-/, "")
    .replace(/^hero-/, "")
    .replace(/[-_]+/g, " ");
  const readable = cleaned.trim() ? cleaned : base;
  return titleCaseFromSlug(slugify(readable));
}

/** Unique slug per file on disk (same stem in .webp / .jfif / .avif was collapsing to one product). */
function uniqueSlugFromCatalogFile(categorySlug, fileName) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const ext = path.extname(fileName).toLowerCase().replace(/^\./, "");
  const baseSlug = slugify(`${stem}-${ext}`);
  return baseSlug.startsWith(`${categorySlug}-`) ? baseSlug : `${categorySlug}-${baseSlug}`;
}

/** Mirrors `inferSubcategory` in src/lib/subcategories.ts for DB grouping (shop / category filters). */
function inferSubcategoryFromAsset(categorySlug, slug, title) {
  const text = `${slug} ${title}`.toLowerCase();
  if (categorySlug === "polo-t-shirts") {
    return /knitted|knit/.test(text) ? "Knitted Polos" : "Polos";
  }
  if (categorySlug === "shoes") {
    if (/oxford|derby|formal/.test(text)) return "Formal shoes";
    if (/boot/.test(text)) return "Boots";
    if (/sandal/.test(text)) return "Sandals";
    if (/loafer/.test(text)) return "Loafers";
    return "Casual";
  }
  if (categorySlug === "shirts") {
    if (/presidential/.test(text)) return "Presidential";
    if (/formal|dress|chemise|oxford|button-down|button down/.test(text)) return "Formal shirts";
    return "Casual";
  }
  if (categorySlug === "suits") {
    return /three|3-piece|three-piece/.test(text) ? "Three piece" : "Two piece";
  }
  if (categorySlug === "jackets") {
    return /half/.test(text) ? "Half jackets" : "Jackets";
  }
  if (categorySlug === "trousers") {
    if (/khaki/.test(text)) return "Khaki";
    if (/chino/.test(text)) return "Chino";
    if (/jean|denim/.test(text)) return "Jeans";
    if (/gurkha/.test(text)) return "Gurkha";
    return "Formal";
  }
  if (categorySlug === "linen") {
    if (/trouser|pant/.test(text)) return "Linen Trousers";
    if (/shirt/.test(text)) return "Linen shirts";
    if (/short/.test(text)) return "Linen shorts";
    return "Linen Set";
  }
  if (categorySlug === "t-shirts") {
    if (/sweat-shirt|sweatshirt/.test(text)) return "Sweat-shirts";
    if (/v-neck|v neck/.test(text)) return "V-neck T-shirts";
    return "Round-neck T-shirts";
  }
  return null;
}

async function insertProductsSafe(supabase, rows) {
  const withSub = rows.map((r) => ({ ...r }));
  let { error } = await supabase.from("products").insert(withSub);
  if (error && String(error.message).toLowerCase().includes("subcategory")) {
    const stripped = withSub.map(({ subcategory: _omit, ...rest }) => rest);
    ({ error } = await supabase.from("products").insert(stripped));
  }
  return error;
}

async function readProductImagesByChunks(supabase, productIds, chunkSize = 200) {
  const all = [];
  for (let i = 0; i < productIds.length; i += chunkSize) {
    const chunk = productIds.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    const { data, error } = await supabase
      .from("product_images")
      .select("product_id,image_url")
      .in("product_id", chunk);
    if (error) return { data: null, error };
    all.push(...(data ?? []));
  }
  return { data: all, error: null };
}

async function collectAssetProducts() {
  const products = [];

  // Catalog assets: /src/assets/catalog/<category>/<file>
  const catalogFiles = await walk(CATALOG_ROOT);
  for (const absPath of catalogFiles) {
    const ext = path.extname(absPath).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    const rel = absPath.replace(/\\/g, "/");
    const categoryFolder = rel.split("/").slice(-2, -1)[0] ?? "misc";
    const fileName = path.basename(absPath);
    const categorySlug = normalizeCatalogCategory(categoryFolder);
    const slug = uniqueSlugFromCatalogFile(categorySlug, fileName);
    products.push({
      slug,
      title: productTitleFromFilename(fileName, categorySlug),
      category_slug: categorySlug,
      image_url: `/src/assets/catalog/${categoryFolder}/${fileName}`,
      price: estimatePrice(categorySlug, slug),
    });
  }

  // Root cat/hero images
  const rootFiles = await fs.readdir(ASSETS_ROOT, { withFileTypes: true });
  for (const entry of rootFiles) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    const base = entry.name.replace(/\.[^.]+$/, "");
    if (!base.startsWith("cat-") && !base.startsWith("hero-")) continue;

    const rootSlug = slugify(base);
    const categoryGuessRaw = base.startsWith("cat-") ? base.slice(4).split("-")[0] : "formal";
    const categorySlug = normalizeCatalogCategory(categoryGuessRaw || "formal");
    products.push({
      slug: rootSlug,
      title: titleCaseFromSlug(rootSlug.replace(/^cat-/, "").replace(/^hero-/, "")),
      category_slug: categorySlug,
      image_url: `/src/assets/${entry.name}`,
      price: estimatePrice(categorySlug, rootSlug),
    });
  }

  // Fashions assets: /src/assets/fashions/<file>
  const fashionFiles = await fs.readdir(FASHIONS_ROOT, { withFileTypes: true });
  for (const entry of fashionFiles) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    if (entry.name.toLowerCase().includes("metadata")) continue;

    const fileBase = entry.name.replace(/\.[^.]+$/, "");
    const extShort = path.extname(entry.name).toLowerCase().replace(/^\./, "");
    const slug = slugify(`${fileBase}-${extShort}`);
    const categoryGuess = slugify(fileBase).split("-")[0] || "misc";
    const categorySlug = normalizeCatalogCategory(categoryGuess);
    products.push({
      slug,
      title: productTitleFromFilename(entry.name, categorySlug),
      category_slug: categorySlug,
      image_url: `/src/assets/fashions/${entry.name}`,
      price: estimatePrice(categorySlug, slug),
    });
  }

  // de-dupe by slug
  const seen = new Set();
  return products.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

async function main() {
  const env = await readEnvFile(ENV_PATH);
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  const adminEmailCandidates = [
    env.ADMIN_SYNC_EMAIL,
    "princeesquire@gmail.com",
    "princeesquare@gmail.com",
  ].filter(Boolean);
  const adminPassword = env.ADMIN_SYNC_PASSWORD || "Prince@2026";

  if (!url || !key) {
    throw new Error("Missing Supabase URL or publishable key in .env");
  }

  const supabase = createClient(url, key);
  if (!serviceRoleKey) {
    let loginOk = false;
    let lastMessage = "Invalid login credentials";
    for (const email of adminEmailCandidates) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: adminPassword,
      });
      if (!loginError) {
        loginOk = true;
        break;
      }
      lastMessage = loginError.message || lastMessage;
    }
    if (!loginOk) {
      throw new Error(`Admin login failed: ${lastMessage}`);
    }
  }

  const assetProducts = await collectAssetProducts();
  console.log(`Collected ${assetProducts.length} asset products from files.`);

  const targetCategoryRows = TARGET_CATEGORIES.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    description:
      c.subcategories.length > 0
        ? `Subcategories: ${c.subcategories.join(", ")}`
        : `${c.name} collection`,
    display_order: i + 1,
    image_url: null,
  }));
  const { error: categoryUpsertError } = await supabase
    .from("categories")
    .upsert(targetCategoryRows, { onConflict: "slug" });
  if (categoryUpsertError) {
    throw new Error(`Category upsert failed: ${categoryUpsertError.message}`);
  }

  const { data: freshCategories, error: freshCategoriesError } = await supabase
    .from("categories")
    .select("id,slug");
  if (freshCategoriesError) {
    throw new Error(`Category reload failed: ${freshCategoriesError.message}`);
  }
  const categoryIdBySlug = new Map((freshCategories ?? []).map((c) => [c.slug, c.id]));

  const { data: existingProductsForRecategorize, error: recatReadError } = await supabase
    .from("products")
    .select("id,slug,title,description");
  if (recatReadError) {
    throw new Error(`Product recategorize read failed: ${recatReadError.message}`);
  }
  for (const product of existingProductsForRecategorize ?? []) {
    const categorySlug = inferCategoryFromText(
      `${product.slug || ""} ${product.title || ""} ${product.description || ""}`,
    );
    const categoryId = categoryIdBySlug.get(categorySlug) ?? categoryIdBySlug.get("shirts") ?? null;
    const { error: recatError } = await supabase
      .from("products")
      .update({ category_id: categoryId })
      .eq("id", product.id);
    if (recatError) {
      throw new Error(`Product recategorize failed: ${recatError.message}`);
    }
  }

  const staleCategories = (freshCategories ?? [])
    .map((c) => c.slug)
    .filter((slug) => !TARGET_CATEGORY_SLUG_SET.has(slug));
  if (staleCategories.length > 0) {
    const { error: staleDeleteError } = await supabase
      .from("categories")
      .delete()
      .in("slug", staleCategories);
    if (staleDeleteError) {
      throw new Error(`Old category delete failed: ${staleDeleteError.message}`);
    }
  }

  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("id,slug");
  if (existingProductsError) {
    throw new Error(`Product read failed: ${existingProductsError.message}`);
  }
  const existingProductSlugSet = new Set((existingProducts ?? []).map((p) => p.slug));

  const rowsToInsert = assetProducts
    .filter((p) => !existingProductSlugSet.has(p.slug))
    .map((p) => {
      const categorySlug =
        inferCategoryFromText(`${p.slug} ${p.title} ${p.category_slug}`) || p.category_slug;
      const subcategory = inferSubcategoryFromAsset(categorySlug, p.slug, p.title);
      return {
        slug: p.slug,
        title: p.title,
        description: p.title,
        category_id: categoryIdBySlug.get(categorySlug) ?? null,
        subcategory,
        price: p.price || estimatePrice(categorySlug, p.slug),
        sale_price: null,
        is_published: true,
        is_featured: false,
      };
    });

  if (rowsToInsert.length > 0) {
    const insertError = await insertProductsSafe(supabase, rowsToInsert);
    if (insertError) {
      throw new Error(`Product insert failed: ${insertError.message}`);
    }
  }

  const { data: allProducts, error: allProductsError } = await supabase
    .from("products")
    .select("id,slug");
  if (allProductsError) {
    throw new Error(`Product reload failed: ${allProductsError.message}`);
  }
  const productIdBySlug = new Map((allProducts ?? []).map((p) => [p.slug, p.id]));

  const productIds = assetProducts
    .map((p) => productIdBySlug.get(p.slug))
    .filter(Boolean);
  const { data: existingImages, error: existingImagesError } = await readProductImagesByChunks(
    supabase,
    productIds,
  );
  if (existingImagesError) {
    throw new Error(`Product image read failed: ${existingImagesError.message}`);
  }
  const existingImageKeySet = new Set((existingImages ?? []).map((img) => `${img.product_id}::${img.image_url}`));

  const imageRowsToInsert = [];
  for (const product of assetProducts) {
    const productId = productIdBySlug.get(product.slug);
    if (!productId) continue;
    const keyRow = `${productId}::${product.image_url}`;
    if (existingImageKeySet.has(keyRow)) continue;
    imageRowsToInsert.push({
      product_id: productId,
      image_url: product.image_url,
      display_order: 0,
    });
  }

  if (imageRowsToInsert.length > 0) {
    const { error } = await supabase.from("product_images").insert(imageRowsToInsert);
    if (error) {
      throw new Error(`Product image insert failed: ${error.message}`);
    }
  }

  const { data: variantsRead, error: variantsReadError } = await supabase
    .from("product_variants")
    .select("id,product_id");
  if (variantsReadError) {
    throw new Error(`Variant read failed: ${variantsReadError.message}`);
  }
  const productIdsWithVariants = new Set((variantsRead ?? []).map((v) => v.product_id));
  const { data: productsForVariants, error: productsForVariantsError } = await supabase
    .from("products")
    .select("id,slug,title,category_id,categories(slug)");
  if (productsForVariantsError) {
    throw new Error(`Product list for variants failed: ${productsForVariantsError.message}`);
  }
  const variantRows = [];
  const seenVariantSkus = new Set();
  for (const p of productsForVariants ?? []) {
    if (productIdsWithVariants.has(p.id)) continue;
    const categorySlug =
      p.categories?.slug || inferCategoryFromText(`${p.slug || ""} ${p.title || ""}`) || "shirts";
    const sizeOptions =
      categorySlug === "shoes"
        ? ["40", "41", "42", "43", "44"]
        : categorySlug === "caps-hats" || categorySlug === "belts-ties"
          ? ["One Size"]
          : ["S", "M", "L", "XL"];
    const colorOptions = ["Black", "Navy", "Brown"];
    for (const size of sizeOptions.slice(0, 3)) {
      const sku = `${(p.slug || "item").slice(0, 20).toUpperCase()}-${size.replace(/\s+/g, "")}`;
      if (seenVariantSkus.has(sku)) continue;
      seenVariantSkus.add(sku);
      variantRows.push({
        product_id: p.id,
        size,
        color: colorOptions[sizeOptions.indexOf(size) % colorOptions.length],
        sku,
        stock_quantity: 5,
      });
    }
  }
  if (variantRows.length > 0) {
    const { error: variantInsertError } = await supabase
      .from("product_variants")
      .upsert(variantRows, { onConflict: "sku" });
    if (variantInsertError) {
      throw new Error(`Variant upsert failed: ${variantInsertError.message}`);
    }
  }

  console.log(
    `Sync complete. New products: ${rowsToInsert.length}, new product images: ${imageRowsToInsert.length}, new default variants: ${variantRows.length}.`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
