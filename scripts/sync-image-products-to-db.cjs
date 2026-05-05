/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const {
  buildProductDescription,
  inferCategorySlugFromText,
  titleCase,
} = require("./lib/product-copy.cjs");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ASSETS_ROOT = path.join(ROOT, "src", "assets");
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".jfif", ".webp", ".avif"]);
const EXCLUDED_TOP_LEVEL_DIRS = new Set(["catalog", "fashions"]);
const EXCLUDED_SEGMENTS = ["_files"];
const GENERIC_FILE_PATTERNS = [
  /^download(?:\s*\(\d+\))?$/i,
  /^oip(?:\s*\(\d+\))?$/i,
  /^image(?:\s*\(\d+\))?$/i,
  /^item$/i,
  /^th(?:\(\d+\))?$/i,
];

const TARGET_CATEGORIES = [
  {
    slug: "polo-t-shirts",
    name: "Polo T-shirts",
    subcategories: ["Knitted Polos", "Polos"],
    description:
      "Smart polos in clean everyday fits, from textured knitted options to classic pique essentials.",
    heroTitle: "Polos That Keep Smart Style Easy",
    heroBody:
      "Explore knitted polos and classic polo shirts built for refined casual dressing, travel, and polished weekend looks.",
  },
  {
    slug: "shoes",
    name: "Shoes",
    subcategories: ["Formal shoes", "Casual", "Boots", "Sandals", "Loafers"],
    description:
      "Formal shoes, loafers, boots, sandals, and casual pairs chosen to finish every outfit with confidence.",
    heroTitle: "Footwear Built For Sharp First Impressions",
    heroBody:
      "From polished formal shoes to relaxed loafers and everyday casual pairs, this edit covers every smart step.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    subcategories: ["Formal shirts", "Casual", "Presidential"],
    description:
      "Formal, casual, and presidential shirts selected for clean tailoring, easy layering, and all-day comfort.",
    heroTitle: "Shirts That Carry The Whole Look",
    heroBody:
      "Discover crisp formal shirts, easy casual options, and presidential statement pieces for office, events, and after-hours plans.",
  },
  {
    slug: "suits",
    name: "Suits",
    subcategories: ["Two piece", "Three piece"],
    description:
      "Tailored two-piece and three-piece suits for weddings, business dressing, and premium formal moments.",
    heroTitle: "Tailored Suits For Every Big Occasion",
    heroBody:
      "Shop sharp two-piece and three-piece suits made for weddings, corporate polish, celebrations, and elevated evening wear.",
  },
  {
    slug: "blazers",
    name: "Blazers",
    subcategories: [],
    description:
      "Structured blazers that add instant refinement to trousers, denim, and dressed-up off-duty looks.",
    heroTitle: "Blazers That Instantly Elevate A Look",
    heroBody:
      "Layer up with sharp blazers designed for smart-casual dressing, dinner plans, meetings, and standout polished style.",
  },
  {
    slug: "track-suits",
    name: "Track Suits",
    subcategories: [],
    description:
      "Matching track suits and athleisure sets that combine comfort, movement, and a clean modern profile.",
    heroTitle: "Track Suits With A Cleaner Finish",
    heroBody:
      "Comfort-first sets designed for travel, active days, easy layering, and relaxed style that still looks put together.",
  },
  {
    slug: "jackets",
    name: "Jackets",
    subcategories: ["Jackets", "Denim Jackets", "Half jackets"],
    description:
      "Outerwear edits spanning everyday jackets, denim layers, and half jackets for cooler days and smarter layering.",
    heroTitle: "Layering Pieces That Hold Their Shape",
    heroBody:
      "Browse clean-cut jackets, rugged denim layers, and half jackets built for transitional weather and versatile styling.",
  },
  {
    slug: "trousers",
    name: "Trousers",
    subcategories: ["Khaki", "Formal", "Chino", "Jeans", "Gurkha"],
    description:
      "Khaki, formal, chino, denim, and gurkha trousers tailored for daily wear, office polish, and sharper casual outfits.",
    heroTitle: "Trousers That Keep The Fit Clean",
    heroBody:
      "From formal pairs to denim, khaki, and gurkha styles, these trousers are built for balance, comfort, and repeat wear.",
  },
  {
    slug: "linen",
    name: "Linen",
    subcategories: ["Linen Set", "Linen Trousers", "Linen shirts", "Linen shorts"],
    description:
      "Breathable linen sets, trousers, shirts, and shorts made for warm weather and effortless refinement.",
    heroTitle: "Linen For Warm Days And Light Dressing",
    heroBody:
      "Explore breathable linen pieces designed for holidays, sunny city days, relaxed events, and easy polished comfort.",
  },
  {
    slug: "caps-hats",
    name: "Caps & Hats",
    subcategories: ["Caps", "Hats"],
    description:
      "Caps and hats that add texture, shade, and personality to casual and elevated everyday outfits.",
    heroTitle: "Headwear That Finishes The Outfit",
    heroBody:
      "Choose from clean caps and statement hats designed to sharpen weekend dressing, travel fits, and relaxed city looks.",
  },
  {
    slug: "belts-ties",
    name: "Belts & Ties",
    subcategories: ["Belts", "Ties"],
    description:
      "Belts and ties selected to sharpen suiting, smart-casual looks, and everyday finishing details.",
    heroTitle: "Accessories That Pull Everything Together",
    heroBody:
      "Shop polished belts and ties that add structure, colour, and a finished look to formalwear and smart everyday dressing.",
  },
  {
    slug: "socks",
    name: "Socks",
    subcategories: [],
    description:
      "Comfort-led socks for daily wear, office dressing, and the finishing detail that keeps smarter looks complete.",
    heroTitle: "The Small Essential That Matters Daily",
    heroBody:
      "Discover socks chosen for comfort, reliable wear, and easy pairing with business, casual, and occasion outfits.",
  },
  {
    slug: "sweaters",
    name: "Sweaters",
    subcategories: [],
    description:
      "Sweaters and knitwear built for warmth, texture, and dependable layering through cooler mornings and evenings.",
    heroTitle: "Knitwear With Warmth And Structure",
    heroBody:
      "Layer into sweaters that feel soft, look clean, and work across office dressing, travel, and off-duty wardrobes.",
  },
  {
    slug: "t-shirts",
    name: "T-shirts",
    subcategories: ["Sweat-shirts", "Round-neck T-shirts", "V-neck T-shirts"],
    description:
      "Round-neck, V-neck, and sweat-shirt styles for easy everyday dressing with a cleaner menswear edge.",
    heroTitle: "T-Shirts That Still Feel Considered",
    heroBody:
      "Browse everyday tees and sweat-shirts designed for layering, comfort, and casual outfits that stay sharp.",
  },
];

const TARGET_CATEGORY_SLUG_SET = new Set(TARGET_CATEGORIES.map((category) => category.slug));

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
  socks: { min: 500, max: 2500 },
  sweaters: { min: 2500, max: 12000 },
  "t-shirts": { min: 1500, max: 6000 },
  misc: { min: 3000, max: 10000 },
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashSeed(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function estimatePrice(category, slug) {
  const range = PRICE_RANGE_BY_CATEGORY[category] || PRICE_RANGE_BY_CATEGORY.misc;
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

async function selectAllPages(runPage, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await runPage(from, to);
    if (error) return { data: null, error };
    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
  }
  return { data: rows, error: null };
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

function looksGenericFile(fileName) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  return GENERIC_FILE_PATTERNS.some((pattern) => pattern.test(stem));
}

function trimLeadingCategoryNoise(baseText, topFolder, subFolder, categorySlug) {
  let output = baseText;
  const prefixes = [
    slugify(categorySlug),
    slugify(topFolder),
    slugify(subFolder || ""),
    "cat",
    "hero",
  ].filter(Boolean);

  for (const prefix of prefixes) {
    output = output.replace(new RegExp(`^${prefix}-+`, "i"), "");
  }

  return output;
}

function shouldIncludeAssetPath(segments) {
  if (segments.length < 2) return false;
  if (EXCLUDED_TOP_LEVEL_DIRS.has(String(segments[0]).toLowerCase())) return false;
  return !segments.some((segment) =>
    EXCLUDED_SEGMENTS.some((excluded) => String(segment).toLowerCase().includes(excluded)),
  );
}

function normalizeCategorySlug(topFolder, subFolder, fileName) {
  const joined = `${topFolder} ${subFolder || ""} ${fileName}`.toLowerCase();

  if (String(topFolder).toLowerCase() === "khaki-pants") return "trousers";
  if (String(topFolder).toLowerCase() === "polo shirts") return "polo-t-shirts";
  if (String(topFolder).toLowerCase() === "tracksuits") return "track-suits";
  if (String(topFolder).toLowerCase() === "belt and ties") return "belts-ties";
  if (String(topFolder).toLowerCase() === "caps and hats") return "caps-hats";
  if (String(topFolder).toLowerCase() === "socks") return "socks";
  if (subFolder && /t-?shirts?/.test(String(subFolder).toLowerCase())) return "t-shirts";

  return inferCategorySlugFromText(joined);
}

function inferSubcategoryFromAsset(categorySlug, topFolder, subFolder, fileName) {
  const text = `${topFolder} ${subFolder || ""} ${fileName}`.toLowerCase();
  if (categorySlug === "polo-t-shirts") {
    return /knitted|knit/.test(text) ? "Knitted Polos" : "Polos";
  }
  if (categorySlug === "shoes") {
    if (/formal/.test(text)) return "Formal shoes";
    if (/boot/.test(text)) return "Boots";
    if (/sandal/.test(text)) return "Sandals";
    if (/loafer/.test(text)) return "Loafers";
    return "Casual";
  }
  if (categorySlug === "shirts") {
    if (/presidential/.test(text)) return "Presidential";
    if (/formal|dress|oxford|button-down|button down/.test(text)) return "Formal shirts";
    return "Casual";
  }
  if (categorySlug === "suits") {
    return /three|3 piece|3-piece|three-piece/.test(text) ? "Three piece" : "Two piece";
  }
  if (categorySlug === "jackets") {
    if (/denim/.test(text)) return "Denim Jackets";
    if (/half|vest|gilet/.test(text)) return "Half jackets";
    return "Jackets";
  }
  if (categorySlug === "trousers") {
    if (/khaki/.test(text)) return "Khaki";
    if (/chino/.test(text)) return "Chino";
    if (/jean|denim/.test(text)) return "Jeans";
    if (/gurkha/.test(text)) return "Gurkha";
    return "Formal";
  }
  if (categorySlug === "linen") {
    if (/line set|linen set|set/.test(text)) return "Linen Set";
    if (/trouser|pant/.test(text)) return "Linen Trousers";
    if (/shirt/.test(text)) return "Linen shirts";
    if (/short/.test(text)) return "Linen shorts";
    return "Linen Set";
  }
  if (categorySlug === "caps-hats") {
    return /hat/.test(text) ? "Hats" : "Caps";
  }
  if (categorySlug === "belts-ties") {
    return /tie/.test(text) ? "Ties" : "Belts";
  }
  if (categorySlug === "t-shirts") {
    if (/sweat-shirt|sweatshirt/.test(text)) return "Sweat-shirts";
    if (/v-neck|v neck/.test(text)) return "V-neck T-shirts";
    return "Round-neck T-shirts";
  }
  return null;
}

function buildAssetTitle(fileName, topFolder, subFolder, categorySlug, fallbackLabel) {
  if (looksGenericFile(fileName)) return fallbackLabel;

  const stem = trimLeadingCategoryNoise(
    slugify(fileName.replace(/\.[^.]+$/, "")),
    topFolder,
    subFolder,
    categorySlug,
  );
  const words = stem.split("-").filter(Boolean);
  if (words.length < 2) return fallbackLabel;
  return titleCase(words.slice(0, 12).join(" "));
}

function toSourceAssetPath(absPath) {
  return absPath
    .replace(path.join(ROOT, "src", "assets"), "/src/assets")
    .replace(/\\/g, "/");
}

function getRepresentativeByCategory(assets) {
  const groups = new Map();
  for (const asset of assets) {
    const list = groups.get(asset.category_slug) || [];
    list.push(asset);
    groups.set(asset.category_slug, list);
  }

  const out = new Map();
  for (const [categorySlug, list] of groups.entries()) {
    const ranked = [...list].sort((a, b) => {
      const aScore = looksGenericFile(a.fileName) ? 2 : 0;
      const bScore = looksGenericFile(b.fileName) ? 2 : 0;
      const aHero = /hero|cat|cover/.test(a.fileName.toLowerCase()) ? -1 : 0;
      const bHero = /hero|cat|cover/.test(b.fileName.toLowerCase()) ? -1 : 0;
      return aScore + aHero - (bScore + bHero);
    });
    out.set(categorySlug, ranked[0] || list[0]);
  }

  return out;
}

async function collectAssetProducts() {
  const files = await walk(ASSETS_ROOT);
  const rawEntries = [];

  for (const absPath of files) {
    const ext = path.extname(absPath).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(ext)) continue;

    const relative = absPath.replace(ASSETS_ROOT, "").replace(/\\/g, "/").replace(/^\/+/, "");
    const segments = relative.split("/");
    if (!shouldIncludeAssetPath(segments)) continue;

    const fileName = segments[segments.length - 1];
    const topFolder = segments[0];
    const subFolder = segments.length > 2 ? segments[1] : null;
    const categorySlug = normalizeCategorySlug(topFolder, subFolder, fileName);
    if (!TARGET_CATEGORY_SLUG_SET.has(categorySlug)) continue;

    rawEntries.push({
      absPath,
      fileName,
      topFolder,
      subFolder,
      image_url: toSourceAssetPath(absPath),
      category_slug: categorySlug,
      subcategory: inferSubcategoryFromAsset(categorySlug, topFolder, subFolder, fileName),
    });
  }

  rawEntries.sort((a, b) =>
    `${a.category_slug} ${a.subcategory || ""} ${a.fileName}`.localeCompare(
      `${b.category_slug} ${b.subcategory || ""} ${b.fileName}`,
    ),
  );

  const counters = new Map();
  const seenSlugs = new Set();
  const products = [];

  for (const entry of rawEntries) {
    const counterKey = `${entry.category_slug}::${entry.subcategory || "all"}`;
    const nextIndex = (counters.get(counterKey) || 0) + 1;
    counters.set(counterKey, nextIndex);

    const categoryRow = TARGET_CATEGORIES.find((category) => category.slug === entry.category_slug);
    const fallbackLabel = entry.subcategory
      ? `${entry.subcategory} Style ${String(nextIndex).padStart(2, "0")}`
      : `${categoryRow ? categoryRow.name : titleCase(entry.category_slug)} Style ${String(nextIndex).padStart(2, "0")}`;
    const title = buildAssetTitle(
      entry.fileName,
      entry.topFolder,
      entry.subFolder,
      entry.category_slug,
      fallbackLabel,
    );
    const slug = slugify(
      `${entry.category_slug}-${entry.subcategory || "all"}-${entry.fileName.replace(/\.[^.]+$/, "")}-${path
        .extname(entry.fileName)
        .replace(/^\./, "")}`,
    );
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const description = buildProductDescription({
      title,
      categorySlug: entry.category_slug,
      categoryName: categoryRow ? categoryRow.name : null,
      subcategoryName: entry.subcategory,
    });

    products.push({
      ...entry,
      slug,
      title,
      description,
      price: estimatePrice(entry.category_slug, slug),
    });
  }

  return {
    products,
    representatives: getRepresentativeByCategory(products),
  };
}

async function insertProductsSafe(supabase, rows) {
  let { error } = await supabase.from("products").upsert(rows, { onConflict: "slug" });
  if (error && String(error.message || "").toLowerCase().includes("subcategory")) {
    const stripped = rows.map(({ subcategory: _omit, ...rest }) => rest);
    ({ error } = await supabase.from("products").upsert(stripped, { onConflict: "slug" }));
  }
  return error;
}

async function updateProductSafe(supabase, id, payload) {
  let { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error && String(error.message || "").toLowerCase().includes("subcategory")) {
    const { subcategory: _omit, ...rest } = payload;
    ({ error } = await supabase.from("products").update(rest).eq("id", id));
  }
  return error;
}

async function readProductImagesByChunks(supabase, productIds, chunkSize = 200) {
  const all = [];
  for (let index = 0; index < productIds.length; index += chunkSize) {
    const chunk = productIds.slice(index, index + chunkSize);
    if (chunk.length === 0) continue;
    const { data, error } = await supabase
      .from("product_images")
      .select("id,product_id,image_url")
      .in("product_id", chunk);
    if (error) return { data: null, error };
    all.push(...(data || []));
  }
  return { data: all, error: null };
}

async function deleteProductImagesByIds(supabase, ids, chunkSize = 200) {
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    if (chunk.length === 0) continue;
    const { error } = await supabase.from("product_images").delete().in("id", chunk);
    if (error) return error;
  }
  return null;
}

function isAssetBackedImageUrl(imageUrl) {
  return String(imageUrl || "").startsWith("/src/assets/");
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
    throw new Error("Missing Supabase URL or key in .env");
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

  const { products: assetProducts, representatives } = await collectAssetProducts();
  const assetSlugSet = new Set(assetProducts.map((product) => product.slug));
  console.log(`Collected ${assetProducts.length} asset products from current folders.`);

  const categoryRows = TARGET_CATEGORIES.map((category, index) => ({
    slug: category.slug,
    name: category.name,
    description: category.description,
    display_order: index + 1,
    image_url: representatives.get(category.slug)?.image_url || null,
  }));
  const { error: categoryUpsertError } = await supabase
    .from("categories")
    .upsert(categoryRows, { onConflict: "slug" });
  if (categoryUpsertError) {
    throw new Error(`Category upsert failed: ${categoryUpsertError.message}`);
  }

  const { data: freshCategories, error: freshCategoriesError } = await supabase
    .from("categories")
    .select("id,slug");
  if (freshCategoriesError) {
    throw new Error(`Category reload failed: ${freshCategoriesError.message}`);
  }
  const categoryIdBySlug = new Map((freshCategories || []).map((category) => [category.slug, category.id]));

  const carouselRows = TARGET_CATEGORIES.map((category) => ({
    category_id: categoryIdBySlug.get(category.slug),
    title: category.heroTitle,
    description: category.heroBody,
    image_url: representatives.get(category.slug)?.image_url || null,
    is_active: true,
  })).filter((row) => row.category_id);
  const { error: carouselUpsertError } = await supabase
    .from("category_carousels")
    .upsert(carouselRows, { onConflict: "category_id" });
  if (carouselUpsertError) {
    throw new Error(`Category carousel upsert failed: ${carouselUpsertError.message}`);
  }

  const { data: existingProducts, error: existingProductsError } = await selectAllPages((from, to) =>
    supabase
      .from("products")
      .select("id,slug,title,price,is_published,product_images(id,image_url)")
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (existingProductsError) {
    throw new Error(`Existing products read failed: ${existingProductsError.message}`);
  }

  const existingProductBySlug = new Map((existingProducts || []).map((product) => [product.slug, product]));
  const rowsToInsert = [];
  let updatedExisting = 0;

  for (const assetProduct of assetProducts) {
    const existing = existingProductBySlug.get(assetProduct.slug);
    const categoryId = categoryIdBySlug.get(assetProduct.category_slug) || null;
    const payload = {
      title: assetProduct.title,
      description: assetProduct.description,
      category_id: categoryId,
      subcategory: assetProduct.subcategory,
      is_published: true,
    };

    if (existing) {
      const updateError = await updateProductSafe(supabase, existing.id, payload);
      if (updateError) {
        throw new Error(`Product update failed for ${assetProduct.slug}: ${updateError.message}`);
      }
      updatedExisting += 1;
      continue;
    }

    rowsToInsert.push({
      slug: assetProduct.slug,
      title: assetProduct.title,
      description: assetProduct.description,
      category_id: categoryId,
      subcategory: assetProduct.subcategory,
      price: assetProduct.price,
      sale_price: null,
      is_published: true,
      is_featured: false,
    });
  }

  if (rowsToInsert.length > 0) {
    const insertError = await insertProductsSafe(supabase, rowsToInsert);
    if (insertError) {
      throw new Error(`Product insert failed: ${insertError.message}`);
    }
  }

  const staleAssetBackedProductIds = (existingProducts || [])
    .filter((product) => {
      const imageRows = product.product_images || [];
      const hasAssetImage = imageRows.some((image) => isAssetBackedImageUrl(image.image_url));
      return hasAssetImage && !assetSlugSet.has(product.slug);
    })
    .map((product) => product.id);
  for (const productId of staleAssetBackedProductIds) {
    const updateError = await updateProductSafe(supabase, productId, { is_published: false });
    if (updateError) {
      throw new Error(`Failed to unpublish stale asset product: ${updateError.message}`);
    }
  }

  const { data: allProducts, error: allProductsError } = await selectAllPages((from, to) =>
    supabase
      .from("products")
      .select("id,slug")
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (allProductsError) {
    throw new Error(`Product reload failed: ${allProductsError.message}`);
  }
  const productIdBySlug = new Map((allProducts || []).map((product) => [product.slug, product.id]));

  const productIds = assetProducts
    .map((product) => productIdBySlug.get(product.slug))
    .filter(Boolean);
  const { data: existingImages, error: existingImagesError } = await readProductImagesByChunks(
    supabase,
    productIds,
  );
  if (existingImagesError) {
    throw new Error(`Product image read failed: ${existingImagesError.message}`);
  }

  const imagesByProductId = new Map();
  for (const image of existingImages || []) {
    const list = imagesByProductId.get(image.product_id) || [];
    list.push(image);
    imagesByProductId.set(image.product_id, list);
  }

  const staleImageIds = [];
  const imageRowsToInsert = [];

  for (const assetProduct of assetProducts) {
    const productId = productIdBySlug.get(assetProduct.slug);
    if (!productId) continue;
    const imageRows = imagesByProductId.get(productId) || [];
    let hasCurrentImage = false;
    for (const imageRow of imageRows) {
      if (imageRow.image_url === assetProduct.image_url) {
        if (hasCurrentImage) {
          staleImageIds.push(imageRow.id);
        } else {
          hasCurrentImage = true;
        }
        continue;
      }
      staleImageIds.push(imageRow.id);
    }
    if (!hasCurrentImage) {
      imageRowsToInsert.push({
        product_id: productId,
        image_url: assetProduct.image_url,
        display_order: 0,
      });
    }
  }

  if (staleImageIds.length > 0) {
    const deleteError = await deleteProductImagesByIds(supabase, staleImageIds);
    if (deleteError) {
      throw new Error(`Deleting stale asset images failed: ${deleteError.message}`);
    }
  }
  if (imageRowsToInsert.length > 0) {
    const { error: imageInsertError } = await supabase.from("product_images").insert(imageRowsToInsert);
    if (imageInsertError) {
      throw new Error(`Product image insert failed: ${imageInsertError.message}`);
    }
  }

  const { data: variantsRead, error: variantsReadError } = await selectAllPages((from, to) =>
    supabase
      .from("product_variants")
      .select("id,product_id,sku")
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (variantsReadError) {
    throw new Error(`Variant read failed: ${variantsReadError.message}`);
  }
  const productIdsWithVariants = new Set((variantsRead || []).map((variant) => variant.product_id));
  const existingSkus = new Set((variantsRead || []).map((variant) => String(variant.sku || "")));

  const { data: productsForVariants, error: productsForVariantsError } = await selectAllPages((from, to) =>
    supabase
      .from("products")
      .select("id,slug,title,subcategory,categories(slug,name)")
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (productsForVariantsError) {
    throw new Error(`Product list for variants failed: ${productsForVariantsError.message}`);
  }

  const variantRows = [];
  for (const product of productsForVariants || []) {
    if (productIdsWithVariants.has(product.id)) continue;
    const text = `${product.slug || ""} ${product.title || ""} ${product.categories?.name || ""} ${product.subcategory || ""}`.toLowerCase();
    const categorySlug =
      product.categories?.slug || inferCategorySlugFromText(text) || "shirts";
    const isShoes = categorySlug === "shoes";
    const isAccessory = /cap|hat|belt|tie|sock/.test(text) || ["caps-hats", "belts-ties", "socks"].includes(categorySlug);
    const sizes = isAccessory ? ["One Size"] : isShoes ? ["40", "41", "42", "43"] : ["S", "M", "L", "XL"];
    const colors = ["Black", "Navy", "Brown"];

    for (let index = 0; index < Math.min(3, sizes.length); index += 1) {
      const size = sizes[index];
      let sku = `${String(product.slug || "item")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 20)}-${String(size).replace(/\s+/g, "")}`;
      if (existingSkus.has(sku)) {
        sku = `${sku}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      }
      existingSkus.add(sku);
      variantRows.push({
        product_id: product.id,
        size,
        color: colors[index % colors.length],
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
    `Sync complete. Updated products: ${updatedExisting}, new products: ${rowsToInsert.length}, unpublished stale products: ${staleAssetBackedProductIds.length}, new product images: ${imageRowsToInsert.length}, removed stale images: ${staleImageIds.length}, new default variants: ${variantRows.length}.`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
