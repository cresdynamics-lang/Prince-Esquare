/**
 * Build jeans catalog from Cursor assets.
 *
 * Usage:
 *   node scripts/generate-jeans-specs.js
 *   node scripts/build-jeans-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'jeans-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'jeans.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'jeans-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const JEANS_ALLOWLIST = [
  /^878272364854410925$/,
  /^283234264060471160$/,
  /^Men_s_BeanFlex__Jeans__Classic_Fit/i,
  /^7_For_All_Mankind_Austyn/i,
  /^KOTTY_Mens_Regular_Fit/i,
  /^MAC_Jeans_Men_s_Straight/i,
  /^Men_s_BeanFlex__Jeans__Standard_Fit_Slim_Straight/i,
  /^Men_s_BeanFlex__Jeans__Standard_Fit__Denim/i,
  /^Men_s_Denim$/i,
  /^Men_s_Double_L__Jeans__Classic_Fit__Cotton__1_/i,
  /^Men_s_Double_L__Jeans__Classic_Fit__Cotton$/i,
  /^Men_s_Business_Casual_Lyocell/i,
  /^Men_s_Double_LA_Jeans/i,
  /^Men_s_BeanFlexa$/i,
  /^Classic_Light_Blue_Wide_Leg/i,
  /^Men_s_BeanFlex_Jeans$/i,
  /^Qazel_Vorrlon/i,
  /^Mens_Next_Classic_Stretch/i,
  /^JACK___JONES/i,
  /^Men_s_Double_L__Jeans__Classic_Fit__Straight_Leg/i,
  /^Diesel_Jeans/i,
  /^Reiss_Light_Washed_Grey/i,
  /^MAC_JEANS_Macflexx/i,
  /^MAINE_REGULAR-FIT/i,
];

const SKIP_PATTERNS = [
  /suit/i,
  /blazer/i,
  /tuxedo/i,
  /three.piece/i,
  /two.piece/i,
  /trouser(?!.*jean)/i,
  /chino/i,
  /khaki/i,
  /linen(?!.*jean)/i,
  /formal.pant/i,
  /dress.pant/i,
  /luxire/i,
  /windowpane/i,
  /moleskin/i,
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
    .replace(/Men_s_BeanFlexa/, 'Men_s_BeanFlex_Jeans_Extra')
    .replace(/Men_s_BeanFlex_Jeans$/, 'Men_s_BeanFlex_Jeans_Base')
    .replace(/Men_s_BeanFlex__Jeans__Standard_Fit__Denim/, 'BeanFlex_Standard')
    .replace(/Men_s_BeanFlex__Jeans__Standard_Fit_Slim_Straight/, 'BeanFlex_SlimStraight')
    .replace(/Men_s_BeanFlex__Jeans__Classic_Fit/, 'BeanFlex_Classic');

const isJeansAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  if (/jean|denim/i.test(filename) || /jean|denim/i.test(label)) return true;
  return JEANS_ALLOWLIST.some((re) => re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['Black', /\bblack\b|macflexx|dark.denim/],
    ['Grey', /grey|gray|reiss/],
    ['Light Blue', /light.blue|wide.leg|diesel|lyocell|summer/],
    ['Indigo', /indigo|dark|mac.jeans/i],
    ['Blue', /blue|denim|bean|double|jack|maine|kotty|next|qazel|878272|7_for/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Blue';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/wide.leg/i.test(t)) return 'wide-leg';
  if (/skinny|qazel/i.test(t)) return 'skinny';
  if (/slim/i.test(t)) return 'slim';
  if (/stretch|beanflex|maine|next/i.test(t)) return 'stretch';
  if (/straight|mac|frame|878272/i.test(t)) return 'straight';
  return 'classic';
};

const inferFit = (label) => {
  const t = label.toLowerCase();
  if (/skinny|qazel/i.test(t)) return 'skinny';
  if (/slim|reiss/i.test(t)) return 'slim';
  if (/relaxed|austyn|wide/i.test(t)) return 'relaxed';
  if (/regular|standard|maine|jack/i.test(t)) return 'regular';
  if (/classic|double/i.test(t)) return 'classic';
  return 'regular';
};

const buildName = (color, style, fit) => {
  const styleNames = {
    straight: 'STRAIGHT',
    classic: 'CLASSIC',
    slim: 'SLIM',
    skinny: 'SKINNY',
    'wide-leg': 'WIDE-LEG',
    stretch: 'STRETCH',
    regular: 'REGULAR',
    lightweight: 'SUMMER',
  };
  const fitNames = { skinny: 'SKINNY-FIT', slim: 'SLIM-FIT', relaxed: 'RELAXED-FIT', classic: 'CLASSIC-FIT', regular: 'REGULAR-FIT' };
  return `${color.toUpperCase()} ${fitNames[fit] || ''} ${styleNames[style] || 'DENIM'} JEANS`
    .replace(/\s+/g, ' ')
    .trim();
};

const buildDescription = (meta) => {
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.style.replace(/-/g, ' ')} denim jeans — ${meta.fit} fit cotton denim for casual and smart-casual wear.`;
  const features = [
    `Premium denim in ${meta.color.toLowerCase()} wash.`,
    `${meta.fit.charAt(0).toUpperCase() + meta.fit.slice(1)} fit five-pocket styling.`,
    'Durable rivet-reinforced pocket construction.',
    'Belt loops with button and zip fly.',
    'Available waist sizes 30–40.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable waist sizes 30–40. Styled at Prince Esquire for weekend, casual, and smart-casual wear.`;
};

const priceFor = (style, fit, idx) => {
  let base = 4800;
  const styleBump = { 'wide-leg': 900, skinny: 0, slim: 400, stretch: 300, straight: 500 };
  const fitBump = { skinny: 0, slim: 500, relaxed: 400, classic: 300, regular: 200 };
  base += styleBump[style] || 0;
  base += fitBump[fit] || 0;
  return Math.min(base + (idx % 7) * 200, 7200);
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
    .filter(isJeansAsset)
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
    const shortImage = `jeans-${String(idx).padStart(3, '0')}.png`;
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
      subCategory: 'Jeans',
      style,
      fit,
      featured: spec?.featured ?? idx % 5 === 0,
      description: spec?.description || buildDescription({ color, style, fit }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} jeans`);
  console.log('Written:', OUT_JSON);
};

main();
