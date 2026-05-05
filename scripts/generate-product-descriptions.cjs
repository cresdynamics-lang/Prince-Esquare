/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { buildProductDescription, inferCategorySlugFromText } = require("./lib/product-copy.cjs");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");

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

async function main() {
  const env = await readEnvFile(ENV_PATH);
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL/key in .env");
  }
  const supabase = createClient(url, key);

  if (!serviceRoleKey) {
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

  const { data: products, error: readError } = await selectAllPages((from, to) =>
    supabase
      .from("products")
      .select("id,title,subcategory,categories(name,slug)")
      .range(from, to),
  );
  if (readError) throw new Error(`Read failed: ${readError.message}`);

  let updated = 0;
  for (const product of products ?? []) {
    const categoryName = String(product.categories?.name ?? "menswear");
    const categorySlug =
      product.categories?.slug ||
      inferCategorySlugFromText(`${product.title || ""} ${categoryName} ${product.subcategory || ""}`);
    const description = buildProductDescription({
      title: product.title,
      categorySlug,
      categoryName,
      subcategoryName: product.subcategory || null,
    });
    const { error } = await supabase.from("products").update({ description }).eq("id", product.id);
    if (error) throw new Error(`Update failed for ${product.title}: ${error.message}`);
    updated += 1;
  }

  console.log(`Updated descriptions for ${updated} products.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
