/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");

const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "src", "assets");
const CATALOG_ROOT = path.join(ASSETS_ROOT, "catalog");
const OUTPUT_SQL = path.join(
  ROOT,
  "supabase",
  "migrations",
  "20260425222000_sync_asset_products.sql",
);
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

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
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

  const seen = new Set();
  return products.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

async function main() {
  const products = await collectAssetProducts();
  const categories = Array.from(new Set(products.map((p) => p.category_slug))).sort();

  const categoryValues = categories
    .map((slug) => `(${sqlString(slug)}, ${sqlString(titleCaseFromSlug(slug))}, null, null)`)
    .join(",\n  ");

  const productValues = products
    .map(
      (p) =>
        `(${sqlString(p.slug)}, ${sqlString(p.title)}, ${sqlString(p.title)}, ${sqlString(
          p.category_slug,
        )}, ${Number(p.price)}, true, false)`,
    )
    .join(",\n  ");

  const imageValues = products
    .map((p) => `(${sqlString(p.slug)}, ${sqlString(p.image_url)}, 0)`)
    .join(",\n  ");

  const sql = `-- Auto-generated from src/assets and src/assets/catalog.
-- Ensures all image-based products are available in DB and manageable in admin.

begin;

with category_rows(slug, name, description, image_url) as (
  values
  ${categoryValues}
)
insert into public.categories (slug, name, description, image_url)
select slug, name, description, image_url
from category_rows
on conflict (slug) do update
set name = excluded.name;

with product_rows(slug, title, description, category_slug, price, is_published, is_featured) as (
  values
  ${productValues}
)
insert into public.products (slug, title, description, category_id, price, sale_price, is_published, is_featured)
select
  pr.slug,
  pr.title,
  pr.description,
  c.id,
  pr.price,
  null,
  pr.is_published,
  pr.is_featured
from product_rows pr
left join public.categories c on c.slug = pr.category_slug
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  category_id = excluded.category_id,
  price = excluded.price,
  is_published = excluded.is_published;

with image_rows(product_slug, image_url, display_order) as (
  values
  ${imageValues}
)
insert into public.product_images (product_id, image_url, display_order)
select p.id, ir.image_url, ir.display_order
from image_rows ir
join public.products p on p.slug = ir.product_slug
where not exists (
  select 1
  from public.product_images pi
  where pi.product_id = p.id
    and pi.image_url = ir.image_url
);

commit;
`;

  await fs.writeFile(OUTPUT_SQL, sql, "utf8");
  console.log(`Generated SQL migration: ${path.relative(ROOT, OUTPUT_SQL)}`);
  console.log(`Products included: ${products.length}, categories included: ${categories.length}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
