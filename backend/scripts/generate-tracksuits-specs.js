/**
 * Generates backend/data/tracksuits-specs.json (keyed by image UUID).
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_PRICE = 8500;
const PREMIUM_PRICE = 11500;
const BRANDED_PRICE = 9500;
const KIDS_PRICE = 6500;

const rich = (intro, features, fit, sizes = 'S, M, L, XL, XXL') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Machine wash cold on gentle cycle. Tumble dry low. Do not bleach. Iron on low heat if needed.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const setFeatures = (color, style = 'tracksuit') => [
  `Two-piece ${style} set with matching jacket and pants.`,
  `${color} premium athletic fabric with soft hand-feel.`,
  'Full-zip jacket with ribbed cuffs and hem.',
  'Elastic waistband joggers with tapered leg fit.',
  'Side pockets on jacket and pants for everyday utility.',
  'Sport-luxe finish suitable for streetwear and casual wear.',
];

const fit =
  'Wear as a coordinated set with trainers for athleisure, or mix the jacket with denim for smart-casual weekend style.';

const make = (name, color, brand, price, featured = false, intro) => ({
  name,
  color,
  brand,
  price,
  featured,
  description: rich(intro || `${name} - premium men's two-piece tracksuit set from Prince Esquire.`, setFeatures(color), fit),
});

/** Manual overrides for known products */
const OVERRIDES = {
  '15e0f505': make('LIGHT BLUE PALM ANGELS TRACKSUIT SET', 'Light Blue', 'Palm Angels', PREMIUM_PRICE, true,
    'Palm Angels light blue tracksuit with white side stripes and gothic script branding - luxury streetwear essential.'),
  a346bcd5: make('BLACK PALM ANGELS TRACKSUIT SET', 'Black', 'Palm Angels', PREMIUM_PRICE, true,
    'Palm Angels black tracksuit with signature side stripe detailing and bold logo branding.'),
  cbf8ab77: make('BLACK GIVENCHY LOGO TRACKSUIT SET', 'Black', 'Givenchy', PREMIUM_PRICE, true,
    'Givenchy black two-piece tracksuit with tonal logo branding and refined athletic silhouette.'),
  a535cbec: make('NAVY LOUIS VUITTON STRIPE TRACKSUIT SET', 'Navy', 'Louis Vuitton', PREMIUM_PRICE, true,
    'Louis Vuitton navy tracksuit with white chevron chest stripes and signature embroidered branding.'),
  f54cbfb3: make('BLUE & WHITE NIKE TRACKSUIT SET', 'Blue', 'Nike', BRANDED_PRICE, true,
    'Nike blue and white color-block tracksuit with chevron hooded jacket and side-stripe joggers.'),
  '4910d0f1': make('BLACK ADIDAS THREE-STRIPE TRACKSUIT SET', 'Black', 'Adidas', BRANDED_PRICE, true,
    'Adidas Performance black tracksuit with iconic three white stripes on jacket and pants.'),
  '3aac3045': make('BLACK ADIDAS ORIGINALS TRACKSUIT SET', 'Black', 'Adidas', BRANDED_PRICE,
    'Adidas Originals black tracksuit with classic trefoil styling and contrast stripe panels.'),
  '104f81f7': make('BLUE ADIDAS TIRO ESSENTIALS KIDS TRACKSUIT', 'Blue', 'Adidas', KIDS_PRICE,
    'Adidas Tiro Essentials youth tracksuit in royal blue with white three-stripe detailing.'),
  e96a3881: make('BLACK ADIDAS GOLD STRIPE KIDS TRACKSUIT', 'Black', 'Adidas', KIDS_PRICE,
    'Adidas toddler tracksuit in black with metallic gold three-stripe accents.'),
  b6cacb98: make('BLACK NIKE TECH FLEECE TRACKSUIT SET', 'Black', 'Nike', BRANDED_PRICE, true,
    'Nike Tech Fleece black tracksuit with chevron chest seam and zippered utility pockets.'),
  '5823211c': make('BLACK NIKE TECH FLEECE HOODIE TRACKSUIT', 'Black', 'Nike', BRANDED_PRICE, true,
    'Nike Tech Fleece full-zip hooded tracksuit with reflective taping and tapered joggers.'),
  '850b7176': make('GREY NIKE TECH FLEECE TWO-TONE TRACKSUIT', 'Grey', 'Nike', BRANDED_PRICE,
    'Nike Tech Fleece grey and white two-tone tracksuit with modern paneled construction.'),
  '46340b8d': make('BLACK NIKE WINDRUNNER TRACKSUIT SET', 'Black', 'Nike', BRANDED_PRICE,
    'Nike black windrunner-style hooded tracksuit with lightweight performance fabric.'),
  '7d0ef695': make('SLATE BLUE NIKE COLOR-BLOCK TRACKSUIT', 'Blue', 'Nike', BRANDED_PRICE,
    'Nike slate blue and white color-block tracksuit with hooded windbreaker jacket.'),
  '4ed15e75': make('BLACK NIKE HALF-ZIP TRACKSUIT SET', 'Black', 'Nike', BRANDED_PRICE,
    'Nike black half-zip tracksuit with grey shoulder panels and reflective ankle details.'),
  c1abc508: make('BLACK NIKE TRIPLE-SWOOSH TRACKSUIT SET', 'Black', 'Nike', BRANDED_PRICE,
    'Nike black tracksuit with white shoulder panels and triple-swoosh chest graphic.'),
  '6e0974c6': make('BLACK LACOSTE SPORT TRACKSUIT SET', 'Black', 'Lacoste', BRANDED_PRICE, true,
    'Lacoste Sport all-black tracksuit with green crocodile logos and minimalist athletic styling.'),
  '53b75f54': make('BLACK LACOSTE PIPING TRACKSUIT SET', 'Black', 'Lacoste', BRANDED_PRICE,
    'Lacoste black tracksuit with white piping trim on hood, jacket, and side leg stripes.'),
  fdb5abd4: make('NAVY BOSS HUGO BOSS TRACKSUIT SET', 'Navy', 'Hugo Boss', BRANDED_PRICE, true,
    'BOSS Hugo Boss navy tracksuit with white shoulder panels and logo chest branding.'),
  af76bd39: make('LIGHT BLUE PUMA MARSEILLE TRACKSUIT SET', 'Light Blue', 'Puma', BRANDED_PRICE,
    'Puma Olympique de Marseille light blue and navy tracksuit with club crest detailing.'),
  f823efc0: make('BLACK REFLECTIVE STRIPE TRACKSUIT SET', 'Black', 'Prince Esquire', DEFAULT_PRICE,
    'Black high-visibility tracksuit with reflective ladder-stripe detailing on sleeves and legs.'),
  '5ad392cd': make('NAVY RIVIERA STRIPE TRACKSUIT SET', 'Navy', 'Prince Esquire', DEFAULT_PRICE,
    'Navy Riviera track set with bold white side stripes and ribbed jogger cuffs.'),
  ce41d544: make('BLACK RED CHEVRON TRACKSUIT SET', 'Black', 'Prince Esquire', DEFAULT_PRICE,
    'Black athletic tracksuit with red sleeve panels and grey chevron chest graphic.'),
  b5fe088a: make('ARMY GREEN STRIPED TRACKSUIT SET', 'Green', 'Prince Esquire', DEFAULT_PRICE,
    'Army green zip-up tracksuit with contrast stripe panels on jacket and pants.'),
  '0899b5bd': make('GREY CASUAL RYAN TRACKSUIT SET', 'Grey', 'Prince Esquire', DEFAULT_PRICE,
    'Grey casual two-piece tracksuit with relaxed fit for everyday comfort and style.'),
};

const inferBrand = (label) => {
  const l = label.toLowerCase();
  if (/palm.?angels/.test(l)) return { brand: 'Palm Angels', price: PREMIUM_PRICE };
  if (/givenchy/.test(l)) return { brand: 'Givenchy', price: PREMIUM_PRICE };
  if (/louis.?vuitton|l\.vuitton/.test(l)) return { brand: 'Louis Vuitton', price: PREMIUM_PRICE };
  if (/nike/.test(l)) return { brand: 'Nike', price: BRANDED_PRICE };
  if (/adidas/.test(l)) return { brand: 'Adidas', price: BRANDED_PRICE };
  if (/puma/.test(l)) return { brand: 'Puma', price: BRANDED_PRICE };
  if (/lacoste/.test(l)) return { brand: 'Lacoste', price: BRANDED_PRICE };
  if (/boss|hugo/.test(l)) return { brand: 'Hugo Boss', price: BRANDED_PRICE };
  if (/corteiz/.test(l)) return { brand: 'Corteiz', price: BRANDED_PRICE };
  return { brand: 'Prince Esquire', price: DEFAULT_PRICE };
};

const inferColor = (label) => {
  const l = label.toLowerCase();
  if (/black/.test(l)) return 'Black';
  if (/navy|marine/.test(l)) return 'Navy';
  if (/blue/.test(l)) return 'Blue';
  if (/white/.test(l)) return 'White';
  if (/grey|gray/.test(l)) return 'Grey';
  if (/green|army/.test(l)) return 'Green';
  if (/red/.test(l)) return 'Red';
  if (/brown|beige|tan|cognac/.test(l)) return 'Brown';
  return 'Black';
};

const labelToName = (label) => {
  let name = label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(Men s|Mens|Men's|Herren|2-Teiliges|2 Piece|2_Piece)\b/gi, '')
    .replace(/\b(Tracksuit|Track Suit|Tracksuits|Trainingsanzug|Jogginganzug|Sportanzug|Sweatsuit|Sweatsuits)\b/gi, 'TRACKSUIT SET')
    .replace(/\b(Set|Outfit|Suit)\b/gi, 'SET')
    .trim();
  if (name.length > 60) name = name.slice(0, 57) + '...';
  if (!/tracksuit|set/i.test(name)) name = `${name} TRACKSUIT SET`.trim();
  return name.toUpperCase().replace(/\s+/g, ' ');
};

const BATCH_UUIDS = [
  '104f81f7','4910d0f1','b6cacb98','f823efc0','c74d917c','0d3bab00','d1326f34','6a6f3300','4c701123',
  '9ce1b386','375e507c','192f32a8','f54cbfb3','ee7ec162','53593d37','7d2e614c','2cc000c9','37d5bee4',
  '7662b086','5c8961a3','2b833357','d55195b7','afb4f9a4','e7cfe179','315d1a44','34beb2ac','3aac3045',
  'cbf8ab77','e7c55dea','c04c223b','4902dbd8','eab76c62','5ad392cd','300ac7f2','e0887a13','bff923e4',
  '95a3634e','7b37c84a','ce41d544','15e0f505','cc6efe40','86f2a1e8','cf933d21','9769ed36','9ad27599',
  'a346bcd5','62e30297','3c733ee4','9a439f8b','47c0d9c8','5bdc0d8a','3923b0c3','b5fe088a','35cd9f6d',
  'e93b06ba','c1abc508','6e0974c6','af76bd39','fdb5abd4','4f885e84','a3703a6b','4ed15e75','15e779f1',
  '7d0ef695','8cbdced7','948e84e7','a31e4166','e96a3881','850b7176','46340b8d','5823211c','a535cbec',
  '0899b5bd',
];

const SKIP_UUIDS = new Set([
  'f89b4ecc','179b47ae','c08f3226','30fadd45','e04771b7','5315c23f','9fcf6a64','68462fe0','c696c83f',
  'b6ed517a','18ac58b8','d6764088','e80843fb','773132b0','167bba7a','525d2d88','9343ce7b','244f03bc',
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
  const name = labelToName(label);
  SPECS[uuid] = make(name, color, brand, price);
}

const OUT = path.join(__dirname, '..', 'data', 'tracksuits-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} tracksuit specs to ${OUT}`);
