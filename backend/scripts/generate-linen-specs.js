/**
 * Generates backend/data/linen-specs.json (keyed by image UUID).
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_PRICE = 7000;
const PREMIUM_PRICE = 10500;
const BRANDED_PRICE = 8500;

const rich = (intro, features, fit, sizes = 'M–3XL') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Machine wash cold on gentle cycle. Hang dry or tumble dry low. Iron on low heat. Linen softens beautifully with wear.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const shirtFeatures = (color, sleeve = 'short') => [
  `Breathable ${color.toLowerCase()} linen or linen-blend fabric with natural texture.`,
  `${sleeve === 'long' ? 'Long sleeves with button cuffs.' : 'Short sleeves with clean finished hems.'}`,
  'Lightweight weave ideal for warm-weather comfort.',
  'Button-front closure with refined collar detailing.',
  'Relaxed drape with Prince Esquire tailoring finish.',
  'Pairs effortlessly with chinos, linen trousers, or denim.',
];

const fit =
  'Wear untucked with shorts or chinos for resort style, or tuck into tailored trousers for elevated smart-casual occasions.';

const make = (name, color, brand, price, featured = false, intro, sleeve = 'short') => ({
  name,
  color,
  brand,
  price,
  featured,
  sleeve,
  description: rich(
    intro || `${name} — premium men's linen shirt crafted for breathable summer elegance at Prince Esquire.`,
    shirtFeatures(color, sleeve),
    fit
  ),
});

const OVERRIDES = {
  '9beb6539': make(
    'OFF-WHITE GUCCI MONOGRAM LINEN CAMP COLLAR SHIRT',
    'Off-White',
    'Gucci',
    PREMIUM_PRICE,
    true,
    'Gucci off-white camp collar shirt with tonal GG monogram weave — understated luxury for refined resort dressing.',
    'short'
  ),
  b587f9dc: make(
    'BLUE ALEX MILL LINEN LONG-SLEEVE SHIRT',
    'Blue',
    'Alex Mill',
    BRANDED_PRICE,
    false,
    'Alex Mill blue linen long-sleeve shirt with breathable weave and relaxed tailoring.',
    'long'
  ),
  '5ed269a1': make(
    'BLUE ABERCROMBIE & FITCH LINEN LONG-SLEEVE SHIRT',
    'Blue',
    'Abercrombie & Fitch',
    BRANDED_PRICE,
    false,
    'Abercrombie & Fitch blue linen long-sleeve shirt — classic warm-weather layering piece.',
    'long'
  ),
  fbd933a8: make(
    'NATURAL CAPE TOWN 100% LINEN SHIRT',
    'Natural',
    'Prince Esquire',
    DEFAULT_PRICE,
    true,
    'Cape Town 100% linen shirt in natural tone — pure breathable linen for coastal and summer wear.',
    'short'
  ),
  '0230ad3c': make(
    'BROWN GEOMETRIC JACQUARD CUBAN COLLAR LINEN SHIRT',
    'Brown',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Brown geometric jacquard Cuban collar shirt with textured weave and relaxed vacation silhouette.',
    'short'
  ),
  '7e15e7df': make(
    'STRIPED LINEN RELAXED COLLAR SHIRT',
    'Stripe',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Linen-rich striped shirt with relaxed collar and easy warm-weather drape.',
    'short'
  ),
  b867c111: make(
    'NAVY BLUE CLASSIC LINEN LONG-SLEEVE SHIRT',
    'Navy',
    'Prince Esquire',
    DEFAULT_PRICE,
    true,
    'Classic navy blue linen long-sleeve shirt — premium summer essential with clean minimalist styling.',
    'long'
  ),
  '903d5ea0': make(
    'WHITE MARBELLA LINEN SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    true,
    'Marbella white linen shirt with crisp resort tailoring and breathable Mediterranean finish.',
    'short'
  ),
  '5a5b8528': make(
    'WHITE LINEN BUTTON-DOWN SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Crisp white linen button-down shirt — timeless summer staple with clean camp-collar styling.',
    'short'
  ),
  '571b4c1f': make(
    'BEIGE LINEN BUTTON-UP SHIRT',
    'Beige',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Beige linen button-up shirt with soft natural texture and relaxed everyday fit.',
    'short'
  ),
  '6d2a4913': make(
    'WHITE SLIM LINEN-BLEND SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Slim-fit white linen-blend shirt with refined structure and breathable hand-feel.',
    'long'
  ),
  bf0178c8: make(
    'NATURAL PURE LINEN LOOSE-FIT LONG-SLEEVE SHIRT',
    'Natural',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Pure linen loose-fit long-sleeve shirt with airy drape and effortless warm-weather comfort.',
    'long'
  ),
  fcfd4807: make(
    'WHITE SUMMER LINEN SQUARE-COLLAR SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White summer linen shirt with distinctive square collar and lightweight vacation styling.',
    'short'
  ),
  '999402f1': make(
    'BLUE BAGGY COTTON-LINEN LONG-SLEEVE SHIRT',
    'Blue',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Blue baggy cotton-linen long-sleeve shirt with relaxed oversized silhouette.',
    'long'
  ),
  '2c34b07d': make(
    'WHITE HOLLOW-OUT KNIT LINEN SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White hollow-out knit linen shirt with open texture and breezy resort character.',
    'short'
  ),
  e786e919: make(
    'WHITE KNITTED LINEN CAMP COLLAR SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White knitted linen camp collar shirt with textured vertical stripe knit pattern.',
    'short'
  ),
  d2e992ad: make(
    'BEIGE OLD MONEY LINEN LONG-SLEEVE SHIRT',
    'Beige',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Beige linen long-sleeve shirt with classic lapel collar — refined old-money casual elegance.',
    'long'
  ),
  '7afc5429': make(
    'WHITE REVERE COLLAR LINEN SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White revere collar linen shirt with clean minimalist lines and resort-ready styling.',
    'short'
  ),
  '8f19cb15': make(
    'WHITE NOTCHED NECK LINEN SHIRT',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White notched neck linen shirt with modern collar detail and breathable summer weave.',
    'short'
  ),
  '58b387e4': make(
    'BEIGE STAND-COLLAR COTTON-LINEN SHIRT',
    'Beige',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Beige cotton-linen stand-collar shirt for casual beach and streetwear summer looks.',
    'short'
  ),
};

const BATCH_UUIDS = [
  'b587f9dc','2c109e98','5ed269a1','fbd933a8','58b387e4','a6b41eb0','2f6a064e','bf0178c8','7e15e7df','ef78fe7b',
  'd2e992ad','a77375e0','f8d29626','c1b9135b','00286a23','a52f63b1','643a461a','8f19cb15','999402f1','903d5ea0',
  '64d83980','7e4861cd','9b75bac6','5458da0b','1dcacb5f','571b4c1f','a2a1ea56','159997bc','27ba57cc','f223ec33',
  'c8eccc2d','b867c111','2c34b07d','5030905f','5a5b8528','09f9783d','764bd18a','6fbf857c','7afc5429','b9121201',
  'aa6078a8','9beb6539','fcfd4807','ee5fcfa0','6ead6ee9','b8e85b3a','0230ad3c','c7a79f1a','8bf2135b','e4c831b4',
  '8319f7ff','c05d1071','7b2b1ead','76acf003','db2a5d44','001cb147','5a7edd3c','6d2a4913','72b5cfb7','97030512',
  '30e62673','93594e08','d1971e07','988edda4','e786e919',
];

const SKIP_UUIDS = new Set([
  '2c109e98','c8eccc2d','aa6078a8','76acf003','97030512','72b5cfb7','988edda4','764bd18a','f223ec33','159997bc',
]);

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);

const extractUuid = (filename) => {
  const m = filename.match(/-([a-f0-9]{8})-[a-f0-9]{4}/i);
  return m ? m[1] : null;
};

const extractLabel = (filename) =>
  filename
    .replace(/^c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_/, '')
    .replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i, '');

const inferBrand = (label) => {
  const l = label.toLowerCase();
  if (/gucci/.test(l)) return { brand: 'Gucci', price: PREMIUM_PRICE };
  if (/dior/.test(l)) return { brand: 'Dior', price: PREMIUM_PRICE };
  if (/fendi/.test(l)) return { brand: 'Fendi', price: PREMIUM_PRICE };
  if (/burberry/.test(l)) return { brand: 'Burberry', price: PREMIUM_PRICE };
  if (/zara/.test(l)) return { brand: 'Zara', price: BRANDED_PRICE };
  if (/abercrombie|alex.?mill|shein/.test(l)) return { brand: 'Prince Esquire', price: BRANDED_PRICE };
  return { brand: 'Prince Esquire', price: DEFAULT_PRICE };
};

const inferColor = (label) => {
  const l = label.toLowerCase();
  if (/navy|marine/.test(l)) return 'Navy';
  if (/white|branca|blanc/.test(l)) return 'White';
  if (/blue|azul/.test(l)) return 'Blue';
  if (/black|noir/.test(l)) return 'Black';
  if (/beige|tan|khaki|camel|natural|cape/i.test(l)) return 'Beige';
  if (/brown|chocolate/.test(l)) return 'Brown';
  if (/green|army|olive/.test(l)) return 'Green';
  if (/stripe|striped/.test(l)) return 'Stripe';
  if (/grey|gray/.test(l)) return 'Grey';
  return 'Natural';
};

const inferSleeve = (label) => (/long.?sleeve|long_sleeve/i.test(label) ? 'long' : 'short');

const labelToName = (label) => {
  let name = label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(Men s|Mens|Men's|For sale|eBay|AliExpress|SHEIN|Temu)\b/gi, '')
    .replace(/\b(Shirt|Camisa)\b/gi, 'LINEN SHIRT')
    .trim();
  if (!/linen/i.test(name)) name = `${name} LINEN SHIRT`.trim();
  if (name.length > 62) name = name.slice(0, 59) + '...';
  return name.toUpperCase().replace(/\s+/g, ' ');
};

const labelsByUuid = {};
if (fs.existsSync(ASSETS_DIR)) {
  for (const f of fs.readdirSync(ASSETS_DIR)) {
    const uuid = extractUuid(f);
    if (uuid && BATCH_UUIDS.includes(uuid)) labelsByUuid[uuid] = extractLabel(f);
  }
}

const SPECS = {};
for (const uuid of BATCH_UUIDS) {
  if (SKIP_UUIDS.has(uuid)) continue;
  if (OVERRIDES[uuid]) {
    SPECS[uuid] = OVERRIDES[uuid];
    continue;
  }
  const label = labelsByUuid[uuid] || uuid;
  const { brand, price } = inferBrand(label);
  const color = inferColor(label);
  const sleeve = inferSleeve(label);
  const name = labelToName(label);
  SPECS[uuid] = make(name, color, brand, price, false, undefined, sleeve);
}

const OUT = path.join(__dirname, '..', 'data', 'linen-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} linen specs to ${OUT}`);
