/**
 * Build formal trouser catalog from Cursor assets.
 *
 * Usage:
 *   node scripts/generate-formal-specs.js
 *   node scripts/build-formal-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'formal-trouser-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'formal-trousers.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'formal-trouser-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const FORMAL_ALLOWLIST = [
  /^126523070765874279$/,
  /^309200330662136158$/,
  /^350788258470586343$/,
  /^1139903355717803560$/,
  /^387380005458687729$/,
  /^Adjustable_gentlemans_trouser/i,
  /^B_TAILOR/i,
  /^Bespoke_adjustable_trouser/i,
  /^grey_trouser$/i,
  /^Grey_Trousers$/i,
  /^Luxire__1_/i,
  /^Italian_Pants/i,
  /^Luxire_dress_pants_constructed_in_Minnis/i,
  /^Newly_latest_black/i,
  /^322922235782862159$/,
  /^Men_s_Fashion/i,
  /^Men_s_Office_Wear_Trouser/i,
  /^UNINUKOO_Mens_Dress_Pants_Slim_Fit.*__1_/i,
  /^Italian_Linen/i,
  /^545991154850721850$/,
  /^291748882097031250$/,
  /^SALMON_COLORED/i,
  /^Luxire_dress_pants_constructed_in_Chino/i,
  /^one$/i,
  /^Luxire_dress_pants__Button_fly/i,
  /^UNINUKOO_Mens_Dress_Pants_Slim_Fit_Solid_Color_Skinny_Trousers_Classic_Business_Casual_Wedding_Suit_Pants$/i,
  /^Luxire_Trousers/i,
  /^Luxire__2_/i,
  /^572520171376442866$/,
  /^UNINUKOO_Mens_Classic_Suit_Pants/i,
  /^Luxire-83142725/i,
];

const SKIP_PATTERNS = [
  /marco_stretch.*suit/i,
  /three.piece/i,
  /three.pieces/i,
  /two.piece/i,
  /2.piece/i,
  /blazer/i,
  /tuxedo/i,
  /waistcoat/i,
  /vest_pants/i,
  /rockefeller/i,
  /champagne_three/i,
  /ivory_blazer/i,
  /john.*two.piece/i,
  /best_italian_suit/i,
  /men_s_grey_double_breasted_slim_fit_suit/i,
  /men_s_suit_3_piece/i,
  /menseventwear_formal.*blazer/i,
  /bespoke_navy_plaid_three/i,
  /haband/i,
  /dickies/i,
  /pelago/i,
  /rei_co/i,
  /walker_slater/i,
  /plaid_plain.*chino/i,
  /khaki_button_fly/i,
  /men_s_comfort_stretch_chino/i,
  /page_not_found/i,
  /beige_caqui/i,
  /^508132770466/,
  /^514888169897/,
  /^513340057535/,
  /^847028642443/,
  /^121526889938/,
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
  label.replace(/__\d+_?$/, '').replace(/_+$/, '');

const isFormalAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  return FORMAL_ALLOWLIST.some((re) => re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['Navy', /navy|midnight|blue_wool|rich_blue/],
    ['Black', /\bblack\b/],
    ['Charcoal', /charcoal|grey_trouser|grey_trousers|mid_grey|mid-grey/],
    ['Grey', /\bgrey\b|\bgray\b|glen|plaid|houndstooth|windowpane|check/],
    ['Green', /green|emerald|forest/],
    ['Beige', /beige|oatmeal|tan|chino|cream|ivory|one$/],
    ['Salmon', /salmon/],
    ['Cream', /cream|ivory|off.white/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Charcoal';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/windowpane|boutique/i.test(t)) return 'windowpane';
  if (/side.adjuster|adjustable|bespoke_adjustable/i.test(t)) return 'side-adjuster';
  if (/button.fly/i.test(t)) return 'button-fly';
  if (/linen/i.test(t)) return 'linen';
  if (/plaid|glen|check|houndstooth/i.test(t)) return 'check';
  return 'flat-front';
};

const inferFit = (label) => {
  const t = label.toLowerCase();
  if (/slim|skinny/i.test(t)) return 'slim';
  if (/straight|classic|office/i.test(t)) return 'classic';
  if (/luxire|bespoke|b_tailor|adjustable/i.test(t)) return 'tailored';
  return 'regular';
};

const buildName = (color, style, fit) => {
  const styleNames = {
    'flat-front': 'FLAT-FRONT',
    windowpane: 'WINDOWPANE',
    'side-adjuster': 'SIDE-ADJUSTER',
    'button-fly': 'BUTTON-FLY',
    linen: 'LINEN',
    check: 'CHECK',
  };
  const fitNames = { slim: 'SLIM-FIT', classic: 'CLASSIC', tailored: 'TAILORED', regular: 'FORMAL' };
  return `${color.toUpperCase()} ${fitNames[fit] || ''} ${styleNames[style] || 'FORMAL'} TROUSERS`
    .replace(/\s+/g, ' ')
    .trim();
};

const buildDescription = (meta) => {
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.style.replace(/-/g, ' ')} formal trousers — ${meta.fit} fit suiting for boardrooms, weddings, and black-tie occasions.`;
  const features = [
    `Premium suiting fabric in ${meta.color.toLowerCase()}.`,
    `${meta.fit.charAt(0).toUpperCase() + meta.fit.slice(1)} formal silhouette.`,
    'Pressed centre crease and refined tailoring finish.',
    'Belt loops or side adjusters as styled.',
    'Available waist sizes 30–40.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable waist sizes 30–40. Tailored at Prince Esquire for boardrooms, weddings, and formal occasions.`;
};

const priceFor = (style, fit, idx) => {
  let base = 6500;
  const styleBump = {
    windowpane: 1200,
    'side-adjuster': 2200,
    check: 1400,
    linen: 900,
    'button-fly': 0,
  };
  const fitBump = { slim: 300, tailored: 2000, classic: 400, regular: 200 };
  base += styleBump[style] || 0;
  base += fitBump[fit] || 0;
  return Math.min(base + (idx % 8) * 250, 10500);
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
    .filter(isFormalAsset)
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
    const shortImage = `formal-${String(idx).padStart(3, '0')}.png`;
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
      subCategory: 'Formal',
      style,
      fit,
      featured: spec?.featured ?? idx % 6 === 0,
      description: spec?.description || buildDescription({ color, style, fit }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} formal trousers`);
  console.log('Written:', OUT_JSON);
};

main();
