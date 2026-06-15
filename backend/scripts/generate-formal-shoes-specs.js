/**
 * Generates backend/data/formal-shoes-specs.json (keyed by image UUID).
 * Boots: KSh 7,000 | Normal officials: KSh 6,500
 */
const fs = require('fs');
const path = require('path');

const OFFICIAL_PRICE = 6500;
const BOOT_PRICE = 7000;

const rich = (intro, features, fit, sizes = 'EU 40-46') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Wipe clean with a damp cloth. Use leather conditioner periodically. Store with shoe trees to maintain shape.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const bootFeatures = (color) => [
  `${color} smooth leather upper with refined finish.`,
  'Elastic side gussets for easy slip-on wear.',
  'Pull tab at heel for convenient dressing.',
  'Almond toe with clean formal silhouette.',
  'Durable rubber sole with low stacked heel.',
  'Contrast leather lining for premium comfort.',
];

const officialFeatures = (style, color) => {
  const base = [`${color} leather upper with polished finish.`];
  if (/brogue|wingtip/i.test(style)) {
    base.push('Classic brogue perforations and wingtip detailing.');
  } else if (/cap-toe/i.test(style)) {
    base.push('Defined cap-toe stitch across the toe box.');
  } else if (/loafer/i.test(style)) {
    base.push('Slip-on loafer construction with refined strap detail.');
  } else if (/monk/i.test(style)) {
    base.push('Monk strap buckle closure for distinguished style.');
  } else {
    base.push('Clean formal stitching with timeless profile.');
  }
  if (/oxford/i.test(style)) base.push('Closed-lace Oxford construction.');
  else if (/derby/i.test(style)) base.push('Open-lace Derby construction for flexible fit.');
  else if (/loafer/i.test(style)) base.push('Low-profile dress sole with modest heel.');
  else base.push('Lace-up closure with matching round laces.');
  base.push('Comfortable leather lining with durable outsole.');
  base.push('Ideal for office, weddings, and formal occasions.');
  return base;
};

const bootFit =
  'Pair with tailored trousers, dark denim, or overcoat looks for smart winter and evening dressing.';
const officialFit =
  'Wear with suits, formal trousers, and blazers for business, ceremonies, and polished everyday style.';

const makeSpec = ({ name, color, style, type, featured = false, intro }) => {
  const isBoot = type === 'boot';
  const price = isBoot ? BOOT_PRICE : OFFICIAL_PRICE;
  const description = rich(
    intro ||
      `${name} - premium ${isBoot ? 'formal Chelsea boots' : 'leather dress shoes'} crafted for the modern gentleman.`,
    isBoot ? bootFeatures(color) : officialFeatures(style, color),
    isBoot ? bootFit : officialFit
  );
  return { name, color, brand: 'Prince Esquire', price, style, type, featured, description };
};

/** uuid -> product metadata */
const MANIFEST = {
  // --- Previous WhatsApp batch (reprice to 6500) ---
  '8f047ccd': makeSpec({
    name: 'BLACK LEATHER BROGUE OXFORD SHOES',
    color: 'Black',
    style: 'Brogue Oxford',
    type: 'official',
    featured: true,
    intro: 'Black leather brogue Oxford shoes with decorative perforations - refined formal footwear with heritage character.',
  }),
  '3cad8017': makeSpec({
    name: 'TAN BURNISHED CAP-TOE OXFORD SHOES',
    color: 'Tan',
    style: 'Cap-Toe Oxford',
    type: 'official',
    featured: true,
    intro: 'Tan burnished cap-toe Oxford shoes with warm two-tone leather and defined toe cap stitching.',
  }),
  '01d19d56': makeSpec({
    name: 'BROWN BURNISHED DERBY DRESS SHOES',
    color: 'Brown',
    style: 'Derby',
    type: 'official',
    intro: 'Brown burnished Derby dress shoes with pointed toe and polished gradient leather finish.',
  }),
  '5070994b': makeSpec({
    name: 'BLACK CLASSIC DERBY DRESS SHOES',
    color: 'Black',
    style: 'Derby',
    type: 'official',
    featured: true,
    intro: 'Black polished leather Derby dress shoes with open lacing - a timeless formal essential.',
  }),
  'b05cc18b': makeSpec({
    name: 'BROWN BURNISHED WINGTIP BROGUE OXFORD SHOES',
    color: 'Brown',
    style: 'Wingtip Brogue',
    type: 'official',
    intro: 'Dark brown burnished wingtip brogue Oxfords with rich two-tone leather and classic perforations.',
  }),

  // --- Chelsea boots (7000) ---
  c2e2c136: makeSpec({
    name: 'BROWN CLASSIC CHELSEA FORMAL BOOTS',
    color: 'Brown',
    style: 'Chelsea Boot',
    type: 'boot',
    featured: true,
    intro: 'Brown classic Chelsea boots with elastic side panels - smart ankle boots for formal and business-casual wear.',
  }),
  '702377f0': makeSpec({
    name: 'BLACK STACKED-HEEL CHELSEA BOOTS',
    color: 'Black',
    style: 'Chelsea Boot',
    type: 'boot',
    intro: 'Black stacked-heel Chelsea boots with sleek pull-on design and refined formal profile.',
  }),
  '0b0c71fd': makeSpec({
    name: 'DARK BROWN TWO-TONE CHELSEA BOOTS',
    color: 'Brown',
    style: 'Chelsea Boot',
    type: 'boot',
    intro: 'Handcrafted dark brown two-tone Chelsea boots with artisan leather finish and elastic gussets.',
  }),
  ea504a6d: makeSpec({
    name: 'BLACK SCULPTED ZIP-FRONT FORMAL BOOTS',
    color: 'Black',
    style: 'Zip Boot',
    type: 'boot',
    intro: 'Black sculpted zip-front formal boots with clean lines and elevated smart-casual appeal.',
  }),
  f4116ee8: makeSpec({
    name: 'BLACK HANDCRAFTED LEATHER CHELSEA BOOTS',
    color: 'Black',
    style: 'Chelsea Boot',
    type: 'boot',
    featured: true,
    intro: 'Handcrafted black leather Chelsea boots with premium construction and timeless ankle-boot silhouette.',
  }),
  '2e539222': makeSpec({
    name: 'BLACK POLISHED CHELSEA OFFICIAL BOOTS',
    color: 'Black',
    style: 'Chelsea Boot',
    type: 'boot',
    intro: 'Black polished Chelsea official boots with almond toe and durable welted sole.',
  }),

  // --- Normal officials (6500) ---
  '3c9f69cf': makeSpec({ name: 'BLACK GENUINE LEATHER OXFORD DRESS SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '81bae2f2': makeSpec({ name: 'BLACK 100% LEATHER FORMAL OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '546c030c': makeSpec({ name: 'BLACK CLASSIC SOCIAL DRESS SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '53634919': makeSpec({ name: 'BLACK PATENT STRAP FORMAL LOAFERS', color: 'Black', style: 'Loafer', type: 'official', intro: 'Black patent-strap formal loafers with textured vamp and gold-tone buckle accent.' }),
  '16f85437': makeSpec({ name: 'BLACK WINGTIP BROGUE OXFORD SHOES', color: 'Black', style: 'Wingtip Brogue', type: 'official', featured: true }),
  fdfbbd25: makeSpec({ name: 'BLACK COLLEGE FORMAL DRESS SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  d5c8229b: makeSpec({ name: 'BLACK JANE HARLOW CAP-TOE OXFORD SHOES', color: 'Black', style: 'Cap-Toe Oxford', type: 'official' }),
  '7e246324': makeSpec({ name: 'TAN GRAINED CAP-TOE DERBY SHOES', color: 'Tan', style: 'Cap-Toe Derby', type: 'official' }),
  '7cfe96e2': makeSpec({ name: 'BROWN POLO RALPH LAUREN DERBY SHOES', color: 'Brown', style: 'Derby', type: 'official' }),
  a5041caa: makeSpec({ name: 'BLACK ENGLAND STYLE FORMAL LOAFERS', color: 'Black', style: 'Loafer', type: 'official' }),
  '82206e8c': makeSpec({ name: 'BLACK SQUARE-TOE FORMAL DERBY SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '53f45783': makeSpec({ name: 'BLACK CLASSIC PLAIN-TOE DERBY SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  b4ed7b46: makeSpec({ name: 'BLACK ALMOND-TOE FORMAL DERBY SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '0657da18': makeSpec({ name: 'BLACK BROGUE ACCENT DERBY SHOES', color: 'Black', style: 'Derby', type: 'official', intro: 'Black derby shoes with subtle brogue perforations and contrasting wood-tone sole.' }),
  '0125d86f': makeSpec({ name: 'BLACK ZARA LEATHER DERBY OFFICIAL SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '57f0f4fd': makeSpec({ name: 'DARK BROWN PLAIN-TOE OXFORD SHOES', color: 'Brown', style: 'Oxford', type: 'official' }),
  '5697f425': makeSpec({ name: 'BLACK GRADIENT PATINA FORMAL OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official', intro: 'Black formal Oxfords with smoky grey patina toe caps and subtle medallion broguing.' }),
  '00840356': makeSpec({ name: 'BLACK CLASSIC CAP-TOE OXFORD SHOES', color: 'Black', style: 'Cap-Toe Oxford', type: 'official', featured: true }),
  '7cb4aecd': makeSpec({ name: 'BLACK BOSS CAP-TOE OXFORD SHOES', color: 'Black', style: 'Cap-Toe Oxford', type: 'official' }),
  c68ee18a: makeSpec({ name: 'BLACK SLEEK FORMAL LACE-UP SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  ef3cf39a: makeSpec({ name: 'BLACK POINTED TOE FORMAL DRESS SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '3ecd09e2': makeSpec({ name: 'BROWN BURNISHED CAP-TOE OXFORD SHOES', color: 'Brown', style: 'Cap-Toe Oxford', type: 'official' }),
  '10470925': makeSpec({ name: 'BROWN GEORGE CLEVERLEY GRAIN DERBY SHOES', color: 'Brown', style: 'Derby', type: 'official' }),
  fc812d58: makeSpec({ name: 'BLACK BRITISH BUSINESS POINTED TOE SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  a287298c: makeSpec({ name: 'BLACK MINIMALIST FORMAL DERBY SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '3082b4b8': makeSpec({ name: 'BLACK CLASSIC FORMAL LACE-UP SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '3527ab2c': makeSpec({ name: 'BLACK POLISHED OFFICIAL DRESS SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '54e053d5': makeSpec({ name: 'BLACK SMOOTH LEATHER FORMAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '9a159f51': makeSpec({ name: 'BROWN CLASSIC FORMAL LACE-UP SHOES', color: 'Brown', style: 'Derby', type: 'official' }),
  b5136949: makeSpec({ name: 'BROWN BURNISHED FORMAL OXFORD SHOES', color: 'Brown', style: 'Oxford', type: 'official' }),
  be97ad78: makeSpec({ name: 'BLACK EVERYDAY OFFICIAL DRESS SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  cc7d5175: makeSpec({ name: 'BLACK BUSINESS CASUAL LEATHER DRESS SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '73c19c75': makeSpec({ name: 'BROWN CLASSIC BRITISH BROGUE SHOES', color: 'Brown', style: 'Brogue', type: 'official' }),
  '77d55b11': makeSpec({ name: 'BROWN HERITAGE LEATHER DERBY SHOES', color: 'Brown', style: 'Derby', type: 'official' }),
  '7b2baac1': makeSpec({ name: 'BLACK HIGH-SHINE FORMAL DERBY SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '8ba2bb26': makeSpec({ name: 'BLACK ROUND-TOE FORMAL DERBY SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  '39e8fd65': makeSpec({ name: 'BLACK SLIM PROFILE FORMAL OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '99dabcc7': makeSpec({ name: 'BLACK DRESS OXFORD OFFICIAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  ab1f9c90: makeSpec({ name: 'BLACK HANDCRAFTED CAP-TOE OXFORD SHOES', color: 'Black', style: 'Cap-Toe Oxford', type: 'official' }),
  '35af44f6': makeSpec({ name: 'BLACK CLASSIC FORMAL OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '218aebc9': makeSpec({ name: 'BROWN BUSINESS DRESS LEATHER SHOES', color: 'Brown', style: 'Oxford', type: 'official' }),
  '2aada966': makeSpec({ name: 'BLACK CORPORATE STYLE FORMAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  b54d64b7: makeSpec({ name: 'BLACK CORPORATE LEATHER OFFICIAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  bfacdd45: makeSpec({ name: 'BROWN WEDDING FORMAL DRESS SHOES', color: 'Brown', style: 'Oxford', type: 'official' }),
  '1252c314': makeSpec({ name: 'BROWN POINTED TOE WEDDING DRESS SHOES', color: 'Brown', style: 'Oxford', type: 'official' }),
  d3f1f468: makeSpec({ name: 'BLACK ISOLATED CLASSIC FORMAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  e24785db: makeSpec({ name: 'BLACK EVERYDAY OFFICE DRESS SHOES', color: 'Black', style: 'Derby', type: 'official' }),
  b2d37e27: makeSpec({ name: 'BLACK CLASSIC LACE-UP OFFICIAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  f894fa54: makeSpec({ name: 'BLACK FENLOFT CLASSIC OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '48b98c4c': makeSpec({ name: 'BLACK THEO LEATHER RICHELIEU OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  c7cf286e: makeSpec({ name: 'BLACK LACE-UP FRONT OXFORD SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '2cffb352': makeSpec({ name: 'BLACK VEGAN LEATHER FORMAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  aaba9e78: makeSpec({ name: 'BLACK SMART FORMAL DRESS SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '5710bc14': makeSpec({ name: 'BROWN MASSIMO DUTTI CAP-TOE OXFORD SHOES', color: 'Brown', style: 'Cap-Toe Oxford', type: 'official' }),
  e54cd078: makeSpec({ name: 'GREY BURNISHED SIDE-LACE OXFORD SHOES', color: 'Grey', style: 'Oxford', type: 'official' }),
  '53b75f54': makeSpec({ name: 'BLACK HUSH PUPPIES FORMAL SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '1459261e': makeSpec({ name: 'BROWN CLASSIC LEATHER OFFICIAL SHOES', color: 'Brown', style: 'Derby', type: 'official' }),
  '5c74fafc': makeSpec({ name: 'BROWN WINGTIP BROGUE OXFORD SHOES', color: 'Brown', style: 'Wingtip Brogue', type: 'official' }),
  f0611c61: makeSpec({ name: 'BLACK SLIM FORMAL LACE-UP SHOES', color: 'Black', style: 'Oxford', type: 'official' }),
  '33a273fb': makeSpec({ name: 'BLACK PROFESSIONAL OFFICIAL SHOES', color: 'Black', style: 'Derby', type: 'official' }),
};

const OUT = path.join(__dirname, '..', 'data', 'formal-shoes-specs.json');
fs.writeFileSync(OUT, JSON.stringify(MANIFEST, null, 2));
const boots = Object.values(MANIFEST).filter((s) => s.type === 'boot').length;
const officials = Object.values(MANIFEST).filter((s) => s.type === 'official').length;
console.log(`Written ${Object.keys(MANIFEST).length} formal shoe specs (${boots} boots @ ${BOOT_PRICE}, ${officials} officials @ ${OFFICIAL_PRICE})`);
