const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/assets/catalog");
const miscDir = path.join(root, "misc");
if (!fs.existsSync(miscDir)) {
  console.log("misc folder not found");
  process.exit(0);
}

// Final conservative pass: only files with reasonably clear intent.
const explicitMap = {
  "misc-prices-may-vary-free-customizationcheck-out-the.jfif": "suits",
  "misc-prices-may-vary-high-quality-fabricthe-men.jfif": "shirts",
  "misc-this-garment-portrays-all-the-original-styling-of.jfif": "suits",
  "misc-veredeln-sie-ihre-freizeitoutfits-mit-dem.jfif": "t-shirts",
};

let moved = 0;
const movedItems = [];

for (const [fileName, category] of Object.entries(explicitMap)) {
  const from = path.join(miscDir, fileName);
  if (!fs.existsSync(from)) continue;

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

const remaining = fs
  .readdirSync(miscDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .sort();

fs.writeFileSync(
  path.join(root, "reclassify-pass5-report.json"),
  JSON.stringify({ moved_count: moved, moved: movedItems, remaining_misc: remaining }, null, 2),
);

console.log(`moved=${moved}`);
