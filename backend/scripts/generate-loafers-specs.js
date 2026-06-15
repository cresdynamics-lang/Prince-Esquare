/**
 * Generates backend/data/loafers-specs.json
 * Run: node scripts/generate-loafers-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable EU sizes 40–46. Crafted for Prince Esquire gentlemen who value slip-on elegance.`;

const SPECS = {
  Louis_Vuitton: {
    name: 'LOUIS VUITTON PLAID TWEED PENNY LOAFERS',
    color: 'Brown',
    style: 'penny',
    fit: 'classic',
    brand: 'Prince Esquire',
    price: 118000,
    featured: true,
    description: fmt(
      'Louis Vuitton-inspired plaid tweed penny loafers — tweed upper with patent leather trim and gold LV buckle.',
      [
        'Heritage plaid tweed with patent leather collar.',
        'Gold-tone LV logo buckle on penny strap.',
        'Classic slip-on loafer silhouette.',
        'Low block heel with black sole.',
        'Statement luxury casual loafer.',
      ]
    ),
  },
  Gucci_men_s_loafers_luxury_dress_shoes: {
    name: 'GUCCI HORSEBIT SUEDE LOAFERS',
    color: 'Black',
    style: 'horsebit',
    fit: 'classic',
    brand: 'Prince Esquire',
    price: 112000,
    featured: true,
    description: fmt(
      'Gucci-inspired black suede horsebit loafers — signature gold horsebit across a velvet-soft suede upper.',
      [
        'Black suede upper with matte finish.',
        'Polished gold horsebit hardware.',
        'Tan leather interior lining.',
        'Rubber sole with embossed branding.',
        'Iconic Italian luxury loafer styling.',
      ]
    ),
  },
  Gucci_loafers_men_dress_shoes: {
    name: 'GUCCI BLACK SUEDE HORSEBIT LOAFERS',
    color: 'Black',
    style: 'horsebit',
    fit: 'classic',
    brand: 'Prince Esquire',
    price: 108000,
    description: fmt(
      'Gucci horsebit loafers in black suede — gold interlocking hardware on a refined slip-on profile.',
      [
        'Deep black suede construction.',
        'Signature gold horsebit detail.',
        'Low heel dress loafer cut.',
        'Premium interior leather lining.',
        'Evening and smart-casual versatility.',
      ]
    ),
  },
  'Shoes_-_Christian_Louboutin': {
    name: 'CHRISTIAN LOUBOUTIN CRYSTAL HORSEBIT LOAFERS',
    color: 'Black',
    style: 'horsebit',
    fit: 'classic',
    brand: 'Prince Esquire',
    price: 125000,
    featured: true,
    description: fmt(
      'Christian Louboutin-inspired crystal horsebit platform loafers — studded suede upper with gold horsebit and chunky sole.',
      [
        'Black suede fully embellished with crystals.',
        'Gold horsebit strap hardware.',
        'Chunky platform lug sole.',
        'Statement red-carpet loafer presence.',
        'Luxury evening slip-on design.',
      ]
    ),
  },
  Black_Chunky_Penny_Loafers___CHARLES___KEITH_US: {
    name: 'BLACK CHUNKY PENNY LOAFERS',
    color: 'Black',
    style: 'penny',
    fit: 'classic',
    price: 18500,
    description: fmt(
      'Black chunky penny loafers — polished leather upper with rugged commando lug sole.',
      [
        'High-shine black leather upper.',
        'Classic penny strap with cutout.',
        'Thick black rubber lug sole.',
        'Moccasin toe stitching detail.',
        'Modern dress-casual hybrid loafer.',
      ]
    ),
  },
  Fashion_Classic_Thick_Sole_Men_s_Penny_Loafers: {
    name: 'BLACK PATENT CHUNKY BIT LOAFERS',
    color: 'Black',
    style: 'bit',
    fit: 'classic',
    price: 19500,
    description: fmt(
      'Black patent leather chunky bit loafers — glossy upper with silver hardware and oversized lug sole.',
      [
        'Glossy black patent leather.',
        'Silver metal bit across vamp.',
        'Oversized chunky rubber lug sole.',
        'Slip-on dress-casual profile.',
        'Bold contemporary loafer styling.',
      ]
    ),
  },
  SLIP_ON_SNEAKER_LOAFERS__BROWN_SUEDE: {
    name: 'BROWN SUEDE SNEAKER LOAFERS',
    color: 'Brown',
    style: 'sneaker-loafer',
    fit: 'classic',
    price: 16500,
    description: fmt(
      'Brown suede sneaker loafers — hybrid slip-on with cream rubber sole and moccasin stitching.',
      [
        'Soft chocolate brown suede upper.',
        'Thick off-white sneaker-style sole.',
        'Moccasin stitched toe apron.',
        'Tan leather interior lining.',
        'Comfortable smart-casual loafer.',
      ]
    ),
  },
  SHOESMALL_Men_s_Loafers_Soft_Suede_Penny_Loafers: {
    name: 'BLACK SUEDE DRIVING LOAFERS',
    color: 'Black',
    style: 'driving',
    fit: 'classic',
    price: 15800,
    description: fmt(
      'Black suede driving loafers — gommino pebble sole with bow-tie vamp detail.',
      [
        'Matte black suede upper.',
        'Decorative bow on vamp.',
        'Rubber pebble driving sole.',
        'Beige leather interior.',
        'Relaxed weekend loafer.',
      ]
    ),
  },
  Verdano_Suede_Loafers___Green: {
    name: 'NAVY SUEDE DRIVING MOCCASIN LOAFERS',
    color: 'Navy',
    style: 'driving',
    fit: 'classic',
    price: 17200,
    description: fmt(
      'Navy suede driving moccasin loafers — orange lining with gommino rubber pebble sole.',
      [
        'Deep navy suede exterior.',
        'Contrast orange leather lining.',
        'Bow-tie lace detail on vamp.',
        'Extended pebble sole on heel.',
        'Italian driving shoe inspiration.',
      ]
    ),
  },
  Minimal_Black_Loafers_for_Men: {
    name: 'MINIMAL BLACK LEATHER LOAFERS',
    color: 'Black',
    style: 'classic',
    fit: 'classic',
    price: 14200,
    description: fmt(
      'Minimal black leather loafers — clean slip-on profile for everyday elegance.',
      [
        'Smooth black leather upper.',
        'Unembellished minimal vamp.',
        'Low profile dress sole.',
        'Comfortable slip-on entry.',
        'Essential black loafer staple.',
      ]
    ),
  },
  men_s_designer_slip_on_loafers___formal___casual_: {
    name: 'BLACK SUEDE HORSEBIT LOAFERS',
    color: 'Black',
    style: 'horsebit',
    fit: 'classic',
    price: 17800,
    description: fmt(
      'Black suede horsebit loafers — gold hardware on a soft suede slip-on upper.',
      [
        'Black suede with tonal stitching.',
        'Gold-tone horsebit ornament.',
        'Apron toe moccasin construction.',
        'Formal and casual versatility.',
        'Prince Esquire signature loafer.',
      ]
    ),
  },
  Loafers: {
    name: 'TAN LEATHER CLASSIC LOAFERS',
    color: 'Tan',
    style: 'classic',
    fit: 'classic',
    price: 15500,
    description: fmt(
      'Tan leather classic loafers — timeless slip-on in warm cognac-toned leather.',
      [
        'Rich tan leather upper.',
        'Classic rounded toe profile.',
        'Low stacked heel.',
        'Smooth interior lining.',
        'Smart-casual wardrobe essential.',
      ]
    ),
  },
  Life_is_fashion__professionnalmode: {
    name: 'WHITE CHUNKY BEE EMBLEM LOAFERS',
    color: 'White',
    style: 'penny',
    fit: 'classic',
    price: 22000,
    featured: true,
    description: fmt(
      'White chunky platform loafers with bee emblem — textured vamp and bold lug sole.',
      [
        'Glossy white platform lug sole.',
        'Embossed animal-print texture on vamp.',
        'Silver bee emblem on black ornament.',
        'Statement designer-inspired loafer.',
        'Fashion-forward slip-on style.',
      ]
    ),
  },
  Men_s_Luxury_Native_Attire_Shoe: {
    name: 'BLACK GLITTER SMOKING LOAFERS',
    color: 'Black',
    style: 'smoking',
    fit: 'classic',
    price: 24000,
    description: fmt(
      'Black glitter smoking loafers — velvet sparkle finish for gala and celebration wear.',
      [
        'Black glitter-embellished upper.',
        'Smoking slipper low-cut profile.',
        'Tan leather interior lining.',
        'Signature red-edge sole detail.',
        'Evening and wedding formal loafer.',
      ]
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'loafers-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} loafer specs → ${OUT}`);
