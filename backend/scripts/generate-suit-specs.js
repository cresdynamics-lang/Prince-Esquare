/**
 * Generates backend/data/suit-product-specs.json with rich two-piece suit metadata.
 * Run: node scripts/generate-suit-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable sizes S–3XL (jacket & trouser set). Tailored at Prince Esquire for weddings, galas, and executive occasions.`;

const SPECS = {
  Formal_Men_s_Suits_2_Piece_Slim_Fit_Performance_Suit: {
    name: 'CHARCOAL SLIM-FIT PERFORMANCE TWO-PIECE SUIT',
    color: 'Charcoal',
    style: 'single-breasted',
    pattern: 'solid',
    price: 24500,
    featured: true,
    description: fmt(
      'A modern slim-fit two-piece suit engineered for all-day performance — sharp charcoal tone, clean lines, and a silhouette that moves with you from boardroom to evening reception.',
      [
        'Slim-fit jacket with two-button single-breasted closure and notch lapels.',
        'Performance suiting fabric with breathable comfort for Nairobi climate.',
        'Matching flat-front trousers with sharp front crease.',
        'Flap hip pockets and welt breast pocket on the jacket.',
        'Versatile charcoal pairs with white, blue, and burgundy shirts.',
      ]
    ),
  },
  'Custom_White_Two-Piece_Suit___Formal_Wedding_Outfit_groom_outfit': {
    name: 'IVORY WEDDING GROOM TWO-PIECE SUIT',
    color: 'Ivory',
    style: 'single-breasted',
    pattern: 'solid',
    price: 32000,
    featured: true,
    description: fmt(
      'An immaculate ivory two-piece wedding suit cut for grooms who want luminous elegance — crisp tailoring, celebration-ready presence, and timeless formal polish.',
      [
        'Single-breasted jacket with refined notch lapels.',
        'Premium ivory suiting with a subtle lustrous finish.',
        'Matching tailored trousers with clean flat-front construction.',
        'Ideal for weddings, church ceremonies, and white-tie-adjacent events.',
        'Pairs beautifully with Prince Esquire dress shirts and silk ties.',
      ]
    ),
  },
  'Custom_Navy_Double-Breasted_Suit__Slim_Fit_Two-Piece_Tuxedo_groom_outfit': {
    name: 'MIDNIGHT NAVY DOUBLE-BREASTED TUXEDO TWO-PIECE',
    color: 'Navy',
    style: 'double-breasted',
    pattern: 'solid',
    price: 38500,
    featured: true,
    description: fmt(
      'Command the aisle in this midnight navy double-breasted tuxedo two-piece — peak lapels, slim tailoring, and groom-worthy authority in every seam.',
      [
        'Double-breasted six-button jacket with sharp peak lapels.',
        'Deep navy base with satin-level formal presence.',
        'Slim-fit matching trousers for a cohesive silhouette.',
        'Welt breast pocket and structured shoulders.',
        'Wedding, prom, and black-tie ready.',
      ]
    ),
  },
  'Formal_Men_s_Suits_2_Piece_Slim_Fit_Performance_Suit_-_Brown___M': {
    name: 'COGNAC BROWN SLIM-FIT PERFORMANCE TWO-PIECE SUIT',
    color: 'Brown',
    style: 'single-breasted',
    pattern: 'solid',
    price: 24800,
    description: fmt(
      'Rich cognac brown in a slim-fit two-piece cut — warm, confident, and distinctly Prince Esquire for autumn weddings and smart executive dressing.',
      [
        'Two-button single-breasted jacket with notch lapels.',
        'Warm brown suiting with smooth premium hand-feel.',
        'Matching slim trousers with pressed center crease.',
        'Earth-tone alternative to navy and charcoal.',
        'Performance fabric for comfort through long events.',
      ]
    ),
  },
  'Formal_Men_s_Suits_2_Piece_Slim_Fit_Performance_Suit_-_Royal_Blue___XXS': {
    name: 'ROYAL BLUE SLIM-FIT PERFORMANCE TWO-PIECE SUIT',
    color: 'Blue',
    style: 'single-breasted',
    pattern: 'solid',
    price: 25200,
    description: fmt(
      'Royal blue slim-fit two-piece suit with commanding colour and clean modern tailoring — a celebration staple that photographs beautifully.',
      [
        'Single-breasted two-button jacket with notch lapels.',
        'Vivid royal blue suiting with refined drape.',
        'Coordinated slim-fit trousers.',
        'Statement colour for weddings and formal galas.',
        'Breathable performance blend for all-day wear.',
      ]
    ),
  },
  Jungle_Green_Pinstripe_Spring_Summer_Wedding_Men_s_Suit_: {
    name: 'JUNGLE GREEN PINSTRIPE WEDDING TWO-PIECE SUIT',
    color: 'Green',
    style: 'single-breasted',
    pattern: 'pinstripe',
    price: 29800,
    description: fmt(
      'Spring-summer wedding style in jungle green pinstripe — a fresh botanical tone with vertical stripe refinement for outdoor ceremonies and garden receptions.',
      [
        'Fine pinstripe on a rich jungle-green base.',
        'Single-breasted jacket with classic notch lapels.',
        'Lightweight suiting suited to warm-season events.',
        'Matching pinstripe trousers with slim taper.',
        'Distinctive alternative to conventional navy wedding suiting.',
      ]
    ),
  },
  Traje_ajustado_de_2_piezas_con_botonadura_simple_y_dise_o_de_2_botones_para_hombre__color_azul: {
    name: 'STEEL BLUE TWO-BUTTON SLIM TWO-PIECE SUIT',
    color: 'Blue',
    style: 'single-breasted',
    pattern: 'solid',
    price: 23500,
    description: fmt(
      'A precision-cut steel-blue two-piece with simple two-button closure — European slim tailoring in a versatile everyday formal palette.',
      [
        'Two-button single-breasted jacket with notch lapels.',
        'Steel-blue suiting with smooth structured drape.',
        'Slim adjusted fit through jacket and trouser.',
        'Flap pockets and clean breast pocket line.',
        'Office, interview, and dinner-date ready.',
      ]
    ),
  },
  'Ivory_Blazer_with_brown_pant_Suit__Custom_2-Piece_Wedding_Groom_Suit': {
    name: 'IVORY BLAZER & COGNAC TROUSER WEDDING TWO-PIECE',
    color: 'Ivory Brown',
    style: 'single-breasted',
    pattern: 'solid',
    price: 33500,
    featured: true,
    description: fmt(
      'A bespoke-inspired wedding two-piece pairing an ivory blazer with rich cognac trousers — tonal contrast with groom-level sophistication.',
      [
        'Ivory single-breasted jacket with notch lapels.',
        'Contrasting cognac-brown matching trousers.',
        'Custom wedding-groom styling with premium lining.',
        'Welt pockets and structured formal shoulders.',
        'Ideal for outdoor and vineyard wedding settings.',
      ]
    ),
  },
  'Men_s_Grey_Double_Breasted_Slim_Fit_Suit_-_Formal_Wedding_Tuxedo_Set': {
    name: 'GRAPHITE GREY DOUBLE-BREASTED WEDDING TWO-PIECE',
    color: 'Grey',
    style: 'double-breasted',
    pattern: 'solid',
    price: 36000,
    description: fmt(
      'Graphite grey double-breasted wedding two-piece with slim-fit precision — formal tuxedo presence in a modern neutral tone.',
      [
        'Double-breasted jacket with peak lapels.',
        'Slim-fit graphite suiting with subtle sheen.',
        'Matching trousers with tapered leg.',
        'Tuxedo-set construction for weddings and proms.',
        'Pairs with white and black formal shirts.',
      ]
    ),
  },
  'Men_s_Double-Breasted_Black_Suit___2-Piece_Wedding__Prom___Business_Tuxedo_Set_-_same_as_picture-08___XXXL': {
    name: 'JET BLACK DOUBLE-BREASTED TUXEDO TWO-PIECE',
    color: 'Black',
    style: 'double-breasted',
    pattern: 'solid',
    price: 39000,
    featured: true,
    description: fmt(
      'Jet black double-breasted tuxedo two-piece — the definitive formal ensemble for weddings, prom nights, and high-stakes business occasions.',
      [
        'Six-button double-breasted front with peak lapels.',
        'Deep black suiting with formal satin-level finish.',
        'Matching flat-front trousers with sharp crease.',
        'Welt breast pocket for pocket square styling.',
        'Timeless black-tie versatility.',
      ]
    ),
  },
  Menseventwear_Formal_Men_s_2_Pieces_Solid_Slim_Fit_Peak_Lapel_Mens_Suit__Blazer_Pants_: {
    name: 'MIDNIGHT SOLID PEAK-LAPEL SLIM TWO-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    price: 27500,
    description: fmt(
      'Midnight solid two-piece with bold peak lapels and slim-fit tailoring — event-wear confidence for galas, award nights, and formal receptions.',
      [
        'Single-breasted jacket with commanding peak lapels.',
        'Solid midnight suiting with structured shoulders.',
        'Slim-fit blazer and coordinated trousers.',
        'Flap hip pockets and breast pocket.',
        'Formal eventwear staple from Prince Esquire.',
      ]
    ),
  },
  blue_single_breasted_blazer_for_men_business_style_party_wear_2036: {
    name: 'COBALT BLUE SINGLE-BREASTED BUSINESS TWO-PIECE',
    color: 'Blue',
    style: 'single-breasted',
    pattern: 'solid',
    price: 22800,
    description: fmt(
      'Cobalt blue single-breasted business two-piece — party-ready polish with office-appropriate structure in a vivid professional hue.',
      [
        'Single-breasted two-button jacket with notch lapels.',
        'Cobalt blue suiting with smooth matte finish.',
        'Matching business trousers with belt loops.',
        'Versatile for corporate events and evening parties.',
        'Modern slim silhouette.',
      ]
    ),
  },
  Black_Double_Breasted_Tuxedo___Gentleman_s_Guru: {
    name: 'GENTLEMAN\'S GURU BLACK DOUBLE-BREASTED TUXEDO',
    color: 'Black',
    style: 'double-breasted',
    pattern: 'solid',
    price: 39500,
    description: fmt(
      'The Gentleman\'s Guru black double-breasted tuxedo two-piece — peak-lapel authority and immaculate tailoring for the most formal occasions.',
      [
        'Double-breasted jacket with wide peak lapels.',
        'Premium black tuxedo suiting.',
        'Matching formal trousers.',
        'Satin-trim compatible formal construction.',
        'Wedding and black-tie essential.',
      ]
    ),
  },
  Men_s_suits___fashion: {
    name: 'CONTEMPORARY FASHION FORWARD TWO-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    price: 24000,
    description: fmt(
      'A contemporary fashion-forward two-piece suit with modern proportions and runway-inspired tailoring — for the style-conscious gentleman.',
      [
        'Single-breasted jacket with refined notch lapels.',
        'Modern slim-fit cut through body and leg.',
        'Premium suiting fabric with clean drape.',
        'Flap pockets and structured silhouette.',
        'Ideal for fashion events and smart-formal dressing.',
      ]
    ),
  },
  breasted_suit_men___: {
    name: 'CLASSIC DOUBLE-BREASTED FORMAL TWO-PIECE SUIT',
    color: 'Navy',
    style: 'double-breasted',
    pattern: 'solid',
    price: 31000,
    description: fmt(
      'Classic double-breasted formal two-piece in deep navy — traditional six-button styling with contemporary slim-fit refinement.',
      [
        'Double-breasted six-button jacket.',
        'Peak or notch lapels with structured shoulders.',
        'Deep navy suiting with premium weave.',
        'Matching tailored trousers.',
        'Boardroom and wedding versatility.',
      ]
    ),
  },
  Vinci___Exclusive_Menswear_Collection_Redefining_Contemporary_Elegance: {
    name: 'VINCI EXCLUSIVE CONTEMPORARY ELEGANCE TWO-PIECE',
    color: 'Charcoal',
    style: 'single-breasted',
    pattern: 'solid',
    price: 35000,
    featured: true,
    description: fmt(
      'Vinci Exclusive menswear two-piece — contemporary elegance with Italian-inspired tailoring and a refined charcoal palette.',
      [
        'Single-breasted jacket with precision notch lapels.',
        'Exclusive collection suiting with luxury hand-feel.',
        'Slim contemporary silhouette.',
        'Matching flat-front trousers.',
        'Redefining modern formalwear for Prince Esquire clients.',
      ]
    ),
  },
  Best_Italian_suit_for_men_s___: {
    name: 'ITALIAN CRAFTSMANSHIP LUXURY TWO-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    price: 42000,
    featured: true,
    description: fmt(
      'Italian craftsmanship luxury two-piece suit — canvassed construction, premium wool hand-feel, and sartorial excellence in every detail.',
      [
        'Italian-inspired single-breasted tailoring.',
        'Premium wool-blend suiting with natural drape.',
        'Half-canvas style structure through chest.',
        'Matching trousers with tapered leg.',
        'The pinnacle of Prince Esquire formal dressing.',
      ]
    ),
  },
  Classic_men_s_suits_outfit_for_any_event: {
    name: 'CLASSIC ALL-OCCASION NAVY TWO-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    price: 22000,
    description: fmt(
      'The classic all-occasion navy two-piece — reliable, refined, and ready for weddings, interviews, church, and formal dinners alike.',
      [
        'Two-button single-breasted jacket with notch lapels.',
        'Timeless navy suiting.',
        'Matching trousers with front crease.',
        'Welt breast pocket and flap hip pockets.',
        'Wardrobe foundation piece.',
      ]
    ),
  },
  '1094304409441296839': {
    name: 'BURGUNDY PINSTRIPE DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Burgundy',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 34000,
    description: fmt(
      'Burgundy pinstripe double-breasted two-piece — bold colour with elongating vertical stripes and peak-lapel formality.',
      [
        'Double-breasted six-button jacket with peak lapels.',
        'Burgundy base with fine contrasting pinstripes.',
        'Matching pinstripe trousers.',
        'Statement suiting for galas and celebrations.',
        'Slimming stripe pattern.',
      ]
    ),
  },
  '1109504058217038235': {
    name: 'WINE RED DOUBLE-BREASTED PEAK-LAPEL TWO-PIECE',
    color: 'Burgundy',
    style: 'double-breasted',
    pattern: 'solid',
    price: 33000,
    description: fmt(
      'Wine red double-breasted two-piece with peak lapels — rich celebratory colour and commanding formal presence.',
      [
        'Double-breasted jacket with peak lapels.',
        'Deep wine-red suiting with smooth finish.',
        'Matching tailored trousers.',
        'Ideal for weddings and festive formal events.',
        'Structured shoulders and slim taper.',
      ]
    ),
  },
  '946952259163293468': {
    name: 'SAGE GREEN DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Green',
    style: 'double-breasted',
    pattern: 'solid',
    price: 31500,
    description: fmt(
      'Sage green double-breasted two-piece — muted botanical elegance with adjustable-waistband trousers for all-day comfort.',
      [
        'Double-breasted jacket in soft sage green.',
        'Peak lapels with structured tailoring.',
        'Matching trousers with adjustable waistband.',
        'Spring and summer formal alternative.',
        'Slim-fit regular proportions.',
      ]
    ),
  },
  '232146555788501377': {
    name: 'DEEP BURGUNDY DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Burgundy',
    style: 'double-breasted',
    pattern: 'solid',
    price: 32500,
    description: fmt(
      'Deep burgundy double-breasted two-piece with rich jewel-tone suiting — formal flair for evening events and winter weddings.',
      [
        'Six-button double-breasted closure.',
        'Deep burgundy premium suiting.',
        'Peak lapels and flap pockets.',
        'Matching slim trousers.',
        'Pairs with black and white formal shirts.',
      ]
    ),
  },
  '1017461740831971376': {
    name: 'RED PINSTRIPE DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Red',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 35500,
    featured: true,
    description: fmt(
      'Vibrant red pinstripe double-breasted two-piece — a fearless formal statement with elongating white stripes and peak-lapel authority.',
      [
        'Bold red suiting with contrasting pinstripes.',
        'Double-breasted six-button jacket.',
        'Wide peak lapels for dramatic silhouette.',
        'Matching pinstripe trousers.',
        'Show-stopping gala and celebration wear.',
      ]
    ),
  },
  Formal_Men_s_Double_Breasted_Black_Suit: {
    name: 'FORMAL BLACK DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Black',
    style: 'double-breasted',
    pattern: 'solid',
    price: 37000,
    description: fmt(
      'Formal black double-breasted two-piece — executive authority and timeless evening elegance in premium black suiting.',
      [
        'Double-breasted jacket with peak lapels.',
        'Jet black formal suiting.',
        'Matching trousers with sharp crease.',
        'Welt breast pocket.',
        'Business, wedding, and gala ready.',
      ]
    ),
  },
  '813251645250690441': {
    name: 'BEIGE HOUNDSTOOTH DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Beige',
    style: 'double-breasted',
    pattern: 'houndstooth',
    price: 36500,
    featured: true,
    description: fmt(
      'Beige and white houndstooth double-breasted two-piece with brown coordinating trousers — heritage pattern meets modern peak-lapel tailoring.',
      [
        'Classic houndstooth check on beige-white base.',
        'Double-breasted jacket with gold-tone buttons.',
        'Wide peak lapels and structured fit.',
        'Coordinated brown trousers for tonal contrast.',
        'Wedding and high-fashion formal occasions.',
      ]
    ),
  },
  Blazer_Jacket: {
    name: 'TAN DOUBLE-BREASTED PEAK-LAPEL TWO-PIECE SUIT',
    color: 'Tan',
    style: 'double-breasted',
    pattern: 'solid',
    price: 30000,
    description: fmt(
      'Tan double-breasted peak-lapel two-piece — warm neutral suiting with contrasting dark buttons and slim tailored lines.',
      [
        'Light tan suiting with subtle woven texture.',
        'Double-breasted six-button front.',
        'Wide peak lapels and dark contrast buttons.',
        'Matching tailored trousers.',
        'Versatile warm-tone formal alternative.',
      ]
    ),
  },
  '443815738298794728': {
    name: 'NAVY PINSTRIPE DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Navy',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 34500,
    description: fmt(
      'Navy pinstripe double-breasted two-piece — the power suit redefined with peak lapels and crisp vertical striping.',
      [
        'Deep navy with fine white pinstripes.',
        'Double-breasted six-button jacket.',
        'Peak lapels and flap pockets.',
        'Matching pinstripe trousers.',
        'Boardroom and formal event staple.',
      ]
    ),
  },
  Royal_Look___: {
    name: 'FOREST GREEN SINGLE-BREASTED TWO-PIECE SUIT',
    color: 'Green',
    style: 'single-breasted',
    pattern: 'solid',
    price: 26800,
    description: fmt(
      'Forest green single-breasted two-piece — royal formal dressing in a rich emerald tone with cream-shirt versatility.',
      [
        'Two-button single-breasted jacket with notch lapels.',
        'Deep forest green premium suiting.',
        'Matching trousers with front crease.',
        'Welt breast pocket for pocket squares.',
        'Distinctive alternative to navy and black.',
      ]
    ),
  },
  Polished_Gentleman_Outfit: {
    name: 'POLISHED GENTLEMAN NAVY TWO-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    price: 25500,
    description: fmt(
      'The Polished Gentleman navy two-piece — impeccably coordinated formal outfit with refined tailoring and everyday executive appeal.',
      [
        'Single-breasted two-button jacket.',
        'Classic navy suiting with smooth drape.',
        'Matching flat-front trousers.',
        'Notch lapels and structured shoulders.',
        'Complete gentleman\'s formal foundation.',
      ]
    ),
  },
  'Peak_lapels_double-breasted_stripe_suit': {
    name: 'BOLD STRIPE PEAK-LAPEL DOUBLE-BREASTED TWO-PIECE',
    color: 'Blue',
    style: 'double-breasted',
    pattern: 'stripe',
    price: 37500,
    featured: true,
    description: fmt(
      'Bold wide-stripe double-breasted two-piece in light blue and cream — dramatic peak lapels and fashion-forward formal impact.',
      [
        'Wide vertical cream stripes on light blue base.',
        'Double-breasted jacket with pick-stitched peak lapels.',
        'Six-button front with gold-tone hardware option.',
        'Matching bold-stripe trousers.',
        'Statement suiting for red-carpet and gala events.',
      ]
    ),
  },
  'Sage_Slim_Fit_Double_Breasted_2_Piece_Suit_with_Adjustable_Waistband_36_Regular_-_30_Waist___Sage': {
    name: 'SAGE SLIM DOUBLE-BREASTED ADJUSTABLE TWO-PIECE',
    color: 'Green',
    style: 'double-breasted',
    pattern: 'solid',
    price: 31800,
    description: fmt(
      'Sage slim-fit double-breasted two-piece with adjustable waistband trousers — soft green formalwear with modern comfort engineering.',
      [
        'Slim-fit double-breasted sage jacket.',
        'Peak lapels and six-button front.',
        'Adjustable waistband on matching trousers.',
        'Soft sage green suiting.',
        'All-day event comfort.',
      ]
    ),
  },
  '791929915733303502': {
    name: 'OLIVE GREEN DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Green',
    style: 'double-breasted',
    pattern: 'solid',
    price: 30500,
    description: fmt(
      'Olive green double-breasted two-piece — military-inspired elegance with peak lapels and rich forest-toned suiting.',
      [
        'Double-breasted six-button olive jacket.',
        'Wide peak lapels with structured shoulders.',
        'Matching olive trousers with slim taper.',
        'Premium wool-blend hand-feel.',
        'Formal events and creative black-tie alternatives.',
      ]
    ),
  },
  Essential_Casual_suit_looks_for_men_for_modern_men: {
    name: 'MODERN ESSENTIAL CASUAL TWO-PIECE SUIT',
    color: 'Grey',
    style: 'single-breasted',
    pattern: 'solid',
    price: 21500,
    description: fmt(
      'Modern essential casual two-piece — relaxed formal structure for smart-casual offices, brunch meetings, and contemporary events.',
      [
        'Single-breasted jacket with soft shoulder.',
        'Neutral grey casual suiting.',
        'Unstructured modern fit.',
        'Matching trousers with comfortable taper.',
        'Smart-casual suiting for modern professionals.',
      ]
    ),
  },
  '436849232629363597': {
    name: 'LIGHT BLUE WIDE-STRIPE DOUBLE-BREASTED TWO-PIECE',
    color: 'Blue',
    style: 'double-breasted',
    pattern: 'stripe',
    price: 36800,
    description: fmt(
      'Light blue wide-stripe double-breasted two-piece — textured herringbone base with cream stripes and commanding peak-lapel presence.',
      [
        'Wide cream stripes on light blue textured base.',
        'Double-breasted six-button jacket.',
        'Peak lapels with decorative pick-stitching.',
        'Matching striped trousers.',
        'Fashion-forward formal statement.',
      ]
    ),
  },
  Tak_m_Elbise: {
    name: 'ROSSALS FOREST GREEN MILITARY TWO-PIECE SUIT',
    color: 'Green',
    style: 'double-breasted',
    pattern: 'solid',
    price: 38000,
    featured: true,
    description: fmt(
      'Rossals forest green military-inspired two-piece — distinctive horizontal piped bands across the front with peak lapels and slim tailoring.',
      [
        'Unique military-style horizontal piped button bands.',
        'Deep forest green premium suiting.',
        'Wide peak lapels and slim fit.',
        'Four-button cuff detailing.',
        'Statement formalwear for galas and premier events.',
      ]
    ),
  },
  '792774340695873461': {
    name: 'PEACH DOUBLE-BREASTED WEDDING TWO-PIECE SUIT',
    color: 'Peach',
    style: 'double-breasted',
    pattern: 'solid',
    price: 32800,
    description: fmt(
      'Peach double-breasted wedding two-piece — warm apricot tone with peak lapels and premium patterned interior lining.',
      [
        'Soft peach suiting with subtle sheen.',
        'Double-breasted six-button jacket with peak lapels.',
        'Premium patterned interior lining.',
        'Matching peach trousers with center crease.',
        'Summer wedding and garden ceremony favourite.',
      ]
    ),
  },
  '286893438754773832': {
    name: 'NAVY PLAID DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Navy',
    style: 'double-breasted',
    pattern: 'plaid',
    price: 35000,
    description: fmt(
      'Navy plaid double-breasted two-piece — large-scale check in navy, white, and red with peak-lapel formality and bold personality.',
      [
        'Bold large-scale plaid pattern.',
        'Double-breasted jacket with notch lapels.',
        'Navy, white, and red colour intersection.',
        'Matching plaid trousers.',
        'Statement wedding and event suiting.',
      ]
    ),
  },
  Formal_Affair__Men_s_Elegant_Suit_Picks_: {
    name: 'FORMAL AFFAIR ELEGANT NAVY TWO-PIECE SUIT',
    color: 'Navy',
    style: 'single-breasted',
    pattern: 'solid',
    price: 26200,
    description: fmt(
      'Formal Affair elegant navy two-piece — curated evening sophistication with refined tailoring and celebration-ready polish.',
      [
        'Single-breasted two-button jacket.',
        'Elegant navy suiting with premium finish.',
        'Notch lapels and structured fit.',
        'Matching formal trousers.',
        'Gala and wedding guest essential.',
      ]
    ),
  },
  'John___Men_s_Two-Piece_Suit__Classic_Blazer_and_Pants_Set_-_Red___XS': {
    name: 'VIBRANT RED SLIM TWO-PIECE SUIT',
    color: 'Red',
    style: 'single-breasted',
    pattern: 'solid',
    price: 28500,
    featured: true,
    description: fmt(
      'Vibrant red slim two-piece suit — bold scarlet suiting with white-trimmed chest pocket detail for unforgettable formal moments.',
      [
        'Single-breasted one-button slim jacket.',
        'Bold scarlet red suiting.',
        'Notch lapels with white-trimmed welt pocket.',
        'Matching slim straight-leg trousers.',
        'Wedding, prom, and red-carpet ready.',
      ]
    ),
  },
  'Slim_Fit_Men_s_Suit_2_Piece_2_Button_in_Hunter_Green_42_Regular_-_36_Waist___Hunter_Green': {
    name: 'HUNTER GREEN TWO-BUTTON SLIM TWO-PIECE SUIT',
    color: 'Green',
    style: 'single-breasted',
    pattern: 'solid',
    price: 27000,
    description: fmt(
      'Hunter green two-button slim two-piece — deep woodland tone with crisp tailoring for distinguished formal dressing.',
      [
        'Two-button single-breasted hunter green jacket.',
        'Notch lapels and slim-fit cut.',
        'Matching hunter green trousers.',
        'Flap pockets and breast pocket.',
        'Autumn and winter formal events.',
      ]
    ),
  },
  'Rockefeller_Collection_-_Double_Breasted_Stripe_Suit_Blue_Regular_Fit_2_Piece_with_Adjustable_Waistband_Pants': {
    name: 'ROCKEFELLER BLUE STRIPE DOUBLE-BREASTED TWO-PIECE',
    color: 'Blue',
    style: 'double-breasted',
    pattern: 'stripe',
    price: 35800,
    description: fmt(
      'Rockefeller Collection blue stripe double-breasted two-piece — regular fit with adjustable waistband trousers and heritage stripe pattern.',
      [
        'Rockefeller Collection premium stripe suiting.',
        'Double-breasted six-button jacket.',
        'Blue base with contrasting vertical stripes.',
        'Adjustable waistband trousers.',
        'Regular fit for comfortable formal wear.',
      ]
    ),
  },
  'Rockefeller_Collection_-_Double_Breasted_Stripe_Suit_Camel_Regular_Fit_2_Piece': {
    name: 'ROCKEFELLER CAMEL PINSTRIPE DOUBLE-BREASTED TWO-PIECE',
    color: 'Camel',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 35200,
    description: fmt(
      'Rockefeller Collection camel pinstripe double-breasted two-piece — warm tan suiting with fine vertical stripes and peak-lapel elegance.',
      [
        'Camel tan suiting with fine pinstripes.',
        'Double-breasted four-button closure.',
        'Peak lapels and flap pockets.',
        'Matching pinstripe trousers.',
        'Rockefeller Collection regular fit.',
      ]
    ),
  },
  Royalty___: {
    name: 'PURPLE PINSTRIPE DOUBLE-BREASTED TWO-PIECE SUIT',
    color: 'Purple',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 36500,
    featured: true,
    description: fmt(
      'Royal purple pinstripe double-breasted two-piece — regal colour with elongating white stripes and peak-lapel authority.',
      [
        'Deep purple suiting with white pinstripes.',
        'Double-breasted six-button jacket.',
        'Peak lapels and structured shoulders.',
        'Matching pinstripe trousers.',
        'Royal statement formalwear.',
      ]
    ),
  },
  Party_Me_Suits___PARIHIL_COLLECTION: {
    name: 'TEAL PINSTRIPE DOUBLE-BREASTED PARIHIL TWO-PIECE',
    color: 'Teal',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 37200,
    description: fmt(
      'Parihil Collection teal pinstripe double-breasted two-piece — deep blue-green suiting with silver buttons and celebration-ready flair.',
      [
        'Deep teal suiting with grey-white pinstripes.',
        'Double-breasted six-button jacket with peak lapels.',
        'Silver-tone button hardware.',
        'Matching pinstripe trousers.',
        'Party Me Suits / Parihil Collection exclusive styling.',
      ]
    ),
  },
  'Rockefeller_Collection_-_Double_Breasted_Stripe_Suit_Purple_Regular_Fit_2_Piece_with_Adjustable_Waistband_Pants': {
    name: 'ROCKEFELLER PURPLE STRIPE DOUBLE-BREASTED TWO-PIECE',
    color: 'Purple',
    style: 'double-breasted',
    pattern: 'stripe',
    price: 36000,
    description: fmt(
      'Rockefeller Collection purple stripe double-breasted two-piece — bold violet suiting with adjustable waistband comfort.',
      [
        'Purple base with contrasting vertical stripes.',
        'Double-breasted Rockefeller Collection cut.',
        'Regular fit with adjustable waistband trousers.',
        'Peak lapels and flap pockets.',
        'Statement celebration suiting.',
      ]
    ),
  },
  '736479345343771559': {
    name: 'LIGHT BLUE PINSTRIPE GOLD-BUTTON TWO-PIECE SUIT',
    color: 'Blue',
    style: 'double-breasted',
    pattern: 'pinstripe',
    price: 34200,
    description: fmt(
      'Light blue pinstripe double-breasted two-piece with gold-tone buttons — powder blue elegance with burgundy stripe accent.',
      [
        'Powder blue suiting with burgundy pinstripes.',
        'Double-breasted six-button front.',
        'Polished gold-tone button hardware.',
        'Wide peak lapels.',
        'Matching pinstripe trousers with ticket pocket.',
      ]
    ),
  },
};

const out = path.join(__dirname, '..', 'data', 'suit-product-specs.json');
fs.writeFileSync(out, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} suit specs to ${out}`);
