const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src/assets/catalog");
const miscDir = path.join(root, "misc");
if (!fs.existsSync(miscDir)) {
  console.log("misc folder not found");
  process.exit(0);
}

const explicitMap = {
  "misc-jacket-regular-fit-single-breasted-notch.jfif": "suits",
  "misc-laurent-monaco-structure-sur-mesure-elegance.jfif": "suits",
  "misc-refined-timeless-and-effortlessly-elegant.jfif": "suits",
  "misc-top-offer-of-the-season-men-s-luxury-designer.jfif": "suits",
  "misc-discover-the-pinnacle-of-ready-to-wear-fashion.jfif": "suits",
  "misc-men-tie-sets-classic-fashion-necktie-set-with.jfif": "suits",
  "misc-attirez-lattention-deplacez-vous-avec-assurance.jfif": "suits",
  "misc-stand-tall-stay-bold-the-chunky-heel.jfif": "shoes",
  "misc-bring-a-burst-of-colours-to-your-spring-wardrobe.jfif": "shirts",
  "misc-prices-may-vary-60-cotton-40-polyester.jfif": "t-shirts",
  "misc-stay-effortlessly-stylish-with-this-modern-color.jfif": "t-shirts",
  "misc-ressentez-vous-bien-avec-un-style-quotidien-sans.jfif": "t-shirts",
  "misc-ressentez-vous-bien-avec-un-style-quotidien-sans-2.jfif": "t-shirts",
  "misc-dm-for-size-m-l-xl-2xl-i-also-provide-custom-logo.jfif": "t-shirts",
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

fs.writeFileSync(
  path.join(root, "reclassify-pass4-report.json"),
  JSON.stringify({ moved_count: moved, moved: movedItems }, null, 2),
);

console.log(`moved=${moved}`);
