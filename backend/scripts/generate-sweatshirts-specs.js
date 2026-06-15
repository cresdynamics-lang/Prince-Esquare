/**
 * Generates backend/data/sweatshirts-specs.json
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes M–3XL. Prince Esquire casual streetwear.`;

const SPECS = {
  '40__OFF_the_Nike_Solo_Swoosh_Crewneck__Thunder_Blue_': {
    name: 'NIKE SOLO SWOOSH CREWNECK — THUNDER BLUE',
    color: 'Blue',
    brand: 'Nike',
    price: 12500,
    featured: true,
    description: fmt(
      'Nike Solo Swoosh crewneck sweatshirt in thunder blue — minimalist athletic pullover.',
      ['Thunder blue fleece upper.', 'Small white Nike swoosh on chest.', 'Ribbed crew neck, cuffs and hem.', 'Soft brushed interior.', 'Everyday sportswear staple.']
    ),
  },
  Novidade__Moletom_Vans: {
    name: 'VANS OFF THE WALL CREWNECK SWEATSHIRT',
    color: 'Black',
    brand: 'Vans',
    price: 11800,
    description: fmt(
      'Vans black crewneck sweatshirt with bold Off The Wall chest logo.',
      ['Solid black cotton-blend fleece.', 'Large white VANS logo print.', 'Ribbed collar and cuffs.', 'Off The Wall neck tape detail.', 'Skate-inspired casual style.']
    ),
  },
  powder_blue_sweatshirt: {
    name: 'NAVY NIKE SWOOSH CREWNECK SWEATSHIRT',
    color: 'Navy',
    brand: 'Nike',
    price: 12200,
    description: fmt(
      'Nike navy crewneck sweatshirt with embroidered white swoosh.',
      ['Deep navy blue fleece.', 'White embroidered swoosh logo.', 'Classic ribbed trim.', 'Relaxed everyday fit.', 'Athleisure essential.']
    ),
  },
  '702069029441412557': {
    name: 'BLACK NIKE SWOOSH CREWNECK SWEATSHIRT',
    color: 'Black',
    brand: 'Nike',
    price: 12000,
    featured: true,
    description: fmt(
      'Nike black crewneck sweatshirt — clean swoosh logo pullover.',
      ['Solid black fleece upper.', 'White Nike swoosh on chest.', 'Ribbed crew neckline.', 'Soft interior lining.', 'Minimal athletic style.']
    ),
  },
  '702069029441412671': {
    name: 'SAGE GREEN NIKE SWOOSH CREWNECK',
    color: 'Green',
    brand: 'Nike',
    price: 12200,
    description: fmt(
      'Nike sage green crewneck sweatshirt with subtle swoosh branding.',
      ['Muted sage green fleece.', 'Small black Nike swoosh.', 'Ribbed cuffs and hem.', 'Oversized casual fit.', 'Modern earth-tone pullover.']
    ),
  },
  '702069029442366440': {
    name: 'BLACK ADIDAS TREFOIL CREWNECK SWEATSHIRT',
    color: 'Black',
    brand: 'Adidas',
    price: 11500,
    description: fmt(
      'Adidas black crewneck sweatshirt with classic trefoil logo.',
      ['Solid black fleece body.', 'White Adidas trefoil chest logo.', 'Ribbed crew neck and cuffs.', 'Relaxed streetwear fit.', 'Sportswear essential.']
    ),
  },
  '702069029441442692': {
    name: 'CREAM ADIDAS TREFOIL CREWNECK SWEATSHIRT',
    color: 'Cream',
    brand: 'Adidas',
    price: 11800,
    description: fmt(
      'Adidas cream crewneck sweatshirt with black trefoil logo.',
      ['Off-white cotton-blend fleece.', 'Black trefoil and wordmark.', 'Dropped shoulder silhouette.', 'Ribbed trim details.', 'Clean minimalist trainer style.']
    ),
  },
  '1023865296538593401': {
    name: 'WHITE NEW YORK USA GRAPHIC SWEATSHIRT',
    color: 'White',
    brand: 'Prince Esquire',
    price: 9800,
    description: fmt(
      'White crewneck sweatshirt with distressed New York USA graphic print.',
      ['Crisp white fleece upper.', 'Black arched NEW YORK print.', 'USA subtitle graphic.', 'Ribbed collar and cuffs.', 'Varsity streetwear style.']
    ),
  },
  '756956649884521747': {
    name: 'GREY WHITE BLACK COLORBLOCK SWEATSHIRT',
    color: 'Grey',
    brand: 'Prince Esquire',
    price: 9200,
    description: fmt(
      'Grey, white and black horizontal colorblock crewneck sweatshirt.',
      ['Heather grey shoulder panels.', 'White mid-band across chest.', 'Black lower body and cuffs.', 'Ribbed crew neck.', 'Modern panelled street style.']
    ),
  },
  '730709108319522200': {
    name: 'BEIGE LOS ANGELES GRAPHIC SWEATSHIRT',
    color: 'Beige',
    brand: 'Prince Esquire',
    price: 8900,
    description: fmt(
      'Beige crewneck sweatshirt with Los Angeles chest lettering.',
      ['Warm beige fleece upper.', 'Black italic Los Angeles print.', 'Ribbed neckline and hem.', 'Relaxed casual fit.', 'West Coast inspired graphic.']
    ),
  },
  '738379301439125897': {
    name: 'BURGUNDY LAYERED COLLAR SWEATSHIRT',
    color: 'Burgundy',
    brand: 'Prince Esquire',
    price: 10500,
    description: fmt(
      'Burgundy crewneck sweatshirt styled with white shirt-collar layering.',
      ['Rich burgundy knit body.', 'White collar peek detail.', 'Ribbed cuffs and hem.', 'Smart-casual preppy look.', 'Fine-gauge sweatshirt knit.']
    ),
  },
  Men_Letter_Patched_Detail_Cable_Knit_Sweatshirt: {
    name: 'WHITE CABLE KNIT TEXTURED SWEATSHIRT',
    color: 'White',
    brand: 'Prince Esquire',
    price: 10200,
    description: fmt(
      'White textured cable-knit sweatshirt with diamond argyle pattern.',
      ['White embossed knit texture.', 'Diamond and cable panel design.', 'Ribbed crew neck.', 'Classic wear patch detail.', 'Elevated knit pullover.']
    ),
  },
  '882564858203587713': {
    name: 'BLACK ATHLETES FLAME GRAPHIC SWEATSHIRT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 9500,
    description: fmt(
      'Black crewneck sweatshirt with Athletes gothic script and flame hem print.',
      ['Solid black fleece body.', 'White Old English Athletes chest text.', 'Grey flame motif at hem.', 'Ribbed cuffs and waistband.', 'Streetwear graphic pullover.']
    ),
  },
  Men_s_Knitted_Casual_Patchwork_Round_Neck_Sweatshirt: {
    name: 'TAN WHITE OMBRE FUZZY KNIT SWEATSHIRT',
    color: 'Tan',
    brand: 'Prince Esquire',
    price: 11200,
    description: fmt(
      'Tan-to-white ombre fuzzy knit sweatshirt with bold letter graphic.',
      ['Soft mohair-style fuzzy knit.', 'Tan fading into white ombre.', 'Oversized letter chest print.', 'Thick ribbed crew neck.', 'Statement knit pullover.']
    ),
  },
  '1144829167802529640': {
    name: 'NAVY RELAXED CREWNECK SWEATSHIRT',
    color: 'Navy',
    brand: 'Prince Esquire',
    price: 8800,
    description: fmt(
      'Navy blue relaxed-fit crewneck sweatshirt with dropped shoulders.',
      ['Deep navy fleece upper.', 'Ribbed collar, cuffs and hem.', 'Oversized casual silhouette.', 'Soft brushed interior.', 'Winter essential pullover.']
    ),
  },
  Classic_Casual_Crew_Neck_Sweatshirt: {
    name: 'BLACK CLASSIC CREWNECK SWEATSHIRT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 7500,
    description: fmt(
      'Black classic crewneck sweatshirt — plain essential pullover.',
      ['Solid black cotton-blend fleece.', 'Ribbed crew neckline.', 'Ribbed cuffs and waistband.', 'Clean minimalist design.', 'Everyday casual staple.']
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'sweatshirts-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} sweatshirt specs → ${OUT}`);
