/**
 * Build two-piece suit catalog from Cursor assets.
 * Copies images to backend/data/suit-images/ with short names.
 *
 * Usage:
 *   node scripts/generate-suit-specs.js
 *   node scripts/build-suits-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'suit-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'two-piece-suits.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'suit-product-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const findSpec = (label) => {
  if (SPECS[label]) return SPECS[label];
  const keys = Object.keys(SPECS)
    .filter((k) => label === k || (k.length > 4 && label.startsWith(k)))
    .sort((a, b) => b.length - a.length);
  return keys.length ? SPECS[keys[0]] : null;
};

const SUIT_INCLUDE = [
  /2.piece|2_piece|two.piece|two_piece/i,
  /\bsuit\b/i,
  /tuxedo/i,
  /traje/i,
  /rockefeller/i,
  /breasted_suit/i,
  /double.breasted/i,
  /double_breasted/i,
  /hunter_green/i,
  /parihil/i,
  /party_me_suits/i,
  /tak_m_elbise/i,
  /menseventwear/i,
  /john___men/i,
  /sage_slim/i,
  /peak_lapels/i,
  /polished_gentleman/i,
  /royal_look/i,
  /royalty/i,
  /vinci/i,
  /italian_suit/i,
  /classic_men_s_suits/i,
  /formal_affair/i,
  /essential_casual_suit/i,
  /jungle_green_pinstripe/i,
  /ivory_blazer/i,
  /blazer_jacket/i,
  /blue_single_breasted_blazer/i,
  /men_s_suits/i,
  /formal_men_s_suits/i,
  /formal_men_s_double/i,
  /custom_navy_double/i,
  /custom_white_two/i,
  /men_s_grey_double/i,
  /men_s_double.breasted_black/i,
  /black_double_breasted_tuxedo/i,
  /best_italian_suit/i,
  /^1094304409441296839$/,
  /^1109504058217038235$/,
  /^946952259163293468$/,
  /^232146555788501377$/,
  /^1017461740831971376$/,
  /^813251645250690441$/,
  /^443815738298794728$/,
  /^791929915733303502$/,
  /^436849232629363597$/,
  /^792774340695873461$/,
  /^286893438754773832$/,
  /^736479345343771559$/,
];

const SKIP_PATTERNS = [
  /3_piece|three.piece|three_piece/i,
  /happy_new_month/i,
  /house_of_timi/i,
  /^Suits-dc9ce66b/i,
  /shirt/i,
  /polo/i,
  /trouser/i,
  /shoe/i,
  /loafer/i,
  /blazer_for_men_business(?!.*suit)/i,
];

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

const isSuitAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  return SUIT_INCLUDE.some((re) => re.test(filename) || re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['Ivory', /ivory|white_two|custom_white/],
    ['Black', /\bblack\b|jet black|noir/],
    ['Navy', /\bnavy\b|midnight navy|steel blue|azul|cobalt|royal blue/],
    ['Grey', /\bgrey\b|gray|graphite|charcoal|sage/],
    ['Green', /\bgreen\b|hunter|olive|forest|jungle|teal|sage/],
    ['Brown', /\bbrown\b|cognac|camel|tan|beige|ochre/],
    ['Burgundy', /burgundy|wine|maroon|crimson/],
    ['Red', /\bred\b|scarlet/],
    ['Blue', /\bblue\b(?! green)/],
    ['Purple', /purple|violet|royalty/],
    ['Peach', /peach|apricot|salmon/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Classic';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/double.breasted|double_breasted|tuxedo/i.test(t)) return 'double-breasted';
  return 'single-breasted';
};

const inferPattern = (label) => {
  const t = label.toLowerCase();
  if (/houndstooth/i.test(t)) return 'houndstooth';
  if (/pinstripe|pin.stripe/i.test(t)) return 'pinstripe';
  if (/plaid|check/i.test(t)) return 'plaid';
  if (/stripe/i.test(t)) return 'stripe';
  return 'solid';
};

const buildName = (color, style, pattern) => {
  const styleWord = style === 'double-breasted' ? 'DOUBLE-BREASTED' : 'SINGLE-BREASTED';
  const patternNames = {
    solid: '',
    pinstripe: 'PINSTRIPE ',
    stripe: 'STRIPE ',
    plaid: 'PLAID ',
    houndstooth: 'HOUNDSTOOTH ',
  };
  const pat = patternNames[pattern] || '';
  return `${color.toUpperCase()} ${pat}${styleWord} TWO-PIECE SUIT`.replace(/\s+/g, ' ').trim();
};

const buildDescription = (meta) => {
  const styleLabel = meta.style === 'double-breasted' ? 'double-breasted' : 'single-breasted';
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.pattern !== 'solid' ? meta.pattern + ' ' : ''}${styleLabel} two-piece suit — tailored for weddings, galas, and executive occasions with premium structure and refined Kenyan style.`;
  const features = [
    meta.style === 'double-breasted'
      ? 'Double-breasted jacket with structured peak or notch lapels.'
      : 'Single-breasted jacket with clean two-button closure and notch lapels.',
    `Premium ${meta.pattern !== 'solid' ? meta.pattern : 'solid'} suiting in ${meta.color.toLowerCase()}.`,
    'Matching tailored trousers with sharp front crease.',
    'Flap hip pockets and welt breast pocket on jacket.',
    'Available sizes S–3XL as a coordinated jacket-and-trouser set.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes S–3XL (jacket & trouser set). Tailored at Prince Esquire for weddings, galas, and executive occasions.`;
};

const priceFor = (style, pattern, idx) => {
  let base = 22000;
  if (style === 'double-breasted') base += 4000;
  const bump = { pinstripe: 2500, stripe: 3000, plaid: 2800, houndstooth: 3500 };
  base += bump[pattern] || 0;
  return Math.min(base + (idx % 9) * 500, 42000);
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
    .filter(isSuitAsset)
    .sort();

  const seenLabels = new Set();
  const usedSlugs = new Set();
  const catalog = [];
  let suitIdx = 0;

  for (const sourceFile of files) {
    const label = extractLabel(sourceFile);
    const dedupeKey = normalizeLabel(label);
    if (seenLabels.has(dedupeKey)) continue;
    seenLabels.add(dedupeKey);

    suitIdx += 1;
    const shortImage = `suit-${String(suitIdx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const style = spec?.style || inferStyle(label);
    const pattern = spec?.pattern || inferPattern(label);
    const name = (spec?.name || buildName(color, style, pattern)).toUpperCase();

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
      price: spec?.price || priceFor(style, pattern, suitIdx),
      brand: spec?.brand || 'Prince Esquire',
      color,
      subCategory: 'Two piece',
      style,
      pattern,
      featured: spec?.featured ?? suitIdx % 9 === 0,
      description: spec?.description || buildDescription({ color, style, pattern }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} two-piece suits`);
  console.log('Written:', OUT_JSON);
};

main();
