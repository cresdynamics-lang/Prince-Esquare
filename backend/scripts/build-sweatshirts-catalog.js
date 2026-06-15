/**
 * Build sweatshirts catalog from Cursor assets.
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'sweatshirts-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'sweatshirts.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'sweatshirts-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const SWEATSHIRT_ALLOWLIST = [
  /^___Comfort_Meets_Color___Only_at_White_Bear/i,
  /^Men_Letter_Graphic_Thermal_Lined_Sweatshirt$/i,
  /^Classic_Casual_Crew_Neck_Sweatshirt/i,
  /^Winter_is_coming___Introducing_a_touch_of_timeless/i,
  /^904308800196153008$/,
  /^Men_Solid_Thermal_Lined_Sweatshirt/i,
  /^941674603348505062$/,
  /^Men_Solid_Round_Neck_Sweatshirt/i,
  /^powder_blue_sweatshirt/i,
  /^Men_Letter_Patched_Detail_Sweatshirt$/i,
  /^Solid_Drop_Shoulder_Thermal_Lined_Sweatshirt/i,
  /^1144829167802529640$/,
  /^738379301439125897$/,
  /^936467316289924956$/,
  /^Cartoon_Face_Print_Thermal_Lined_Sweatshirt/i,
  /^702069029446531525$/,
  /^756041856233583557$/,
  /^730709108319522200$/,
  /^SHEIN_UNISEX_Men_Letter_Graphic_Thermal_Sweatshirt/i,
  /^Manfinity_Dauomo_Men_Letter_Graphic_Thermal_Lined_Sweatshirt/i,
  /^756956649884521747$/,
  /^Sweatshirt$/i,
  /^484911084901836922$/,
  /^882564858203587713$/,
  /^40__OFF_the_Nike_Solo_Swoosh_Crewneck/i,
  /^Men_Letter_Graphic_Sweatshirt$/i,
  /^Novidade__Moletom_Vans/i,
  /^kaboom/i,
  /^702069029441412557$/,
  /^Manfinity_Homme_Plus_Size_Men_s_Solid_Color_Plain_Basic_Casual_Urban_Pullover/i,
  /^Men_Letter_Patched_Detail_Cable_Knit_Sweatshirt/i,
  /^702069029441412671$/,
  /^1023865296538593401$/,
  /^__________________________________/i,
  /^702069029442366440$/,
  /^702069029441442692$/,
  /^Men_s_Knitted_Casual_Patchwork_Round_Neck_Sweatshirt/i,
];

const SKIP_PATTERNS = [
  /TAKE_A_SCREENSHOT/i,
  /Cozy_Autumn_Home_Decor/i,
  /Blank_sweatshirt_display/i,
  /WHATSAPP/i,
  /trouser/i,
  /shoe/i,
  /polo/i,
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
    .replace(/___1_$/, '')
    .replace(/___2_$/, '');

const isSweatshirtAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  return SWEATSHIRT_ALLOWLIST.some((re) => re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['White', /\bwhite\b|new.york|blank|cream|off.white/i],
    ['Blue', /\bblue\b|thunder|navy|powder/i],
    ['Black', /\bblack\b|vans|adidas.*black|kaboom/i],
    ['Grey', /\bgrey|gray|colorblock|heather/i],
    ['Green', /\bgreen\b|sage/i],
    ['Burgundy', /\bburgundy|maroon|wine/i],
    ['Beige', /\bbeige\b|tan\b|khaki|los.angeles/i],
    ['Red', /\bred\b/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Black';
};

const inferBrand = (label) => {
  const t = label.toLowerCase();
  if (/nike/i.test(t)) return 'Nike';
  if (/adidas/i.test(t)) return 'Adidas';
  if (/vans/i.test(t)) return 'Vans';
  if (/shein/i.test(t)) return 'SHEIN';
  return 'Prince Esquire';
};

const buildName = (color, idx, label, spec) => {
  if (spec?.name) return spec.name;
  const brand = inferBrand(label);
  if (/nike|adidas|vans/i.test(label)) {
    return `${brand.toUpperCase()} ${color.toUpperCase()} CREWNECK SWEATSHIRT`;
  }
  if (/^\d+$/.test(label) || /^702069029/.test(label)) {
    return `${color.toUpperCase()} CREWNECK SWEATSHIRT — PE-${String(idx).padStart(3, '0')}`;
  }
  if (/thermal|graphic|letter|patched|cable|patchwork|solid|round.neck/i.test(label)) {
    const style = /graphic|letter|cartoon|patched|cable|patchwork/i.test(label) ? 'GRAPHIC' : 'CLASSIC';
    return `${color.toUpperCase()} ${style} CREWNECK SWEATSHIRT`;
  }
  return `${color.toUpperCase()} CREWNECK SWEATSHIRT`;
};

const buildDescription = (meta) => {
  const intro = `Prince Esquire ${meta.color.toLowerCase()} crewneck sweatshirt — comfortable fleece pullover for casual and streetwear styling.`;
  const features = [
    `Premium ${meta.color.toLowerCase()} cotton-blend fleece.`,
    'Classic ribbed crew neck, cuffs and hem.',
    'Soft brushed interior for warmth.',
    'Relaxed fit for everyday wear.',
    'Available sizes M–3XL.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes M–3XL. Styled at Prince Esquire.`;
};

const priceFor = (idx, label, spec) => {
  if (spec?.price) return spec.price;
  if (/nike|adidas|vans/i.test(label)) return 11500 + (idx % 6) * 400;
  if (/graphic|letter|cartoon|patched|cable|patchwork|thermal/i.test(label)) return 8800 + (idx % 7) * 300;
  return 7500 + (idx % 8) * 250;
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
    .filter(isSweatshirtAsset)
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
    const shortImage = `sweat-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const name = buildName(color, idx, label, spec).toUpperCase();

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
      price: priceFor(idx, label, spec),
      brand: spec?.brand || inferBrand(label),
      color,
      subCategory: 'Sweat-shirts',
      featured: spec?.featured ?? idx % 6 === 0,
      description: spec?.description || buildDescription({ color }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} sweatshirts`);
  console.log('Written:', OUT_JSON);
};

main();
