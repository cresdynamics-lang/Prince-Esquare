/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

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

function trimTo(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function buildMetaTitle(title, categoryName) {
  return trimTo(`${title} | ${categoryName} | Prince Esquire Kenya`, 60);
}

function buildMetaDescription(title, categoryName) {
  const text = `${title} from Prince Esquire ${categoryName} collection. Premium menswear in Kenya with fast Nairobi delivery, quality fit, and trusted style support.`;
  return trimTo(text, 160);
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

  const { data: products, error: readError } = await supabase
    .from("products")
    .select("id,title,categories(name)");
  if (readError) throw new Error(`Read failed: ${readError.message}`);

  let updated = 0;
  for (const p of products ?? []) {
    const categoryName = String(p.categories?.name ?? "Menswear");
    const meta_title = buildMetaTitle(String(p.title ?? "Product"), categoryName);
    const meta_description = buildMetaDescription(String(p.title ?? "Product"), categoryName);
    const { error } = await supabase
      .from("products")
      .update({ meta_title, meta_description })
      .eq("id", p.id);
    if (error) throw new Error(`Update failed for ${p.title}: ${error.message}`);
    updated += 1;
  }

  console.log(`Updated SEO metadata for ${updated} products.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

