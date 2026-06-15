/**
 * Generates backend/data/formal-trouser-specs.json
 * Run: node scripts/generate-formal-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable waist sizes 30–40. Tailored at Prince Esquire for boardrooms, weddings, and formal occasions.`;

const SPECS = {
  '126523070765874279': {
    name: 'NAVY WINDOWPANE FORMAL DRESS TROUSERS',
    color: 'Navy',
    style: 'windowpane',
    fit: 'slim',
    price: 7800,
    featured: true,
    description: fmt(
      'Navy windowpane formal dress trousers with sharp centre crease — structured suiting for executive and wedding wear.',
      [
        'Deep navy base with contrasting windowpane grid.',
        'Pressed centre-leg crease for polished silhouette.',
        'Flat-front waistband with belt loops.',
        'Premium wool-blend suiting fabric.',
        'Pairs with Prince Esquire blazers and dress shirts.',
      ]
    ),
  },
  '309200330662136158': {
    name: 'GREY GLEN PLAID SIDE-ADJUSTER FORMAL TROUSERS',
    color: 'Grey',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 9200,
    description: fmt(
      'Grey Glen plaid formal trousers with side adjusters and cuffed hem — classic sartorial finishing.',
      [
        'Prince of Wales check in grey and charcoal.',
        'Side-adjuster waist tabs with metal buckle.',
        'Single forward pleat and cuffed turn-up hem.',
        'Welt rear pocket with button closure.',
        'Bespoke-inspired tailoring detail.',
      ]
    ),
  },
  '350788258470586343': {
    name: 'CHARCOAL WINDOWPANE FORMAL TROUSERS',
    color: 'Charcoal',
    style: 'windowpane',
    fit: 'slim',
    price: 8000,
    description: fmt(
      'Charcoal windowpane formal trousers with side adjusters — refined grid pattern for business and gala dressing.',
      [
        'Dark charcoal ground with light windowpane overlay.',
        'Side-adjuster tabs instead of belt loops.',
        'Single pleat at front for ease of movement.',
        'Cuffed hem with structured drape.',
        'Premium woven suiting texture.',
      ]
    ),
  },
  '1139903355717803560': {
    name: 'NAVY WINDOWPANE TAILORED FORMAL TROUSERS',
    color: 'Navy',
    style: 'windowpane',
    fit: 'tailored',
    price: 7900,
    description: fmt(
      'Navy windowpane tailored formal trousers — large-scale check pattern with clean belt-loop waistband.',
      [
        'Deep navy with tan windowpane grid.',
        'Tailored tapered leg with pressed crease.',
        'Standard belt loops and button closure.',
        'Rear welt pocket with secure button.',
        'Versatile formal separate for suiting separates.',
      ]
    ),
  },
  '387380005458687729': {
    name: 'DARK TAN FORMAL COTTON DRESS TROUSERS',
    color: 'Tan',
    style: 'flat-front',
    fit: 'slim',
    price: 6500,
    description: fmt(
      'Dark tan cotton twill formal dress trousers — chino-refined construction with office-ready crease.',
      [
        'Mid-weight cotton twill in British tan.',
        'Flat-front slim silhouette.',
        'Chambray-lined waistband for comfort.',
        'Zip fly with button closure.',
        'Smart-formal alternative to wool dress pants.',
      ]
    ),
  },
  Adjustable_gentlemans_trouser_ready_for_order_: {
    name: 'LIGHT GREY SIDE-ADJUSTER FORMAL TROUSERS',
    color: 'Grey',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 8800,
    featured: true,
    description: fmt(
      'Light silver-grey formal trousers with polished side adjusters — fine wool texture with cuffed hem.',
      [
        'Neutral light grey suiting cloth.',
        'Side-adjuster buckle tabs at waist.',
        'Single pleat and slanted side pocket.',
        'Cuffed hem for traditional formal finish.',
        'Clean Prince Esquire tailoring lines.',
      ]
    ),
  },
  'B_TAILOR___B_TAILOR_Bespoke_Trousers': {
    name: 'BEIGE CUFFED FLAT-FRONT FORMAL TROUSERS',
    color: 'Beige',
    style: 'flat-front',
    fit: 'slim',
    price: 7200,
    description: fmt(
      'Beige flat-front formal trousers with turn-up cuffs — slim tailored cut for warm-weather formalwear.',
      [
        'Soft beige cotton-blend suiting.',
        'Flat-front waist with belt loops.',
        'Slim tapered leg with centre crease.',
        'Classic cuffed hem detail.',
        'Ideal for summer weddings and garden events.',
      ]
    ),
  },
  Bespoke_adjustable_trouser_ready_for_order__Model_: {
    name: 'CREAM HIGH-WAIST FORMAL TROUSERS',
    color: 'Cream',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 9500,
    description: fmt(
      'Cream high-waist formal trousers with ring-buckle side tab — sharp pleats and wide-leg drape.',
      [
        'Off-white ivory suiting fabric.',
        'High-rise waist with side ring-buckle closure.',
        'Prominent forward pleats for volume.',
        'Wide-leg formal silhouette.',
        'Statement piece for black-tie and summer formals.',
      ]
    ),
  },
  grey_trouser: {
    name: 'CHARCOAL FLANNEL CUFFED FORMAL TROUSERS',
    color: 'Charcoal',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 8600,
    description: fmt(
      'Charcoal flannel formal trousers with side adjusters and turn-up cuffs — rich mottled wool texture.',
      [
        'Heavy brushed flannel in charcoal grey.',
        'Side-adjuster strap with silver buckle.',
        'Slanted side pocket and buttoned rear welt.',
        'Prominent cuffed hem.',
        'Ideal for cooler-season formal dressing.',
      ]
    ),
  },
  Grey_Trousers: {
    name: 'GREY CHECK SIDE-ADJUSTER DRESS TROUSERS',
    color: 'Grey',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 8400,
    description: fmt(
      'Grey check formal dress trousers with side adjusters — Glen plaid weave with cuffed finish.',
      [
        'Grey Glen plaid suiting pattern.',
        'Side-adjuster tabs with polished buckle.',
        'Forward pleat and clean front line.',
        'Cuffed hem for traditional tailoring.',
        'Pairs with navy and charcoal blazers.',
      ]
    ),
  },
  'Luxire__1_': {
    name: 'FOREST GREEN FORMAL DRESS TROUSERS',
    color: 'Green',
    style: 'flat-front',
    fit: 'slim',
    price: 7400,
    description: fmt(
      'Forest green formal dress trousers with permanent press crease — slim tapered leg for modern suiting.',
      [
        'Deep emerald green suiting cloth.',
        'Flat-front slim tapered silhouette.',
        'Sharp centre-leg crease.',
        'Zip fly with button waist closure.',
        'Distinctive formal colour for evening events.',
      ]
    ),
  },
  Italian_Pants: {
    name: 'HOUNDSTOOTH WOVEN FORMAL TROUSERS',
    color: 'Multi',
    style: 'flat-front',
    fit: 'tailored',
    price: 8200,
    featured: true,
    description: fmt(
      'Italian-inspired houndstooth formal trousers — navy, olive, and grey multi-tone weave with side adjusters.',
      [
        'Heritage houndstooth micro-pattern.',
        'Side-adjuster waist for bespoke fit.',
        'Premium woven wool-blend texture.',
        'Buttoned rear welt pocket.',
        'European tailoring influence.',
      ]
    ),
  },
  'Luxire_dress_pants_constructed_in_Minnis_': {
    name: 'LIGHT GREY MINNIS WOOL FORMAL TROUSERS',
    color: 'Grey',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 9800,
    description: fmt(
      'Light grey Minnis wool formal trousers with side adjusters — fine English suiting with cuffed hem.',
      [
        'Premium Minnis wool suiting quality.',
        'Light silver-grey colourway.',
        'Side-adjuster buckle tabs.',
        'Single pleat and cuffed turn-up.',
        'Luxury formal separate for discerning dressers.',
      ]
    ),
  },
  Newly_latest_black_trendy_fashion_style_baars_pant_design: {
    name: 'BLACK FORMAL DRESS TROUSERS WITH BELT',
    color: 'Black',
    style: 'flat-front',
    fit: 'classic',
    price: 6800,
    description: fmt(
      'Black formal dress trousers with matching belt — straight-leg cut with sharp centre crease.',
      [
        'Solid black suiting fabric.',
        'Included matching leather belt.',
        'Classic straight-leg formal cut.',
        'Permanent press centre crease.',
        'Essential black-tie and office staple.',
      ]
    ),
  },
  '322922235782862159': {
    name: 'NAVY FLAT-FRONT FORMAL DRESS TROUSERS',
    color: 'Navy',
    style: 'flat-front',
    fit: 'slim',
    price: 7000,
    description: fmt(
      'Navy flat-front formal dress trousers — slim tailored leg with crisp pressed crease.',
      [
        'Deep navy suiting cloth.',
        'Flat-front slim silhouette.',
        'Belt loops with button closure.',
        'Sharp vertical leg crease.',
        'Core formal wardrobe essential.',
      ]
    ),
  },
  'Men_s_Fashion__style___Accessories': {
    name: 'MIDNIGHT BLUE FORMAL DRESS TROUSERS',
    color: 'Navy',
    style: 'flat-front',
    fit: 'slim',
    price: 7100,
    description: fmt(
      'Midnight blue formal dress trousers — clean flat-front tailoring for business and ceremony.',
      [
        'Rich midnight navy tone.',
        'Slim flat-front cut.',
        'Standard belt loops and zip fly.',
        'Pressed crease through each leg.',
        'Versatile formal separate.',
      ]
    ),
  },
  'Men_s_Office_Wear_Trouser_Business_Formal_Pants_Best_Quality_Fabric_Casual_Pants__1_': {
    name: 'BLACK OFFICE FORMAL DRESS TROUSERS',
    color: 'Black',
    style: 'flat-front',
    fit: 'slim',
    price: 6900,
    description: fmt(
      'Black office formal dress trousers — business-ready slim fit with premium fabric hand.',
      [
        'Solid black office suiting.',
        'Slim tapered business silhouette.',
        'Durable premium fabric blend.',
        'Centre crease for polished presentation.',
        'Daily executive wear staple.',
      ]
    ),
  },
  'UNINUKOO_Mens_Dress_Pants_Slim_Fit_Solid_Color_Skinny_Trousers_Classic_Business_Casual_Wedding_Suit_Pants__1_': {
    name: 'NAVY SLIM-FIT FORMAL DRESS TROUSERS',
    color: 'Navy',
    style: 'flat-front',
    fit: 'slim',
    price: 6700,
    description: fmt(
      'Navy slim-fit formal dress trousers — skinny tailored leg for modern wedding and business suiting.',
      [
        'Solid navy suiting colour.',
        'Slim skinny-tapered leg.',
        'Flat-front waistband with belt loops.',
        'Clean wedding-suit separate styling.',
        'Pairs with Prince Esquire formal shirts.',
      ]
    ),
  },
  Italian_Linen: {
    name: 'BEIGE ITALIAN LINEN FORMAL TROUSERS',
    color: 'Beige',
    style: 'flat-front',
    fit: 'regular',
    price: 7500,
    featured: true,
    description: fmt(
      'Beige Italian linen formal trousers — breathable summer formalwear with tailored crease.',
      [
        'Italian linen weave in soft beige.',
        'Flat-front regular straight leg.',
        'Breathable warm-weather formal fabric.',
        'Pressed centre crease.',
        'Ideal for outdoor weddings and coastal events.',
      ]
    ),
  },
  '545991154850721850': {
    name: 'MONOCHROME GLEN PLAID FORMAL TROUSERS',
    color: 'Grey',
    style: 'check',
    fit: 'tailored',
    price: 8100,
    description: fmt(
      'Monochrome Glen plaid formal trousers — black and white check with rear welt pocket detail.',
      [
        'Classic Glen plaid in monochrome.',
        'Tailored folded presentation cut.',
        'Belt-loop waistband.',
        'Buttoned rear welt pocket.',
        'Smart-formal pattern separate.',
      ]
    ),
  },
  '291748882097031250': {
    name: 'OATMEAL LINEN FORMAL TROUSERS',
    color: 'Beige',
    style: 'flat-front',
    fit: 'regular',
    price: 7300,
    description: fmt(
      'Oatmeal linen formal trousers — lightweight textured weave for refined summer dressing.',
      [
        'Oatmeal beige linen-blend fabric.',
        'Relaxed formal straight leg.',
        'Natural breathable texture.',
        'Clean flat-front construction.',
        'Pairs with linen shirts and loafers.',
      ]
    ),
  },
  'SALMON_COLORED_TROUSERS_FOR_MENS__1_': {
    name: 'SALMON FORMAL DRESS TROUSERS',
    color: 'Salmon',
    style: 'flat-front',
    fit: 'slim',
    price: 7600,
    description: fmt(
      'Salmon formal dress trousers — distinctive warm tone for celebratory and summer formal events.',
      [
        'Soft salmon pink suiting tone.',
        'Slim flat-front cut.',
        'Pressed leg crease.',
        'Belt loops with button closure.',
        'Statement formal colour for weddings.',
      ]
    ),
  },
  'Luxire_dress_pants_constructed_in_Chino__Classic_': {
    name: 'CLASSIC BEIGE FORMAL CHINO TROUSERS',
    color: 'Beige',
    style: 'flat-front',
    fit: 'classic',
    price: 6600,
    description: fmt(
      'Classic beige formal chino trousers — Luxire-inspired dress construction with tailored finish.',
      [
        'Classic beige chino suiting tone.',
        'Dress-trouser construction in chino cloth.',
        'Flat-front classic fit.',
        'Zip and button closure.',
        'Smart-casual to formal crossover.',
      ]
    ),
  },
  one: {
    name: 'IVORY FORMAL DRESS TROUSERS',
    color: 'Ivory',
    style: 'flat-front',
    fit: 'slim',
    price: 7700,
    description: fmt(
      'Ivory formal dress trousers — clean light tone for summer weddings and cream-jacket pairings.',
      [
        'Soft ivory off-white suiting.',
        'Slim flat-front silhouette.',
        'Sharp centre crease.',
        'Belt-loop waistband.',
        'Elegant warm-weather formal option.',
      ]
    ),
  },
  'Luxire_dress_pants__Button_fly_front_closure_with_': {
    name: 'TAN BUTTON-FLY FORMAL DRESS TROUSERS',
    color: 'Tan',
    style: 'button-fly',
    fit: 'classic',
    price: 6400,
    description: fmt(
      'Tan button-fly formal dress trousers — traditional closure with clean flat-front lines.',
      [
        'Medium tan formal suiting.',
        'Traditional button-fly front.',
        'Flat-front classic cut.',
        'Belt loops and pressed crease.',
        'Heritage formal trouser detailing.',
      ]
    ),
  },
  'UNINUKOO_Mens_Dress_Pants_Slim_Fit_Solid_Color_Skinny_Trousers_Classic_Business_Casual_Wedding_Suit_Pants': {
    name: 'EMERALD SLIM-FIT FORMAL DRESS TROUSERS',
    color: 'Green',
    style: 'flat-front',
    fit: 'slim',
    price: 6800,
    description: fmt(
      'Emerald green slim-fit formal dress trousers — bold colour for modern wedding separates.',
      [
        'Rich emerald green suiting.',
        'Slim tapered leg profile.',
        'Flat-front waist with belt loops.',
        'Centre-leg permanent crease.',
        'Distinctive wedding-guest formalwear.',
      ]
    ),
  },
  Luxire_Trousers: {
    name: 'MID GREY LUXIRE FORMAL TROUSERS',
    color: 'Grey',
    style: 'flat-front',
    fit: 'tailored',
    price: 8500,
    description: fmt(
      'Mid grey Luxire formal trousers — precision tailoring with refined suiting drape.',
      [
        'Mid grey premium suiting cloth.',
        'Tailored flat-front cut.',
        'Clean pressed crease.',
        'Quality waistband finishing.',
        'Luxire-inspired formal construction.',
      ]
    ),
  },
  'Luxire__2_': {
    name: 'CHARCOAL LUXIRE FORMAL DRESS TROUSERS',
    color: 'Charcoal',
    style: 'flat-front',
    fit: 'tailored',
    price: 8700,
    description: fmt(
      'Charcoal Luxire formal dress trousers — understated dark grey for executive suiting.',
      [
        'Charcoal grey suiting fabric.',
        'Tailored flat-front silhouette.',
        'Belt loops and zip-button closure.',
        'Sharp leg crease.',
        'Boardroom-ready formal separate.',
      ]
    ),
  },
  '572520171376442866': {
    name: 'NAVY WINDOWPANE BOUTIQUE FORMAL TROUSERS',
    color: 'Navy',
    style: 'windowpane',
    fit: 'tailored',
    price: 9000,
    featured: true,
    description: fmt(
      'Navy windowpane boutique formal trousers — large-scale check with pleated high-rise waist.',
      [
        'Navy base with tan windowpane overlay.',
        'High-rise pleated formal waist.',
        'Tapered leg with cuffed hem.',
        'Premium textured suiting weave.',
        'Boutique-quality formal statement.',
      ]
    ),
  },
  'UNINUKOO_Mens_Classic_Suit_Pants_Straight_Fit_Modern_Formal_Dress_Pants_Separate_Trousers': {
    name: 'CLASSIC STRAIGHT-FIT FORMAL SUIT TROUSERS',
    color: 'Charcoal',
    style: 'flat-front',
    fit: 'classic',
    price: 7200,
    description: fmt(
      'Classic straight-fit formal suit trousers — modern separate with timeless straight leg.',
      [
        'Charcoal formal suiting separate.',
        'Straight-fit modern cut.',
        'Flat-front waistband.',
        'Pressed centre crease.',
        'Versatile suit-trouser separate.',
      ]
    ),
  },
  Luxire: {
    name: 'NAVY LUXIRE BESPOKE FORMAL TROUSERS',
    color: 'Navy',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 9600,
    description: fmt(
      'Navy Luxire bespoke formal trousers — side-adjuster waist with premium suiting construction.',
      [
        'Deep navy bespoke suiting cloth.',
        'Side-adjuster waist tabs.',
        'Tailored tapered leg.',
        'Clean formal finishing throughout.',
        'Luxury formal separate from Prince Esquire.',
      ]
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'formal-trouser-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} formal trouser specs → ${OUT}`);
