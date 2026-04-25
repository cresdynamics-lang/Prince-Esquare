/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ASSETS_ROOT = path.join(ROOT, "src", "assets");
const CATALOG_ROOT = path.join(ASSETS_ROOT, "catalog");
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".jfif"]);

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

const PRICE_RANGE_BY_CATEGORY = {
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
  sportswear: { min: 3500, max: 9000 },
  misc: { min: 3500, max: 9000 },
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
  return slugify(folderName);
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
    const baseSlug = slugify(fileName.replace(/\.[^.]+$/, ""));
    const slug = baseSlug.startsWith(`${categorySlug}-`) ? baseSlug : `${categorySlug}-${baseSlug}`;
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
    const categorySlug = slugify(categoryGuessRaw || "formal");
    products.push({
      slug: rootSlug,
      title: titleCaseFromSlug(rootSlug.replace(/^cat-/, "").replace(/^hero-/, "")),
      category_slug: categorySlug,
      image_url: `/src/assets/${entry.name}`,
      price: estimatePrice(categorySlug, rootSlug),
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
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  const adminEmail = "princeesquare@gmail.com";
  const adminPassword = "Prince@2026";

  if (!url || !key) {
    throw new Error("Missing Supabase URL or publishable key in .env");
  }

  const supabase = createClient(url, key);
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (loginError) {
    throw new Error(`Admin login failed: ${loginError.message}`);
  }

  const assetProducts = await collectAssetProducts();
  console.log(`Collected ${assetProducts.length} asset products from files.`);

  const neededCategorySlugs = Array.from(new Set(assetProducts.map((p) => p.category_slug))).filter(Boolean);
  const { data: existingCategories } = await supabase.from("categories").select("id,slug,name");
  const existingCategoryBySlug = new Map((existingCategories ?? []).map((c) => [c.slug, c]));

  const categoriesToInsert = neededCategorySlugs
    .filter((slug) => !existingCategoryBySlug.has(slug))
    .map((slug) => ({
      slug,
      name: titleCaseFromSlug(slug),
      description: null,
      image_url: null,
    }));

  if (categoriesToInsert.length > 0) {
    const { error } = await supabase.from("categories").insert(categoriesToInsert);
    if (error) {
      throw new Error(`Category insert failed: ${error.message}`);
    }
    console.log(`Inserted ${categoriesToInsert.length} missing categories.`);
  }

  const { data: freshCategories, error: freshCategoriesError } = await supabase
    .from("categories")
    .select("id,slug");
  if (freshCategoriesError) {
    throw new Error(`Category reload failed: ${freshCategoriesError.message}`);
  }
  const categoryIdBySlug = new Map((freshCategories ?? []).map((c) => [c.slug, c.id]));

  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("id,slug");
  if (existingProductsError) {
    throw new Error(`Product read failed: ${existingProductsError.message}`);
  }
  const existingProductSlugSet = new Set((existingProducts ?? []).map((p) => p.slug));

  const rowsToInsert = assetProducts
    .filter((p) => !existingProductSlugSet.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.title,
      category_id: categoryIdBySlug.get(p.category_slug) ?? null,
      price: p.price,
      sale_price: null,
      is_published: true,
      is_featured: false,
    }));

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("products").insert(rowsToInsert);
    if (error) {
      throw new Error(`Product insert failed: ${error.message}`);
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
  const { data: existingImages, error: existingImagesError } = await supabase
    .from("product_images")
    .select("product_id,image_url")
    .in("product_id", productIds);
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

  console.log(
    `Sync complete. New products: ${rowsToInsert.length}, new product images: ${imageRowsToInsert.length}.`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
