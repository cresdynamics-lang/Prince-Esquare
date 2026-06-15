/**
 * Generates backend/data/belts-specs.json (keyed by image UUID).
 */
const fs = require('fs');
const path = require('path');

const rich = (intro, features, fit, sizes = 'Waist 32-42 (adjustable)') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Wipe with a damp cloth. Condition leather periodically. Store flat or coiled loosely. Avoid prolonged water exposure.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const SPECS = {
  fa8cb090: {
    name: 'BROWN ITALIAN LEATHER RATCHET DRESS BELT',
    color: 'Brown',
    brand: 'Prince Esquire',
    price: 2100,
    featured: true,
    description: rich(
      'Brown Italian-style leather ratchet dress belt with a sleek automatic buckle - refined everyday essential for suits, chinos, and smart-casual wear.',
      [
        'Rich brown smooth-grain leather strap.',
        'Automatic ratchet closure for precise micro-adjustment.',
        'Polished silver-tone rectangular buckle.',
        'Clean minimalist profile for formal versatility.',
        'Durable construction for daily office wear.',
        'No-hole design for a seamless tailored look.',
      ],
      'Pair with navy, charcoal, or tan tailoring. Ideal for business meetings, weddings, and polished weekend outfits.',
    ),
  },
  '4a5ef43a': {
    name: 'BLACK RECTANGLE BUCKLE LEATHER BELT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Classic black leather belt with a rectangular pin buckle - timeless formal accessory for trousers, denim, and chinos.',
      [
        'Smooth black leather with matte finish.',
        'Rectangular brushed silver-tone pin buckle.',
        'Matching leather keeper loop.',
        'Clean edge stitching for durability.',
        'Versatile width for dress and casual wear.',
        'Multiple adjustment holes for flexible fit.',
      ],
      'A wardrobe staple that works with suits, dress pants, and dark denim.',
    ),
  },
  '8016d7f1': {
    name: 'BLACK GENUINE LEATHER RATCHET DRESS BELT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 2050,
    featured: true,
    description: rich(
      'Black genuine leather ratchet dress belt - precision-fit formal accessory with a modern buckle system and premium hand-feel.',
      [
        'Genuine black leather strap with smooth finish.',
        'Ratchet track closure for exact waist sizing.',
        'Low-profile rectangular metal buckle.',
        'Refined profile suited to formal trousers.',
        'Reinforced buckle attachment point.',
        'No visible punch holes for a clean silhouette.',
      ],
      'Perfect under suit jackets with dress trousers or elevated smart-casual looks.',
    ),
  },
  bd1da189: {
    name: 'BROWN VINTAGE SQUARE BUCKLE LEATHER BELT',
    color: 'Brown',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Brown vintage-style leather belt with an antique square buckle - rugged heritage accessory for denim and casual tailoring.',
      [
        'Distressed brown leather with natural grain.',
        'Square antique brass-tone pin buckle.',
        'Vintage-inspired matte leather finish.',
        'Single leather keeper loop.',
        'Durable stitching at buckle fold.',
        'Relaxed casual profile.',
      ],
      'Best with jeans, boots, and weekend casual layers for a timeless workwear look.',
    ),
  },
  d92b57ea: {
    name: 'BLACK GENUINE LEATHER DRESS BELT - 130CM',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Black genuine leather dress belt in 130cm length - essential formal accessory with a classic pin buckle and smooth polished strap.',
      [
        'Genuine smooth black leather.',
        '130cm length fits most waist sizes.',
        'Classic single-prong metal buckle.',
        'Matching leather keeper.',
        'Tonal edge stitching.',
        'Suitable for daily office and event wear.',
      ],
      'Pairs with black or charcoal suits and formal trousers.',
    ),
  },
  '09a9e37b': {
    name: 'BLACK & BROWN REVERSIBLE DRESS BELT',
    color: 'Black',
    brand: 'Marino',
    price: 2100,
    featured: true,
    description: rich(
      'Marino reversible leather dress belt with rotating buckle - two colours in one refined accessory for versatile formal styling.',
      [
        'Reversible black and brown leather sides.',
        'Rotating removable buckle mechanism.',
        '1.25-inch classic dress width.',
        'Smooth leather finish on both sides.',
        'Brushed silver-tone frame buckle.',
        'Two-in-one value for travel and daily rotation.',
      ],
      'Switch between black and brown to match shoes and tailoring without changing belts.',
    ),
  },
  fed2f6c4: {
    name: 'BLACK TEXTURED LEATHER REVERSIBLE BELT',
    color: 'Black',
    brand: 'Louis Vuitton',
    price: 2100,
    description: rich(
      'Black textured leather reversible belt with polished silver swivel buckle - luxury accessory with engraved hardware detailing.',
      [
        'Pebbled black leather with premium texture.',
        'Polished silver-tone swivel buckle frame.',
        'Reversible strap design for dual styling.',
        'Engraved buckle bar detailing.',
        'Matching leather keeper loop.',
        'Refined formal-casual profile.',
      ],
      'Elevate suits, blazers, and designer denim with understated luxury hardware.',
    ),
  },
  aa928946: {
    name: 'BROWN SLIDE RATCHET LEATHER BELT',
    color: 'Brown',
    brand: 'Bulliant',
    price: 2050,
    description: rich(
      'Brown slide ratchet leather belt with automatic closure - practical dress belt offering precise fit and clean formal styling.',
      [
        'Brown genuine leather strap.',
        'Slide ratchet buckle for micro-adjustment.',
        'Slim dress-width profile.',
        'Brushed metal buckle hardware.',
        'Track-style closure without holes.',
        'Comfortable all-day wear.',
      ],
      'Ideal for gifting and daily business wear with chinos or dress pants.',
    ),
  },
  eb0578f5: {
    name: 'COGNAC CHEVRON EMBOSSED LEATHER BELT',
    color: 'Cognac',
    brand: 'Prince Esquire',
    price: 2100,
    featured: true,
    description: rich(
      'Cognac leather belt with embossed chevron pattern and polished silver buckle - sophisticated textured accessory for formal and smart-casual outfits.',
      [
        'Rich cognac tan leather with chevron embossing.',
        'Polished silver-tone rectangular buckle.',
        'Dual leather keeper loops.',
        'Dark burnished edge finishing.',
        'Tan leather interior lining.',
        'Distinctive woven-look texture.',
      ],
      'Pairs beautifully with brown shoes, navy suits, and earth-tone chinos.',
    ),
  },
  '5abca4ed': {
    name: 'BROWN VINTAGE DISTRESSED LEATHER BELT',
    color: 'Brown',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Vintage distressed brown leather belt with antique brass square buckle - rugged full-grain accessory for denim and casual wear.',
      [
        'Hand-burnished brown leather with patina effect.',
        'Antique brass-tone square pin buckle.',
        'Natural grain visible throughout strap.',
        'Heavy-duty buckle stitching.',
        'Wide casual profile.',
        'Lived-in vintage character.',
      ],
      'Style with raw denim, boots, and layered casual jackets.',
    ),
  },
  '5e9de2ad': {
    name: 'DARK BROWN KCOLM PERFORATED LEATHER BELT',
    color: 'Brown',
    brand: 'KCOLM',
    price: 2050,
    description: rich(
      'KCOLM dark brown leather belt with perforated dot pattern and brushed gunmetal buckle - modern formal accessory with subtle brand detailing.',
      [
        'Deep brown smooth-grain leather.',
        'Perforated dot-grid pattern section.',
        'Brushed gunmetal pin buckle.',
        'KCOLM embossed branding on strap and loop.',
        'Clean finished edges.',
        'Contemporary dress-casual profile.',
      ],
      'Works with dress trousers, blazers, and polished weekend looks.',
    ),
  },
  '6098025d': {
    name: 'VETERAN VINTAGE BURNISHED COGNAC LEATHER BELT',
    color: 'Cognac',
    brand: 'Veteran Vintage',
    price: 2100,
    description: rich(
      'Veteran Vintage burnished cognac leather belt with solid brass buckle and D-ring keeper detail - artisan heritage accessory with rugged vertical grain.',
      [
        'Thick full-grain cognac leather.',
        'Hand-burnished vintage patina finish.',
        'Solid brass single-prong buckle.',
        'Dual keepers with metal D-ring accent.',
        'Rugged vertical grain texture.',
        'Heritage workwear-inspired build.',
      ],
      'Perfect with premium denim, leather jackets, and heritage casual outfits.',
    ),
  },
  c4dd74b8: {
    name: 'BROWN CASUAL GENUINE LEATHER BELT - 130CM',
    color: 'Brown',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Brown casual genuine leather belt with classic pin buckle - versatile 130cm accessory for everyday chinos and denim.',
      [
        'Genuine brown leather with smooth finish.',
        '130cm adjustable length.',
        'Classic metal pin buckle.',
        'Matching leather keeper loop.',
        'Durable edge stitching.',
        'Everyday casual-to-smart profile.',
      ],
      'An easy everyday belt for chinos, jeans, and relaxed tailoring.',
    ),
  },
  b1bb1a99: {
    name: 'GENLETS BLACK TWO-TONE CONTRAST STITCH BELT',
    color: 'Black',
    brand: 'Genlets',
    price: 2050,
    description: rich(
      'Genlets black leather belt with tan edge trim and bold contrast stitching - contemporary two-tone accessory for casual and smart-casual style.',
      [
        'Black leather top with tan edge border.',
        'Double-row orange-tan contrast stitching.',
        'Brushed silver-tone rounded buckle.',
        'Dual matching keeper loops.',
        'Two-tone layered construction.',
        'Modern street-to-office versatility.',
      ],
      'Adds detail to dark denim, khakis, and layered casual outfits.',
    ),
  },
  '8346800b': {
    name: 'TAN HORIZONTAL STRIPE TEXTURED LEATHER BELT',
    color: 'Tan',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Tan leather belt with horizontal stripe texture and brushed silver buckle - modern casual accessory with a sleek stitchless profile.',
      [
        'Warm tan smooth leather strap.',
        'Horizontal dark stripe texture pattern.',
        'Brushed silver rectangular pin buckle.',
        'Ribbed detail on buckle frame.',
        'Dark edge finishing.',
        'Contemporary casual silhouette.',
      ],
      'Pairs with chinos, light denim, and summer smart-casual looks.',
    ),
  },
  '0f90a7fd': {
    name: 'BROWN SPANISH ARTISAN LEATHER BELT',
    color: 'Brown',
    brand: 'Leyva',
    price: 2100,
    description: rich(
      'Spanish artisan brown leather belt handcrafted in Spain - premium accessory with natural grain and classic metal buckle hardware.',
      [
        'Hand-finished brown leather from Spain.',
        'Natural grain with artisan character.',
        'Classic polished metal pin buckle.',
        'Matching leather keeper.',
        'Durable hand-stitched buckle fold.',
        'European craftsmanship quality.',
      ],
      'Ideal for elevating linen trousers, blazers, and Mediterranean-inspired casual style.',
    ),
  },
  e27421c0: {
    name: 'BLACK METAL BUCKLE LEATHER BELT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 2000,
    description: rich(
      'Black leather belt with a bold metal frame buckle - clean formal-casual essential for trousers and denim.',
      [
        'Smooth black leather strap.',
        'Statement metal frame pin buckle.',
        'Matching leather keeper loop.',
        'Reinforced buckle attachment.',
        'Classic dress width.',
        'Multiple adjustment holes.',
      ],
      'A reliable everyday belt for office wear and weekend dressing.',
    ),
  },
  '58326744': {
    name: 'DARK BROWN HERRINGBONE TEXTURED LEATHER BELT',
    color: 'Brown',
    brand: 'Prince Esquire',
    price: 2100,
    description: rich(
      'Dark brown herringbone-textured leather belt with silver buckle and monogram-lined interior - refined formal accessory with premium hidden detailing.',
      [
        'Dark brown leather with chevron/herringbone embossing.',
        'Polished silver-tone rectangular buckle.',
        'Tan monogram-pattern interior lining.',
        'Tonal edge stitching.',
        'Sophisticated textured surface.',
        'Formal-to-smart-casual versatility.',
      ],
      'Perfect for business suits, wedding guest attire, and dress chinos.',
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'belts-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} belt specs to ${OUT}`);
