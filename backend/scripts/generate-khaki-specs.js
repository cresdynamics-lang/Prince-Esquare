/**
 * Generates backend/data/khaki-trouser-specs.json with rich khaki trouser metadata.
 * Run: node scripts/generate-khaki-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable waist sizes 30–40. Tailored at Prince Esquire for smart-casual, office, and weekend wear.`;

const SPECS = {
  '508132770466494258': {
    name: 'TEXTURED LIGHT GREY TAILORED KHAKI TROUSERS',
    color: 'Grey',
    style: 'flat-front',
    fit: 'slim',
    price: 6200,
    description: fmt(
      'Textured light grey tailored khakis with a heathered weave — sharp centre crease, flat-front cut, and refined Prince Esquire finishing for office-ready style.',
      [
        'Premium textured cotton-blend twill with subtle melange finish.',
        'Flat-front design with pressed centre-leg crease.',
        'Slanted side pockets and buttoned rear welt pocket.',
        'Slim tailored silhouette for a modern profile.',
        'Versatile grey tone pairs with navy, white, and earth-tone shirts.',
      ]
    ),
  },
  '387380005458687729': {
    name: 'DARK KHAKI COTTON TWILL CHINOS',
    color: 'Khaki',
    style: 'flat-front',
    fit: 'slim',
    price: 5800,
    description: fmt(
      'Dark khaki cotton twill chinos with chambray-lined waistband — durable everyday trousers with clean flat-front styling.',
      [
        'Mid-weight cotton twill in classic British tan khaki.',
        'Flat-front silhouette with zip fly and button closure.',
        'Chambray-lined waistband for comfort and structure.',
        'Deep slanted side pockets.',
        'Smart-casual staple for office and weekend wear.',
      ]
    ),
  },
  '514888169897601167': {
    name: 'CLASSIC TAN FLAT-FRONT KHAKI CHINOS',
    color: 'Tan',
    style: 'flat-front',
    fit: 'regular',
    price: 5500,
    description: fmt(
      'Classic tan flat-front khaki chinos — timeless cotton twill with tonal stitching and an easy regular fit.',
      [
        'Smooth cotton twill in versatile medium tan.',
        'Flat-front design with belt loops and button-zip closure.',
        'Regular straight-leg cut for all-day comfort.',
        'Clean tonal stitching throughout.',
        'Essential smart-casual wardrobe foundation.',
      ]
    ),
  },
  Beige_caqui: {
    name: 'BEIGE CAQUI FLAT-FRONT CHINOS',
    color: 'Beige',
    style: 'flat-front',
    fit: 'regular',
    price: 5600,
    description: fmt(
      'Beige caqui flat-front chinos in a soft cotton twill — polished enough for the office, relaxed enough for weekends.',
      [
        'Light beige khaki tone with smooth matte finish.',
        'Classic flat-front chino construction.',
        'Standard belt loops and zip-button closure.',
        'Straight-leg regular fit.',
        'Pairs with Prince Esquire shirts and polos.',
      ]
    ),
  },
  Haband_Pants___Haband_Casual_Joe_Pants_Mens_32x27_Khaki_Elastic_Waist_Chino_Relaxed___Color__Tan___Size__32: {
    name: 'RELAXED ELASTIC-WAIST KHAKI CHINOS',
    color: 'Tan',
    style: 'elastic-waist',
    fit: 'relaxed',
    price: 5200,
    description: fmt(
      'Relaxed-fit khaki chinos with partial elastic waistband — comfort-first tailoring with a sharp pressed crease for polished casual wear.',
      [
        'Partial elastic side waistband for flexible fit.',
        'Durable cotton twill in classic tan khaki.',
        'Straight-leg relaxed silhouette.',
        'Pressed centre crease for a dressed-up look.',
        'Ideal for all-day comfort without sacrificing style.',
      ]
    ),
  },
  Khaki_Button_Fly_Chino_Trousers: {
    name: 'KHAKI BUTTON-FLY CHINO TROUSERS',
    color: 'Khaki',
    style: 'flat-front',
    fit: 'slim',
    price: 5900,
    description: fmt(
      'Khaki button-fly chino trousers with clean flat-front lines — crisp cotton twill built for smart-casual dressing.',
      [
        'Traditional button-fly front closure.',
        'Flat-front slim cut with tapered leg.',
        'Quality cotton twill with reinforced belt loops.',
        'Slanted side-entry pockets.',
        'Versatile khaki tone for year-round wear.',
      ]
    ),
  },
  Luxire__1_: {
    name: 'PREMIUM KHAKI TROUSERS WITH SIDE ADJUSTERS',
    color: 'Beige',
    style: 'side-adjuster',
    fit: 'tailored',
    price: 7800,
    featured: true,
    description: fmt(
      'Premium khaki trousers with Gurkha-style side adjusters — high-rise tailored cut, turn-up cuffs, and sartorial Prince Esquire detailing.',
      [
        'Side buckle adjusters replace belt loops for a custom fit.',
        'High-rise tailored waist with slanted welt pockets.',
        'Buttoned rear welt pocket with horn-style button.',
        'Turn-up cuffs and sharp pressed centre crease.',
        'Textured linen-wool blend appearance for elevated style.',
      ]
    ),
  },
  Pelago_Khaki_Stretch_Chino_Dress_Pants___Mens_5: {
    name: 'PELAGO STRETCH 5-POCKET KHAKI TROUSERS',
    color: 'Tan',
    style: 'five-pocket',
    fit: 'straight',
    price: 6400,
    description: fmt(
      'Pelago-inspired stretch khaki trousers with five-pocket styling — cotton comfort meets jean-like utility in a tan chino finish.',
      [
        'Five-pocket design with rivet-reinforced front pockets.',
        'Stretch cotton blend for ease of movement.',
        'Straight-leg cut with branded interior waistband.',
        'Metal button closure and zip fly.',
        'Smart-casual hybrid of chino polish and denim durability.',
      ]
    ),
  },
  Men_s_Casual_Pants___REI_Co_op: {
    name: 'MK CLASSIC KHAKI CARGO TROUSERS',
    color: 'Khaki',
    style: 'cargo',
    fit: 'relaxed',
    price: 6800,
    description: fmt(
      'Rugged khaki cargo trousers with pleated thigh pockets — heavy-duty cotton twill built for outdoor utility and casual adventure.',
      [
        'Durable heavyweight cotton twill construction.',
        'Two large pleated cargo pockets with flap closures.',
        'Reinforced utility pocket with metal rivet detail.',
        'Straight-leg relaxed fit with triple-stitched seams.',
        'Six-pocket design for maximum functionality.',
      ]
    ),
  },
  Page_Not_Found: {
    name: 'KHAKI CARGO TROUSERS WITH WEB BELT',
    color: 'Khaki',
    style: 'cargo',
    fit: 'relaxed',
    price: 6500,
    description: fmt(
      'Classic khaki cargo trousers styled with a canvas web belt — relaxed straight-leg cut with reinforced knee detailing.',
      [
        'Heavyweight cotton canvas twill in tan khaki.',
        'Expandable cargo pockets with secure button flaps.',
        'Reinforced horizontal knee stitching for durability.',
        'Includes matching canvas web belt with metal buckle.',
        'Relaxed fit for casual and outdoor wear.',
      ]
    ),
  },
  Plaid_Plain_Men_s_Dress_Pants_Slim_Fit_Stretch_: {
    name: 'SLIM-FIT STRETCH KHAKI DRESS TROUSERS',
    color: 'Khaki',
    style: 'dress',
    fit: 'slim',
    price: 7200,
    featured: true,
    description: fmt(
      'Slim-fit stretch khaki dress trousers with sharp centre crease — office-ready tailoring that moves with you.',
      [
        'Stretch cotton blend for comfort through long days.',
        'Slim tapered leg with permanent press crease.',
        'Flat-front waistband with belt loops.',
        'Smart-casual dress trouser finish.',
        'Pairs with dress shirts and leather shoes.',
      ]
    ),
  },
  Walker_Slater_Moleskin_Trousers: {
    name: 'TOBACCO MOLESKIN WIDE-LEG KHAKI TROUSERS',
    color: 'Tobacco',
    style: 'wide-leg',
    fit: 'relaxed',
    price: 7500,
    featured: true,
    description: fmt(
      'Tobacco moleskin wide-leg khaki trousers — high-rise barrel-leg silhouette in soft brushed cotton with utility-inspired pocket detailing.',
      [
        'Soft brushed moleskin cotton in rich tobacco brown.',
        'High-rise waist with deep curved front pockets.',
        'Contemporary barrel / wide-leg silhouette.',
        'Structural front seaming for shape and drape.',
        'Distinctive alternative to standard slim chinos.',
      ]
    ),
  },
  '513340057535417570': {
    name: 'BEAMS COTTON TWILL CHINO COLLECTION',
    color: 'Multi',
    style: 'flat-front',
    fit: 'slim',
    price: 6900,
    description: fmt(
      'BEAMS-style cotton twill chino collection — flat-front slim-straight cut available in charcoal, olive, sand, navy, and classic tan.',
      [
        'Premium cotton twill with workwear-inspired durability.',
        'Flat-front slim-to-straight leg silhouette.',
        'Colour-coded button closure and branded inner waistband.',
        'Traditional slash side pockets.',
        'Five versatile colourways in one refined chino style.',
      ]
    ),
  },
  '847028642443314371': {
    name: 'LIGHT BEIGE SLIM KHAKI CHINOS',
    color: 'Beige',
    style: 'flat-front',
    fit: 'slim',
    price: 5700,
    description: fmt(
      'Light beige slim khaki chinos — soft cotton twill with a clean tapered leg for minimalist smart-casual dressing.',
      [
        'Light beige khaki tone with smooth matte twill.',
        'Slim tapered leg with flat-front waist.',
        'Contrasting dark button at centre waist.',
        'Classic slanted side pockets.',
        'Easy pairing with polos and casual shirts.',
      ]
    ),
  },
  '121526889938230082': {
    name: 'OLIVE GREEN KHAKI CHINO TROUSERS',
    color: 'Olive',
    style: 'flat-front',
    fit: 'straight',
    price: 5800,
    description: fmt(
      'Olive green khaki chino trousers — straight-leg flat-front cut in durable cotton twill with double-needle side seams.',
      [
        'Muted olive / sage green cotton twill.',
        'Straight-leg flat-front silhouette.',
        'Reinforced double-needle outer leg stitching.',
        'Brown button closure with zip fly.',
        'Earth-tone alternative to classic tan khakis.',
      ]
    ),
  },
  Men_s_Comfort_Stretch_Chino_Pants__Standard_Fit__Straight_Leg__Cotton_Blend: {
    name: 'COMFORT STRETCH STRAIGHT-LEG KHAKIS',
    color: 'Khaki',
    style: 'flat-front',
    fit: 'standard',
    price: 6000,
    description: fmt(
      'Comfort stretch straight-leg khakis — cotton-blend chinos with permanent crease and standard fit for everyday professional wear.',
      [
        'Cotton-blend stretch for all-day flexibility.',
        'Standard straight-leg fit with sharp centre crease.',
        'Flat-front design with reinforced belt loops.',
        'Classic tan khaki colourway.',
        'Office-to-weekend versatility.',
      ]
    ),
  },
  Dickies_874_WORK_PANT: {
    name: 'DICKIES-STYLE KHAKI WORK TROUSERS',
    color: 'Khaki',
    style: 'work',
    fit: 'relaxed',
    price: 6300,
    description: fmt(
      'Dickies-style khaki work trousers — hard-wearing cotton twill with straight-leg cut and utility-grade construction.',
      [
        'Heavy-duty cotton twill built for durability.',
        'Classic work-pant straight-leg silhouette.',
        'Reinforced stitching at stress points.',
        'Traditional waist with belt loops and zip fly.',
        'Rugged khaki tone for work and casual wear.',
      ]
    ),
  },
};

const out = path.join(__dirname, '..', 'data', 'khaki-trouser-specs.json');
fs.writeFileSync(out, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} khaki trouser specs to ${out}`);
