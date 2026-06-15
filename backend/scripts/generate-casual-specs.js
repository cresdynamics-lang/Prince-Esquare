/**
 * Generates backend/data/casual-shoes-specs.json
 * Run: node scripts/generate-casual-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable EU sizes 40–46. Styled at Prince Esquire for everyday casual wear.`;

const SPECS = {
  _Nike: {
    name: 'NIKE AIR FORCE 1 LOW SNEAKERS',
    color: 'White',
    style: 'sneaker',
    price: 18500,
    featured: true,
    description: fmt(
      'Nike Air Force 1 low-top sneakers — classic white leather cupsole trainer.',
      ['Premium white leather upper.', 'Iconic AF1 low silhouette.', 'Rubber cupsole with pivot tread.', 'Padded collar for comfort.', 'Streetwear and casual staple.']
    ),
  },
  Nike: {
    name: 'NIKE CLASSIC LOW SNEAKERS',
    color: 'White',
    style: 'sneaker',
    price: 17200,
    description: fmt(
      'Nike-inspired classic low sneakers — clean trainer profile for daily wear.',
      ['Smooth leather upper.', 'Low-top lace-up design.', 'White rubber sole.', 'Minimal branding detail.', 'Versatile casual sneaker.']
    ),
  },
  ___Nike_Air_Force_1_Low___Grey___Black_Edition___: {
    name: 'NIKE AIR FORCE 1 GREY BLACK EDITION',
    color: 'Grey',
    style: 'sneaker',
    price: 19200,
    featured: true,
    description: fmt(
      'Nike Air Force 1 grey and black edition — two-tone low-top trainer.',
      ['Grey and black leather panels.', 'Classic AF1 silhouette.', 'Contrast white midsole.', 'Street-ready casual sneaker.', 'Premium trainer construction.']
    ),
  },
  _Sneakers_Lacoste_en_color_beige_: {
    name: 'LACOSTE BEIGE CANVAS SNEAKERS',
    color: 'Beige',
    style: 'sneaker',
    price: 16800,
    description: fmt(
      'Lacoste beige canvas sneakers — lightweight casual trainer with crocodile branding.',
      ['Beige canvas upper.', 'White rubber sole.', 'Lacoste crocodile emblem.', 'Breathable summer sneaker.', 'Smart-casual trainer style.']
    ),
  },
  Zapatillas_Lacoste_L_Spin_Evo_: {
    name: 'LACOSTE L-SPIN EVO SNEAKERS',
    color: 'White',
    style: 'sneaker',
    price: 17500,
    description: fmt(
      'Lacoste L-Spin Evo sneakers — athletic-inspired casual trainer.',
      ['Mesh and synthetic upper.', 'Cushioned EVA sole.', 'Lacoste sport styling.', 'Lightweight daily wear.', 'Modern casual sneaker.']
    ),
  },
  Tommy_luxury_sneakers___Description__Low_top_: {
    name: 'TOMMY HILFIGER LOW-TOP SNEAKERS',
    color: 'White',
    style: 'sneaker',
    price: 18200,
    featured: true,
    description: fmt(
      'Tommy Hilfiger luxury low-top sneakers — premium casual trainer.',
      ['Clean white leather upper.', 'Signature flag branding.', 'Rubber cupsole.', 'Preppy casual styling.', 'Designer everyday sneaker.']
    ),
  },
  Luxury_timberland_men_shoe: {
    name: 'TIMBERLAND SLIP-ON CASUAL SNEAKERS',
    color: 'Brown',
    style: 'slip-on',
    price: 17800,
    description: fmt(
      'Timberland slip-on casual sneakers — brown gradient upper with chunky white sole.',
      ['Brown two-tone leather upper.', 'Elastic side gussets.', 'Chunky white rubber sole.', 'Tree logo embossing.', 'Hybrid loafer-sneaker style.']
    ),
  },
  Classic_Western_elegance_meets_modern_comfort_: {
    name: 'BROWN LEATHER PENNY SNEAKER LOAFERS',
    color: 'Brown',
    style: 'hybrid',
    price: 16500,
    description: fmt(
      'Brown leather penny sneaker loafers — dress loafer upper with white cupsole.',
      ['Polished brown leather upper.', 'Penny strap detail.', 'Thick white rubber sole.', 'Hybrid casual loafer.', 'Smart-casual crossover shoe.']
    ),
  },
  Men_Running_Shoes_Outdoor_Walking_Soft_Casual_Sneakers: {
    name: 'BLACK PEBBLED LEATHER CASUAL SNEAKERS',
    color: 'Black',
    style: 'sneaker',
    price: 14200,
    description: fmt(
      'Black pebbled leather casual sneakers — platform sole trainer for daily wear.',
      ['Textured black leather upper.', 'Thick white platform sole.', 'Lace-up closure.', 'Comfort cushioned insole.', 'Modern minimalist trainer.']
    ),
  },
  T_nis_Casual_Preto_RS6: {
    name: 'BLACK CASUAL LOW SNEAKERS',
    color: 'Black',
    style: 'sneaker',
    price: 13800,
    description: fmt(
      'Black casual low sneakers — minimalist lace-up with white sole contrast.',
      ['Solid black smooth upper.', 'White rubber cupsole.', 'Clean low-top profile.', 'Everyday street sneaker.', 'Versatile black trainer.']
    ),
  },
  Hermes_Moccasins_and_Derbies_Suede_Loafers: {
    name: 'BEIGE CANVAS H BUCKLE SNEAKER LOAFERS',
    color: 'Beige',
    style: 'hybrid',
    price: 24500,
    featured: true,
    description: fmt(
      'Hermes-inspired beige canvas sneaker loafers — H-buckle strap with white cupsole.',
      ['Beige textured canvas upper.', 'Brown leather collar trim.', 'Silver H-buckle hardware.', 'Thick white rubber sole.', 'Luxury casual hybrid loafer.']
    ),
  },
  Raguler_shoe_for_men: {
    name: 'GREY SUEDE SNEAKER LOAFERS',
    color: 'Grey',
    style: 'hybrid',
    price: 15800,
    description: fmt(
      'Grey suede sneaker loafers — slip-on moc toe with white wedge sole.',
      ['Charcoal grey suede upper.', 'Moccasin toe stitching.', 'White wedge rubber sole.', 'Slip-on casual loafer.', 'Relaxed weekend style.']
    ),
  },
  876794621182876355: {
    name: 'NAVY MESH TASSEL SNEAKER LOAFERS',
    color: 'Navy',
    style: 'hybrid',
    price: 16200,
    description: fmt(
      'Navy mesh tassel sneaker loafers — breathable upper with white platform sole.',
      ['Navy knitted mesh upper.', 'Leather tassel strap detail.', 'Thick white rubber sole.', 'Slip-on casual profile.', 'Sporty loafer hybrid.']
    ),
  },
  794603928028600309: {
    name: 'BLACK TASSEL KILTIE SNEAKER LOAFERS',
    color: 'Black',
    style: 'hybrid',
    price: 16800,
    description: fmt(
      'Black leather tassel kiltie sneaker loafers — formal upper with white platform sole.',
      ['Smooth black leather upper.', 'Double tassel kiltie detail.', 'Chunky white rubber sole.', 'Dress-casual hybrid loafer.', 'Statement slip-on style.']
    ),
  },
  846606429998996404: {
    name: 'BLACK SUEDE SNEAKER LOAFERS',
    color: 'Black',
    style: 'hybrid',
    price: 15500,
    description: fmt(
      'Black suede sneaker loafers — moc toe slip-on with white cupsole.',
      ['Matte black suede upper.', 'Moccasin stitched toe.', 'Thick white rubber sole.', 'Tan leather lining.', 'Casual slip-on loafer.']
    ),
  },
  1080582504344820100: {
    name: 'BLACK LACOSTE TASSEL SUEDE LOAFERS',
    color: 'Black',
    style: 'hybrid',
    price: 17200,
    description: fmt(
      'Lacoste black suede tassel loafers — white platform sole casual slip-on.',
      ['Black suede upper with tassels.', 'White chunky platform sole.', 'Moc-toe construction.', 'Lacoste casual styling.', 'Premium weekend loafer.']
    ),
  },
  759489924671366362: {
    name: 'BURGUNDY SANTONI PEBBLED SNEAKERS',
    color: 'Burgundy',
    style: 'sneaker',
    price: 28500,
    featured: true,
    description: fmt(
      'Santoni burgundy pebbled leather sneakers — Italian luxury casual trainer.',
      ['Deep burgundy pebbled leather.', 'Gold Santoni script branding.', 'White rubber cupsole.', 'Orange logo outsole detail.', 'Premium designer sneaker.']
    ),
  },
  709387378830554076: {
    name: 'NAVY PEBBLED PENNY SNEAKER LOAFERS',
    color: 'Navy',
    style: 'hybrid',
    price: 16400,
    description: fmt(
      'Navy pebbled penny sneaker loafers — textured leather with white sole.',
      ['Navy pebbled grain leather.', 'Penny strap across vamp.', 'Thick white rubber cupsole.', 'Tan interior lining.', 'Smart-casual hybrid loafer.']
    ),
  },
  1148417973749969407: {
    name: 'BLACK WOVEN PENNY SNEAKER LOAFERS',
    color: 'Black',
    style: 'hybrid',
    price: 15900,
    description: fmt(
      'Black woven penny sneaker loafers — braided texture with white flat sole.',
      ['Woven black textile upper.', 'Smooth penny strap detail.', 'Flat white rubber sole.', 'Slip-on casual loafer.', 'Textured statement shoe.']
    ),
  },
  349451252355834662: {
    name: 'CHARCOAL LORO PIANA PEBBLED SNEAKER LOAFERS',
    color: 'Grey',
    style: 'hybrid',
    price: 32000,
    featured: true,
    description: fmt(
      'Loro Piana-inspired charcoal pebbled sneaker loafers — luxury casual hybrid.',
      ['Dark grey pebbled leather.', 'Penny loafer strap detail.', 'Off-white rubber cupsole.', 'Tan leather lining.', 'Italian luxury casual style.']
    ),
  },
  1017954322005851268: {
    name: 'NAVY SUEDE STRIPE CASUAL SNEAKERS',
    color: 'Navy',
    style: 'sneaker',
    price: 14800,
    description: fmt(
      'Navy suede casual sneakers — three-stripe design with tan heel panel.',
      ['Navy suede and mesh upper.', 'White diagonal stripe detail.', 'Tan suede heel accent.', 'White rubber sole.', 'Sporty street sneaker.']
    ),
  },
  Hanley_Leather_Shoes___Khaki: {
    name: 'KHAKI LEATHER CASUAL SNEAKERS',
    color: 'Tan',
    style: 'sneaker',
    price: 15200,
    description: fmt(
      'Khaki leather casual sneakers — earthy tone low-top trainer.',
      ['Khaki tan leather upper.', 'White contrast sole.', 'Lace-up casual design.', 'Everyday smart-casual sneaker.', 'Warm neutral palette.']
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'casual-shoes-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} casual shoe specs → ${OUT}`);
