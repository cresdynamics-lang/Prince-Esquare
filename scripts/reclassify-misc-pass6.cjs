const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/assets/catalog");
const miscDir = path.join(root, "misc");
if (!fs.existsSync(miscDir)) {
  console.log("misc folder not found");
  process.exit(0);
}

const explicitMap = {
  "misc-download.jfif": "shirts",
  "misc-download-2.jfif": "shoes",
  "misc-download-3.jfif": "track-suits",
  "misc-download-4.jfif": "shoes",
  "misc-download-5.jfif": "shoes",
  "misc-download-6.jfif": "shoes",
  "misc-download-7.jfif": "shoes",
  "misc-download-8.jfif": "shoes",
  "misc-download-9.jfif": "shoes",
  "misc-download-10.jfif": "shoes",
  "misc-download-11.jfif": "shoes",
  "misc-download-12.jfif": "shirts",
  "misc-temu-best-deals.jfif": "shoes",
  "misc-ky.jfif": "shoes",
  "misc-this-item-is-unavailable-etsy.jfif": "shoes",
  "misc-brand-name-icpansmodel-number-xk058material.jfif": "trousers",
  "misc-product-id-4001153086977.jfif": "shirts",
  "misc-instagram.jfif": "t-shirts",
  "misc-instagram-2.jfif": "suits",
  "misc-item.jfif": "belts",
  "misc-item-2.jfif": "track-suits",
  "misc-product-information-materials-90-polyester-10.jfif": "track-suits",
  "misc-service-if-you-have-any-question-please-feel.jfif": "track-suits",
  "misc-shein.jfif": "track-suits",
  "misc-looks-like-something-from-a-final-fantasy.jfif": "suits",
  "misc-price-product-description-item.jfif": "track-suits",
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
  path.join(root, "reclassify-pass6-report.json"),
  JSON.stringify({ moved_count: moved, moved: movedItems, remaining_misc: remaining }, null, 2),
);

console.log(`moved=${moved}`);
