/**
 * Build belts catalog from Cursor assets (user batch).
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);
const OUT_DIR = path.join(__dirname, '..', 'data', 'belts-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'belts.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'belts-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const BATCH_UUIDS = new Set([
  'fa8cb090', '4a5ef43a', '8016d7f1', 'bd1da189', 'd92b57ea', '17f017ed', '09a9e37b',
  'fed2f6c4', 'aa928946', '211bec2c', '69175c69', '488af282', 'eb0578f5', '5abca4ed',
  '5e9de2ad', '2235884d', '6098025d', '455ba928', '6d3bd3e9', 'c4dd74b8', 'b1bb1a99',
  '8346800b', '0f90a7fd', 'e27421c0', '58326744', '8e4fcc86',
]);

const SKIP_UUIDS = new Set([
  '17f017ed', // 2-pack promo
  '69175c69', // SSENSE promo
  '488af282', // multi-belt collage
  '2235884d', // women's BKE belt
  '455ba928', // page not found
  '6d3bd3e9', // leather bracelet not belt
  '8e4fcc86', // 4-belt WhatsApp collage
  '211bec2c', // promo/collage
]);

const extractUuid = (filename) => {
  const m = filename.match(/-([a-f0-9]{8})-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i);
  return m ? m[1] : null;
};

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const main = () => {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('Assets not found:', ASSETS_DIR);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.startsWith('c__Users_Spine') && f.endsWith('.png'))
    .filter((f) => {
      const uuid = extractUuid(f);
      return uuid && BATCH_UUIDS.has(uuid) && !SKIP_UUIDS.has(uuid);
    })
    .sort();

  const seenNames = new Set();
  const catalog = [];
  let idx = 0;

  for (const sourceFile of files) {
    const uuid = extractUuid(sourceFile);
    const spec = SPECS[uuid];
    if (!spec) {
      console.warn(`No spec for ${uuid}, skipping`);
      continue;
    }

    idx += 1;
    const shortImage = `belt-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const name = spec.name.toUpperCase();
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    catalog.push({
      image: shortImage,
      sourceFile,
      uuid,
      name,
      slug: `${slugify(spec.name)}-${uuid.slice(0, 8)}`,
      price: spec.price || 2000 + (idx % 2) * 100,
      brand: spec.brand || 'Prince Esquire',
      color: spec.color || 'Brown',
      featured: Boolean(spec.featured),
      description: spec.description,
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} belts`);
  console.log('Written:', OUT_JSON);
};

main();
