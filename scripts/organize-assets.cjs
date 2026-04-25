const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/assets");
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".jfif"]);
const entries = fs.readdirSync(root, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile() && exts.has(path.extname(e.name).toLowerCase()))
  .map((e) => e.name);

const categories = [
  "shoes",
  "suits",
  "shirts",
  "t-shirts",
  "trousers",
  "khaki-pants",
  "track-suits",
  "belts",
  "misc",
];

const keywords = [
  ["track-suits", ["tracksuit", "track suit", "trackset", "track set", "athletic", "sportswear", "jogger", "hoodie set"]],
  ["khaki-pants", ["khaki", "chino", "cargo", "tactical", "military pantalon"]],
  ["trousers", ["trouser", "trousers", "pant", "pants", "jeans"]],
  ["t-shirts", ["t-shirt", "t shirt", "tee", "crew neck", "short sleeve"]],
  ["shirts", ["shirt", "button down", "button-up", "button up", "dress shirt", "polo"]],
  ["suits", ["suit", "tuxedo", "blazer", "3 piece", "three piece", "prom suit", "groom"]],
  ["shoes", ["shoe", "oxford", "loafer", "sneaker"]],
  ["belts", ["belt", "buckle"]],
];

function slugify(value) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
  return (
    ascii
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-") || "item"
  );
}

function classify(name) {
  const n = name.toLowerCase();
  for (const [category, list] of keywords) {
    if (list.some((k) => n.includes(k))) return category;
  }
  return "misc";
}

const catalogRoot = path.join(root, "catalog");
for (const c of categories) {
  fs.mkdirSync(path.join(catalogRoot, c), { recursive: true });
}

const used = Object.fromEntries(categories.map((c) => [c, new Set()]));
const moved = [];

for (const fileName of files) {
  const ext = path.extname(fileName).toLowerCase();
  const stem = path.basename(fileName, ext);
  const category = classify(stem);
  const base = slugify(stem).slice(0, 70).replace(/^-+|-+$/g, "") || category;

  let candidate = `${category}-${base}`;
  let index = 1;
  while (
    used[category].has(candidate) ||
    fs.existsSync(path.join(catalogRoot, category, `${candidate}${ext}`))
  ) {
    index += 1;
    candidate = `${category}-${base}-${index}`;
  }

  used[category].add(candidate);
  const from = path.join(root, fileName);
  const toRel = path.posix.join("catalog", category, `${candidate}${ext}`);
  const to = path.join(root, toRel);
  fs.renameSync(from, to);
  moved.push({ from: fileName, to: toRel });
}

fs.writeFileSync(
  path.join(catalogRoot, "organize-report.json"),
  JSON.stringify({ moved_count: moved.length, moved }, null, 2),
);

console.log(`moved=${moved.length}`);
