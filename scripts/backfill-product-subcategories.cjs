/* eslint-disable no-console */
/**
 * Sets products.subcategory from the same rules as src/lib/subcategories.ts inferSubcategory.
 * Keep logic aligned when changing taxonomy inference.
 */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function inferSubcategory(categorySlug, titleOrSlug) {
  const category = categorySlug ?? "";
  const text = String(titleOrSlug || "").toLowerCase();

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
  const args = new Set(process.argv.slice(2));
  const onlyEmpty = args.has("--only-empty");

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

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,slug,title,subcategory,categories(slug)");
  if (productsError) throw new Error(`Products read failed: ${productsError.message}`);

  let updated = 0;
  let skipped = 0;
  for (const p of products ?? []) {
    const slug = p.categories?.slug ?? null;
    const inferred = inferSubcategory(slug, `${p.title ?? ""} ${p.slug ?? ""}`);
    const nextValue = inferred;

    if (onlyEmpty && p.subcategory != null && String(p.subcategory).trim() !== "") {
      skipped += 1;
      continue;
    }

    const { error } = await supabase.from("products").update({ subcategory: nextValue }).eq("id", p.id);
    if (error) throw new Error(`Update failed for ${p.slug}: ${error.message}`);
    updated += 1;
  }

  console.log(
    `Backfill subcategories complete. Updated: ${updated}, skipped (--only-empty): ${skipped}, total rows: ${(products ?? []).length}.`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
