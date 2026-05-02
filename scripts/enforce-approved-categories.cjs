/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");

const REQUIRED_CATEGORIES = [
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

function inferCategorySlug(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("polo")) return "polo-t-shirts";
  if (/(shoe|loafer|oxford|boot|sandal)/.test(t)) return "shoes";
  if (/(three-piece|two-piece|wedding suit|suit)/.test(t) && !t.includes("track")) return "suits";
  if (t.includes("blazer")) return "blazers";
  if (/(track|jogger|athleisure)/.test(t)) return "track-suits";
  if (/(jacket|coat|bomber)/.test(t)) return "jackets";
  if (/(khaki|chino|jean|gurkha|trouser|pant)/.test(t)) return "trousers";
  if (t.includes("linen")) return "linen";
  if (/(cap|hat)/.test(t)) return "caps-hats";
  if (/(belt|tie)/.test(t)) return "belts-ties";
  if (/(sweater|knitwear|cardigan|pullover)/.test(t)) return "sweaters";
  if (/(t-shirt|tee|sweat-shirt|round-neck|v-neck)/.test(t)) return "t-shirts";
  if (/(shirt|presidential)/.test(t)) return "shirts";
  return "shirts";
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

async function main() {
  const env = await readEnvFile(ENV_PATH);
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL/key in .env");

  const supabase = createClient(url, key);
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminEmailCandidates = [
      env.ADMIN_SYNC_EMAIL,
      "princeesquire@gmail.com",
      "princeesquare@gmail.com",
    ].filter(Boolean);
    const adminPassword = env.ADMIN_SYNC_PASSWORD || "Prince@2026";
    let loggedIn = false;
    let lastError = "Invalid login credentials";
    for (const email of adminEmailCandidates) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: adminPassword });
      if (!error) {
        loggedIn = true;
        break;
      }
      lastError = error.message || lastError;
    }
    if (!loggedIn) throw new Error(`Admin login failed: ${lastError}`);
  }

  const categoryRows = REQUIRED_CATEGORIES.map((cat, index) => ({
    slug: cat.slug,
    name: cat.name,
    description:
      cat.subcategories.length > 0
        ? `Subcategories: ${cat.subcategories.join(", ")}`
        : `${cat.name} collection`,
    display_order: index + 1,
    image_url: null,
  }));

  const { error: upsertError } = await supabase
    .from("categories")
    .upsert(categoryRows, { onConflict: "slug" });
  if (upsertError) throw new Error(`Category upsert failed: ${upsertError.message}`);

  const { data: categories, error: catsError } = await supabase
    .from("categories")
    .select("id,slug,name");
  if (catsError) throw new Error(`Category read failed: ${catsError.message}`);

  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));
  const requiredSlugs = new Set(REQUIRED_CATEGORIES.map((c) => c.slug));

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,slug,title,description,categories(slug)");
  if (productsError) throw new Error(`Products read failed: ${productsError.message}`);

  let recategorizedCount = 0;
  for (const p of products ?? []) {
    const targetSlug = inferCategorySlug(
      `${p.slug || ""} ${p.title || ""} ${p.description || ""} ${p.categories?.slug || ""}`,
    );
    const targetCategoryId = categoryIdBySlug.get(targetSlug) ?? null;
    const { error } = await supabase
      .from("products")
      .update({ category_id: targetCategoryId })
      .eq("id", p.id);
    if (error) throw new Error(`Failed recategorizing ${p.slug}: ${error.message}`);
    recategorizedCount += 1;
  }

  const staleCategoryIds = (categories ?? [])
    .filter((c) => !requiredSlugs.has(c.slug))
    .map((c) => c.id);
  let removedCount = 0;
  if (staleCategoryIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .in("id", staleCategoryIds);
    if (deleteError) throw new Error(`Failed deleting stale categories: ${deleteError.message}`);
    removedCount = staleCategoryIds.length;
  }

  console.log(
    `Enforced categories complete. Required categories: ${REQUIRED_CATEGORIES.length}, recategorized products: ${recategorizedCount}, removed legacy categories: ${removedCount}.`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

