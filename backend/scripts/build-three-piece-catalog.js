/**
 * Build three-piece suit catalog from Cursor assets.
 * Copies images to backend/data/three-piece-suit-images/.
 *
 * Usage:
 *   node scripts/generate-three-piece-specs.js
 *   node scripts/build-three-piece-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'three-piece-suit-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'three-piece-suits.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'three-piece-suit-specs.json');

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

const THREE_PIECE_MARKERS = [
  /3.piece|3_piece|three.piece|three_piece|three.pieces/i,
  /yelekli|YELEK|waistcoat|blazer_vest|vest_pants/i,
  /Three_piece|Three_piece_suit/i,
  /Bespoke_Navy_Plaid_Three/i,
  /Champagne_Three/i,
  /Wedding_lock_Suit/i,
  /Men_s_Red_and_Cream_Three/i,
  /takim_elbise|tak_m_elbise/i,
  /Erkek_Yelekli|Erkek_Trend_Yelekli/i,
  /LAYDA_EM.*YELEK|ilaydaemir|ilayda_emir/i,
  /Bojoni.*3-Piece/i,
  /VIOSSI.*3-Piece/i,
  /Camel_Slim-Fit_Suit_3-Piece/i,
  /Blue_Slim-Fit_Suit_3-Piece/i,
  /Bordeaux_Slim-Fit_Suit_3-Piece/i,
  /Men_s_Royal_Blue_3-Piece/i,
  /Men_s_Navy_Blue_3_piece/i,
  /Mens_Suit_3_Piece/i,
  /Men_s_Suit_3_Piece/i,
  /Men_Suits_3_Piece/i,
  /3_piece_for_men/i,
  /3_piece_peak/i,
  /Suitania.*3_Piece/i,
  /Wedding_Business_Banquet/i,
  /Groomsman_Tuxedo.*3|3_Piece_Men_Suit/i,
];

const SUIT_CONTEXT = [
  /\bsuit\b/i,
  /tuxedo/i,
  /tak_m_elbise/i,
  /takim_elbise/i,
  /Mannequin_men_s_suit/i,
  /Eddie_s_Suit/i,
  /Navy_Blue_Suits_for_Men/i,
  /GENT_WITH/i,
  /VICLAN/i,
  /Embark_on_a_journey/i,
  /Stilinizde/i,
  /A_suit_isn_t/i,
  /Broken_suit/i,
  /Bespoke_Navy_Plaid/i,
  /Amazon_com__blue_plaid_suit/i,
  /Elegant_Men_Suit_Green/i,
  /Wedding_lock/i,
  /^10\d{15}$/,
  /^11\d{15}$/,
  /^3\d{17}$/,
  /^6\d{17}$/,
  /^7\d{17}$/,
  /^8\d{17}$/,
  /^9\d{17}$/,
];

const SKIP_PATTERNS = [
  /zanzea/i,
  /Women_s___Men_s_Clothing/i,
  /Stylish_Blazers_For_Women/i,
  /happy_new_month/i,
  /shirt/i,
  /polo/i,
  /shoe/i,
  /loafer/i,
  /trouser(?!s)/i,
  /2.piece|2_piece|two.piece|two_piece/i,
  /Color_Block_Concise_Daily_Suit_Jacket/i,
  /Jungle_Green_Pinstripe/i,
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

const hasThreePieceMarker = (filename, label) =>
  THREE_PIECE_MARKERS.some((re) => re.test(filename) || re.test(label));

const hasSuitContext = (filename, label) =>
  SUIT_CONTEXT.some((re) => re.test(filename) || re.test(label));

const isThreePieceAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) {
    if (!hasThreePieceMarker(filename, label)) return false;
  }
  if (hasThreePieceMarker(filename, label)) return true;
  if (hasSuitContext(filename, label) && !/2.piece|2_piece|two.piece|two_piece/i.test(label)) {
    return true;
  }
  return false;
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['Ivory', /ivory|champagne|cream|white/],
    ['Black', /\bblack\b|noir|charcoal black/],
    ['Navy', /\bnavy\b|midnight|steel blue|gent_with/],
    ['Grey', /\bgrey\b|gray|graphite|charcoal|dark.grey|dark_grey/],
    ['Green', /\bgreen\b|hunter|olive|forest|jungle/],
    ['Brown', /\bbrown\b|cognac|camel|tan|beige|taupe|kahverengi|bordeaux/],
    ['Burgundy', /burgundy|wine|maroon|bordeaux/],
    ['Red', /\bred\b|scarlet/],
    ['Blue', /\bblue\b|royal blue|electric/],
    ['Camel', /camel|champagne/],
    ['Tan', /\btan\b/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Classic';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/double.breasted|double_breasted/i.test(t)) return 'double-breasted';
  if (/peak.lapel|peak_lapel/i.test(t)) return 'peak-lapel';
  return 'single-breasted';
};

const inferPattern = (label) => {
  const t = label.toLowerCase();
  if (/houndstooth/i.test(t)) return 'houndstooth';
  if (/windowpane|plaid|check/i.test(t)) return 'plaid';
  if (/pinstripe|pin.stripe|striped/i.test(t)) return 'pinstripe';
  if (/stripe/i.test(t)) return 'stripe';
  return 'solid';
};

const inferVestStyle = (label) => {
  const t = label.toLowerCase();
  if (/double.breasted|double_breasted/i.test(t) && /vest|yelek|waistcoat|three/i.test(t)) {
    return 'double-breasted waistcoat';
  }
  return 'single-breasted waistcoat';
};

const buildName = (color, style, pattern) => {
  const styleWord =
    style === 'double-breasted'
      ? 'DOUBLE-BREASTED'
      : style === 'peak-lapel'
        ? 'PEAK LAPEL'
        : 'SINGLE-BREASTED';
  const patternNames = {
    solid: '',
    pinstripe: 'PINSTRIPE ',
    stripe: 'STRIPE ',
    plaid: 'PLAID ',
    houndstooth: 'HOUNDSTOOTH ',
  };
  const pat = patternNames[pattern] || '';
  return `${color.toUpperCase()} ${pat}${styleWord} THREE-PIECE SUIT`.replace(/\s+/g, ' ').trim();
};

const buildDescription = (meta) => {
  const styleLabel =
    meta.style === 'double-breasted'
      ? 'double-breasted'
      : meta.style === 'peak-lapel'
        ? 'peak-lapel'
        : 'single-breasted';
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.pattern !== 'solid' ? meta.pattern + ' ' : ''}${styleLabel} three-piece suit — a complete jacket, waistcoat, and trouser ensemble tailored for weddings, galas, and executive occasions.`;
  const features = [
    'Complete three-piece set: coordinated jacket, waistcoat (vest), and trousers.',
    meta.style === 'peak-lapel'
      ? 'Sharp peak lapels on the jacket for a commanding formal silhouette.'
      : meta.style === 'double-breasted'
        ? 'Double-breasted jacket with structured lapels and premium tailoring.'
        : 'Single-breasted jacket with clean two-button closure and notch lapels.',
    `${meta.vestStyle.charAt(0).toUpperCase() + meta.vestStyle.slice(1)} in matching ${meta.color.toLowerCase()} suiting.`,
    `Premium ${meta.pattern !== 'solid' ? meta.pattern : 'solid'} fabric with refined drape and structure.`,
    'Flap hip pockets, welt breast pocket, and tailored trouser with sharp crease.',
    'Available sizes S–3XL as a full three-piece coordinated set.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes S–3XL (jacket, waistcoat & trouser set). Tailored at Prince Esquire for weddings, galas, and executive occasions.`;
};

const priceFor = (style, pattern, idx) => {
  let base = 32000;
  if (style === 'double-breasted' || style === 'peak-lapel') base += 5000;
  const bump = { pinstripe: 3000, stripe: 3500, plaid: 3200, houndstooth: 4000 };
  base += bump[pattern] || 0;
  return Math.min(base + (idx % 11) * 500, 52000);
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
    .filter(isThreePieceAsset)
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
    const shortImage = `suit3-${String(suitIdx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const style = spec?.style || inferStyle(label);
    const pattern = spec?.pattern || inferPattern(label);
    const vestStyle = spec?.vestStyle || inferVestStyle(label);
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
      subCategory: 'Three piece',
      style,
      pattern,
      vestStyle,
      featured: spec?.featured ?? suitIdx % 8 === 0,
      description:
        spec?.description ||
        buildDescription({ color, style, pattern, vestStyle }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} three-piece suits`);
  console.log('Written:', OUT_JSON);
};

main();
