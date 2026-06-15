/**
 * Build loafers catalog from Cursor assets.
 *
 * Usage:
 *   node scripts/generate-loafers-specs.js
 *   node scripts/build-loafers-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'loafers-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'loafers.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'loafers-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const LOAFERS_ALLOWLIST = [
  /^388294799135456823$/,
  /^2026_New_Men_s_Slip-On_Soft_Bottom/i,
  /^514747432419469270$/,
  /^374643262752582472$/,
  /^617415430177092793$/,
  /^661747739003182776$/,
  /^179721841371628984$/,
  /^623607879658626763$/,
  /^679551031297680244$/,
  /^709387378804067091$/,
  /^421579215140770371$/,
  /^476255729341462660$/,
  /^709387378807195199$/,
  /^774337729693678855$/,
  /^684336105899676398$/,
  /^804877764684492921$/,
  /^722546333974432825$/,
  /^885168501767524537$/,
  /^922815779909717988$/,
  /^922815779912381424$/,
  /^989103136880968723$/,
  /^1030831802219437940$/,
  /^1046875875890779477$/,
  /^922815779909718025$/,
  /^1076782592139667195$/,
  /^1081426929293768184$/,
  /^1130122100224689195$/,
  /^922815779909717998$/,
  /^1081426929293768189$/,
  /^894668282226275667$/,
  /^download__12_/i,
  /^branded_men_s_shoes_/i,
  /^922815779909719483$/,
  /^Gucci_men_s_loafers/i,
  /^922815779909718038$/,
  /^Gucci_loafers_men/i,
  /^879398264724718358$/,
  /^922815779909876285$/,
  /^941674603351394122$/,
  /^1130122100220955430$/,
  /^1066790230463331217$/,
  /^885379607987694301$/,
  /^Loafers$/i,
  /^834995587179613707$/,
  /^hello_for_nice_shoose/i,
  /^1076782592139667177$/,
  /^Louis_Vuitton/i,
  /^Fashion_Classic_Thick_Sole/i,
  /^Men_Corporate_Shoes/i,
  /^Men_s_Casual_Shoes_for_Sale/i,
  /^Men_s_Luxury_Native_Attire/i,
  /^men_s_designer_slip-on_loafers/i,
  /^Minimal_Black_Loafers/i,
  /^Shoe$/i,
  /^Shoes_-_Christian_Louboutin/i,
  /^SLIP-ON_SNEAKER_LOAFERS/i,
  /^SHOESMALL_Men_s_Loafers/i,
  /^Verdano_Suede_Loafers/i,
  /^The_Shopping_Cart/i,
  /^Wa__1__304__955$/,
  /^Life_is_fashion/i,
  /^Black_Chunky_Penny_Loafers/i,
];

const SKIP_PATTERNS = [
  /trouser/i,
  /chino/i,
  /khaki/i,
  /jean/i,
  /denim/i,
  /suit/i,
  /blazer/i,
  /shirt/i,
  /tuxedo/i,
];

const findSpec = (label) => {
  if (SPECS[label]) return SPECS[label];
  const keys = Object.keys(SPECS)
    .filter((k) => label === k || (k.length > 3 && label.startsWith(k)))
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
  label
    .replace(/__\d+_?$/, '')
    .replace(/_+$/, '')
    .replace(/922815779909717988/, '922815779909717988_a')
    .replace(/922815779909717998/, '922815779909717998_b');

const isLoafersAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  if (/loafer|slip.on|penny|horsebit|driving|moccasin|gucci|louboutin|louis.vuitton/i.test(label)) {
    return true;
  }
  return LOAFERS_ALLOWLIST.some((re) => re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['White', /\bwhite\b|bee/],
    ['Navy', /\bnavy\b|verdano/],
    ['Brown', /\bbrown\b|tan|cognac|chocolate|corporate/],
    ['Beige', /\bbeige\b|sand|wa__/],
    ['Tan', /\btan\b/],
    ['Black', /\bblack\b|minimal|chunky|gucci|louboutin|corporate|shoe$/],
    ['Grey', /\bgrey|gray/],
    ['Burgundy', /\bburgundy|wine/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Black';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/horsebit|gucci/i.test(t)) return 'horsebit';
  if (/penny|chunky/i.test(t)) return 'penny';
  if (/driving|moccasin|gommino|shoesmall|verdano/i.test(t)) return 'driving';
  if (/sneaker|soft.bottom|casual/i.test(t)) return 'sneaker-loafer';
  if (/smoking|glitter|native/i.test(t)) return 'smoking';
  if (/bit|fashion.classic/i.test(t)) return 'bit';
  if (/louis.vuitton|plaid|tweed/i.test(t)) return 'penny';
  if (/crystal|stud/i.test(t)) return 'horsebit';
  return 'classic';
};

const styleLabel = (style) => {
  const map = {
    horsebit: 'HORSEBIT',
    penny: 'PENNY',
    driving: 'DRIVING',
    'sneaker-loafer': 'SNEAKER',
    smoking: 'SMOKING',
    bit: 'BIT',
    classic: 'CLASSIC',
  };
  return map[style] || 'LOAFER';
};

const buildName = (color, style, idx, label) => {
  const base = `${color.toUpperCase()} ${styleLabel(style)} LOAFERS`;
  if (/^\d+$/.test(label)) return `${base} — PE-${String(idx).padStart(3, '0')}`;
  return base.replace(/\s+/g, ' ').trim();
};

const buildDescription = (meta) => {
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.style.replace(/-/g, ' ')} loafers — slip-on elegance for smart-casual and formal wear.`;
  const features = [
    `Premium ${meta.color.toLowerCase()} upper construction.`,
    `${styleLabel(meta.style)} loafer styling with refined silhouette.`,
    'Comfortable slip-on entry with cushioned interior.',
    'Durable sole for daily wear.',
    'Available EU sizes 40–46.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable EU sizes 40–46. Styled at Prince Esquire for the modern gentleman.`;
};

const priceFor = (style, idx) => {
  const luxury = /gucci|louis.vuitton|louboutin/i;
  if (luxury.test(String(idx))) return 108000 + (idx % 5) * 2500;

  const bases = {
    horsebit: 22000,
    penny: 18500,
    driving: 16800,
    'sneaker-loafer': 16500,
    smoking: 24000,
    bit: 19500,
    classic: 15200,
  };
  const base = bases[style] || 15800;
  return Math.min(base + (idx % 9) * 400, 32000);
};

const isLuxuryLabel = (label) => /gucci|louis.vuitton|louboutin/i.test(label);

const main = () => {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('Assets not found:', ASSETS_DIR);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.startsWith('c__Users_Spine') && f.endsWith('.png'))
    .filter(isLoafersAsset)
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
    const shortImage = `loafers-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const style = spec?.style || inferStyle(label);
    const name = (spec?.name || buildName(color, style, idx, label)).toUpperCase();

    let slug = slugify(spec?.slug || name);
    let resolvedSlug = slug;
    let sn = 2;
    while (usedSlugs.has(resolvedSlug)) {
      resolvedSlug = `${slug}-${sn}`;
      sn += 1;
    }
    usedSlugs.add(resolvedSlug);

    let price = spec?.price;
    if (!price) {
      price = isLuxuryLabel(label)
        ? 108000 + (idx % 6) * 3000
        : priceFor(style, idx);
    }

    catalog.push({
      image: shortImage,
      sourceFile,
      name,
      slug: resolvedSlug,
      price,
      brand: spec?.brand || 'Prince Esquire',
      color,
      subCategory: 'Loafers',
      style,
      featured: spec?.featured ?? idx % 6 === 0,
      description: spec?.description || buildDescription({ color, style }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} loafers`);
  console.log('Written:', OUT_JSON);
};

main();
