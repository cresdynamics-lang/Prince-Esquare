const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/assets/catalog");
const miscDir = path.join(root, "misc");
if (!fs.existsSync(miscDir)) {
  console.log("misc folder not found");
  process.exit(0);
}

const files = fs
  .readdirSync(miscDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name);

// High-confidence third-pass mappings only.
const containsRules = [
  ["socks", ["cat-socks"]],
  ["suits", ["cat-formal", "timeless-elegance", "professional-wardrobe", "slim-fit", "modele-aaron", "formelle-bekleidung"]],
  ["t-shirts", ["cat-casual", "casual-top", "everyday-style"]],
  ["shirts", ["dress-hirt", "red-collar", "polyester-65-viscose-35-button"]],
  ["track-suits", ["drawstring", "winter-fall-fabric-polyester-sleeve"]],
  ["belts", ["micro-adjustment", "men-s-leather"]],
  ["trousers", ["denim", "fit-through-the-hip"]],
];

const explicitMap = {
  "misc-cat-formal.jpg": "suits",
  "misc-cat-casual.jpg": "t-shirts",
  "misc-cat-socks.jpg": "socks",
};

function chooseCategory(fileName) {
  if (explicitMap[fileName]) return explicitMap[fileName];
  const n = fileName.toLowerCase();
  for (const [category, words] of containsRules) {
    if (words.some((w) => n.includes(w))) return category;
  }
  return null;
}

let moved = 0;
const movedItems = [];

for (const fileName of files) {
  const category = chooseCategory(fileName);
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
  movedItems.push({
    from: `catalog/misc/${fileName}`,
    to: `catalog/${category}/${candidate}`,
  });
}

fs.writeFileSync(
  path.join(root, "reclassify-pass3-report.json"),
  JSON.stringify({ moved_count: moved, moved: movedItems }, null, 2),
);

console.log(`moved=${moved}`);
