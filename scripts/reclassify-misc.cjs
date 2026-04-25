const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/assets/catalog");
const miscDir = path.join(root, "misc");
if (!fs.existsSync(miscDir)) {
  console.log("misc folder not found");
  process.exit(0);
}

const entries = fs.readdirSync(miscDir, { withFileTypes: true });
const files = entries.filter((e) => e.isFile()).map((e) => e.name);

const ruleSets = [
  ["shoes", ["jogging-schuhe", "derby", "dress-shoe", "shoe", "oxford", "loafer", "sneaker", "footwear"]],
  ["suits", ["tailoring", "tailored", "formal-style", "double-breasted", "3-pieces", "3-piece", "tuxedo", "blazer", "suit"]],
  ["shirts", ["chemise", "button", "dress-shirt", "shirt", "polo"]],
  ["t-shirts", ["tee", "t-shirt", "short-sleeve", "crew-neck"]],
  ["khaki-pants", ["cargo", "khaki", "chino", "military", "multi-poches", "tactical"]],
  ["trousers", ["trouser", "trousers", "pant", "pants", "jeans", "straight-fit"]],
  ["track-suits", ["deportivo", "agasalho", "track", "sports", "jogger", "hoodie"]],
  ["belts", ["cowhide", "cowather", "buckle", "leather-belt", "belt"]],
];

function decideCategory(fileName) {
  const n = fileName.toLowerCase();
  for (const [category, words] of ruleSets) {
    if (words.some((w) => n.includes(w))) return category;
  }
  return null;
}

let moved = 0;
const movedItems = [];

for (const fileName of files) {
  const category = decideCategory(fileName);
  if (!category) continue;

  const from = path.join(miscDir, fileName);
  const targetDir = path.join(root, category);
  fs.mkdirSync(targetDir, { recursive: true });

  const renamed = fileName.replace(/^misc-/, `${category}-`);
  let candidate = renamed;
  let i = 1;
  while (fs.existsSync(path.join(targetDir, candidate))) {
    i += 1;
    const ext = path.extname(renamed);
    const stem = path.basename(renamed, ext);
    candidate = `${stem}-${i}${ext}`;
  }

  fs.renameSync(from, path.join(targetDir, candidate));
  moved += 1;
  movedItems.push({ from: `catalog/misc/${fileName}`, to: `catalog/${category}/${candidate}` });
}

fs.writeFileSync(
  path.join(root, "reclassify-report.json"),
  JSON.stringify({ moved_count: moved, moved: movedItems }, null, 2),
);

console.log(`moved=${moved}`);
