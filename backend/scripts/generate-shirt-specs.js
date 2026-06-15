/**
 * Generates backend/data/shirt-product-specs.json with rich per-product metadata.
 * Run: node scripts/generate-shirt-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes M–3XL. Pair with Prince Esquire trousers or denim for a complete look.`;

const SPECS = {
  '1082552829154389767': {
    name: 'COMIC POP ART ACTION CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'White Multi',
    price: 5850,
    description: fmt(
      'Turn up the energy with this white short-sleeve shirt covered in retro comic-book graphics — Ka-Pow!, BAM!, and BOOOOOOM bubbles in red, orange, and yellow with sharp black outlines.',
      [
        'All-over pop-art print with explosion clouds, starbursts, and action lines.',
        'Lightweight breathable poplin-style fabric for warm Nairobi days.',
        'Point collar and full button placket with discreet white buttons.',
        'Relaxed modern fit with slightly cuffed short sleeves.',
        'Statement piece for weekends, creative offices, and streetwear looks.',
      ]
    ),
  },
  '1105070827338807633': {
    name: 'TAN & WHITE PINSTRIPE FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Tan White',
    price: 7800,
    description: fmt(
      'A refined long-sleeve dress shirt in tan and white vertical pinstripes — smart enough for the boardroom, relaxed enough for rolled-cuff after-hours style.',
      [
        'Fine vertical stripe pattern with slimming, timeless appeal.',
        'Structured point collar that holds shape with or without a tie.',
        'Cotton or cotton-linen blend with natural drape and breathability.',
        'Curved shirttail hem for neat tucking or smart untucked wear.',
        'Polished white buttons on a full-length front placket.',
      ]
    ),
  },
  '1111544751837321308': {
    name: 'BLACK TRIBAL PANEL CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Black White',
    price: 6200,
    description: fmt(
      'Contemporary black short-sleeve shirt with a bold vertical tribal geometric panel in high-contrast white — finished with a sleek mandarin collar and white buttons.',
      [
        'Asymmetrical tribal geometric inset for a culturally inspired look.',
        'Modern band collar alternative to classic spread collars.',
        'Lightweight breathable cotton-blend for all-day comfort.',
        'Straight hem designed for untucked casual wear.',
        'Pairs with chinos or denim for day-to-night versatility.',
      ]
    ),
  },
  '1113022495441489805': {
    name: 'SKY BLUE LINEN-BLEND CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 6500,
    description: fmt(
      'A refreshing powder-blue casual shirt with visible linen-blend texture, rolled sleeves, and a soft relaxed drape — ideal for warm-weather smart-casual dressing.',
      [
        'Breathable linen-blend weave with natural slub character.',
        'Classic point collar and curved shirttail hem.',
        'Long sleeves with button cuffs — easily rolled for a laid-back look.',
        'Tonal buttons on a clean button-down front.',
        'Crisp sky-blue shade pairs with chinos, jeans, or shorts.',
      ]
    ),
  },
  '1123577807051528923': {
    name: 'MIDNIGHT & SAND PANEL MOTIF CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Black Tan',
    price: 6800,
    description: fmt(
      'Vintage resort style meets modern tailoring in this black short-sleeve shirt with sand-beige paisley, geometric, and circular motifs arranged in structured panels.',
      [
        'Multi-paneled print blending paisley swirls, diamonds, and scroll borders.',
        'High-contrast black and tan palette for effortless pairing with denim.',
        'Lightweight cotton-rayon feel with soft warm-weather drape.',
        'Point collar and contrast button-front closure.',
        'Bohemian resort aesthetic for holidays and weekend gatherings.',
      ]
    ),
  },
  '1137440449687978922': {
    name: 'BLACK & COGNAC DUO-TONE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Black Brown',
    price: 6800,
    description: fmt(
      'A modern color-blocked short-sleeve shirt split vertically between matte black and rich tobacco brown, with a contrasting black chest pocket and rolled cuffs.',
      [
        'Bold vertical duo-tone construction in black and cognac brown.',
        'Soft brushed-texture fabric with premium tactile finish.',
        'Contrast patch pocket on the brown panel.',
        'White buttons pop against the dark colour blocks.',
        'Layer open over a tee or button up for elevated weekend style.',
      ]
    ),
  },
  '12_Hottest_Men_s_Dress_Shirts_to_Wear_for_Formal_Occasions': {
    name: 'CLASSIC WHITE LONG-SLEEVE DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 7500,
    description: fmt(
      'The foundation of every formal wardrobe — a crisp white long-sleeve dress shirt with a sharp spread collar, clean placket, and polished barrel cuffs.',
      [
        'Pure white colourway for weddings, interviews, and black-tie events.',
        'Structured collar designed to sit neatly under jackets and ties.',
        'Smooth wrinkle-resistant cotton blend for all-day sharpness.',
        'Barrel cuffs with single-button closure.',
        'Tailored fit that layers seamlessly under Prince Esquire blazers.',
      ]
    ),
  },
  '146789269100262103': {
    name: 'IMPASTO SUNSET LANDSCAPE ART SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 7200,
    description: fmt(
      'Wearable art in shirt form — an impasto oil-painting print of a sunset over water with palette-knife texture in violet, magenta, orange, yellow, and deep blue.',
      [
        'High-definition 3D-effect landscape print with heavy brushstroke detail.',
        'Vibrant multi-tone sky transitioning from indigo to fiery sunset hues.',
        'Short sleeves with classic point collar and four-button partial placket.',
        'Lightweight fade-resistant fabric for summer festivals and creative events.',
        'Statement piece for gallery openings, vacations, and bold weekend looks.',
      ]
    ),
  },
  '2025_Summer_Men_s_Casual_Floral_Print_Short_Sleeve_Top_Hawaiian_Shirt_For_Mens_Clothes_Daily_New': {
    name: 'YELLOW TROPICAL LILY HAWAIIAN SHIRT',
    subCategory: 'Casual',
    color: 'Yellow Multi',
    price: 5800,
    description: fmt(
      'Sun-soaked vacation energy in a bright yellow Hawaiian shirt with red lily blossoms, green palm fronds, and a subtle white chevron background.',
      [
        'Bold tropical floral print with red lilies and lush green foliage.',
        'Camp collar for an open, relaxed neckline.',
        'Lightweight rayon-style fabric built for heat and humidity.',
        'Full button-front with contrasting white buttons.',
        'Perfect for beach trips, cruises, and summer parties.',
      ]
    ),
  },
  '430867889373882171': {
    name: 'NAVY & BURGUNDY NAUTICAL STRIPE SHIRT',
    subCategory: 'Casual',
    color: 'Navy Red',
    price: 6800,
    description: fmt(
      'A spirited tri-colour stripe shirt in navy, burgundy, and white with pattern-matched chest pocket and white inner cuffs that flash when sleeves are rolled.',
      [
        'Rhythmic vertical stripes in navy, wine-red, and crisp white.',
        'Pattern-aligned left chest pocket for a tailored finish.',
        'Premium breathable poplin with a sharp modern silhouette.',
        'White contrast inner cuffs for rolled-sleeve styling.',
        'Smart-casual essential for brunches and social gatherings.',
      ]
    ),
  },
  '430867889373882173': {
    name: 'NAUTICAL TRI-COLOUR BOLD STRIPE SHIRT',
    subCategory: 'Casual',
    color: 'Navy Red',
    price: 6500,
    description: fmt(
      'Dynamic navy, red, and white vertical stripes in varying widths — a preppy nautical shirt with offset chest pocket and solid white cuff lining.',
      [
        'Wide and narrow stripe mix with navy pinstripe accents in white bands.',
        'Chest pocket with deliberately offset stripe alignment.',
        'Crisp lightweight cotton poplin that holds its shape.',
        'Point collar with horizontal stripe underside detail.',
        'Modern tailored fit for weekend and smart-casual wear.',
      ]
    ),
  },
  '625015254562351953': {
    name: 'EARTH-TONE TRIBAL GEOMETRIC SHIRT',
    subCategory: 'Casual',
    color: 'Green Tan',
    price: 7000,
    description: fmt(
      'Long-sleeve utility shirt with an intricate tribal geometric print in forest green, mustard tan, and charcoal — plus two button-flap chest pockets.',
      [
        'All-over diamond and square ethnic motifs in an earthy palette.',
        'Dual functional chest pockets with secure flap closures.',
        'Mid-weight durable woven fabric with structured drape.',
        'Point collar and adjustable buttoned cuffs.',
        'Heritage-inspired casual style for weekends and travel.',
      ]
    ),
  },
  '659707045446435431': {
    name: 'BEIGE & BLACK RETRO COLOR-BLOCK SHIRT',
    subCategory: 'Casual',
    color: 'Beige Black',
    price: 6800,
    description: fmt(
      'Retro camp-collar shirt in beige with bold vertical black panels and a minimalist blue-grey geometric diamond graphic on the chest.',
      [
        'Tri-tone colour-blocking with beige base and black vertical bands.',
        'Notched camp collar for a relaxed open-neck silhouette.',
        'Wood-effect buttons on a five-button front placket.',
        'Contemporary geometric line-and-diamond chest print.',
        'Short sleeves with clean cuffed finish for summer styling.',
      ]
    ),
  },
  '681380618598070313': {
    name: 'BURGUNDY MICRO-DOT SLIM FIT SHIRT',
    subCategory: 'Casual',
    color: 'Burgundy',
    price: 6500,
    description: fmt(
      'John Taylor slim-fit short-sleeve shirt in deep burgundy with a refined micro-dot pattern — white and lavender three-dot clusters on a smooth poplin base.',
      [
        'Subtle micro-dot geometric print adds texture without loudness.',
        'Slim tailored silhouette for a sharp modern profile.',
        'Contrasting white buttons against rich wine-red ground.',
        'Dark inner collar band for added depth.',
        'Smart-casual piece for office Fridays and weekend outings.',
      ]
    ),
  },
  '681380618598070313__1_': {
    name: 'BURGUNDY MICRO-DOT SLIM FIT SHIRT — ALT',
    subCategory: 'Casual',
    color: 'Burgundy',
    price: 6500,
    description: fmt(
      'A second colourway of our burgundy micro-dot slim shirt — staggered white and lavender dot clusters on premium poplin with crisp white button contrast.',
      [
        'Repeating three-dot motif in white and light lavender tones.',
        'Slim fit cut that follows the body for contemporary styling.',
        'Point collar and short-sleeve warm-weather construction.',
        'Smooth lightweight woven fabric with slight sheen.',
        'Versatile wine-red tone pairs with navy, grey, or black bottoms.',
      ]
    ),
  },
  '712624341051807339': {
    name: 'MIDNIGHT BLOOM FLORAL STATEMENT SHIRT',
    subCategory: 'Casual',
    color: 'Black Multi',
    price: 7500,
    description: fmt(
      'Long-sleeve statement shirt on a black ground with vivid white daisies, magenta roses, green foliage, and swirling teal kinetic-line overlays.',
      [
        'High-contrast floral and abstract digital print with 3D depth.',
        'Premium smooth fabric with subtle lustre.',
        'Slim contemporary silhouette with structured point collar.',
        'Curved hem for tucked or untucked evening wear.',
        'Ideal for parties, date nights, and fashion-forward events.',
      ]
    ),
  },
  '726416614941909305': {
    name: 'EMERALD SHAMROCK CELEBRATION SHIRT',
    subCategory: 'Casual',
    color: 'Green Black',
    price: 5800,
    description: fmt(
      'Festive emerald-green short-sleeve shirt with black vertical stripes and a playful chest graphic of shamrocks in a glass topped with a leprechaun hat.',
      [
        'Kelly green base with high-contrast black stripe panels.',
        'Unique St. Patrick\'s Day themed chest illustration.',
        'Lightweight smooth fabric for comfortable party wear.',
        'Classic point collar and white button-front closure.',
        'Fun statement piece for themed events and casual celebrations.',
      ]
    ),
  },
  '756393699924465780': {
    name: 'VINTAGE EXPLORER MAP PRINT SHIRT',
    subCategory: 'Casual',
    color: 'Beige Tan',
    price: 6900,
    description: fmt(
      'Antique cartography covers this short-sleeve shirt — aged parchment beige with rust-orange landmasses, latitude lines, and nautical labels like NORTH ATLANTIC.',
      [
        'Detailed vintage world-map all-over print with compass motifs.',
        'Earthy beige, tan, ochre, and muted red cartographic palette.',
        'Pre-rolled cuff short sleeves and spread collar.',
        'Contrasting white buttons on a full button placket.',
        'Conversation-starting travel and explorer aesthetic.',
      ]
    ),
  },
  '760826930824283112': {
    name: 'MIDNIGHT NAVY TEXTURED FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Navy',
    price: 8500,
    description: fmt(
      'Impeccably tailored midnight navy formal shirt with a subtle micro-textured weave, crisp spread collar, and tonal buttons for seamless elegance.',
      [
        'Fine micro-texture adds depth beyond flat dress-shirt fabrics.',
        'Deep navy hue pairs with charcoal, black, and navy suits.',
        'Structured spread collar holds shape with or without a tie.',
        'Tonal navy buttons and clean-lined placket.',
        'Barrel cuffs and curved hem for professional all-day wear.',
      ]
    ),
  },
  '845269423830041781': {
    name: 'BURGUNDY SATEEN SLIM-FIT DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Burgundy',
    price: 9500,
    description: fmt(
      'Premium wine-red dress shirt with a lustrous sateen finish, slim tailored fit, dark contrast buttons, and a clean pocketless front.',
      [
        'Subtle sateen sheen for luxury evening and wedding style.',
        'Slim fit with contoured side seams and curved shirttail hem.',
        'Classic point collar and single-button barrel cuffs.',
        'Deep burgundy pairs elegantly with black and charcoal suiting.',
        'Wrinkle-resistant cotton blend for celebration-day confidence.',
      ]
    ),
  },
  '867787422030050416': {
    name: 'EARTHY BROWN PLAID FLANNEL SHIRT',
    subCategory: 'Casual',
    color: 'Brown',
    price: 7500,
    description: fmt(
      'Cozy brushed-cotton flannel in a large-scale brown plaid — chocolate, tan, and coffee tones with a chest pocket and dark contrast buttons.',
      [
        'Soft brushed flannel hand-feel for cooler evenings.',
        'Classic earthy plaid pattern aligned on chest pocket.',
        'Relaxed long-sleeve fit with buttoned cuffs.',
        'Point collar and curved hem for tucked or untucked wear.',
        'Heritage casual layer over tees or under jackets.',
      ]
    ),
  },
  '882072276995657272': {
    name: 'EMERALD ASYMMETRICAL STRIPE SHIRT',
    subCategory: 'Casual',
    color: 'Green',
    price: 7000,
    description: fmt(
      'Bold emerald-green camp-collar shirt split between a solid panel and wide green-and-cream vertical stripes, with black buttons and Honor script embroidery.',
      [
        'Unique asymmetrical solid-and-stripe panel construction.',
        'Open camp collar for breathable summer styling.',
        'Fixed rolled-cuff short sleeves with relaxed fit.',
        'Delicate black script embroidery on the striped chest panel.',
        'Lightweight cotton-rayon blend for tropical comfort.',
      ]
    ),
  },
  '972777588268279534': {
    name: 'TURQUOISE TRIBAL ACCENT SHIRT',
    subCategory: 'Casual',
    color: 'Turquoise',
    price: 6800,
    description: fmt(
      'Vibrant turquoise short-sleeve shirt with slub texture, white contrast stitching, and an asymmetrical band of brown-and-tan tribal geometric motifs.',
      [
        'Bright turquoise base with breathable linen-like crosshatch texture.',
        'Vertical ethnic geometric band and matching chest sunburst emblem.',
        'White contrast stitching along placket, collar, and hem.',
        'Crisp white buttons on a classic point-collar silhouette.',
        'Culturally inspired resort look for vacations and weekends.',
      ]
    ),
  },
  '979251512731017588': {
    name: 'MONOCHROME TROPICAL WAVE RESORT SHIRT',
    subCategory: 'Casual',
    color: 'Black Grey',
    price: 6800,
    description: fmt(
      'Modern resort shirt in black, white, and slate grey — a diagonal gradient wave sweeps across the front with twin palm-tree silhouettes on the lower right.',
      [
        'Sophisticated monochromatic palette replaces loud tropical colours.',
        'Dynamic diagonal swoosh graphic with black-to-white gradient.',
        'Functional chest pocket integrated into the wave design.',
        'Contrasting white buttons against dark collar and placket.',
        'Lightweight breathable fabric for beach clubs and brunches.',
      ]
    ),
  },
  '983825481307536993': {
    name: 'ABSTRACT GEOMETRIC PATCHWORK SHIRT',
    subCategory: 'Casual',
    color: 'Black Cream',
    price: 6500,
    description: fmt(
      'Artist-inspired short-sleeve shirt mixing grids, concentric circles, dashed lines, and wood-grain textures in black, cream, and earthy brown.',
      [
        'Large-scale abstract patchwork print with multiple geometric motifs.',
        'Solid cream camp collar and placket contrast the busy body print.',
        'Six wood-effect brown buttons complement earthy print tones.',
        'Regular relaxed fit with slightly curved hem.',
        'Contemporary casual piece for fashion-forward weekend wear.',
      ]
    ),
  },
  '987343918322199202': {
    name: 'EARTH-TONE DOTTED STRIPE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Tan Brown',
    price: 6500,
    description: fmt(
      'Vertical multi-stripe shirt in tan, chocolate, black, and cream — each wide tan stripe traced with a delicate row of brown micro-dots down the centre.',
      [
        'Unique dotted-line detail within vertical stripe pattern.',
        'Fixed rolled-cuff short sleeves for polished casual style.',
        'Lightweight breathable cotton-rayon for warm weather.',
        'Contrasting white buttons on a classic point collar.',
        'Earthy palette pairs effortlessly with khaki chinos and denim.',
      ]
    ),
  },
};

// Descriptive filename specs (filename prefix keys)
const DESCRIPTIVE = {
  Abstract_Printed_Summer_Shirt___: {
    name: 'MONOCHROME TROPICAL WAVE RESORT SHIRT',
    subCategory: 'Casual',
    color: 'Black Grey',
    price: 6800,
    description: fmt(
      'A sleek monochromatic take on the tropical shirt — diagonal black-to-grey gradient wave with palm-tree silhouettes and a functional chest pocket.',
      ['Gradient swoosh graphic across the front panel.', 'Twin palm prints on the lower right.', 'White contrast buttons and solid black collar.', 'Lightweight resort-weight fabric.', 'Modern alternative to classic Hawaiian prints.']
    ),
  },
  'Aesthetic_Elegant_Retro_Teal_Symmetry_Art_Print_Casual_Shirt_S-Multicolor': {
    name: 'VINTAGE TEAL FILIGREE SHORT-SLEEVE SHIRT',
    subCategory: 'Casual',
    color: 'Teal',
    price: 7200,
    description: fmt(
      'Deep teal shirt with distressed marbled texture and pale gold baroque filigree scrollwork framing the neckline and sleeve cuffs.',
      ['Intricate scrollwork yoke in pale gold around collar and chest.', 'Textured teal base with subtle damask undertone.', 'Short sleeves with filigree cuff borders.', 'White buttons contrast the dark detailed fabric.', 'Smart-resort piece bridging vintage art and casual ease.'],
    ),
  },
  Aesthetic_Men_s_Vertical_Striped_Shirt___Vintage_Casual_Vibe_with_60__off__outfits__fashion: {
    name: 'VINTAGE VERTICAL STRIPE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6200,
    description: fmt(
      'Retro-inspired vertical stripe shirt with heritage colour bands — a relaxed vintage casual piece with classic collar and easy warm-weather fit.',
      ['Bold multi-tone vertical stripes for a slimming silhouette.', 'Lightweight breathable fabric with soft drape.', 'Button-down front with contrast buttons.', 'Short or long sleeve construction for everyday wear.', 'Pairs with denim for an effortless off-duty look.'],
    ),
  },
  'Amazon_Essentials_Men_s_Regular-Fit_Short-Sleeve_Pocket_Oxford_Shirt__': {
    name: 'CLASSIC POCKET OXFORD SHORT-SLEEVE SHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 5500,
    description: fmt(
      'Essential oxford-weave short-sleeve shirt with a left chest pocket — crisp cotton texture in a regular comfortable fit for daily smart-casual wear.',
      ['Textured oxford cotton with breathable structure.', 'Functional chest pocket for everyday utility.', 'Point collar and button-front closure.', 'Regular fit designed for easy movement.', 'Foundation piece for chinos, shorts, and jeans.'],
    ),
  },
  Amazon_com__CIGENU_Men_s_Long_Sleeve_Dress_Shirts_: {
    name: 'CIGENU STRETCH WRINKLE-FREE DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 8200,
    description: fmt(
      'Professional long-sleeve dress shirt with stretch comfort and wrinkle-free finish — crisp collar, slim silhouette, and smooth cotton-poly blend.',
      ['Wrinkle-resistant fabric stays sharp through long workdays.', 'Added stretch for ease of movement at desk and events.', 'Classic point collar suited to ties and blazers.', 'Barrel cuffs with secure button closure.', 'Office, wedding, and interview-ready staple.'],
    ),
  },
  Amazon_com__Hodaweisolp_Men_s_Casual_Short_Sleeve_: {
    name: 'HODAWEISOLP SUMMER PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5200,
    description: fmt(
      'Lightweight short-sleeve casual shirt with an all-over summer print — relaxed camp-collar styling built for heat and holiday dressing.',
      ['Breathable summer-weight fabric.', 'Bold seasonal print for vacation wardrobes.', 'Button-front with easy relaxed fit.', 'Short sleeves with clean hem finish.', 'Ideal for beach, BBQ, and travel days.'],
    ),
  },
  'Camisa_de_hombre_de_manga_corta_con_tapeta_de_botones_-_Rayas_-_Rosa__': {
    name: 'PINK STRIPE SHORT-SLEEVE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Pink',
    price: 5800,
    description: fmt(
      'Fresh pink vertical stripe short-sleeve shirt with a clean button placket — a colourful warm-weather piece with European casual tailoring.',
      ['Vertical stripe pattern in soft rose tones.', 'Short-sleeve construction for summer comfort.', 'Classic collar and full button-front.', 'Lightweight woven fabric with smooth hand-feel.', 'Adds colour to weekend and resort outfits.'],
    ),
  },
  'Camisa_de_hombre_de_manga_corta_con_tapeta_de_botones_-_Rayas_-_Verde_': {
    name: 'GREEN STRIPE SHORT-SLEEVE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Green',
    price: 5800,
    description: fmt(
      'Green vertical stripe short-sleeve shirt with crisp button placket — a sharp casual option in an earthy fresh palette.',
      ['Clean vertical stripes in forest and sage greens.', 'Breathable short-sleeve summer cut.', 'Point collar with contrast buttons.', 'Regular fit for easy everyday styling.', 'Pairs with neutral chinos and white sneakers.'],
    ),
  },
  'Camisa_para_hombre_de_algod_n_oxford_estilo_casual_-_Mateo_-_Verde___2': {
    name: 'MATEO GREEN OXFORD CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Green',
    price: 6000,
    description: fmt(
      'Mateo green oxford cotton casual shirt — textured weave, soft structure, and a lived-in smart-casual character in a versatile olive-green tone.',
      ['Premium oxford cotton with visible basket weave.', 'Relaxed casual tailoring for daily wear.', 'Button-down collar and front placket.', 'Durable fabric that improves with wear.', 'Green earth tone suits denim and khaki alike.'],
    ),
  },
  Checked_Men_s_Shirt_with_Comfortable_Fit___Jules: {
    name: 'JULES COMFORT-FIT CHECKED SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6200,
    description: fmt(
      'Jules checked shirt in a comfortable relaxed fit — heritage check pattern with soft cotton feel for easy weekend layering.',
      ['Classic check pattern in balanced multi-tone palette.', 'Comfort-fit cut with room through chest and waist.', 'Button cuffs and point collar construction.', 'Versatile layer over tees or under overshirts.', 'Everyday casual staple with timeless appeal.'],
    ),
  },
  'Dirk_-_Camisa_con_Estampado_-_Azul___S': {
    name: 'DIRK BLUE PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 6400,
    description: fmt(
      'Dirk blue printed casual shirt with an artistic all-over motif — cool-toned pattern on a breathable short-sleeve button-down body.',
      ['Distinctive blue-ground print with artistic detailing.', 'Short-sleeve resort-ready silhouette.', 'Camp or spread collar for relaxed neckline.', 'Lightweight fabric for warm climates.', 'European-inspired casual holiday style.'],
    ),
  },
  Dope_Lemon_Shirt: {
    name: 'DOPE LEMON BOTANICAL PRINT SHIRT',
    subCategory: 'Casual',
    color: 'Cream Yellow',
    price: 6200,
    description: fmt(
      'Playful cream shirt covered in bright yellow lemons on green branches with delicate white blossoms — rolled cuffs and black contrast buttons.',
      ['All-over lemon botanical print on off-white ground.', 'Sunny yellow fruit with forest-green leaf detail.', 'Short sleeves with permanent rolled-cuff styling.', 'Black buttons add sharp contrast to the print.', 'Fun summer shirt for vacations and garden parties.'],
    ),
  },
  Dress_Shirt_Regular_Fit_Stretch_Stain_Shield_Long_Sleeve_Solid_Business_Wedding_Shirt: {
    name: 'STAIN-SHIELD STRETCH BUSINESS DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 8800,
    description: fmt(
      'Regular-fit dress shirt engineered with stretch and stain-shield technology — stays crisp through meetings, weddings, and long travel days.',
      ['Stain-repellent finish protects against spills.', 'Four-way stretch for comfort behind a desk or at the altar.', 'Regular fit allows room without looking boxy.', 'Classic spread collar and barrel cuffs.', 'Business and wedding-ready white formal staple.'],
    ),
  },
  'Drune___Herren_Hawaii_Hemd_Kurzarm__Blau___2XL': {
    name: 'BLUE TROPICAL HIBISCUS HAWAIIAN SHIRT',
    subCategory: 'Casual',
    color: 'Blue Multi',
    price: 6000,
    description: fmt(
      'Navy-to-teal Hawaiian shirt with large white hibiscus blooms, tropical leaves, and warm yellow-orange accents — styled best open over a white tee.',
      ['Dense tropical floral print with hibiscus and palm foliage.', 'Cool blue ground with high-contrast white flowers.', 'Spread collar and rolled short-sleeve cuffs.', 'Lightweight rayon-cotton feel for coastal heat.', 'Classic Aloha silhouette for beach and cruise wear.'],
    ),
  },
  'Drune___Stylisches_Gestreiftes_Button-Down_Hemd__Braun___3XL': {
    name: 'BROWN STRIPE BUTTON-DOWN SHIRT',
    subCategory: 'Formal shirts',
    color: 'Brown',
    price: 7200,
    description: fmt(
      'Stylish brown striped long-sleeve button-down — refined earth-tone stripes in a structured European cut suited to smart-casual offices.',
      ['Vertical stripe pattern in warm brown and tan tones.', 'Long sleeves with buttoned cuffs.', 'Classic button-down collar construction.', 'Structured woven fabric for a neat silhouette.', 'Smart-casual bridge between office and weekend.'],
    ),
  },
  'FREDD_MARSHALL_Tactix-Canvas_Men_s_Molle-Compatible_Tactical_Shirt___EDC__Field_Work_-_Armygreen___XXL': {
    name: 'TACTIX CANVAS TACTICAL FIELD SHIRT',
    subCategory: 'Casual',
    color: 'Green',
    price: 7800,
    description: fmt(
      'Fredd Marshall Tactix canvas shirt in army green — MOLLE-compatible chest panels, reinforced stitching, and utility pockets for field and EDC wear.',
      ['Heavy-duty canvas build with MOLLE webbing panels.', 'Multiple utility pockets for tools and essentials.', 'Durable reinforced seams for outdoor work.', 'Button-front with structured military collar.', 'Rugged casual shirt for adventure and field use.'],
    ),
  },
  Fashion_Mens_Hawaiian_Shirts_Short_Sleeve_Button_Coconut_Tree_Print_Ca: {
    name: 'YELLOW PALM FROND HAWAIIAN SHIRT',
    subCategory: 'Casual',
    color: 'Yellow Black',
    price: 5800,
    description: fmt(
      'High-impact sun-yellow Hawaiian shirt with bold black bamboo and palm-frond motifs — camp collar and white buttons for classic vacation style.',
      ['Large-scale black botanical print on bright yellow ground.', 'Flat camp collar for open-neck comfort.', 'Short sleeves with turned-up cuff detail.', 'Lightweight breathable holiday fabric.', 'Statement summer shirt for beaches and parties.'],
    ),
  },
  'Fashionable_Stripes_Print_Casual_100__Cotton_Shirt_S-Multicolor': {
    name: 'MULTICOLOR COTTON STRIPE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6500,
    description: fmt(
      '100% cotton multicolor stripe shirt — vibrant heritage bands on a breathable natural-fibre body with classic button-down construction.',
      ['Multi-tone stripe print on premium cotton.', 'Natural fibre breathability for all-day comfort.', 'Long-sleeve casual cut with button cuffs.', 'Colourful off-duty alternative to plain shirts.', 'Soft hand-feel that improves with washing.'],
    ),
  },
  G: {
    name: 'GRAPHIC PRINT SHORT-SLEEVE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5800,
    description: fmt(
      'Bold graphic-print short-sleeve casual shirt with an eye-catching all-over design — lightweight fabric and relaxed fit for expressive weekend style.',
      ['Vibrant all-over graphic print.', 'Short-sleeve button-down with camp collar.', 'Breathable summer-weight material.', 'Easy layering over plain tees.', 'Standout casual piece for social events.'],
    ),
  },
  Hawaiian_Bowling_Shirts_for_Men_Short_Sleeve_Printed_Regular_Fit_Summe: {
    name: 'BLACK ORANGE FLORAL BOWLING SHIRT',
    subCategory: 'Casual',
    color: 'Black Orange',
    price: 6200,
    description: fmt(
      'Retro bowling-shirt silhouette in black with oversized white and orange floral motifs — camp collar and relaxed regular fit for summer nights.',
      ['High-contrast floral print on deep black ground.', 'Notched camp collar for vintage bowling style.', 'Short sleeves with clean finished hem.', 'Wear open over a white tee for layered looks.', 'Bold casual shirt for parties and themed events.'],
    ),
  },
  Hawaiian_Shirt_for_Men_Short_Sleeve_Button_Down_: {
    name: 'CLASSIC HAWAIIAN BUTTON-DOWN SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5600,
    description: fmt(
      'Traditional Hawaiian short-sleeve button-down with a tropical all-over print — relaxed fit, breathable fabric, and vacation-ready styling.',
      ['Classic Aloha tropical print coverage.', 'Short-sleeve breathable construction.', 'Full button-front with spread collar.', 'Regular fit for comfortable holiday wear.', 'Essential beach and resort wardrobe piece.'],
    ),
  },
  'Herren_Freizeithemd_-_Marineblau___2XL__1_': {
    name: 'MARINE BLUE FREIZEIT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Navy',
    price: 6400,
    description: fmt(
      'German-style marine blue Freizeit (leisure) shirt — deep navy tone, relaxed tailoring, and everyday casual comfort in a long-sleeve button-down.',
      ['Rich marine navy colourway.', 'Relaxed Freizeit cut for off-duty comfort.', 'Long sleeves with adjustable cuffs.', 'Classic point collar and button placket.', 'European casual staple for weekends.'],
    ),
  },
  Herrenhemd_Langarm_Paisleymuster_aus_Hochwertigem_Material: {
    name: 'LONG-SLEEVE PAISLEY DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 8900,
    description: fmt(
      'Premium long-sleeve paisley dress shirt in high-quality woven fabric — ornate swirls with dress-shirt structure for weddings and formal evenings.',
      ['Intricate paisley motif with rich colour depth.', 'Long-sleeve formal construction with barrel cuffs.', 'Quality woven material with smooth finish.', 'Point collar designed for ties and jackets.', 'Statement formal piece for celebrations.'],
    ),
  },
  Herrenhemd_Langarm_Paisleymuster_aus_Hochwertigem_Material__1_: {
    name: 'LONG-SLEEVE PAISLEY DRESS SHIRT — VARIANT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 9000,
    description: fmt(
      'Second colourway of our premium paisley dress shirt — flowing ornamental swirls on a long-sleeve body built for formal occasions.',
      ['Detailed paisley pattern with jewel-tone accents.', 'Structured dress-shirt collar and placket.', 'Premium fabric with refined drape.', 'Single-button cuffs for classic formal finish.', 'Pairs with Prince Esquire blazers and dress trousers.'],
    ),
  },
  'JUSTIN_-_Camisa_de_Verano_Jungla_-_Zebra_Mix___L': {
    name: 'JUNGLE ZEBRA MIX SUMMER SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6600,
    description: fmt(
      'Justin jungle summer shirt with a wild zebra-and-botanical mix print — short-sleeve camp styling for adventurous holiday looks.',
      ['Zebra stripe meets jungle botanical print.', 'Summer-weight breathable fabric.', 'Camp collar for open-neck comfort.', 'Bold pattern for confident vacation style.', 'Lightweight button-front casual construction.'],
    ),
  },
  JaysEssentials__Premium_Quality_Products_for_Everyday_Living: {
    name: 'JAY\'S ESSENTIALS PREMIUM CASUAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Blue',
    price: 7000,
    description: fmt(
      'Jay\'s Essentials premium everyday shirt — clean construction, quality fabric, and versatile styling for daily smart-casual wear.',
      ['Premium quality fabric for everyday durability.', 'Classic button-down with point collar.', 'Versatile colour for office and weekend.', 'Comfortable regular fit through body.', 'Reliable wardrobe staple from Jay\'s Essentials.'],
    ),
  },
  'KELDROS___L_SSIGES__ELEGANTES_HEMD_-_Cremefarben___3XL__1_': {
    name: 'KELDROS CREAM ELEGANT DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Cream',
    price: 8200,
    description: fmt(
      'Keldros elegant cream dress shirt — luxurious off-white tone, refined European tailoring, and formal long-sleeve construction.',
      ['Sophisticated cream colour for formal suiting.', 'Elegant structured collar and cuffs.', 'Smooth premium woven fabric.', 'Long-sleeve dress-shirt silhouette.', 'Ideal for weddings, church, and gala events.'],
    ),
  },
  'Knitterfreies_elastisches_Slim-Fit-Hemd_-_Bolendo_Mark__Grau-Blau___L': {
    name: 'BOLENDO WRINKLE-FREE SLIM DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Grey Blue',
    price: 8500,
    description: fmt(
      'Bolendo wrinkle-free slim-fit dress shirt in grey-blue — elastic comfort with a sharp silhouette for modern professional dressing.',
      ['Non-iron finish saves time on busy mornings.', 'Slim fit contours without restricting movement.', 'Grey-blue tone pairs with navy and charcoal suits.', 'Stretch weave for desk-to-dinner comfort.', 'German-engineered formal reliability.'],
    ),
  },
  'LAKE_COMO_Shirt_-_XL': {
    name: 'LAKE COMO RESORT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 6800,
    description: fmt(
      'Lake Como resort shirt — Italian-inspired casual elegance in a breathable short-sleeve cut with refined coastal colour tones.',
      ['Resort-ready casual tailoring.', 'Lake Como-inspired refined aesthetic.', 'Lightweight fabric for Mediterranean warmth.', 'Button-front with classic collar.', 'Holiday and waterfront occasion styling.'],
    ),
  },
  'Loose_Men_Letter_Graphic_Colorblock_Shirt_Without_Tee__1_': {
    name: 'LOVE GRAFFITI GRAPHIC CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'White Multi',
    price: 6200,
    description: fmt(
      'White shirt exploding with graffiti-style LOVE lettering in hot pink, yellow, cyan, and black — streetwear energy on a button-down body.',
      ['All-over hand-drawn LOVE graphic print.', 'Multi-colour graffiti palette on white ground.', 'Short sleeves with folded cuff detail.', 'Point collar and white button closure.', 'Streetwear statement for festivals and casual nights.'],
    ),
  },
  Manfinity_Mode_Men_Solid_Color_Long_Sleeve_Casual_Daily_Shirt_For_Spri: {
    name: 'MANFINITY SOLID LONG-SLEEVE DAILY SHIRT',
    subCategory: 'Formal shirts',
    color: 'Classic',
    price: 6800,
    description: fmt(
      'Manfinity solid long-sleeve daily shirt — clean colour, minimal design, and commute-friendly comfort for spring and summer office wear.',
      ['Solid colourway for versatile styling.', 'Long-sleeve smart-casual construction.', 'Breathable fabric for daily commuting.', 'Classic collar and button placket.', 'Foundation shirt for layered weekday outfits.'],
    ),
  },
  'Maxim___Elastisch_overhemd': {
    name: 'MAXIM STRETCH FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Blue',
    price: 8000,
    description: fmt(
      'Maxim elastic formal shirt (elastisch overhemd) — Dutch tailoring with built-in stretch for comfortable all-day professional wear.',
      ['Elastic weave moves with you at work.', 'Clean formal silhouette with point collar.', 'European Maxim quality construction.', 'Wrinkle-resistant performance fabric.', 'Office-ready with blazer compatibility.'],
    ),
  },
  Men_1pc_Striped_Print_Shirt: {
    name: 'HERITAGE STRIPE PRINT SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7000,
    description: fmt(
      'Heritage stripe print shirt with balanced vertical bands — long-sleeve button-down suited to smart-casual offices and dinner dates.',
      ['Classic vertical stripe pattern.', 'Long sleeves with buttoned cuffs.', 'Point collar for tie or open-neck wear.', 'Woven fabric with structured drape.', 'Timeless pattern that never dates.'],
    ),
  },
  Men_Allover_Print_Decor_Pocket_Shirt: {
    name: 'DECOR POCKET ALL-OVER PRINT SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7500,
    description: fmt(
      'All-over print shirt with a decorative chest pocket detail — artistic motif coverage on a long-sleeve button-down body.',
      ['Full-body artistic print with pocket accent.', 'Decorative pocket adds visual focal point.', 'Long-sleeve construction with collar stand.', 'Unique pattern for fashion-forward formal-casual.', 'Conversation piece for events and outings.'],
    ),
  },
  Men_Graphic_Print_Shirt_Without_Tee: {
    name: 'COMIC POP ART GRAPHIC SHIRT',
    subCategory: 'Casual',
    color: 'White Multi',
    price: 5850,
    description: fmt(
      'White comic-book graphic shirt with BAM!, Ka-Pow!, and explosion bubbles — pop-art energy on a short-sleeve button-down.',
      ['Retro comic onomatopoeia all-over print.', 'Red, orange, yellow, and black action graphics.', 'Short sleeves with spread collar.', 'Lightweight fabric for summer events.', 'Playful casual shirt for themed parties.'],
    ),
  },
  Men_Lapel_Collar_Button_Front_Shirt__1_: {
    name: 'LAPEL COLLAR BUTTON-FRONT SHIRT',
    subCategory: 'Formal shirts',
    color: 'Classic',
    price: 7200,
    description: fmt(
      'Structured lapel-collar button-front shirt — a refined formal-casual hybrid with clean lines and long-sleeve tailoring.',
      ['Distinctive lapel collar for elevated style.', 'Full button-front with crisp placket.', 'Long-sleeve formal-ready construction.', 'Tailored fit through chest and waist.', 'Pairs with dress trousers for evening events.'],
    ),
  },
  Men_Paisley_Print_Shirt: {
    name: 'PAISLEY PRINT LONG-SLEEVE SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 8500,
    description: fmt(
      'Ornate paisley print long-sleeve shirt — swirling teardrop motifs in rich tones on a dress-shirt frame for weddings and celebrations.',
      ['Classic paisley swirls with jewel-tone depth.', 'Long sleeves with barrel cuff closure.', 'Point collar suited to jackets and ties.', 'Smooth woven fabric with elegant drape.', 'Formal statement without solid-colour plainness.'],
    ),
  },
  Men_Paisley_Print_Shirt_Without_Tee: {
    name: 'PAISLEY PRINT CASUAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 8400,
    description: fmt(
      'Paisley print button-down with flowing ornamental curves — dress-shirt quality in a versatile long-sleeve silhouette.',
      ['Detailed paisley motif across body and sleeves.', 'Button-down front with structured collar.', 'Premium print clarity and colour saturation.', 'Long-sleeve cut for formal and smart-casual.', 'Rich pattern for special-occasion dressing.'],
    ),
  },
  Men_Plus_Size_Shirt_Collar_Short_Sleeve_Allover_Print_Casual_Top: {
    name: 'PLUS SIZE ALL-OVER PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6000,
    description: fmt(
      'Plus-size short-sleeve casual shirt with a bold all-over print — generous cut, breathable fabric, and confident pattern coverage.',
      ['Inclusive plus-size relaxed fit.', 'All-over print for maximum visual impact.', 'Short sleeves with collared neckline.', 'Lightweight material for warm weather.', 'Comfort-first casual for bigger frames.'],
    ),
  },
  Men_Random_Palm_Tree_Print_Shirt_Without_Tee: {
    name: 'RANDOM PALM TREE TROPICAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5800,
    description: fmt(
      'Scattered palm-tree tropical print on a short-sleeve button-down — random-placement fronds for an organic vacation aesthetic.',
      ['Artistic random palm frond placement.', 'Tropical colour palette for resort wear.', 'Short-sleeve breathable construction.', 'Camp or spread collar styling.', 'Holiday essential for coastal getaways.'],
    ),
  },
  'Men_Shirt_-_Red___4XL': {
    name: 'CLASSIC RED FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Red',
    price: 7500,
    description: fmt(
      'Classic solid red long-sleeve formal shirt — bold colour for celebrations, parties, and statement suiting in a clean dress-shirt cut.',
      ['Rich solid red colourway.', 'Long-sleeve formal shirt construction.', 'Point collar and barrel cuffs.', 'Smooth cotton-blend fabric.', 'Celebration-ready alternative to white and blue.'],
    ),
  },
  'Men_Shirt_-_White___L': {
    name: 'CLASSIC WHITE FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 7200,
    description: fmt(
      'Essential white long-sleeve formal shirt — the ultimate blank canvas for ties, blazers, and black-tie dress codes.',
      ['Crisp white for maximum versatility.', 'Structured collar for tie compatibility.', 'Long sleeves with button cuffs.', 'Clean front without distracting details.', 'Wedding, interview, and church staple.'],
    ),
  },
  Men_Solid_Button_Up_Shirt: {
    name: 'SOLID COLOUR BUTTON-UP SHIRT',
    subCategory: 'Formal shirts',
    color: 'Classic',
    price: 7000,
    description: fmt(
      'Clean solid-colour button-up shirt — minimalist long-sleeve design for professional environments and understated formal style.',
      ['Solid tone for effortless coordination.', 'Button-up front with classic collar.', 'Long-sleeve tailored silhouette.', 'Smooth wrinkle-resistant fabric.', 'Daily office and formal event essential.'],
    ),
  },
  Men_Solid_Collared_Button_Up_Shirt: {
    name: 'SOLID COLLARED BUTTON-UP SHIRT',
    subCategory: 'Formal shirts',
    color: 'Classic',
    price: 7100,
    description: fmt(
      'Solid collared button-up with a sharp collar stand — reliable long-sleeve formal shirt for suiting and business-casual wardrobes.',
      ['Defined collar stand holds shape all day.', 'Solid colour for suit and blazer pairing.', 'Long sleeves with adjustable cuffs.', 'Premium cotton-feel weave.', 'Professional wardrobe building block.'],
    ),
  },
  Men_Striped_Button_Front_Shirt_Without_Tee: {
    name: 'STRIPED BUTTON-FRONT SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7300,
    description: fmt(
      'Vertical striped button-front shirt — heritage stripe bands on a long-sleeve body for smart offices and dinner reservations.',
      ['Refined stripe pattern with balanced spacing.', 'Full button-front placket.', 'Long-sleeve with classic collar.', 'Structured fabric for neat tucking.', 'Smart-casual stripe essential.'],
    ),
  },
  Men_Tropical_Print_Button_Up_Shirt: {
    name: 'TROPICAL PRINT BUTTON-UP SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5900,
    description: fmt(
      'Tropical print button-up with lush botanical motifs — short-sleeve vacation shirt for heat, humidity, and holiday adventures.',
      ['Dense tropical botanical all-over print.', 'Button-up front with spread collar.', 'Breathable holiday-weight fabric.', 'Relaxed fit for comfort in warm climates.', 'Beach, cruise, and resort ready.'],
    ),
  },
  Men_Tropical_Print_Shirt: {
    name: 'TROPICAL LEAF PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5800,
    description: fmt(
      'Tropical leaf print casual shirt — oversized foliage motifs on a lightweight short-sleeve button-down for summer escape dressing.',
      ['Bold tropical leaf pattern coverage.', 'Short-sleeve warm-weather cut.', 'Easy button-front closure.', 'Lightweight drape for coastal climates.', 'Vacation wardrobe must-have.'],
    ),
  },
  Men_Vertical_Striped_Button_Up_Shirt: {
    name: 'VERTICAL STRIPE BUTTON-UP SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7400,
    description: fmt(
      'Vertical stripe button-up in classic heritage bands — elongating stripe direction on a long-sleeve formal-casual shirt.',
      ['Vertical stripes create a lengthening effect.', 'Button-up with point collar.', 'Long-sleeve office-appropriate cut.', 'Woven cotton blend with crisp hand.', 'Pairs with navy blazers and grey trousers.'],
    ),
  },
  'Men_s_60s_Striped_Withe_Bowling_Shirt_Camp_Short_': {
    name: '60s RETRO STRIPE BOWLING SHIRT',
    subCategory: 'Casual',
    color: 'White',
    price: 6400,
    description: fmt(
      '1960s-inspired white bowling shirt with retro stripe accents — camp collar and short sleeves for vintage party style.',
      ['Retro 60s bowling-shirt silhouette.', 'Camp collar with stripe detailing.', 'Short-sleeve vintage party cut.', 'White base with period stripe accents.', 'Themed events, bowling nights, and retro looks.'],
    ),
  },
  'Men_s_Floral_Print_Button_Front_Short_Sleeve_Casual_Shirt__Summer': {
    name: 'WHITE LILY TROPICAL SUMMER SHIRT',
    subCategory: 'Casual',
    color: 'White Multi',
    price: 6000,
    description: fmt(
      'White-ground summer shirt with yellow lilies, green Monstera leaves, and palm fronds — dense tropical print for vacation confidence.',
      ['Yellow lily blossoms with dark teal Monstera foliage.', 'White base makes florals pop vividly.', 'Short-sleeve summer button-front.', 'Spread collar and white buttons.', 'Holiday shirt for tropical destinations.'],
    ),
  },
  'Men_s_Floral_Print_Vintage_Flower_Holiday_Breathable_Button_Up_Navy_Bl': {
    name: 'NAVY VINTAGE FLORAL HOLIDAY SHIRT',
    subCategory: 'Casual',
    color: 'Navy Multi',
    price: 6200,
    description: fmt(
      'Navy blue holiday shirt with vintage floral motifs — breathable button-up built for warm-weather travel and resort evenings.',
      ['Vintage-inspired floral print on navy ground.', 'Breathable fabric for holiday humidity.', 'Button-up with classic collar.', 'Relaxed fit for comfortable travel.', 'Coastal and resort evening styling.'],
    ),
  },
  'Men_s_Full_Size_Button_Down_Collared_Neck_Shirt_Plus_Size_-_Blue___XL': {
    name: 'PLUS SIZE BLUE FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Blue',
    price: 7600,
    description: fmt(
      'Plus-size blue button-down formal shirt — generous fit, classic collared neckline, and long-sleeve construction for inclusive professional dressing.',
      ['Inclusive plus-size tailored fit.', 'Classic blue formal colourway.', 'Collared neck with full button placket.', 'Long sleeves with barrel cuffs.', 'Office and event-ready for larger sizes.'],
    ),
  },
  'Men_s_Full_Size_Button_Down_Embroidered_Shirt_Plus_Size_-_Light_Blue__': {
    name: 'PLUS SIZE LIGHT BLUE EMBROIDERED SHIRT',
    subCategory: 'Formal shirts',
    color: 'Blue',
    price: 7800,
    description: fmt(
      'Plus-size light blue shirt with refined chest embroidery — elegant detail on a comfortable full-size formal button-down.',
      ['Delicate embroidery accent on chest.', 'Soft light blue formal tone.', 'Plus-size comfortable fit.', 'Long-sleeve dress-shirt construction.', 'Celebration and church-appropriate detailing.'],
    ),
  },
  'Men_s_Premium_Striped_Shirts___Stylish___Comfortable___Starting_at__20': {
    name: 'PREMIUM COMFORT STRIPE SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7600,
    description: fmt(
      'Premium striped shirt combining style and comfort — quality stripe weave on a long-sleeve body built for daily professional wear.',
      ['Premium stripe fabric with soft hand-feel.', 'Comfort-focused fit for long workdays.', 'Stylish vertical stripe pattern.', 'Classic collar and button cuffs.', 'Elevated everyday office shirt.'],
    ),
  },
  'Men_s_Royal_Luxury': {
    name: 'ROYAL LUXURY PAISLEY FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 10500,
    description: fmt(
      'Royal Luxury formal shirt with opulent pattern work and premium finish — a high-end long-sleeve piece for gala events and VIP occasions.',
      ['Luxury-grade fabric with rich lustre.', 'Ornate pattern befitting royal occasion wear.', 'Long-sleeve formal tailoring.', 'Statement piece for weddings and galas.', 'Prince Esquire premium formal collection.'],
    ),
  },
  'Men_s_Rust_Orange_Plaid_Shirt___Stylish_Casual_Check_Shirt_for_Men___T': {
    name: 'RUST ORANGE PLAID CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Orange',
    price: 6500,
    description: fmt(
      'Rust orange plaid check shirt — warm autumn tones in a street-style casual cut with soft brushed feel and chest pocket.',
      ['Rust and orange heritage plaid pattern.', 'Trendy street-style casual silhouette.', 'Check pattern aligned on chest pocket.', 'Comfortable brushed cotton feel.', 'Pairs with dark denim for urban weekend looks.'],
    ),
  },
  'Men_s_Short_Sleeve_Letter_Printed_Shirt__Irregular_Cut_': {
    name: 'IRREGULAR CUT LETTER PRINT SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6200,
    description: fmt(
      'Short-sleeve shirt with bold letter graphics and an irregular cut hem — avant-garde casual piece for fashion-forward dressing.',
      ['Oversized letter print graphics.', 'Irregular cut hem for modern asymmetry.', 'Short-sleeve summer construction.', 'Relaxed fit with artistic edge.', 'Streetwear-influenced casual statement.'],
    ),
  },
  'Men_s_Stripe_Print_Business_Long_Sleeve_Shirt_As_shown-XL': {
    name: 'BUSINESS STRIPE LONG-SLEEVE SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7800,
    description: fmt(
      'Business stripe long-sleeve shirt — conservative stripe spacing and dress-shirt construction for corporate environments.',
      ['Business-appropriate stripe scale and colours.', 'Long-sleeve formal shirt frame.', 'Crisp collar for tie wearing.', 'Wrinkle-resistant office fabric.', 'Corporate meeting and presentation ready.'],
    ),
  },
  'Men_s_Striped_Shirt____262_Only______74__OFF_Deal': {
    name: 'CLASSIC STRIPE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6000,
    description: fmt(
      'Classic multi-stripe casual shirt — heritage vertical bands on a comfortable button-down for everyday off-duty style.',
      ['Timeless stripe pattern in balanced tones.', 'Casual comfortable fit.', 'Button-front with spread collar.', 'Versatile day-to-night styling.', 'Affordable wardrobe stripe essential.'],
    ),
  },
  Mens_Casual_Simple_Solid_Color_Short_Sleeved_Shir: {
    name: 'SIMPLE SOLID SHORT-SLEEVE SHIRT',
    subCategory: 'Casual',
    color: 'Classic',
    price: 4800,
    description: fmt(
      'Minimal solid-colour short-sleeve shirt — clean, uncomplicated casual essential in a breathable summer-weight fabric.',
      ['Solid colour for easy outfit building.', 'Short-sleeve hot-weather construction.', 'Simple button-down with point collar.', 'Lightweight and easy to care for.', 'Foundation casual shirt at entry pricing.'],
    ),
  },
  'Mens_Hawaiian_Shirt__Mens_Tropical_Leaf_Print_Shirts': {
    name: 'TROPICAL LEAF HAWAIIAN SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5700,
    description: fmt(
      'Classic Hawaiian shirt with oversized tropical leaf print — short-sleeve Aloha styling for beaches, luaus, and summer BBQs.',
      ['Large-scale tropical leaf motifs.', 'Authentic Hawaiian shirt silhouette.', 'Breathable rayon-cotton holiday fabric.', 'Camp collar and button-front.', 'Vacation essential in bold botanical print.'],
    ),
  },
  'Mens_JEMITOP_Wrinkle_Free_Stretch_Slim_Fit_Dress_Shirts___23_99': {
    name: 'JEMITOP WRINKLE-FREE SLIM DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 8300,
    description: fmt(
      'JEMITOP wrinkle-free stretch slim dress shirt — technical fabric meets tailored silhouette for modern professionals.',
      ['Wrinkle-free technology for travel and long days.', 'Slim fit with four-way stretch comfort.', 'Crisp dress-shirt collar and cuffs.', 'Stain-resistant performance weave.', 'Top pick for business travel wardrobes.'],
    ),
  },
  'Mens_JEMITOP_Wrinkle_Free_Stretch_Slim_Fit_Dress_Shirts___23_99__1_': {
    name: 'JEMITOP WRINKLE-FREE SLIM DRESS SHIRT — VARIANT',
    subCategory: 'Formal shirts',
    color: 'Blue',
    price: 8400,
    description: fmt(
      'Second colourway of JEMITOP\'s wrinkle-free slim dress shirt — same stretch performance in an alternate formal tone.',
      ['Non-iron finish maintains crisp appearance.', 'Slim tailored cut for modern professionals.', 'Stretch fabric for unrestricted movement.', 'Classic point collar and barrel cuffs.', 'Reliable formal shirt for daily wear.'],
    ),
  },
  'Mens_Stretch_Wrinkle_Free_Shirts_Long_Sleeve_Slim_Fit_Button_Down_Shir': {
    name: 'STRETCH WRINKLE-FREE SLIM DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Classic',
    price: 8200,
    description: fmt(
      'Long-sleeve slim-fit button-down with stretch and wrinkle-free treatment — sharp formal look with athletic comfort.',
      ['Wrinkle-free for morning-to-evening sharpness.', 'Slim fit contours the modern physique.', 'Stretch weave aids reaching and sitting.', 'Button-down dress-shirt construction.', 'Versatile formal shirt for work and events.'],
    ),
  },
  'Milaan___Modern_en_elegant_Verfijnd_overhemd_-_Zwart___5XL': {
    name: 'MILAAN BLACK ELEGANT DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Black',
    price: 8800,
    description: fmt(
      'Milaan modern elegant black dress shirt (verfijnd overhemd) — refined Dutch tailoring in a deep black formal tone.',
      ['Sophisticated black for evening formal wear.', 'Modern elegant European cut.', 'Premium smooth formal fabric.', 'Long-sleeve with structured collar.', 'Gala, funeral, and black-tie appropriate.'],
    ),
  },
  'NQyIOS_Men_s_Shirt_Short_Sleeves_Printed_Button_Down_Summer_Beach_Dress_Shirts_X_1': {
    name: 'SUMMER BEACH PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5500,
    description: fmt(
      'NQyIOS summer beach print short-sleeve shirt — colourful holiday graphic on a lightweight button-down for sand and sun.',
      ['Vibrant beach-themed all-over print.', 'Short-sleeve breathable summer cut.', 'Button-down with casual collar.', 'Lightweight quick-dry feel fabric.', 'Beach holiday and poolside essential.'],
    ),
  },
  'Overshirt_Herren___Kontrastdetails___Smarter_Look_-_Hellblau___4XL': {
    name: 'LIGHT BLUE CONTRAST OVERSHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 7200,
    description: fmt(
      'Light blue overshirt with contrast detailing — smarter casual layer with shirt-jacket weight for transitional weather styling.',
      ['Overshirt weight bridges shirt and light jacket.', 'Contrast stitch and panel details.', 'Hellblau (light blue) versatile tone.', 'Button-front with chest pockets.', 'Layer over tees or under coats.'],
    ),
  },
  Pacific_Palm_Shirt: {
    name: 'PACIFIC PALM ABSTRACT TROPICAL SHIRT',
    subCategory: 'Casual',
    color: 'Tan Brown',
    price: 6800,
    description: fmt(
      'Pacific Palm shirt with oversized abstract tropical fronds in tan, mocha, black, and white — modern resort print on a relaxed short-sleeve body.',
      ['Large-scale abstract palm and geometric leaf print.', 'Sophisticated earth-tone palette.', 'Point collar and white button placket.', 'Lightweight soft-drape resort fabric.', 'QUEST GC-quality resort casual styling.'],
    ),
  },
  STRIP_SHIRT: {
    name: 'HERITAGE STRIPE CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6000,
    description: fmt(
      'Heritage stripe casual shirt — balanced vertical bands on a comfortable button-down for easy everyday rotation.',
      ['Classic stripe pattern in heritage colours.', 'Casual comfortable regular fit.', 'Button-front with point collar.', 'Versatile daywear essential.', 'Pairs with jeans and sneakers.'],
    ),
  },
  'Striped_With_Daffodils_Slim_Fit_Shirts_-_Red___2XL_65-72kg': {
    name: 'RED DAFFODIL STRIPE SLIM SHIRT',
    subCategory: 'Formal shirts',
    color: 'Red',
    price: 8000,
    description: fmt(
      'Slim-fit red shirt with delicate daffodil floral accents woven into stripe bands — romantic formal-casual hybrid for spring events.',
      ['Unique daffodil floral detail within stripe pattern.', 'Slim fit for a sharp modern profile.', 'Red ground with contrasting stripe bands.', 'Long-sleeve button-down construction.', 'Spring wedding and garden party appropriate.'],
    ),
  },
  Summer_Coconut_Tree_Print_Shirts_Men_s_Hawaiian_Vintage_Button_Beach_L: {
    name: 'COCONUT TREE VINTAGE HAWAIIAN SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5800,
    description: fmt(
      'Vintage Hawaiian shirt with coconut palm silhouettes — retro beach print on a short-sleeve button-down for tropical nostalgia.',
      ['Coconut tree tropical vintage print.', 'Classic Hawaiian short-sleeve cut.', 'Breathable beach leisure fabric.', 'Button-down with camp collar.', 'Retro vacation and luau styling.'],
    ),
  },
  'Summer_Outfit_-_Amalfi_Set_-_Light_Blue___M': {
    name: 'AMALFI LIGHT BLUE SUMMER SHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 6500,
    description: fmt(
      'Amalfi coast-inspired light blue summer shirt — Mediterranean resort colour in a breathable short-sleeve casual cut.',
      ['Coastal light blue summer tone.', 'Part of the Amalfi resort collection.', 'Breathable warm-weather fabric.', 'Clean button-down casual styling.', 'Italian Riviera holiday aesthetic.'],
    ),
  },
  Summer_Short_Sleeve_Shirt_With_Stripes_And_Printed_Design__Lapel_Colla: {
    name: 'STRIPE & PRINT LAPEL COLLAR SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 6200,
    description: fmt(
      'Summer short-sleeve shirt mixing stripe and printed panels — lapel collar detail adds a refined twist to casual warm-weather wear.',
      ['Combined stripe and graphic print design.', 'Lapel collar for elevated casual look.', 'Short-sleeve summer construction.', 'Lightweight breathable fabric.', 'Dual-pattern shirt for style experimenters.'],
    ),
  },
  The_Perfect_Minimal_Striped_Shirt: {
    name: 'MINIMAL STRIPE FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7500,
    description: fmt(
      'The perfect minimal striped shirt — fine understated stripes on a clean long-sleeve body for refined smart-casual dressing.',
      ['Minimal stripe scale for subtle sophistication.', 'Clean uncluttered formal-casual design.', 'Long-sleeve with crisp collar.', 'Premium cotton with smooth finish.', 'Capsule wardrobe stripe essential.'],
    ),
  },
  Uiriuy_Mens_Casual_Collared_Short_Sleeve_Button_Down_Corduroy_Shirts: {
    name: 'DUSTY BLUE CORDUROY CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 6800,
    description: fmt(
      'Dusty slate-blue corduroy shirt with fine vertical wale texture — camp collar, chest pocket, and rolled cuffs for tactile casual luxury.',
      ['Fine corduroy wale texture adds depth and warmth.', 'Relaxed Cuban camp collar sits flat and open.', 'Single left chest patch pocket.', 'Fixed rolled-up short sleeve cuffs.', 'Soft-touch fabric for smart-casual summer evenings.'],
    ),
  },
  Uiriuy_Mens_Casual_Collared_Short_Sleeve_Button_Down_Corduroy_Shirts__: {
    name: 'DUSTY BLUE CORDUROY CASUAL SHIRT — VARIANT',
    subCategory: 'Casual',
    color: 'Blue',
    price: 6800,
    description: fmt(
      'Variant of our dusty blue corduroy camp-collar shirt — same fine wale texture and rolled cuffs in Prince Esquire casual collection.',
      ['Textured corduroy with subtle vertical rib.', 'Camp collar for open-neck comfort.', 'Contrasting white buttons on blue ground.', 'Chest pocket and rolled short sleeves.', 'Tactile alternative to flat cotton casual shirts.'],
    ),
  },
  'Vintage_Red___White_Floral_Hawaiian_Shirt_Mens_Small_Medium__Bright_Re': {
    name: 'VINTAGE RED HIBISCUS HAWAIIAN SHIRT',
    subCategory: 'Casual',
    color: 'Red Cream',
    price: 6400,
    description: fmt(
      'Deep red Hawaiian shirt with oversized cream hibiscus blooms and a subtle distressed vintage texture — classic tropical celebration style.',
      ['Large-scale cream hibiscus on rich red ground.', 'Vintage distressed texture within floral areas.', 'Spread collar and white button placket.', 'Relaxed fit for beach parties and cruises.', 'High-contrast tropical floral statement.'],
    ),
  },
  ZEROYAA_Men_s_Hipster_Patchwork_Design_Slim_Fit_: {
    name: 'NAVY & TAN PATCHWORK PAISLEY SHIRT',
    subCategory: 'Casual',
    color: 'Navy Tan',
    price: 7200,
    description: fmt(
      'ZEROYAA slim-fit patchwork shirt in navy and tan — paisley, diamond, and ornamental circles arranged in structured panels.',
      ['Intricate patchwork of paisley and geometric blocks.', 'Navy and sandy tan high-contrast palette.', 'Slim fit for a contemporary sharp silhouette.', 'Point collar and light contrast buttons.', 'Artistic casual piece for confident dressers.'],
    ),
  },
  ZEROYAA_Men_s_Luxury_Gold_Prom_Design_Slim_Fit_Long_Sleeve_Button_up_P: {
    name: 'ZEROYAA GOLD PROM SLIM FORMAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Gold Black',
    price: 10200,
    description: fmt(
      'ZEROYAA luxury gold prom shirt — slim-fit long-sleeve with ornate gold monogram pattern on black for gala and prom-night presence.',
      ['Opulent gold prom design on dark ground.', 'Slim fit tailored for youthful formal style.', 'Long-sleeve with dress-shirt collar.', 'Premium ZEROYAA luxury collection quality.', 'Prom, gala, and red-carpet statement piece.'],
    ),
  },
  all_the_men_s_fation_: {
    name: 'MEN\'S FASHION PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5800,
    description: fmt(
      'Contemporary men\'s fashion print shirt — trend-forward pattern on a casual button-down for style-conscious weekend wear.',
      ['Current fashion-forward print design.', 'Casual button-down construction.', 'Breathable fabric for daily wear.', 'Versatile styling with denim or chinos.', 'Affordable entry to statement casual shirts.'],
    ),
  },
  best_formal_shirt: {
    name: 'BEST IN CLASS WHITE DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 9000,
    description: fmt(
      'Best-in-class white dress shirt — benchmark formal construction with crisp collar, precise stitching, and premium cotton blend.',
      ['Top-tier white dress-shirt quality.', 'Precision collar and cuff construction.', 'Smooth premium cotton-poly blend.', 'Long-sleeve formal tailoring.', 'The gold standard for suiting and tuxedos.'],
    ),
  },
  camisa_masculina_de_manga_comprida_com_estampa_: {
    name: 'LONG-SLEEVE PRINTED DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'Multicolor',
    price: 7800,
    description: fmt(
      'Portuguese-style long-sleeve printed dress shirt (camisa masculina) — artistic print on formal long-sleeve construction.',
      ['Artistic all-over print on dress-shirt frame.', 'Long-sleeve manga comprida formal cut.', 'Point collar and button cuffs.', 'Smooth woven fabric with print clarity.', 'Formal-casual hybrid for creative professionals.'],
    ),
  },
  chemises_de_qualit_: {
    name: 'FRENCH QUALITY DRESS SHIRT',
    subCategory: 'Formal shirts',
    color: 'White',
    price: 8600,
    description: fmt(
      'French quality dress shirt (chemise de qualité) — refined European craftsmanship in a crisp long-sleeve formal silhouette.',
      ['Premium French-quality shirt construction.', 'Crisp formal fabric with excellent drape.', 'Long-sleeve with classic collar stand.', 'Quality stitching and button finishing.', 'European formal standard for professionals.'],
    ),
  },
  download__12_: {
    name: 'TROPICAL PRINT CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Multicolor',
    price: 5600,
    description: fmt(
      'Tropical print casual shirt with vibrant holiday motifs — short-sleeve button-down for downloaded-from-summer-catalogue vacation style.',
      ['Bold tropical holiday print.', 'Short-sleeve warm-weather cut.', 'Camp or spread collar styling.', 'Lightweight breathable fabric.', 'Affordable vacation wardrobe addition.'],
    ),
  },
  this_is_very_nice_shirt: {
    name: 'PREMIUM SMART CASUAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Blue',
    price: 7400,
    description: fmt(
      'A genuinely standout smart-casual shirt — quality fabric, clean tailoring, and versatile colour that earns its "very nice" reputation.',
      ['Premium fabric with refined hand-feel.', 'Smart-casual tailoring for multiple occasions.', 'Classic button-down with point collar.', 'Long-sleeve construction with button cuffs.', 'Customer-favourite versatile formal-casual piece.'],
    ),
  },
  'Keldros_-_Stilvolles_Freizeit-T-Shirt_-_Dunkelmarine___3XL': {
    name: 'KELDROS DARK NAVY CASUAL SHIRT',
    subCategory: 'Casual',
    color: 'Navy',
    price: 6200,
    description: fmt(
      'Keldros dark navy casual shirt — stylish Freizeit (leisure) piece in deep marine tone with relaxed European tailoring.',
      ['Deep dunkelmarine navy colour.', 'Stylish casual Freizeit cut.', 'Comfortable everyday fit.', 'Classic collar and button front.', 'German casual quality from Keldros.'],
    ),
  },
  'link_below_____Classic_Navy_Striped_Shirt_for_Men___Smart_Casual_Essential': {
    name: 'CLASSIC NAVY STRIPE SMART CASUAL SHIRT',
    subCategory: 'Formal shirts',
    color: 'Navy',
    price: 7600,
    description: fmt(
      'Classic navy striped smart-casual shirt — essential vertical bands in navy and white for polished off-duty and office-friday style.',
      ['Navy and white vertical stripe pattern.', 'Smart-casual essential for every wardrobe.', 'Long-sleeve with buttoned cuffs.', 'Crisp collar for tie or open-neck.', 'Pairs with chinos and Prince Esquire blazers.'],
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'shirt-product-specs.json');
const merged = { ...SPECS, ...DESCRIPTIVE };
fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`Written ${Object.keys(merged).length} product specs to ${OUT}`);
