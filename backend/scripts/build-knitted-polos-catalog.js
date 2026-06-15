/**
 * Build knitted polos catalog from Cursor assets batch.
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'knitted-polos-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'knitted-polos.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'knitted-polos-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const BATCH_UUIDS = new Set(Object.keys(SPECS));

const SKIP_UUIDS = new Set([
  'faf2a6e8','44898299','5f50fa57','00cd2eaa','d287bec1','22bbeb7e','0ea1aa3c','08276f6f','8e3e72c7',
  '29ea312e','8402fd96','da765d73','be2ca3a4','f309064a','c5760230','c520ad44',
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
  if (!Object.keys(SPECS).length) {
    console.error('Missing specs. Run: node scripts/generate-knitted-polos-specs.js');
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
    .sort((a, b) => extractUuid(a).localeCompare(extractUuid(b)));

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
    const shortImage = `knit-polo-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    let name = spec.name.toUpperCase();
    if (seenNames.has(name)) name = `${name} - PE-${String(idx).padStart(3, '0')}`;
    seenNames.add(name);

    catalog.push({
      image: shortImage,
      sourceFile,
      uuid,
      name,
      slug: `${slugify(name)}-${uuid.slice(0, 8)}`,
      price: spec.price,
      brand: spec.brand || 'Prince Esquire',
      color: spec.color || 'Natural',
      subCategory: 'Knitted Polos',
      featured: Boolean(spec.featured),
      description: spec.description,
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} knitted polos`);
  console.log('Written:', OUT_JSON);
};

main();
