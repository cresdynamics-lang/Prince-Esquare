/**
 * Build casual shoes catalog from Cursor assets.
 *
 * Usage:
 *   node scripts/generate-casual-specs.js
 *   node scripts/build-casual-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'casual-shoes-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'casual-shoes.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'casual-shoes-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const CASUAL_ALLOWLIST = [
  /^_Nike$/i,
  /^Men_Fashion_Patchwork_Breathable/i,
  /^Men_Anti-slip_Litchi/i,
  /^Nike$/i,
  /^_Sneakers_Lacoste_en_color_beige_/i,
  /^972566482026902917$/,
  /^894879388445610725$/,
  /^938085797393764504$/,
  /^You_will_never_be_able/i,
  /^Men_s_New_Korean_Style_Versatile/i,
  /^1140325568130478566/i,
  /^the_beautifull_and_soft_shoes_/i,
  /^922815779907631890$/,
  /^758856605984710764$/,
  /^599401031692055892$/,
  /^Hanley_Leather_Shoes_-_Khaki/i,
  /^Raguler_shoe_for_men/i,
  /^Tommy_luxury_sneakers/i,
  /^922815779911272724$/,
  /^930204498047598083$/,
  /^922815779912263329$/,
  /^Click_Buy_/i,
  /^_indian/i,
  /^1017954322005851268$/,
  /^Classic_Western_elegance_meets_modern_comfort_/i,
  /^shoes_on_heavy_demand/i,
  /^Men_Running_Shoes_Outdoor_Walking/i,
  /^download__12_-616bc042/i,
  /^Luxury_timberland_men_shoe/i,
  /^709387378835499795$/,
  /^922815779907187747$/,
  /^Afghan/i,
  /^Temu_Shop_like_a_Billionaire/i,
  /^Men_s_shoes_-_Designer_footwear/i,
  /^New_Men_s_Skateboard_Shoes/i,
  /^___Nike_Air_Force_1_Low/i,
  /^1080582504344820100$/,
  /^581175526942018731$/,
  /^SHEIN__1_/i,
  /^709387378830554076$/,
  /^Hermes_Moccasins_and_Derbies/i,
  /^CONTACT_US_FOR_WHOLESALE/i,
  /^846606429998996404$/,
  /^876794621182876355$/,
  /^1148417973749969407$/,
  /^Wa__1__304__955-8246/i,
  /^794603928028600309$/,
  /^Zapatillas_Lacoste_L-Spin_Evo_/i,
  /^___Size__40__41__42/i,
  /^349451252355834662$/,
  /^download__13_/i,
  /^759489924671366362$/,
  /^Bold_western_charm_with_a_modern_edge/i,
  /^Kate_luxury_boutique/i,
  /^T_nis_Casual_Preto_RS6/i,
];

const SKIP_PATTERNS = [
  /boys_shoes/i,
  /trouser/i,
  /chino/i,
  /khaki.*pant/i,
  /jean/i,
  /denim/i,
  /suit/i,
  /blazer/i,
  /shirt/i,
  /tuxedo/i,
  /boot(?!.*timber)/i,
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
    .replace(/1140325568130478566__1_/, '1140325568130478566_dup')
    .replace(/Classic_Western_elegance_meets_modern_comfort___1_/, 'Classic_Western_dup')
    .replace(/922815779911272724__1_/, '922815779911272724_dup')
    .replace(/Raguler_shoe_for_men__1_/, 'Raguler_dup')
    .replace(/_Sneakers_Lacoste_en_color_beige___1_/, 'Lacoste_beige_dup');

const isCasualAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  return CASUAL_ALLOWLIST.some((re) => re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['White', /\bwhite\b|korean|nike|lacoste.*beige|spin.evo/i],
    ['Beige', /\bbeige\b|beige|wa__/],
    ['Navy', /\bnavy\b/],
    ['Burgundy', /\bburgundy|maroon|santoni/i],
    ['Grey', /\bgrey|gray|charcoal|loro/i],
    ['Brown', /\bbrown\b|timberland|western|chocolate|roadster/i],
    ['Tan', /\btan\b|khaki|hanley/i],
    ['Black', /\bblack\b|preto|afghan|indian|shein|temu/i],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Black';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/slip.on|timberland/i.test(t)) return 'slip-on';
  if (/loafer|moccasin|hermes|raguler|tassel|penny|western|loro/i.test(t)) return 'hybrid';
  if (/running|skateboard|patchwork|sport/i.test(t)) return 'sport';
  return 'sneaker';
};

const styleLabel = (style) => {
  const map = {
    sneaker: 'CASUAL SNEAKERS',
    hybrid: 'SNEAKER LOAFERS',
    'slip-on': 'SLIP-ON SNEAKERS',
    sport: 'SPORT SNEAKERS',
  };
  return map[style] || 'CASUAL SHOES';
};

const buildName = (color, style, idx, label) => {
  const base = `${color.toUpperCase()} ${styleLabel(style)}`;
  if (/^\d+$/.test(label) || /^922815779/.test(label)) {
    return `${base} — PE-${String(idx).padStart(3, '0')}`;
  }
  return base.replace(/\s+/g, ' ').trim();
};

const buildDescription = (meta) => {
  const intro = `Prince Esquire ${meta.color.toLowerCase()} ${meta.style.replace(/-/g, ' ')} shoes — relaxed casual footwear for everyday style.`;
  const features = [
    `Premium ${meta.color.toLowerCase()} upper construction.`,
    `${styleLabel(meta.style)} profile for modern casual wear.`,
    'Comfortable cushioned interior.',
    'Durable rubber sole for daily use.',
    'Available EU sizes 40–46.',
  ];
  return `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable EU sizes 40–46. Styled at Prince Esquire for the modern gentleman.`;
};

const priceFor = (style, idx, label) => {
  if (/nike|tommy|santoni|hermes|loro|timberland|lacoste/i.test(label)) {
    return 16800 + (idx % 8) * 1500;
  }
  const bases = { sneaker: 13800, hybrid: 15800, 'slip-on': 16500, sport: 14200 };
  const base = bases[style] || 14500;
  return Math.min(base + (idx % 9) * 350, 28000);
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
    .filter(isCasualAsset)
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
    const shortImage = `casual-${String(idx).padStart(3, '0')}.png`;
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

    catalog.push({
      image: shortImage,
      sourceFile,
      name,
      slug: resolvedSlug,
      price: spec?.price || priceFor(style, idx, label),
      brand: spec?.brand || 'Prince Esquire',
      color,
      subCategory: 'Casual',
      style,
      featured: spec?.featured ?? idx % 7 === 0,
      description: spec?.description || buildDescription({ color, style }),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} casual shoes`);
  console.log('Written:', OUT_JSON);
};

main();
