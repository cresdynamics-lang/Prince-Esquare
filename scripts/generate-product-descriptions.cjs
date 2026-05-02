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

function categoryPitch(categoryName) {
  const key = String(categoryName || "").toLowerCase();
  if (key.includes("suit")) {
    return {
      material: "premium suiting blend",
      fit: "structured tailored fit",
      occasion: "weddings, business meetings, and formal events",
      care: "Dry clean recommended to preserve shape and finish",
    };
  }
  if (key.includes("shirt") || key.includes("polo")) {
    return {
      material: "soft breathable cotton blend",
      fit: "modern regular fit",
      occasion: "office, dinner, and polished casual wear",
      care: "Machine wash cold and warm iron for a crisp look",
    };
  }
  if (key.includes("shoe")) {
    return {
      material: "quality leather-look upper with durable sole",
      fit: "comfort-focused foot shape",
      occasion: "workdays, events, and smart weekend outfits",
      care: "Wipe clean and store with shoe support",
    };
  }
  if (key.includes("trouser") || key.includes("linen")) {
    return {
      material: "lightweight woven fabric with breathable comfort",
      fit: "clean tapered silhouette",
      occasion: "daily office wear, travel, and smart casual dressing",
      care: "Gentle wash and low-heat pressing for best results",
    };
  }
  if (key.includes("jacket") || key.includes("blazer") || key.includes("sweater")) {
    return {
      material: "premium textured outerwear fabric",
      fit: "layer-friendly modern cut",
      occasion: "cool-weather styling, office layering, and evening outings",
      care: "Follow garment label care and avoid high-heat drying",
    };
  }
  if (key.includes("cap") || key.includes("hat") || key.includes("belt") || key.includes("tie")) {
    return {
      material: "durable accessory-grade construction",
      fit: "practical everyday profile",
      occasion: "finishing touch for formal and smart-casual looks",
      care: "Spot clean and store away from direct heat",
    };
  }
  return {
    material: "quality menswear fabric",
    fit: "balanced modern fit",
    occasion: "versatile day-to-evening styling",
    care: "Follow basic garment care for long-term durability",
  };
}

function keywordOverrides(title) {
  const t = String(title || "").toLowerCase();
  const out = {};
  if (t.includes("linen")) {
    out.material = "premium breathable linen blend";
    out.occasion = "warm-weather business, events, and refined casual settings";
    out.care = "Gentle wash or dry clean to preserve the natural linen texture";
  }
  if (t.includes("wedding")) {
    out.occasion = "weddings, receptions, and premium celebration dressing";
  }
  if (t.includes("formal")) {
    out.fit = "sharp formal profile with clean lines";
    out.occasion = "boardroom meetings, ceremonies, and formal occasions";
  }
  if (t.includes("casual")) {
    out.fit = "relaxed modern fit for all-day comfort";
    out.occasion = "smart-casual days, travel, and weekend plans";
  }
  if (t.includes("track")) {
    out.material = "lightweight performance-inspired fabric";
    out.fit = "athletic modern cut with easy movement";
    out.occasion = "travel, active days, and clean streetwear styling";
    out.care = "Machine wash cold and air dry for best longevity";
  }
  if (t.includes("polo")) {
    out.material = "soft knitted cotton blend";
  }
  if (t.includes("boot") || t.includes("loafer") || t.includes("oxford")) {
    out.material = "structured premium upper with durable grip sole";
    out.fit = "supportive footwear profile for extended wear";
  }
  if (t.includes("sweater")) {
    out.material = "soft knit fabric with warm breathable feel";
    out.care = "Hand wash or gentle cycle to maintain knit quality";
  }
  return out;
}

function buildDescription(categoryName, title) {
  const profile = categoryPitch(categoryName);
  const override = keywordOverrides(title);
  const material = override.material || profile.material;
  const fit = override.fit || profile.fit;
  const occasion = override.occasion || profile.occasion;
  const care = override.care || profile.care;
  return `${title} is part of our ${categoryName} collection, created for men who want polished style with everyday comfort. Made from ${material}, it features a ${fit} that looks clean and confident. Ideal for ${occasion}, this piece pairs easily with both formal and smart-casual outfits. Care: ${care}. We deliver across Kenya, with fast Nairobi fulfilment for a smooth shopping experience.`;
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
    const categoryName = String(p.categories?.name ?? "menswear");
    const description = buildDescription(categoryName, p.title);
    const { error } = await supabase.from("products").update({ description }).eq("id", p.id);
    if (error) throw new Error(`Update failed for ${p.title}: ${error.message}`);
    updated += 1;
  }

  console.log(`Updated descriptions for ${updated} products.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

