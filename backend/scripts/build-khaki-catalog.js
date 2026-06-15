/**
 * Build khaki trouser catalog from Cursor assets.
 * Copies images to backend/data/khaki-trouser-images/.
 *
 * Usage:
 *   node scripts/generate-khaki-specs.js
 *   node scripts/build-khaki-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'khaki-trouser-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'khaki-trousers.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'khaki-trouser-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const KHAKI_ALLOWLIST = [
  /^508132770466494258$/,
  /^387380005458687729$/,
  /^514888169897601167$/,
  /^Beige_caqui$/,
  /^Haband_Pants/i,
  /^Khaki_Button_Fly_Chino_Trousers$/,
  /^Luxire__1_/,
  /^Pelago_Khaki/i,
  /^Men_s_Casual_Pants___REI_Co/i,
  /^Page_Not_Found$/,
  /^Plaid_Plain_Men_s_Dress_Pants/i,
  /^Walker_Slater_Moleskin_Trousers$/,
  /^513340057535417570$/,
  /^847028642443314371$/,
  /^121526889938230082$/,
  /^Men_s_Comfort_Stretch_Chino_Pants/i,
  /^Dickies_874_WORK_PANT/i,
];

const KHAKI_INCLUDE = [
  /khaki/i,
  /chino/i,
  /caqui/i,
  /moleskin/i,
  /trouser/i,
  /\bpant/i,
  /dickies/i,
  /haband/i,
  /luxire/i,
  /pelago/i,
  /walker_slater/i,
  /^508132770466/,
  /^387380005458/,
  /^514888169897/,
  /^513340057535/,
  /^847028642443/,
  /^121526889938/,
];

const SKIP_PATTERNS = [
  /suit/i,
  /blazer/i,
  /tuxedo/i,
  /waistcoat/i,
  /vest/i,
  /shirt/i,
  /polo/i,
  /shoe/i,
  /loafer/i,
  /three.piece/i,
  /two.piece/i,
  /2.piece/i,
  /rockefeller/i,
  /champagne_three/i,
];

const findSpec = (label) => {
  if (SPECS[label]) return SPECS[label];
  const keys = Object.keys(SPECS)
    .filter((k) => label === k || (k.length > 4 && label.startsWith(k)))
    .sort((a, b) => b.length - a.length);
  return keys.length ? SPECS[keys[0]] : null;
};

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const extractLabel = (filename) => {
  const base = filename.replace(
    /^c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_/,
    ''
  );
  return base.replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i, '');
};

const normalizeLabel = (label) =>
  label.replace(/__\d+_?$/, '').replace(/_+$/, '');

const isKhakiAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  if (KHAKI_ALLOWLIST.some((re) => re.test(label))) return true;
  return KHAKI_INCLUDE.some((re) => re.test(filename) || re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['Olive', /olive|green khaki|sage/],
    ['Tobacco', /tobacco|moleskin|walker/],
    ['Grey', /grey|gray|textured light/],
    ['Beige', /beige|caqui|sand|cream|light beige/],
    ['Tan', /\btan\b|haband|pelago/],
    ['Khaki', /khaki|chino|dickies|cargo|rei/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Khaki';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/cargo|rei_co_op|page_not_found/i.test(t)) return 'cargo';
  if (/moleskin|walker/i.test(t)) return 'wide-leg';
  if (/elastic|haband/i.test(t)) return 'elastic-waist';
  if (/luxire|adjuster/i.test(t)) return 'side-adjuster';
  if (/5.pocket|pelago/i.test(t)) return 'five-pocket';
  if (/dickies|work/i.test(t)) return 'work';
  if (/dress|slim.fit|plaid_plain/i.test(t)) return 'dress';
  return 'flat-front';
};

const inferFit = (label) => {
  const t = label.toLowerCase();
  if (/slim|dress|plaid_plain/i.test(t)) return 'slim';
  if (/relaxed|haband|cargo|rei|dickies/i.test(t)) return 'relaxed';
  if (/wide|moleskin|walker/i.test(t)) return 'relaxed';
  if (/luxire/i.test(t)) return 'tailored';
  return 'regular';
};

const buildName = (color, style, fit) => {
  const styleNames = {
    'flat-front': 'FLAT-FRONT',
    cargo: 'CARGO',
    'wide-leg': 'WIDE-LEG',
    'elastic-waist': 'ELASTIC-WAIST',
    'side-adjuster': 'SIDE-ADJUSTER',
    'five-pocket': '5-POCKET',
    work: 'WORK',
    dress: 'DRESS',
  };
  const fitNames = { slim: 'SLIM-FIT', relaxed: 'RELAXED-FIT', tailored: 'TAILORED', regular: 'CLASSIC' };
  const s = styleNames[style] || 'KHAKI';
  const f = fitNames[fit] || '';
  return `${color.toUpperCase()} ${f} ${s} KHAKI TROUSERS`.replace(/\s+/g, ' ').trim();
};

const buildDescription = (meta) => {
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.style.replace(/-/g, ' ')} khaki trousers — ${meta.fit} fit cotton twill built for smart-casual, office, and weekend wear.`;
  const features = [
    `Premium cotton twill in ${meta.color.toLowerCase()}.`,
    `${meta.fit.charAt(0).toUpperCase() + meta.fit.slice(1)} fit with clean tailored finishing.`,
    'Belt loops with secure button-and-zip closure.',
    'Functional side pockets with reinforced stitching.',
    'Available waist sizes 30–40.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable waist sizes 30–40. Tailored at Prince Esquire for smart-casual, office, and weekend wear.`;
};

const priceFor = (style, fit, idx) => {
  let base = 5500;
  const styleBump = {
    cargo: 800,
    'side-adjuster': 2000,
    'wide-leg': 1500,
    dress: 1200,
    work: 600,
    'five-pocket': 700,
  };
  const fitBump = { slim: 400, tailored: 1800, relaxed: 0, regular: 200 };
  base += styleBump[style] || 0;
  base += fitBump[fit] || 0;
  return Math.min(base + (idx % 7) * 200, 8500);
};

const main = () => {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('Assets not found:', ASSETS_DIR);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.startsWith('c__Users_Spine') && f.endsWith('.png'))
    .filter(isKhakiAsset)
    .sort();

  const seenLabels = new Set();
  const usedSlugs = new Set();
  const catalog = [];
  let idx = 0;

  for (const sourceFile of files) {
    const label = extractLabel(sourceFile);
    const dedupeKey = normalizeLabel(label);
    if (seenLabels.has(dedupeKey)) continue;
    seenLabels.add(dedupeKey);

    idx += 1;
    const shortImage = `khaki-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const style = spec?.style || inferStyle(label);
    const fit = spec?.fit || inferFit(label);
    const name = (spec?.name || buildName(color, style, fit)).toUpperCase();

    let slug = slugify(spec?.slug || name);
    let resolvedSlug = slug;
    let sn = 2;
    while (usedSlugs.has(resolvedSlug)) {
      resolvedSlug = `${slug}-${sn}`;
      sn += 1;
    }
    usedSlugs.add(resolvedSlug);

    catalog.push({
      image: shortImage,
      sourceFile,
      name,
      slug: resolvedSlug,
      price: spec?.price || priceFor(style, fit, idx),
      brand: spec?.brand || 'Prince Esquire',
      color,
      subCategory: 'Khaki',
      style,
      fit,
      featured: spec?.featured ?? idx % 5 === 0,
      description: spec?.description || buildDescription({ color, style, fit }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} khaki trousers`);
  console.log('Written:', OUT_JSON);
};

main();
