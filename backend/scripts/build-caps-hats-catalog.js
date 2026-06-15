/**
 * Build caps & hats catalog from Cursor assets (user batch).
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'caps-hats-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'caps-hats.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'caps-hats-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

// UUID suffixes from the user-provided caps/hats image batch
const BATCH_UUIDS = new Set([
  '4cd3dceb', '49977031', 'b4147abd', 'aa809e09', '8d5c89cf', 'c087d42b', 'ef5cb397',
  'f3736506', '47cc321d', 'e21d4a2c', '26b147c4', '749089b0', '447900eb', '79f6bc9e',
  '8dd596fa', '3cdd5998', '04fc0422', 'fb6ea60e', '11ce834f', '5c6936c5', '42d4c6e0',
  '2e202ca3', '06309b7e', '491b60f5', '908c5621', '2c12c8d2', '1b013167', 'ab0c3bc2',
  '3e0384f8', 'c2ac555f', 'f158a061', '58205edd', 'b9ee382d', '6a0f947d', '67281c97',
  'c7b5bf2d', '67c37e1c', 'c0574fca', 'd4991295', '6c7ecc84', '8a740d28', '95ba92d5',
  '45b8a8ac', 'f94f80fc', '2486c9e5', '2d319ae3', 'e9b0aa48', 'eaf72e33', 'd5192543',
  'f0dd8447', '30aec11a', '7dc1a4a1', '5038413d', 'ef74b660', 'c42d4c5e', '19f66411',
  'a2add281', '305ad2a3', '963669ee', 'f1e8ae7d', '736ebfc0', '8342dcca', '98c2a929',
  'e4841eb7', 'f1b0ead2', '55808876', 'f8a074f8', 'afa79eb3', '9b6dd66f', '740269cc',
]);

const SKIP_UUIDS = new Set([
  'a2add281', // women's boutique
  '55808876', // style ideas collage
  '9b6dd66f', // Temu promo
  'f94f80fc', // accessories wall display
  'c087d42b', // historical hats collage
  '5c6936c5', // men's hats grid
  '6c7ecc84', // best selling promo
  'd5192543', // best selling promo
  'eaf72e33', // pink women's trucker
  '5038413d', // duplicate panama (keep b4147abd)
  '3e0384f8', // duplicate numeric cap
  'afa79eb3', // duplicate Montique fedora
]);

const SKIP_PATTERNS = [
  /women|mujer|femmes|donna|boutique|temu|best_selling|gentleman_wall|cool_men_cap_style/i,
  /whatsapp|drop_shipping|gucci_loafers/i,
];

const rich = (intro, features, fit, sizes = 'One Size (adjustable)') => {
  const text = [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Spot clean or hand wash cold. Air dry flat. Do not bleach. Reshape brim while damp if needed.',
    '',
    `${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');
  return text.replace(/\u2013|\u2014/g, '-').replace(/\u215d/g, '5/8');
};

const findSpec = (label) => {
  if (SPECS[label]) return SPECS[label];
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const nLabel = norm(label);
  const keys = Object.keys(SPECS)
    .filter((k) => {
      const nk = norm(k);
      return nLabel === nk || nLabel.includes(nk) || nk.includes(nLabel);
    })
    .sort((a, b) => norm(b).length - norm(a).length);
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

const extractUuid = (filename) => {
  const m = filename.match(/-([a-f0-9]{8})-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i);
  return m ? m[1] : null;
};

const normalizeLabel = (label) =>
  label
    .replace(/__\d+_?$/, '')
    .replace(/_+$/, '')
    .replace(/___1_$/, '')
    .replace(/__1_$/, '');

const isCapsHatsAsset = (filename) => {
  const uuid = extractUuid(filename);
  if (!uuid || !BATCH_UUIDS.has(uuid)) return false;
  if (SKIP_UUIDS.has(uuid)) return false;
  const label = extractLabel(filename);
  return !SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['White', /\bwhite\b|cream|natural|ivory/i],
    ['Black', /\bblack\b|noir/i],
    ['Navy', /\bnavy\b|marinho/i],
    ['Blue', /\bblue\b|brixton.*blue/i],
    ['Green', /\bgreen\b|academy/i],
    ['Grey', /\bgrey|gray|charcoal|magid/i],
    ['Beige', /\bbeige\b|khaki|tan|camel|neutral/i],
    ['Brown', /\bbrown\b|tobacco/i],
    ['Maroon', /\bmaroon\b|burgundy|wine/i],
    ['Cream', /\bcream\b|off.white/i],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Black';
};

const inferBrand = (label) => {
  const t = label.toLowerCase();
  if (/ralph|polo/i.test(t)) return 'Polo Ralph Lauren';
  if (/new.?era|9forty|9fifty|59fifty/i.test(t)) return 'New Era';
  if (/mitchell/i.test(t)) return 'Mitchell & Ness';
  if (/47_|_47_/i.test(t)) return '47 Brand';
  if (/new.balance/i.test(t)) return 'New Balance';
  if (/under.?armour/i.test(t)) return 'Under Armour';
  if (/brixton/i.test(t)) return 'Brixton';
  if (/montique/i.test(t)) return 'Montique';
  if (/beechfield/i.test(t)) return 'Beechfield';
  if (/american.eagle/i.test(t)) return 'American Eagle';
  if (/regitwow/i.test(t)) return 'Regitwow';
  if (/dodgers|yankees|mlb/i.test(t)) return 'New Era';
  return 'Prince Esquire';
};

const inferHatType = (label) => {
  const t = label.toLowerCase();
  if (/fedora|porkpie|panama|trilby|fedora|messer/i.test(t)) return 'Fedora';
  if (/trucker|filet|chap.u/i.test(t)) return 'Trucker Hat';
  if (/snapback|9fifty/i.test(t)) return 'Snapback Cap';
  if (/fitted|59fifty/i.test(t)) return 'Fitted Cap';
  if (/dad|cleanup|unstructured/i.test(t)) return 'Dad Hat';
  if (/driver|iso-chill|armourvent|performance/i.test(t)) return 'Performance Cap';
  if (/military/i.test(t)) return 'Military Cap';
  return 'Baseball Cap';
};

const buildName = (color, idx, label, spec) => {
  if (spec?.name) return spec.name;
  const hatType = spec?.hatType || inferHatType(label);
  const brand = inferBrand(label);
  if (/yankees|dodgers|mlb|new.era|mitchell|47_/i.test(label))
    return `${brand.toUpperCase()} ${color.toUpperCase()} ${hatType.toUpperCase()} - PE-${String(idx).padStart(3, '0')}`;
  if (hatType === 'Fedora' || hatType === 'Trilby' || hatType === 'Panama Hat')
    return `${color.toUpperCase()} ${hatType.toUpperCase()} - PE-${String(idx).padStart(3, '0')}`;
  return `${color.toUpperCase()} ${hatType.toUpperCase()} - PE-${String(idx).padStart(3, '0')}`;
};

const buildDescription = (meta, label) => {
  const hatType = meta.hatType.toLowerCase();
  const intro =
    hatType.includes('fedora') || hatType.includes('trilby') || hatType.includes('panama') || hatType.includes('porkpie')
      ? `Prince Esquire ${meta.color.toLowerCase()} ${hatType} — refined headwear combining classic silhouette with premium materials for distinguished casual and event styling.`
      : hatType.includes('trucker')
        ? `Prince Esquire ${meta.color.toLowerCase()} trucker hat — mesh-back casual cap with graphic front panel for streetwear and outdoor style.`
        : hatType.includes('performance') || hatType.includes('driver')
          ? `Prince Esquire ${meta.color.toLowerCase()} performance cap — lightweight breathable headwear built for sport, golf, and active casual wear.`
          : `Prince Esquire ${meta.color.toLowerCase()} ${hatType} — quality cotton headwear with comfortable fit for everyday casual and streetwear looks.`;

  return rich(
    intro,
    [
      `${meta.color} durable cotton, wool, or straw construction depending on style.`,
      hatType.includes('fedora') ? 'Pinch-front crown with structured brim profile.' : 'Classic six-panel crown with curved or flat brim.',
      /embroider|graphic|logo|letter|brooklyn|yankees|smile/i.test(label)
        ? 'Detailed front embroidery or graphic with quality stitching.'
        : 'Clean minimalist design suitable for versatile styling.',
      hatType.includes('trucker') ? 'Breathable mesh rear panels for ventilation.' : 'Embroidered ventilation eyelets on crown panels.',
      hatType.includes('snapback') || hatType.includes('fitted') ? 'Structured profile for a sharp streetwear silhouette.' : 'Adjustable strap or snap closure for flexible fit.',
      `${meta.brand} quality finish for lasting everyday wear.`,
    ],
    hatType.includes('fedora') || hatType.includes('panama')
      ? 'Pair with blazers, linen suits, overcoats, or smart casual separates. Ideal for weddings, travel, and warm-weather events.'
      : 'Wear with tees, hoodies, polos, and denim for effortless casual style. A versatile finishing piece for streetwear and weekend outfits.',
  );
};

const priceFor = (idx, label, spec) => {
  if (spec?.price) return spec.price;
  if (/ralph|mitchell|panama|brixton/i.test(label)) return 5500 + (idx % 4) * 500;
  if (/new.era|yankees|dodgers|9fifty|59fifty|9forty/i.test(label)) return 4200 + (idx % 5) * 300;
  if (/under.armour|new.balance|47_/i.test(label)) return 3500 + (idx % 4) * 250;
  if (/fedora|trilby|porkpie|felt/i.test(label)) return 3800 + (idx % 5) * 400;
  if (/trucker/i.test(label)) return 2200 + (idx % 3) * 200;
  return 1800 + (idx % 6) * 200;
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
    .filter(isCapsHatsAsset)
    .sort();

  const seenLabels = new Set();
  const seenNames = new Set();
  const usedSlugs = new Set();
  const catalog = [];
  let idx = 0;

  for (const sourceFile of files) {
    const label = extractLabel(sourceFile);
    const dedupeKey = normalizeLabel(label);
    if (seenLabels.has(dedupeKey)) continue;
    seenLabels.add(dedupeKey);

    idx += 1;
    const shortImage = `hat-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const hatType = spec?.hatType || inferHatType(label);
    const name = buildName(color, idx, label, spec).toUpperCase();
    if (seenNames.has(name)) continue;
    seenNames.add(name);

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
      hatType,
      featured: spec?.featured ?? idx % 6 === 0,
      description: spec?.description || buildDescription({ color, brand: spec?.brand || inferBrand(label), hatType }, label),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} caps & hats`);
  console.log('Written:', OUT_JSON);
};

main();
