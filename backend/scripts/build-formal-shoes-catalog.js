/**
 * Build formal shoes catalog from Cursor assets batch.
 * Boots: KSh 7,000 | Normal officials: KSh 6,500
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'formal-shoes-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'formal-shoes.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'formal-shoes-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const BATCH_UUIDS = new Set(Object.keys(SPECS));

const SKIP_UUIDS = new Set([
  'df30b983', // designers collage
  '32560c8e', // shoe ideas collage
  'bf7e74e1', // tumblr lifestyle
  '0a22aec9', // old money promo
  '4f5c29e5', // portuguese promo text
  '302e2a4e', // portuguese promo text
  'a184c505', // renzo lucci promo
  'e7fd8ce3', // duplicate of 35af44f6
  '80a79673', // duplicate of b5136949
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
    console.error('Missing specs. Run: node scripts/generate-formal-shoes-specs.js');
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
    const shortImage = `fshoe-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    let name = spec.name.toUpperCase();
    if (seenNames.has(name)) name = `${name} - PE-${String(idx).padStart(3, '0')}`;
    seenNames.add(name);

    const slug = `${slugify(name)}-${uuid.slice(0, 8)}`;
    catalog.push({
      image: shortImage,
      sourceFile,
      uuid,
      name,
      slug,
      price: spec.price,
      brand: spec.brand || 'Prince Esquire',
      color: spec.color || 'Black',
      style: spec.style || 'Oxford',
      type: spec.type || 'official',
      subCategory: 'Formal shoes',
      featured: Boolean(spec.featured),
      description: spec.description,
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  const boots = catalog.filter((c) => c.type === 'boot').length;
  console.log(`Catalog: ${catalog.length} formal shoes (${boots} boots, ${catalog.length - boots} officials)`);
  console.log('Written:', OUT_JSON);
};

main();
