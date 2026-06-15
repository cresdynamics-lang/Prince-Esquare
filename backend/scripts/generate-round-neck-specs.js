/**
 * Generates backend/data/round-neck-specs.json
 */
const fs = require('fs');
const path = require('path');

const rich = (intro, features, fit, sizes = 'M–3XL') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Machine wash cold, tumble dry low. Iron on low heat if needed.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const SPECS = {
  camisa_masculina: {
    name: 'BLACK LOS ANGELES LA GRAPHIC ROUND-NECK T-SHIRT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 4200,
    featured: true,
    description: rich(
      'Bold streetwear round-neck tee with Gothic LA chest monogram and Los Angeles collar lettering. Heavyweight black cotton holds its oversized shape for an effortless urban look.',
      [
        'Solid black heavyweight cotton jersey.',
        'Gothic-style white LA logo on left chest.',
        'LOS ANGELES text printed around crew neckline.',
        'Oversized fit with dropped shoulders.',
        'Ribbed round neck for lasting structure.',
        'Short sleeves with clean double-stitched hems.',
      ],
      'Pair with light denim or joggers for a modern streetwear silhouette. The oversized cut layers easily under open shirts or lightweight jackets.',
    ),
  },
  Men_s_Summer_T_Shirt_PARIS: {
    name: 'WHITE PARIS EIFFEL TOWER GRAPHIC T-SHIRT',
    color: 'White',
    brand: 'Prince Esquire',
    price: 3800,
    description: rich(
      'Classic white round-neck tee featuring a Paris Eiffel Tower graphic — timeless travel-inspired style for everyday wear.',
      [
        'Crisp white breathable cotton blend.',
        'Black PARIS FRANCE Eiffel Tower chest print.',
        'Soft jersey fabric with smooth hand-feel.',
        'Ribbed crew neckline.',
        'Regular relaxed fit through body.',
        'Short sleeves with reinforced hems.',
      ],
      'Works with jeans, chinos, or shorts for casual city-inspired outfits. A versatile graphic tee for weekend and travel looks.',
    ),
  },
  Oversized_Black_Spider: {
    name: 'BLACK SPIDER-MAN MASK GRAPHIC T-SHIRT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 4500,
    featured: true,
    description: rich(
      'Minimalist Spider-Man inspired round-neck tee with a mask-shaped chest graphic — subtle superhero style for fans who prefer understated graphics.',
      [
        'Solid black soft cotton jersey.',
        'Red oval Spider-Man mask chest graphic.',
        'White eye detail with SPIDER / MAN lettering.',
        'Small SPIDERMAN subtitle print below graphic.',
        'Classic ribbed crew neck.',
        'Relaxed fit with comfortable short sleeves.',
      ],
      'Ideal for casual outings, movie nights, or layered under a denim jacket. The left-chest placement keeps the look clean and wearable.',
    ),
  },
  'camiseta_punto_____r_pido_hombre_tee_casual_-_Temu_': {
    name: 'BLACK PUMA LOGO ROUND-NECK T-SHIRT',
    color: 'Black',
    brand: 'Puma',
    price: 5500,
    description: rich(
      'Puma black round-neck tee with iconic leaping cat logo — sporty everyday essential from a trusted athletic brand.',
      [
        'Solid black lightweight cotton jersey.',
        'Large white Puma cat and wordmark chest print.',
        'Breathable fabric for all-day comfort.',
        'Ribbed crew neckline.',
        'Regular fit through chest and waist.',
        'Durable short sleeves with neat stitching.',
      ],
      'Pair with joggers, track pants, or jeans for gym-to-street style. A foundational branded tee for active and casual wardrobes.',
    ),
  },
  Men_s_Letter_And_Mountain_Pattern_Printed_Casual_Short_Sleeve_T_Shirt: {
    name: 'NAVY LIFE IS AN ADVENTURE MOUNTAIN T-SHIRT',
    color: 'Navy',
    brand: 'Prince Esquire',
    price: 4000,
    description: rich(
      'Navy oversized round-neck tee with mountain explorer graphic — inspirational outdoor style with a relaxed modern fit.',
      [
        'Deep navy blue cotton jersey.',
        'White mountain silhouette chest graphic.',
        'LIFE IS AN ADVENTURE / BE THE EXPLORER text.',
        'Oversized drop-shoulder silhouette.',
        'Soft breathable fabric.',
        'Wide short sleeves for contemporary styling.',
      ],
      'Style with light shorts or neutral joggers for a laid-back explorer aesthetic. The oversized cut suits taller builds and streetwear layering.',
    ),
  },
  '868491109409733438': {
    name: 'GREEN BROOKLYN NEW YORK GRAPHIC T-SHIRT',
    color: 'Green',
    brand: 'Prince Esquire',
    price: 3900,
    description: rich(
      'Forest green round-neck tee with arched BROOKLYN NEW YORK collegiate print — classic American streetwear graphic styling.',
      [
        'Rich forest green cotton jersey.',
        'White arched BROOKLYN chest lettering.',
        'NEW YORK subtitle in clean sans-serif font.',
        'Ribbed crew neck collar.',
        'Regular comfortable fit.',
        'Short sleeves with durable hems.',
      ],
      'Pairs perfectly with denim, cargo pants, or layered under an open flannel. A staple graphic tee for urban casual outfits.',
    ),
  },
  Manfinity_Homme_Plus_Size_Men_s_Letter_Print_Round_Neck_Short_Sleeve_Casual_T_Shirt: {
    name: 'TAN LIFESTYLE GOTHIC LETTER ROUND-NECK T-SHIRT',
    color: 'Tan',
    brand: 'Prince Esquire',
    price: 4100,
    description: rich(
      'Tan oversized round-neck tee with bold Gothic Lifestyle chest print — heavyweight streetwear piece with structured boxy drape.',
      [
        'Warm tan heavyweight cotton jersey.',
        'Black Gothic Lifestyle chest lettering.',
        'Oversized boxy fit with dropped shoulders.',
        'Thick fabric that holds its shape.',
        'Ribbed round neck collar.',
        'Wide short sleeves for modern streetwear.',
      ],
      'Wear with light wash denim or neutral shorts. The oversized silhouette and Old English graphic deliver an effortless high-fashion casual look.',
    ),
  },
  Men_Letter_Graphic_Contrast_Trim_Tee: {
    name: 'NAVY BIG MOVES CONTRAST PANEL T-SHIRT',
    color: 'Navy',
    brand: 'Prince Esquire',
    price: 4300,
    description: rich(
      'Navy sporty round-neck tee with white contrast side panels and BIG MOVES chest logo — athletic-inspired casual style.',
      [
        'Navy blue cotton jersey body.',
        'White vertical contrast side panels.',
        'Contrast white stitching along seams.',
        'BIG MOVES minimalist chest graphic.',
        'Ribbed crew neckline.',
        'Relaxed sporty fit with short sleeves.',
      ],
      'Style with light-wash jeans or joggers for a clean athletic-casual look. The contrast panels add structure and visual interest.',
    ),
  },
  'Next_REGULAR_FIT_-_RINGER_-_T_Shirt_basic_-_navy_white_neutral_stone': {
    name: 'NAVY RINGER CREW NECK T-SHIRT — GOTHIC B',
    color: 'Navy',
    brand: 'Prince Esquire',
    price: 3600,
    description: rich(
      'Navy ringer round-neck tee with white contrast collar and cuffs plus Gothic B chest emblem — retro sportswear with modern street appeal.',
      [
        'Deep navy body with white ringer trim.',
        'Contrast white ribbed collar and sleeve cuffs.',
        'Small white Gothic letter B chest graphic.',
        'Oversized relaxed fit.',
        'Soft cotton jersey fabric.',
        'Dropped shoulder short sleeves.',
      ],
      'A vintage-inspired ringer tee that pairs with denim, chinos, or shorts. The contrast trim and minimal graphic keep it versatile yet distinctive.',
    ),
  },
  men_s_fashion_lightning_bolt_print_t_shirt_casual_: {
    name: 'LIGHT BLUE LIGHTNING BOLT ROUND-NECK T-SHIRT',
    color: 'Blue',
    brand: 'Prince Esquire',
    price: 3700,
    description: rich(
      'Light blue round-neck tee with minimalist white lightning bolt chest graphic — clean streetwear essential with a relaxed fit.',
      [
        'Soft light blue cotton jersey.',
        'Centered white lightning bolt graphic.',
        'Smooth breathable fabric.',
        'Ribbed crew neck collar.',
        'Relaxed slightly oversized fit.',
        'Short sleeves for summer casual wear.',
      ],
      'Perfect with white sneakers and denim for a fresh casual outfit. The minimalist graphic makes it easy to layer or wear solo.',
    ),
  },
  Tween_Boys__Casual_Round_Neck_Knit_Spider_Printed_T__Shirt__Fashionable: {
    name: 'BLACK RED SPIDER GRAPHIC ROUND-NECK T-SHIRT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 3800,
    description: rich(
      'Black round-neck tee with bold red spider chest graphic — edgy minimalist streetwear with sharp graphic contrast.',
      [
        'Solid black cotton jersey.',
        'Large red stylized spider chest print.',
        'Clean minimalist graphic design.',
        'Ribbed crew neckline.',
        'Regular comfortable fit.',
        'Short sleeves with reinforced stitching.',
      ],
      'Pair with dark denim or cargo pants for an urban edge. The high-contrast spider graphic makes a statement without overwhelming the outfit.',
    ),
  },
  Clover_heavy_weight: {
    name: 'WHITE TREFOIL STRIPE ROUND-NECK T-SHIRT',
    color: 'White',
    brand: 'Prince Esquire',
    price: 4200,
    description: rich(
      'White round-neck tee with trefoil-inspired logo and bold vertical side stripes — athletic streetwear with asymmetrical graphic placement.',
      [
        'Crisp white heavyweight cotton jersey.',
        'Small trefoil-style chest emblem.',
        'Three vertical black stripes on lower side.',
        'Large trefoil accent within stripe panel.',
        'Ribbed crew neck collar.',
        'Structured drape from premium weight fabric.',
      ],
      'Style with joggers or slim jeans for a sporty streetwear look. The asymmetrical stripe detail adds movement and visual depth.',
    ),
  },
  Men_s_Casual_Vintage_Washed_Solid_Color_Round_Neck_Short_Sleeve_T_Shirt__Summer__Emo: {
    name: 'ACID WASH BLACK OVERSIZED ROUND-NECK T-SHIRT',
    color: 'Black',
    brand: 'Prince Esquire',
    price: 4400,
    featured: true,
    description: rich(
      'Acid-wash black oversized round-neck tee — vintage distressed finish with a modern boxy streetwear silhouette.',
      [
        'Acid-wash mottled black and charcoal finish.',
        'Heavyweight cotton jersey construction.',
        'Oversized boxy fit with dropped shoulders.',
        'Plain design — no logos or graphics.',
        'Double-needle stitched cuffs and hem.',
        'Ribbed crew neck with reinforced binding.',
      ],
      'A blank essential elevated by vintage wash texture. Layer under jackets or wear solo with relaxed trousers for effortless street style.',
    ),
  },
  Men_Solid_Round_Neck_Tee: {
    name: 'NAVY SOLID ROUND-NECK ESSENTIAL T-SHIRT',
    color: 'Navy',
    brand: 'Prince Esquire',
    price: 3200,
    description: rich(
      'Navy solid round-neck essential tee — heavyweight relaxed fit blank perfect for layering or everyday minimal style.',
      [
        'Deep navy blue cotton jersey.',
        'Clean design with no graphics.',
        'Heavyweight fabric with structured drape.',
        'Drop-shoulder relaxed silhouette.',
        'Ribbed crew neck collar.',
        'Wide short sleeves for modern fit.',
      ],
      'A wardrobe foundation that works under blazers, with jeans, or on its own. The oversized cut and rich navy tone suit casual and smart-casual looks.',
    ),
  },
  Homens_Camiseta_S_lido_Gola_Redonda: {
    name: 'WHITE SOLID ROUND-NECK ESSENTIAL T-SHIRT',
    color: 'White',
    brand: 'Prince Esquire',
    price: 3000,
    description: rich(
      'White solid round-neck essential tee — crisp everyday staple with a clean regular fit and soft cotton comfort.',
      [
        'Bright white breathable cotton blend.',
        'Plain solid design — no branding.',
        'Classic ribbed crew neckline.',
        'Regular fit through body and sleeves.',
        'Soft jersey hand-feel.',
        'Short sleeves with clean finished hems.',
      ],
      'The ultimate layering piece under shirts, jackets, and suits, or worn alone with any bottom. A must-have basic for every wardrobe.',
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'round-neck-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} round-neck specs → ${OUT}`);
