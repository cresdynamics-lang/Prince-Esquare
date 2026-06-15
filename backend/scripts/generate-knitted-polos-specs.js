/**
 * Generates backend/data/knitted-polos-specs.json (keyed by image UUID).
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_PRICE = 3200;
const BRANDED_PRICE = 3500;
const VALUE_PRICE = 3000;

const rich = (intro, features, fit, sizes = 'M–3XL') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Machine wash cold on gentle cycle. Lay flat or tumble dry low. Do not bleach.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const poloFeatures = (color) => [
  `Soft ${color.toLowerCase()} knitted fabric with breathable comfort.`,
  'Classic polo collar with refined ribbed finish.',
  'Short sleeves with structured ribbed cuffs.',
  'Button or zip placket for easy smart-casual styling.',
  'Fine-gauge knit texture with premium Prince Esquire finish.',
  'Ideal for office-casual, weekends, and warm-weather layering.',
];

const fit =
  'Pair with chinos, tailored trousers, or denim for effortless smart-casual style. Layer under blazers for elevated everyday dressing.';

const make = (name, color, brand, price, featured = false, intro) => ({
  name,
  color,
  brand,
  price,
  featured,
  description: rich(
    intro || `${name} — refined men's knitted polo combining breathable comfort with polished Prince Esquire style.`,
    poloFeatures(color),
    fit
  ),
});

const OVERRIDES = {
  '5a60e696': make(
    'BLACK POLO RALPH LAUREN KNITTED POLO',
    'Black',
    'Polo Ralph Lauren',
    BRANDED_PRICE,
    true,
    'Polo Ralph Lauren black knitted polo with signature pony embroidery — timeless preppy essential.'
  ),
  '12239389': make(
    'BEIGE POLO RALPH LAUREN KNITTED POLO',
    'Beige',
    'Polo Ralph Lauren',
    BRANDED_PRICE,
    true,
    'Polo Ralph Lauren beige piqué knit polo with classic collar and embroidered pony logo.'
  ),
  '416072c1': make(
    'WHITE LACOSTE KNITTED POLO',
    'White',
    'Lacoste',
    BRANDED_PRICE,
    false,
    'Lacoste white knitted polo with iconic crocodile branding and clean resort styling.'
  ),
  '07ca2382': make(
    'GREEN LACOSTE STRETCH PIQUÉ KNITTED POLO',
    'Green',
    'Lacoste',
    BRANDED_PRICE,
    false,
    'Lacoste regular-fit stretch piqué polo in sequoia green — breathable luxury knit.'
  ),
  '7d7a6c4e': make(
    'FOREST GREEN PERCIVAL TIPPED KNITTED POLO',
    'Green',
    'Percival',
    BRANDED_PRICE,
    false,
    'Percival forest green tipped cotton polo with contrast collar trim and refined knit finish.'
  ),
  bb4a7d2c: make(
    'CREAM RIBBED KNITTED POLO',
    'Cream',
    'Prince Esquire',
    DEFAULT_PRICE,
    true,
    'Cream ribbed knitted polo with textured vertical knit pattern and concealed placket styling.'
  ),
  '803da50b': make(
    'CREAM VERTICAL RIBBED KNITTED POLO',
    'Cream',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Cream vertical ribbed knitted polo with clean popover placket and summer-ready comfort.'
  ),
  '736d27dc': make(
    'OFF-WHITE RIBBED KNITTED POLO',
    'Off-White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Off-white ribbed knitted polo with classic collar and lightweight breathable knit.'
  ),
  '63dd1d80': make(
    'WHITE & BROWN COLOR-BLOCK WAFFLE KNIT POLO',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White waffle-knit polo with brown contrast collar, zip placket, and dual chest pockets.'
  ),
  '39fa897e': make(
    'WHITE PLAID COLOR-BLOCK ZIP KNIT POLO',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Summer casual plaid color-block knitted polo with stand collar and zip double-pocket front.'
  ),
  eb22f602: make(
    'OLIVE GREEN STRIPE-TRIM KNITTED POLO',
    'Olive',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Olive green knitted polo with tan stripe-trim collar and cuffs — structured casual polish.'
  ),
  d9268f60: make(
    'WHITE TAN-COLLAR KNITTED POLO',
    'White',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'White knitted polo with contrasting tan collar and cuffs and subtle chest emblem detail.'
  ),
  '6ef09e01': make(
    'CHOCOLATE BROWN POLO RALPH LAUREN KNITTED POLO',
    'Brown',
    'Polo Ralph Lauren',
    BRANDED_PRICE,
    false,
    'Polo Ralph Lauren chocolate brown custom slim-fit piqué knit polo with signature pony logo.'
  ),
  '86c3e5f5': make(
    'MAROON NEONOMAD LOGO KNIT POLO',
    'Maroon',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Maroon ribbed knitted polo with quarter-zip closure and clean logo chest detail.'
  ),
  '411a8754': make(
    'BLUE NEONOMAD REGULAR-FIT KNIT POLO',
    'Blue',
    'Prince Esquire',
    VALUE_PRICE,
    false,
    'Blue regular-fit knitted polo with breathable fabric and everyday smart-casual versatility.'
  ),
  bc0bbbf2: make(
    'CREAM CLASSIC RIBBED KNIT POLO',
    'Cream',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Classic cream ribbed knit polo with timeless collar and refined warm-weather styling.'
  ),
  ac692159: make(
    'NAVY RIBBED POLO COLLAR KNIT POLO',
    'Navy',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Navy casual ribbed polo-collar knit shirt with regular fit and half-sleeve comfort.'
  ),
  '5cc2b05b': make(
    'BLACK CONTRAST-COLLAR KNIT POLO',
    'Black',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Black short-sleeve knitted polo with contrast collar detailing and clean modern lines.'
  ),
  f01e9ea0: make(
    'CREAM DONATTO STRIPE-TRIM KNIT POLO',
    'Cream',
    'Donatto',
    BRANDED_PRICE,
    false,
    'Donatto cream knitted polo with black stripe-trim collar and cuffs and fine horizontal rib texture.'
  ),
  '96564944': make(
    'CHOCOLATE BROWN VERTICAL RIB KNIT POLO',
    'Brown',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Chocolate brown vertical rib-knit polo with classic collar and warm earthy tone.'
  ),
  ce69c6db: make(
    'BLACK QUARTER-ZIP RIB KNIT POLO',
    'Black',
    'Prince Esquire',
    DEFAULT_PRICE,
    false,
    'Black ribbed knitted polo with quarter-zip placket and sleek smart-casual silhouette.'
  ),
  de7614ae: make(
    'WHITE PATCHWORK FRONT-BUTTON KNIT POLO',
    'White',
    'Prince Esquire',
    VALUE_PRICE,
    false,
    'White patchwork front-button knitted polo with modern color-block casual styling.'
  ),
  a5f13ab1: make(
    'SOLID BUSINESS CASUAL KNIT POLO',
    'Navy',
    'Prince Esquire',
    VALUE_PRICE,
    false,
    'Solid-color business-casual knitted polo with soft malha knit and office-ready comfort.'
  ),
};

const BATCH_UUIDS = [
  '5a60e696','faf2a6e8','e09fed20','d7934cdf','803da50b','736d27dc','1522e625','74545312','eb22f602','5cecb970',
  '8823fbfd','a8df82d0','f3fb5c19','444b9882','125f7b98','2e422daf','187c7c0e','f01e9ea0','96564944','ce69c6db',
  '1d3cc582','3318bc54','989201e9','7d245b67','8c2e14ca','99995562','7f3d6b46','bc6913d9','6e51060e','7f71a47a',
  '891919bf','a44be4f8','7e74a1a6','a5f13ab1','19865d72','44898299','5f50fa57','416072c1','8c2cef27','00cd2eaa',
  'd287bec1','22bbeb7e','08bda105','de7614ae','63dd1d80','07ca2382','25d24157','afd928bf','d034d857','1a35f1ba',
  '5cc2b05b','ac692159','c520ad44','29ea312e','8e1ddd58','87544b6e','8402fd96','411a8754','da765d73','3f98defd',
  '7d7a6c4e','6ef09e01','b54f3028','bb4a7d2c','bc0bbbf2','12239389','39fa897e','0ea1aa3c','08276f6f','d9268f60',
  '8e3e72c7','86c3e5f5','be2ca3a4','f309064a','c5760230',
];

const SKIP_UUIDS = new Set([
  'faf2a6e8','44898299','5f50fa57','00cd2eaa','d287bec1','22bbeb7e','0ea1aa3c','08276f6f','8e3e72c7',
  '29ea312e','8402fd96','da765d73','be2ca3a4','f309064a','c5760230','c520ad44',
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
  if (/ralph|polo.*lauren/.test(l)) return { brand: 'Polo Ralph Lauren', price: BRANDED_PRICE };
  if (/lacoste|camisa_d/.test(l)) return { brand: 'Lacoste', price: BRANDED_PRICE };
  if (/percival|perci/.test(l)) return { brand: 'Percival', price: BRANDED_PRICE };
  if (/donatto/.test(l)) return { brand: 'Donatto', price: BRANDED_PRICE };
  return { brand: 'Prince Esquire', price: DEFAULT_PRICE };
};

const inferColor = (label) => {
  const l = label.toLowerCase();
  if (/black|noir/.test(l)) return 'Black';
  if (/white|branca|cream|classic/.test(l)) return l.includes('cream') ? 'Cream' : 'White';
  if (/blue|azul/.test(l)) return 'Blue';
  if (/green|forest|olive|sequoia/.test(l)) return l.includes('olive') ? 'Olive' : 'Green';
  if (/brown|chocolate/.test(l)) return 'Brown';
  if (/maroon|burgundy/.test(l)) return 'Maroon';
  if (/beige|tan|khaki/.test(l)) return 'Beige';
  if (/navy/.test(l)) return 'Navy';
  if (/red/.test(l)) return 'Red';
  return 'Natural';
};

const labelToName = (label) => {
  let name = label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(Men s|Mens|Men's|For Men|Homme|Guys|T-Shirt|Tshirt|at Nordstrom|Size \w+|download)\b/gi, '')
    .replace(/\b(Polo Shirt|Polo T-Shirt|Polo)\b/gi, 'KNITTED POLO')
    .trim();
  if (!/knit/i.test(name)) name = `${name} KNITTED POLO`.trim();
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
  const name = labelToName(label);
  const price = brand === 'Prince Esquire' ? VALUE_PRICE + (idx % 3) * 250 : brandPrice;
  SPECS[uuid] = make(name, color, brand, price);
}

const OUT = path.join(__dirname, '..', 'data', 'knitted-polos-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} knitted polo specs to ${OUT}`);
