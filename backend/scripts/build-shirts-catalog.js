/**
 * Build formal/casual shirt catalog from Cursor assets.
 * Copies images to backend/data/shirt-images/ with short names.
 *
 * Usage: node scripts/build-shirts-catalog.js
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
const OUT_DIR = path.join(__dirname, '..', 'data', 'shirt-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'formal-casual-shirts.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'shirt-product-specs.json');

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

const PRESIDENTIAL = new Set(
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'presidential-shirts.json'), 'utf8')
  ).map((p) => p.image)
);

const SKIP_PATTERNS = [
  /facebook/i,
  /webgains/i,
  /temu_shop/i,
  /comment_link/i,
  /link_is_av/i,
  /link_below/i,
  /call_me_on_this/i,
  /unstitched_shirt_fabric/i,
  /women_s___men_s_clothing/i,
  /prices_may_vary/i,
  /this_shirt_s__________comment/i,
  /your_vintage_wears/i,
  /vintage_tshirt/i,
  /_images_image-/i,
  /freizeit-t-shirt/i,
  /freizeit_t-shirt/i,
];

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const extractLabel = (filename) => {
  const base = filename.replace(/^c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_/, '');
  return base.replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i, '');
};

const classify = (label) => {
  const t = label.toLowerCase();
  const casualHints = [
    'hawaiian', 'hawaii', 'aloha', 'tropical', 'palm', 'coconut', 'beach', 'summer',
    'floral print short', 'short sleeve', 'kurzarm', 'bowling', 'camp collar', 'cuban',
    'comic', 'graffiti', 'love print', 'graphic', 'zebra mix', 'jungle', 'holiday',
    'vintage red', 'lemon', 'hibiscus', 'monstera', 'abstract printed summer',
    'world map print', 'impasto', 'pop art', 'corduroy shirts', 'oxford shirt',
    'pocket oxford', 'rust orange plaid', 'striped shirt____262', 'letter graphic',
    'colorblock', 'random palm', 'dope lemon', 'pacific palm', 'dirk - camisa con estampado',
    'justin - camisa de verano', 'fashion mens hawaiian', 'nqyios', 'hodaweisolp',
    'plus size shirt collar short', 'irregular cut', 'tactical shirt', 'overshirt herren',
    'freizeithemd', 'casual floral', 'casual daily', 'casual simple solid color short',
    'casual collared short', 'hipster patchwork', 'aesthetic elegant retro teal',
    'aesthetic men s vertical striped shirt', 'all the men s fation', 'checked men s shirt with comfortable',
    'camisa para hombre de algod n oxford estilo casual', 'camisa de hombre de manga corta',
    'download__12_', 'g-00ec8738', 'lake como shirt', 'strip shirt', 'poly_cottan',
  ];
  const formalHints = [
    'dress shirt', 'formal', 'business', 'wedding', 'wrinkle free', 'wrinkle_free',
    'stretch slim fit dress', 'long sleeve dress', 'best formal', 'hottest men s dress shirts',
    'chemises de qualit', 'elegantes hemd', 'verfijnd overhemd', 'modern en elegant',
    'keldros', 'milaan', 'maxim', 'elastisch overhemd', 'knitterfreies elastisches slim-fit-hemd',
    'bolendo', 'jemitop', 'cigenu men s long sleeve dress', 'men s stripe print business',
    'men s royal luxury', 'herrenhemd langarm paisleymuster', 'men paisley print shirt without tee',
    'men solid collared button up shirt', 'men solid button up shirt', 'men shirt - white',
    'men shirt - red', 'striped with daffodils slim fit', 'the perfect minimal striped shirt',
    'classic navy striped shirt', 'men s premium striped shirts', 'men 1pc striped print shirt',
    'men vertical striped button up', 'men striped button front', 'men s stripe print business long sleeve',
    'link is available now', 'this is very nice shirt', 'camisa masculina de manga comprida',
    'zero yaa men s luxury gold prom', 'dress_shirt regular fit stretch stain shield',
    'men s full size button down collared neck shirt', 'men s full size button down embroidered shirt',
    'men lapel collar button front shirt', 'men allover print decor pocket shirt',
    'fashionable stripes print casual 100__ cotton shirt', // actually casual name but long sleeve stripe - formal
  ];

  let casualScore = 0;
  let formalScore = 0;
  for (const h of casualHints) if (t.includes(h)) casualScore += 1;
  for (const h of formalHints) if (t.includes(h)) formalScore += 1;

  if (/short sleeve|kurzarm|manga corta/i.test(t)) casualScore += 2;
  if (/long sleeve|long-sleeve|langarm|manga comprida/i.test(t)) formalScore += 2;
  if (/hawaiian|aloha|tropical|palm|coconut/i.test(t)) casualScore += 3;
  if (/dress shirt|business|wedding|wrinkle/i.test(t)) formalScore += 3;

  if (formalScore >= casualScore) return 'Formal shirts';
  return 'Casual';
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['Navy', /navy|marineblau|marine-blue|navy bl/],
    ['White', /\bwhite\b|creme|cream|blanc/],
    ['Black', /\bblack\b|noir|zwart/],
    ['Blue', /\bblue\b|azul|bleu|hellblau|light blue|sky/],
    ['Red', /\bred\b|rojo|crimson|burgundy|maroon/],
    ['Green', /\bgreen\b|verde|olive|teal|emerald/],
    ['Yellow', /\byellow\b|gold|mustard|ochre|banana/],
    ['Pink', /\bpink\b|rosa|rose/],
    ['Grey', /\bgrey\b|gray|grau|gris/],
    ['Brown', /\bbrown\b|tan|camel|mocha|chocolate/],
    ['Multicolor', /multicolor|multi|mix|patchwork|print|floral|paisley|striped|stripe|plaid|checked|check|graphic|tropical|hawaiian/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Classic';
};

const inferPattern = (label, subCategory) => {
  const t = label.toLowerCase();
  if (/solid|simple solid/i.test(t)) return 'solid';
  if (/stripe|striped|rayas/i.test(t)) return 'stripe';
  if (/check|plaid/i.test(t)) return 'check';
  if (/paisley/i.test(t)) return 'paisley';
  if (/floral|hibiscus|lily|daffodil|botanical/i.test(t)) return 'floral';
  if (/hawaiian|tropical|palm|coconut|monstera/i.test(t)) return 'tropical';
  if (/graphic|comic|graffiti|love|letter|pop art/i.test(t)) return 'graphic';
  if (/patchwork|mosaic/i.test(t)) return 'patchwork';
  if (/map/i.test(t)) return 'map print';
  if (/oxford/i.test(t)) return 'oxford weave';
  if (subCategory === 'Formal shirts') return 'dress';
  return 'print';
};

const inferSleeve = (label, subCategory) => {
  const t = label.toLowerCase();
  if (/short sleeve|kurzarm|manga corta|short-sleeve/i.test(t)) return 'short';
  if (/long sleeve|langarm|manga comprida|long-sleeve/i.test(t)) return 'long';
  return subCategory === 'Formal shirts' ? 'long' : 'short';
};

const buildName = (label, subCategory, color, pattern) => {
  const sleeve = inferSleeve(label, subCategory);
  const sleeveWord = sleeve === 'long' ? 'LONG-SLEEVE' : 'SHORT-SLEEVE';
  const patternNames = {
    solid: 'SOLID',
    stripe: 'STRIPED',
    check: 'CHECKED',
    paisley: 'PAISLEY',
    floral: 'FLORAL',
    tropical: 'TROPICAL',
    graphic: 'GRAPHIC',
    patchwork: 'PATCHWORK',
    'map print': 'MAP PRINT',
    'oxford weave': 'OXFORD',
    dress: 'DRESS',
    print: 'PRINT',
  };
  const pat = patternNames[pattern] || 'CLASSIC';
  const type = subCategory === 'Formal shirts' ? 'FORMAL SHIRT' : 'CASUAL SHIRT';
  if (pattern === 'solid' || pattern === 'dress') {
    return `${color.toUpperCase()} ${sleeveWord} ${type}`;
  }
  return `${color.toUpperCase()} ${pat} ${sleeveWord} ${type}`;
};

const featureLines = (meta) => {
  const lines = [];
  if (meta.subCategory === 'Formal shirts') {
    lines.push('Tailored silhouette suited to office, church, weddings, and evening events.');
    if (meta.sleeve === 'long') lines.push('Full-length sleeves with structured cuffs for a polished finish.');
    if (meta.pattern === 'stripe') lines.push('Refined stripe pattern that pairs cleanly with suits and blazers.');
    if (meta.pattern === 'solid' || meta.pattern === 'dress') lines.push('Clean, versatile colourway that layers easily under jackets.');
    if (meta.pattern === 'paisley') lines.push('Statement paisley motif with dress-shirt construction.');
    lines.push('Button-down front with classic collar stand.');
    lines.push('Breathable fabric blend designed for all-day comfort in Nairobi weather.');
  } else {
    lines.push('Relaxed fit made for weekends, holidays, brunch, and smart-casual outings.');
    if (meta.sleeve === 'short') lines.push('Short sleeves with breathable construction for warm weather.');
    if (meta.pattern === 'tropical' || meta.pattern === 'floral') lines.push('Bold botanical print inspired by resort and coastal style.');
    if (meta.pattern === 'graphic') lines.push('Eye-catching graphic print for confident street-ready looks.');
    if (meta.pattern === 'check' || meta.pattern === 'stripe') lines.push('Heritage pattern with easy off-duty styling.');
    if (meta.pattern === 'oxford weave') lines.push('Textured oxford cotton with a soft, lived-in feel.');
    lines.push('Camp or spread collar with button-front closure.');
    lines.push('Wear open over a tee or buttoned up — versatile for coastal trips and city breaks.');
  }
  return lines;
};

const buildDescription = (meta) => {
  const intro =
    meta.subCategory === 'Formal shirts'
      ? `Elevate your formal rotation with this ${meta.color.toLowerCase()} ${meta.pattern} ${meta.sleeve}-sleeve shirt from Prince Esquire. Cut for a sharp, confident presence, it bridges boardroom polish and celebration-day style without feeling stiff.`
      : `A standout ${meta.color.toLowerCase()} ${meta.pattern} ${meta.sleeve}-sleeve casual shirt curated for Prince Esquire. Easy to style and comfortable in Kenya's climate, it delivers personality without sacrificing wearability.`;

  const features = featureLines(meta)
    .map((f) => `• ${f}`)
    .join('\n');

  return `${intro}\n\nKey features:\n${features}\n\nAvailable sizes M–3XL. Pair with Prince Esquire trousers or denim for a complete look.`;
};

const priceFor = (subCategory, pattern, idx) => {
  const base = subCategory === 'Formal shirts' ? 6500 : 4800;
  const bump = { paisley: 800, patchwork: 700, tropical: 400, floral: 400, graphic: 350, stripe: 300, check: 250 };
  const extra = bump[pattern] || 0;
  const variance = (idx % 7) * 250;
  return Math.min(base + extra + variance, subCategory === 'Formal shirts' ? 11500 : 8200);
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
    .filter((f) => !PRESIDENTIAL.has(f))
    .filter((f) => !SKIP_PATTERNS.some((re) => re.test(f)))
    .sort();

  const usedSlugs = new Set();
  const catalog = [];

  files.forEach((sourceFile, idx) => {
    const label = extractLabel(sourceFile);
    const subCategory = classify(label);
    const color = inferColor(label);
    const pattern = inferPattern(label, subCategory);
    const sleeve = inferSleeve(label, subCategory);
    const shortImage = `shirt-${String(idx + 1).padStart(3, '0')}.png`;

    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    let slug = slugify(buildName(label, subCategory, color, pattern));

    const spec = findSpec(label);
    const finalSub = spec?.subCategory || subCategory;
    const finalColor = spec?.color || color;
    const finalPattern = spec?.pattern || inferPattern(label, finalSub);
    const finalSleeve = spec?.sleeve || inferSleeve(label, finalSub);
    const finalName = (spec?.name || buildName(label, finalSub, finalColor, finalPattern)).toUpperCase();
    const finalSlug = spec?.slug || slug;
    let resolvedSlug = finalSlug;
    let sn = 2;
    while (usedSlugs.has(resolvedSlug)) {
      resolvedSlug = `${slugify(finalName)}-${sn}`;
      sn += 1;
    }
    usedSlugs.add(resolvedSlug);

    const meta = { subCategory: finalSub, color: finalColor, pattern: finalPattern, sleeve: finalSleeve, label };
    catalog.push({
      image: shortImage,
      sourceFile,
      name: finalName,
      slug: resolvedSlug,
      price: spec?.price || priceFor(finalSub, finalPattern, idx),
      brand: spec?.brand || 'Prince Esquire',
      color: finalColor,
      subCategory: finalSub,
      sleeve: finalSleeve,
      pattern: finalPattern,
      featured: spec?.featured ?? idx % 11 === 0,
      description: spec?.description || buildDescription(meta),
    });
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  const formal = catalog.filter((c) => c.subCategory === 'Formal shirts').length;
  const casual = catalog.length - formal;
  console.log(`Catalog: ${catalog.length} shirts (${formal} formal, ${casual} casual)`);
  console.log('Written:', OUT_JSON);
};

main();
