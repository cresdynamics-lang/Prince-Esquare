/**
 * Generates backend/data/jackets-specs.json (keyed by image UUID).
 */
const fs = require('fs');
const path = require('path');

const VALUE_PRICE = 4500;
const STANDARD_PRICE = 4800;
const PREMIUM_PRICE = 5200;
const BRANDED_PRICE = 5500;

const rich = (intro, features, fit, sizes = 'M–3XL') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Dry clean recommended, or machine wash cold on gentle cycle. Hang dry. Do not bleach.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const jacketFeatures = (color, style = 'jacket') => [
  `${color} outer shell with insulated warmth and weather-ready comfort.`,
  style === 'vest' ? 'Sleeveless gilet design for versatile layering.' : 'Full-sleeve coverage with structured silhouette.',
  'Quilted or padded construction for lightweight insulation.',
  'Secure zip closure with stand collar or hood protection.',
  'Functional pockets for everyday carry.',
  'Smart-casual outerwear suited to Nairobi cool-season dressing.',
];

const fit =
  'Layer over tees, polos, or knitwear. Pair with denim, chinos, or tailored trousers for elevated casual and weekend style.';

const make = (name, color, brand, price, featured = false, intro, style = 'jacket') => ({
  name,
  color,
  brand,
  price,
  featured,
  style,
  description: rich(
    intro || `${name} — premium men's outerwear with insulated comfort and Prince Esquire refinement.`,
    jacketFeatures(color, style),
    fit
  ),
});

const OVERRIDES = {
  '6b62af19': make('BLACK QUILTED PUFFER JACKET', 'Black', 'Prince Esquire', STANDARD_PRICE, true, 'Black horizontal-quilted puffer jacket with stand collar and zip pockets.'),
  fa8874f5: make('NAVY BOMBER JACKET', 'Navy', 'Prince Esquire', STANDARD_PRICE, false, 'Navy bomber jacket with ribbed collar, cuffs, and zip front closure.'),
  '4ee4a2c4': make('OLIVE GREEN QUILTED PUFFER JACKET', 'Olive', 'Prince Esquire', STANDARD_PRICE, false, 'Olive green geometric-quilted puffer with orange lining and chest zip pocket.'),
  '104d451c': make('OLIVE HOODED WINDPROOF JACKET', 'Olive', 'Prince Esquire', STANDARD_PRICE, false, 'Olive hooded windbreaker with mustard drawstrings and storm-flap zip closure.'),
  '1a9fbefd': make('NAVY HYBRID KNIT-BOMBER JACKET', 'Navy', 'Prince Esquire', PREMIUM_PRICE, true, 'Navy hybrid jacket combining quilted front panel with knitted sleeves and funnel collar.'),
  d52067b2: make('BLACK MA-1 BOMBER JACKET', 'Black', 'Prince Esquire', STANDARD_PRICE, false, 'Classic black MA-1 bomber with ribbed trim and sleeve utility zip pocket.'),
  '87803ff4': make('OLIVE GEOMETRIC QUILTED PUFFER JACKET', 'Olive', 'Prince Esquire', STANDARD_PRICE, false, 'Olive geometric-quilted puffer with orange interior lining and drawcord hem.'),
  '0f3bff27': make('BLACK KBIAODN QUILTED PUFFER JACKET', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black lightweight quilted puffer with stand collar and side zip pockets.'),
  '1728e606': make('TEAL GEOMETRIC QUILTED JACKET', 'Teal', 'Prince Esquire', STANDARD_PRICE, false, 'Teal geometric-quilted jacket with tan zipper tape and fleece-lined collar.'),
  '0ea53e55': make('NAVY POLO RALPH LAUREN PACKABLE DOWN VEST', 'Navy', 'Polo Ralph Lauren', BRANDED_PRICE, true, 'Polo Ralph Lauren navy packable down vest with signature pony embroidery.', 'vest'),
  '8ee2da10': make('BLACK TOM FORD HYBRID DOWN JACKET', 'Black', 'Tom Ford', BRANDED_PRICE, true, 'Tom Ford black hybrid down jacket with quilted front and ribbed knit sleeves.'),
  f1275045: make('BLACK TACVASEN BOMBER JACKET', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black zip-up bomber jacket with ribbed collar, cuffs, and side pockets.'),
  '993fe030': make('BLACK DIAMOND-QUILT BOMBER JACKET', 'Black', 'Prince Esquire', STANDARD_PRICE, false, 'Black diamond-quilted bomber with silver zip closure and ribbed trim.'),
  '28de5921': make('BLACK HORIZONTAL QUILT PUFFER JACKET', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black horizontal-quilted puffer jacket with stand collar and zip pockets.'),
  '450ec5d1': make('CHARCOAL HYBRID KNIT PUFFER JACKET', 'Charcoal', 'Prince Esquire', PREMIUM_PRICE, false, 'Charcoal hybrid puffer with black ribbed knit sleeves and button-zip front.'),
  '66de7ca8': make('BLACK LITE PADDED JACKET', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black lightweight padded jacket with clean quilted silhouette.'),
  '7a6261c2': make('NAVY CHECKERED-LINED BOMBER JACKET', 'Navy', 'Prince Esquire', STANDARD_PRICE, false, 'Navy bomber jacket with checkered interior lining and ribbed waistband.'),
  '3d111aa0': make('NAVY DIAMOND-QUILT BOMBER JACKET', 'Navy', 'Prince Esquire', STANDARD_PRICE, false, 'Navy diamond-quilt bomber with striped rib trim at collar and cuffs.'),
  a4383320: make('NAVY DIAMOND-QUILT FIELD JACKET', 'Navy', 'Prince Esquire', PREMIUM_PRICE, false, 'Navy diamond-quilt field jacket with chest flap pockets and buckle collar detail.'),
  d6982e98: make('OLIVE FILSON QUILTED PACK JACKET', 'Olive', 'Filson', BRANDED_PRICE, true, 'Filson olive quilted pack jacket with snap storm flap and tan interior lining.'),
  '9cf2dfe8': make('BLUE CORNELIANI ZIP BOMBER JACKET', 'Blue', 'Corneliani', BRANDED_PRICE, false, 'Corneliani blue zipped bomber jacket with refined winter outerwear styling.'),
  '14b2cbb3': make('BLUE RALPH LAUREN PURPLE LABEL HYBRID JACKET', 'Blue', 'Polo Ralph Lauren', BRANDED_PRICE, true, 'Ralph Lauren Purple Label blue zip-front hybrid jacket with padded knit panels.'),
  ac6ed5ef: make('NAVY POLO RALPH LAUREN HYBRID JACKET', 'Navy', 'Polo Ralph Lauren', BRANDED_PRICE, false, 'Polo Ralph Lauren navy hybrid quilted-knit jacket with premium outerwear finish.'),
  '1c521745': make('NAVY RIBBED WOOL & QUILTED DOWN JACKET', 'Navy', 'Prince Esquire', PREMIUM_PRICE, false, 'Slim-fit panelled jacket combining ribbed wool and quilted shell down insulation.'),
  '92ceb880': make('NAVY HELLY HANSEN INSULATOR JACKET', 'Navy', 'Helly Hansen', BRANDED_PRICE, false, 'Helly Hansen navy crew insulator jacket with technical lightweight warmth.'),
  '75f10b6d': make('BLUE WOOLRICH INSULATED JACKET', 'Blue', 'Woolrich', BRANDED_PRICE, false, 'Woolrich blue insulated jacket with heritage outdoor construction.'),
  a0c847a2: make('BLUE PEUTEREY INSULATED JACKET', 'Blue', 'Peuterey', BRANDED_PRICE, false, 'Peuterey blue insulated jacket with Italian outerwear craftsmanship.'),
  '8fd8d4de': make('BLUE GRAN SASSO QUILTED VEST', 'Blue', 'Gran Sasso', BRANDED_PRICE, false, 'Gran Sasso blue quilted vest for refined layering over shirts and knitwear.', 'vest'),
  '9f5e273e': make('BLACK HOODED NYLON BOMBER PUFFER', 'Black', 'Prince Esquire', STANDARD_PRICE, false, 'Black nylon bomber puffer with integrated hood and padded insulation.'),
  '4ee16e69': make('NAVY DIAMOND-QUILT BUSINESS PUFFER JACKET', 'Navy', 'Prince Esquire', STANDARD_PRICE, false, 'Navy diamond-quilted lightweight puffer for business-casual winter layering.'),
  '7e6f3d3f': make('NAVY DOWN PUFFER JACKET', 'Navy', 'Prince Esquire', STANDARD_PRICE, false, 'Navy down-style puffer jacket with stand collar and clean quilted body.'),
  '379d8ae2': make('BLUE STAND-COLLAR DOWN PUFFER JACKET', 'Blue', 'Prince Esquire', STANDARD_PRICE, false, 'Blue stand-collar quilted down jacket with streamlined winter profile.'),
  '80385b68': make('BLACK HOODED COTTON-PADDED WINTER COAT', 'Black', 'Prince Esquire', PREMIUM_PRICE, false, 'Black hooded windproof cotton-padded coat for thickened cold-weather warmth.'),
  '37b2cda7': make('BLACK STAND-COLLAR ZIP PARKA JACKET', 'Black', 'Prince Esquire', PREMIUM_PRICE, false, 'Black stand-collar zip parka with padded insulation for winter wear.'),
  ca00a07b: make('NAVY SIRDAL INSULATED JACKET', 'Navy', 'Prince Esquire', STANDARD_PRICE, false, 'Navy Sirdal-style insulated jacket with outdoor-ready warmth.'),
  ae5fa116: make('GREY SOFTSHELL TRANSITION JACKET', 'Grey', 'Prince Esquire', VALUE_PRICE, false, 'Grey softshell transition jacket for spring and autumn layering.'),
  fb9107f1: make('BLACK THERMAL-LINED PADDED VEST', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black thermal-lined padded vest for autumn and winter layering.', 'vest'),
  '94c2e58b': make('BLACK STAND-COLLAR PADDED VEST', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black stand-collar warm padded vest for fall and winter.', 'vest'),
  a024f144: make('OLIVE FLEECE OUTDOOR VEST JACKET', 'Olive', 'Prince Esquire', VALUE_PRICE, false, 'Olive stand-collar fleece outdoor vest jacket for transitional weather.', 'vest'),
  '93e076cb': make('BLACK MEN\'S QUILTED JACKET', 'Black', 'Prince Esquire', VALUE_PRICE, false, 'Black men\'s quilted jacket with clean casual outerwear styling.'),
};

const BATCH_UUIDS = [
  '6b62af19','fa8874f5','4ee4a2c4','104d451c','1a9fbefd','d52067b2','9e66b637','1728e606','ba4b1651','28de5921',
  '3d111aa0','7d30d734','993fe030','0f3bff27','08e2e03b','a4383320','93e076cb','ebb8e549','efa469b3','9cf2dfe8',
  '813b581a','7e6f3d3f','8f10ecb0','33ade341','379d8ae2','8fd8d4de','92ceb880','9f5e273e','4ee16e69','10ced58e',
  'fb9107f1','ca00a07b','7a6261c2','a024f144','94c2e58b','80385b68','2e966c36','6a943f98','a0c847a2','14b2cbb3',
  'ac6ed5ef','cbfaeb83','ae5fa116','1c521745','f1275045','b3c49033','33e7563b','0ea53e55','8ee2da10','f95f56b3',
  '450ec5d1','75f10b6d','66de7ca8','4ed62d9a','37b2cda7','87803ff4','d6982e98',
];

const SKIP_UUIDS = new Set([
  'ebb8e549','efa469b3','8f10ecb0','33ade341','10ced58e','2e966c36','6a943f98','cbfaeb83',
  'b3c49033','33e7563b','f95f56b3','4ed62d9a',
]);

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);

const extractUuid = (filename) => {
  const m = filename.match(/-([a-f0-9]{8})-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i);
  return m ? m[1] : null;
};

const extractLabel = (filename) =>
  filename
    .replace(/^c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_/, '')
    .replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i, '');

const inferBrand = (label) => {
  const l = label.toLowerCase();
  if (/tom ford/.test(l)) return { brand: 'Tom Ford', price: BRANDED_PRICE };
  if (/ralph lauren|polo ralph/.test(l)) return { brand: 'Polo Ralph Lauren', price: BRANDED_PRICE };
  if (/filson/.test(l)) return { brand: 'Filson', price: BRANDED_PRICE };
  if (/corneliani/.test(l)) return { brand: 'Corneliani', price: BRANDED_PRICE };
  if (/woolrich/.test(l)) return { brand: 'Woolrich', price: BRANDED_PRICE };
  if (/peuterey/.test(l)) return { brand: 'Peuterey', price: BRANDED_PRICE };
  if (/helly hansen/.test(l)) return { brand: 'Helly Hansen', price: BRANDED_PRICE };
  if (/gran sasso/.test(l)) return { brand: 'Gran Sasso', price: BRANDED_PRICE };
  return { brand: 'Prince Esquire', price: STANDARD_PRICE };
};

const inferColor = (label) => {
  const l = label.toLowerCase();
  if (/black|preta|noir/.test(l)) return 'Black';
  if (/navy|blauw|blau|blue/.test(l)) return l.includes('navy') ? 'Navy' : 'Blue';
  if (/olive|green|forest/.test(l)) return 'Olive';
  if (/grey|gray/.test(l)) return 'Grey';
  if (/white/.test(l)) return 'White';
  if (/teal/.test(l)) return 'Teal';
  return 'Black';
};

const labelToName = (label) => {
  let name = label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(Men s|Mens|Men's|For Men|Homme|at Nordstrom|Size \w+|WhatsApp Image \d{4}-\d{2}-\d{2} at \d{2}\.\d{2}\.\d{2})\b/gi, '')
    .replace(/\b(Jacket|Coat|Vest|Gilet)\b/gi, 'JACKET')
    .trim();
  if (!/jacket|vest|coat|puffer|bomber/i.test(name)) name = `${name} JACKET`.trim();
  if (name.length > 58) name = name.slice(0, 55) + '...';
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
let idx = 0;
for (const uuid of BATCH_UUIDS) {
  if (SKIP_UUIDS.has(uuid)) continue;
  if (OVERRIDES[uuid]) {
    SPECS[uuid] = OVERRIDES[uuid];
    continue;
  }
  idx += 1;
  const label = labelsByUuid[uuid] || uuid;
  const { brand, price: brandPrice } = inferBrand(label);
  const color = inferColor(label);
  const style = /vest|gilet|sans manches/i.test(label) ? 'vest' : 'jacket';
  const name = labelToName(label);
  const price =
    brand === 'Prince Esquire'
      ? VALUE_PRICE + (idx % 3) * 200 // 4500, 4700, 4900
      : brandPrice;
  SPECS[uuid] = make(name, color, brand, price, false, undefined, style);
}

const OUT = path.join(__dirname, '..', 'data', 'jackets-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} jacket specs to ${OUT}`);
