/**
 * Generates backend/data/three-piece-suit-specs.json with rich three-piece metadata.
 * Run: node scripts/generate-three-piece-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes S–3XL (jacket, waistcoat & trouser set). Tailored at Prince Esquire for weddings, galas, and executive occasions.`;

const SPECS = {
  Blue_Slim_Fit_Suit_3_Piece_Blue___EU_58___US_48_UK_48: {
    name: 'MEDIUM BLUE SLIM-FIT THREE-PIECE SUIT',
    color: 'Blue',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 34500,
    featured: true,
    description: fmt(
      'A vibrant medium-blue three-piece suit with slim tailoring — jacket, five-button waistcoat, and matching trousers for a polished celebration-ready look.',
      [
        'Complete three-piece set in rich medium blue suiting.',
        'Single-breasted two-button jacket with classic notch lapels.',
        'Coordinated five-button waistcoat with pointed hem.',
        'Slim-fit matching trousers with sharp front crease.',
        'Flap hip pockets and welt breast pocket on the jacket.',
      ]
    ),
  },
  'Bespoke_Navy_Plaid_Three-Piece_Notched_Lapel_Business_Suit': {
    name: 'NAVY WINDOWPANE PLAID THREE-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'plaid',
    vestStyle: 'single-breasted waistcoat',
    price: 42000,
    featured: true,
    description: fmt(
      'Bespoke-inspired navy windowpane plaid three-piece — refined grid pattern across jacket, waistcoat, and trousers for distinguished business and wedding style.',
      [
        'Navy base with elegant windowpane plaid pattern throughout.',
        'Single-breasted jacket with notch lapels and two-button closure.',
        'Matching plaid waistcoat with five-button front.',
        'Coordinated plaid trousers with tailored taper.',
        'Premium structured wool-blend suiting with refined drape.',
      ]
    ),
  },
  'Bojoni_Black_Striped_Slim-Fit_Suit_3-Piece_-_Black___EU_48_-_US_38_UK_38': {
    name: 'BLACK PINSTRIPE SLIM-FIT THREE-PIECE SUIT',
    color: 'Black',
    style: 'peak-lapel',
    pattern: 'pinstripe',
    vestStyle: 'single-breasted waistcoat',
    price: 39500,
    featured: true,
    description: fmt(
      'Commanding black pinstripe three-piece with peak lapels — slim-fit tailoring, vintage-inspired watch chain styling, and power-suit presence.',
      [
        'Charcoal-black base with fine vertical pinstripes.',
        'Peak-lapel jacket with ticket pocket and structured shoulders.',
        'Matching pinstripe waistcoat with button-front closure.',
        'Slim-fit coordinated trousers.',
        'Ideal for executive meetings, galas, and formal weddings.',
      ]
    ),
  },
  'Bordeaux_Slim-Fit_Suit_3-Piece_-_VIOSSI': {
    name: 'BORDEAUX SLIM-FIT THREE-PIECE SUIT',
    color: 'Burgundy',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 36800,
    description: fmt(
      'Rich bordeaux three-piece in a slim VIOSSI cut — deep wine tone across jacket, waistcoat, and trousers for memorable formal occasions.',
      [
        'Deep bordeaux suiting with smooth premium finish.',
        'Single-breasted jacket with notch lapels.',
        'Matching waistcoat with V-neckline and button front.',
        'Slim-fit trousers with pressed crease.',
        'Statement colour for weddings and evening galas.',
      ]
    ),
  },
  'Camel_Slim-Fit_Suit_3-Piece_-_Camel___EU_56_-_US_46_UK_46': {
    name: 'CAMEL SLIM-FIT THREE-PIECE SUIT',
    color: 'Camel',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'double-breasted waistcoat',
    price: 37200,
    featured: true,
    description: fmt(
      'Warm camel three-piece with double-breasted waistcoat — textured suiting and slim silhouette for seasonal weddings and upscale events.',
      [
        'Camel-toned suiting with subtle woven texture.',
        'Single-breasted jacket with notch lapels.',
        'Double-breasted six-button waistcoat for sartorial depth.',
        'Matching slim-fit trousers with belt loops.',
        'Versatile earth-tone alternative to navy formalwear.',
      ]
    ),
  },
  'Camel_Slim-Fit_Suit_3-Piece_-_VIOSSI': {
    name: 'TAN TEXTURED VIOSSI THREE-PIECE SUIT',
    color: 'Tan',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'double-breasted waistcoat',
    price: 36500,
    description: fmt(
      'Tan textured VIOSSI three-piece — double-breasted waistcoat and coordinated jacket-and-trouser set for refined warm-weather formalwear.',
      [
        'Light tan suiting with visible premium weave.',
        'Single-breasted jacket with clean notch lapels.',
        'Double-breasted waistcoat with parallel button rows.',
        'Matching trousers with rear welt pocket.',
        'Pairs beautifully with dark or white dress shirts.',
      ]
    ),
  },
  Champagne_Three_Pieces_Business_suits_Notched_Lapel_Tuxedos_Blazer_Vest_Pants: {
    name: 'CHAMPAGNE NOTCHED LAPEL THREE-PIECE SUIT',
    color: 'Ivory',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 38500,
    featured: true,
    description: fmt(
      'Champagne ivory three-piece business suit — luminous formal tone with notch lapels, waistcoat layering, and tuxedo-level polish.',
      [
        'Champagne ivory suiting with elegant lustre.',
        'Notched-lapel single-breasted jacket.',
        'Matching waistcoat for layered formal depth.',
        'Coordinated flat-front trousers.',
        'Wedding, banquet, and black-tie-adjacent ready.',
      ]
    ),
  },
  Mens_Suit_3_Piece_Slim_Fit_Wedding_Business_Suits_for_Men_Three_Piece_Formal_Peak_Lapel_Suit_Set: {
    name: 'FORMAL PEAK LAPEL THREE-PIECE SUIT SET',
    color: 'Navy',
    style: 'peak-lapel',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 41000,
    featured: true,
    description: fmt(
      'Groomsman-ready peak-lapel three-piece — slim-fit wedding and business formal set with commanding lapels and full waistcoat coordination.',
      [
        'Peak-lapel jacket with slim-fit structured shoulders.',
        'Matching waistcoat with deep V-neckline.',
        'Coordinated slim trousers for cohesive silhouette.',
        'Premium suiting suitable for weddings and prom.',
        'Complete three-piece formal ensemble.',
      ]
    ),
  },
  'Men_s_Navy_Blue_3_piece_Suit_Regular_Fit_for_Wedding': {
    name: 'NAVY BLUE WEDDING THREE-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 33800,
    description: fmt(
      'Classic navy blue wedding three-piece in a comfortable regular fit — timeless colour with waistcoat layering for groom and groomsman parties.',
      [
        'Deep navy suiting with smooth matte finish.',
        'Single-breasted two-button jacket with notch lapels.',
        'Four-button matching waistcoat.',
        'Regular-fit trousers for all-day comfort.',
        'Versatile wedding and business formal staple.',
      ]
    ),
  },
  'Men_s_Red_and_Cream_Three_Piece_Suit___Custom_Tailored_Wedding_Outfit_-_Etsy': {
    name: 'RED & CREAM CUSTOM WEDDING THREE-PIECE',
    color: 'Red',
    style: 'peak-lapel',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 45000,
    featured: true,
    description: fmt(
      'Custom-tailored red and cream three-piece wedding outfit — bold contrast styling with peak lapels for unforgettable groom presence.',
      [
        'Red jacket with cream coordinated waistcoat and trousers.',
        'Peak-lapel formal jacket with premium structure.',
        'Custom wedding-tailored three-piece coordination.',
        'Statement colour for destination and celebration weddings.',
        'Full jacket, waistcoat, and trouser set.',
      ]
    ),
  },
  'Men_s_Royal_Blue_3-Piece_Suit___Peak_Lapel_Wedding___Formal_Look': {
    name: 'ROYAL BLUE PEAK LAPEL THREE-PIECE SUIT',
    color: 'Blue',
    style: 'peak-lapel',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 40500,
    featured: true,
    description: fmt(
      'Royal blue peak-lapel three-piece — electric formal colour with waistcoat layering for weddings and high-profile events.',
      [
        'Vivid royal blue suiting with structured drape.',
        'Wide peak lapels on single-breasted jacket.',
        'Matching royal blue waistcoat and trousers.',
        'Bold formal look that photographs beautifully.',
        'Wedding and prom statement ensemble.',
      ]
    ),
  },
  'Men_s_Suit_3_Piece_Suit_Slim_Fit_1-Button_Suits_Striped_Suits_-_Dark_Grey___XL': {
    name: 'DARK GREY STRIPE SLIM-FIT THREE-PIECE',
    color: 'Grey',
    style: 'single-breasted',
    pattern: 'stripe',
    vestStyle: 'single-breasted waistcoat',
    price: 35200,
    description: fmt(
      'Dark grey striped slim-fit three-piece — one-button jacket styling with coordinated waistcoat for modern executive formalwear.',
      [
        'Dark grey base with refined stripe pattern.',
        'Single-button slim-fit jacket with notch lapels.',
        'Matching striped waistcoat.',
        'Coordinated slim trousers.',
        'Professional boardroom and gala ready.',
      ]
    ),
  },
  Men_Suits_3_Piece_Slim_Fit_Single_Breasted_Two_: {
    name: 'CHARCOAL PINSTRIPE SLIM THREE-PIECE SUIT',
    color: 'Grey',
    style: 'single-breasted',
    pattern: 'pinstripe',
    vestStyle: 'single-breasted waistcoat',
    price: 35800,
    description: fmt(
      'Charcoal pinstripe slim three-piece — vertical stripe refinement across jacket, five-button waistcoat, and trousers.',
      [
        'Charcoal grey with contrasting pinstripes.',
        'Single-breasted two-button jacket.',
        'Five-button matching pinstripe waistcoat.',
        'Slim-fit coordinated trousers.',
        'Timeless business and wedding formal style.',
      ]
    ),
  },
  '3_Piece_Men_Suit_Peak_Lapel_Groomsman_Tuxedo__Wedding_Formal_Party_Prom_Suits': {
    name: 'GROOMSMAN PEAK LAPEL TUXEDO THREE-PIECE',
    color: 'Black',
    style: 'peak-lapel',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 42800,
    featured: true,
    description: fmt(
      'Peak-lapel groomsman tuxedo three-piece — wedding, prom, and formal party ready with full waistcoat coordination.',
      [
        'Tuxedo-level peak-lapel jacket.',
        'Matching formal waistcoat.',
        'Coordinated slim trousers.',
        'Groomsman and prom formal staple.',
        'Complete three-piece celebration set.',
      ]
    ),
  },
  '3_piece_peak_lapel_buttoned': {
    name: 'NAVY PEAK LAPEL BUTTONED THREE-PIECE',
    color: 'Navy',
    style: 'peak-lapel',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 39800,
    description: fmt(
      'Navy peak-lapel buttoned three-piece — structured formal tailoring with waistcoat layer for executive and wedding dressing.',
      [
        'Deep navy suiting with peak lapels.',
        'Buttoned jacket front with clean lines.',
        'Matching waistcoat with V-neck cut.',
        'Coordinated trousers with sharp crease.',
        'Premium Prince Esquire formal construction.',
      ]
    ),
  },
  Amazon_com__blue_plaid_suit_men: {
    name: 'BLUE PLAID THREE-PIECE SUIT',
    color: 'Blue',
    style: 'single-breasted',
    pattern: 'plaid',
    vestStyle: 'single-breasted waistcoat',
    price: 37500,
    description: fmt(
      'Blue plaid three-piece suit — classic check pattern across jacket, waistcoat, and trousers for distinctive formal character.',
      [
        'Blue base with tailored plaid/check pattern.',
        'Single-breasted jacket with notch lapels.',
        'Matching plaid waistcoat.',
        'Coordinated plaid trousers.',
        'Standout pattern for weddings and social events.',
      ]
    ),
  },
  Elegant_Men_Suit_Green_Peak_Lapel_Blazer_Formal_Business_Prom_Groom_Tuxedo_Wedding_Suits_2024: {
    name: 'GREEN PEAK LAPEL WEDDING THREE-PIECE',
    color: 'Green',
    style: 'peak-lapel',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 41500,
    featured: true,
    description: fmt(
      'Emerald green peak-lapel wedding three-piece — groom and prom statement suiting with waistcoat layering and bold formal colour.',
      [
        'Rich green suiting with peak-lapel jacket.',
        'Matching waistcoat for layered elegance.',
        'Coordinated trousers with slim taper.',
        'Wedding, prom, and tuxedo-adjacent styling.',
        'Distinctive alternative to conventional navy.',
      ]
    ),
  },
  Wedding_Business_Banquet_Male_Suit_Black___5XL: {
    name: 'BLACK BANQUET THREE-PIECE SUIT',
    color: 'Black',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 33500,
    description: fmt(
      'Black banquet three-piece — wedding and business formal staple with full waistcoat set, available through extended sizes.',
      [
        'Classic black suiting throughout three-piece set.',
        'Single-breasted jacket with notch lapels.',
        'Matching black waistcoat.',
        'Coordinated formal trousers.',
        'Wedding, banquet, and corporate event ready.',
      ]
    ),
  },
  Wedding_lock_Suit: {
    name: 'MIDNIGHT NAVY PINSTRIPE THREE-PIECE',
    color: 'Navy',
    style: 'peak-lapel',
    pattern: 'pinstripe',
    vestStyle: 'single-breasted waistcoat',
    price: 40200,
    description: fmt(
      'Midnight navy pinstripe three-piece with peak lapels — vintage-inspired formal tailoring with watch-chain waistcoat styling.',
      [
        'Navy pinstripe pattern across full set.',
        'Peak-lapel jacket with ticket pocket detail.',
        'Matching pinstripe waistcoat.',
        'Slim coordinated pinstripe trousers.',
        'Wedding-lock formal collection styling.',
      ]
    ),
  },
  Suitania_Collection__Burgundy_3_Piece_Pinstripe_Single_Breasted_Regular_Fit_Suit_REGULAR_FIT___38___32_WAIST: {
    name: 'BURGUNDY PINSTRIPE SUITANIA THREE-PIECE',
    color: 'Burgundy',
    style: 'single-breasted',
    pattern: 'pinstripe',
    vestStyle: 'single-breasted waistcoat',
    price: 38800,
    description: fmt(
      'Suitania Collection burgundy pinstripe three-piece — regular-fit comfort with coordinated waistcoat for distinguished formal wear.',
      [
        'Burgundy base with fine pinstripes.',
        'Single-breasted regular-fit jacket.',
        'Matching pinstripe waistcoat.',
        'Regular-fit trousers with adjustable comfort.',
        'Suitania Collection premium tailoring.',
      ]
    ),
  },
  Erkek_Trend_Yelekli_Tak_m_Elbise_Men_s_Suits_ilayda_emir: {
    name: 'TREND WAISTCOAT THREE-PIECE SUIT',
    color: 'Classic',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 34000,
    description: fmt(
      'Trend waistcoat three-piece — modern Turkish-inspired formal styling with coordinated jacket, yelek (vest), and slim trousers.',
      [
        'Complete three-piece with prominent waistcoat layer.',
        'Single-breasted jacket with notch lapels.',
        'Slim coordinated trousers.',
        'Contemporary formal trend styling.',
        'Wedding and celebration ready.',
      ]
    ),
  },
  _LAYDA_EM_R_ERKEK_TAKIM_ELB_SE_MODELLER__YELEK_CEKEt_SL_MF_T_G_MLEK_KRAVAT_MENS_SU_T: {
    name: 'EXECUTIVE WAISTCOAT THREE-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 35500,
    description: fmt(
      'Executive waistcoat three-piece — complete jacket, vest, shirt-and-tie formal presentation for premium menswear occasions.',
      [
        'Coordinated jacket and waistcoat (yelek) set.',
        'Classic notch-lapel single-breasted styling.',
        'Matching formal trousers.',
        'Designed for full formal shirt-and-tie pairing.',
        'Premium occasion and wedding suiting.',
      ]
    ),
  },
  Navy_Blue_Suits_for_Men_Online_GENT_WITH: {
    name: 'NAVY DOUBLE-BREASTED WAISTCOAT THREE-PIECE',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'double-breasted waistcoat',
    price: 37800,
    featured: true,
    description: fmt(
      'Navy three-piece with double-breasted waistcoat — deep navy suiting with burgundy tie coordination for authoritative formal presence.',
      [
        'Deep navy jacket with notch lapels.',
        'Double-breasted six-button navy waistcoat.',
        'Matching navy trousers.',
        'Structured shoulders and premium wool-blend hand-feel.',
        'Wedding and executive gala ready.',
      ]
    ),
  },
  Three_piece_suit: {
    name: 'CLASSIC NAVY THREE-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 33200,
    description: fmt(
      'Classic navy three-piece suit — timeless single-breasted jacket, waistcoat, and trouser combination for everyday formal excellence.',
      [
        'Navy suiting across full three-piece set.',
        'Two-button single-breasted jacket.',
        'Matching waistcoat with button front.',
        'Coordinated trousers with sharp crease.',
        'Versatile formal wardrobe foundation.',
      ]
    ),
  },
  Mannequin_men_s_suit: {
    name: 'NAVY PINSTRIPE MANNEQUIN THREE-PIECE',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'pinstripe',
    vestStyle: 'single-breasted waistcoat',
    price: 34800,
    description: fmt(
      'Navy pinstripe three-piece as shown on boutique display — fine vertical stripes with waistcoat layering and tailored trousers.',
      [
        'Navy pinstripe throughout jacket, waistcoat, and trousers.',
        'Single-breasted jacket with notch lapels.',
        'Five-button matching waistcoat.',
        'Boutique-quality tailoring and structure.',
        'Business meeting and wedding appropriate.',
      ]
    ),
  },
  Eddie_s_Suit: {
    name: 'TAN HOUNDSTOOTH THREE-PIECE SUIT',
    color: 'Brown',
    style: 'single-breasted',
    pattern: 'houndstooth',
    vestStyle: 'single-breasted waistcoat',
    price: 39500,
    featured: true,
    description: fmt(
      'Tan houndstooth three-piece with tobacco-brown waistcoat contrast — heritage pattern jacket paired with rich solid vest layering.',
      [
        'Houndstooth-pattern jacket in tan and brown tones.',
        'Contrasting tobacco-brown solid waistcoat.',
        'Coordinated formal trousers.',
        'Vintage gentleman aesthetic with modern slim fit.',
        'Wedding and gala statement suiting.',
      ]
    ),
  },
  Broken_suit: {
    name: 'CHARCOAL PEAK LAPEL PINSTRIPE THREE-PIECE',
    color: 'Grey',
    style: 'peak-lapel',
    pattern: 'pinstripe',
    vestStyle: 'single-breasted waistcoat',
    price: 40800,
    description: fmt(
      'Charcoal peak-lapel pinstripe three-piece — power-suit tailoring with ticket pocket, watch-chain waistcoat detail, and slim trousers.',
      [
        'Charcoal pinstripe with peak-lapel jacket.',
        'Ticket pocket and structured slim shoulders.',
        'Matching pinstripe waistcoat.',
        'Vintage-inspired formal accessories styling.',
        'Executive and wedding formal ready.',
      ]
    ),
  },
  VICLAN: {
    name: 'GREY TEXTURED THREE-PIECE SUIT',
    color: 'Grey',
    style: 'single-breasted',
    pattern: 'solid',
    vestStyle: 'single-breasted waistcoat',
    price: 34200,
    description: fmt(
      'Grey textured three-piece from the VICLAN line — refined weave across jacket, waistcoat, and trousers for understated luxury.',
      [
        'Light grey textured suiting fabric.',
        'Single-breasted jacket with clean lapels.',
        'Matching waistcoat layer.',
        'Coordinated trousers with pressed crease.',
        'Modern formal everyday elegance.',
      ]
    ),
  },
};

const out = path.join(__dirname, '..', 'data', 'three-piece-suit-specs.json');
fs.writeFileSync(out, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} three-piece suit specs to ${out}`);
