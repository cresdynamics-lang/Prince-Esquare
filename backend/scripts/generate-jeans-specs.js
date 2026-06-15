/**
 * Generates backend/data/jeans-specs.json
 * Run: node scripts/generate-jeans-specs.js
 */
const fs = require('fs');
const path = require('path');

const fmt = (intro, features) =>
  `${intro}\n\nKey features:\n${features.map((f) => `• ${f}`).join('\n')}\n\nAvailable waist sizes 30–40. Styled at Prince Esquire for weekend, casual, and smart-casual wear.`;

const SPECS = {
  '878272364854410925': {
    name: 'FRAME MEDIUM-WASH STRAIGHT DENIM JEANS',
    color: 'Blue',
    style: 'straight',
    fit: 'regular',
    price: 5800,
    featured: true,
    description: fmt(
      'FRAME-inspired medium-wash straight denim jeans — classic five-pocket styling with natural thigh fading.',
      [
        'Medium blue denim with subtle whiskering.',
        'Straight-leg silhouette for everyday versatility.',
        'Five-pocket construction with belt loops.',
        'Button and zip fly closure.',
        'Premium cotton denim hand-feel.',
      ]
    ),
  },
  '283234264060471160': {
    name: 'BLACK STRAIGHT-FIT DENIM JEANS',
    color: 'Black',
    style: 'straight',
    fit: 'regular',
    price: 5600,
    description: fmt(
      'Solid black straight-fit denim jeans — clean five-pocket cut for sharp casual dressing.',
      [
        'Deep black denim with minimal fading.',
        'Straight-leg regular fit.',
        'Rivet-reinforced front pockets.',
        'Classic belt-loop waistband.',
        'Pairs with polos, shirts, and sneakers.',
      ]
    ),
  },
  'Men_s_BeanFlex__Jeans__Classic_Fit__Denim_Cotton_Blend': {
    name: 'CLASSIC FIT BEANFLEX DENIM JEANS',
    color: 'Blue',
    style: 'classic',
    fit: 'classic',
    price: 5200,
    description: fmt(
      'Classic-fit BeanFlex denim jeans in cotton blend — comfortable everyday denim with timeless straight leg.',
      [
        'Medium blue wash cotton-blend denim.',
        'Classic relaxed fit through hip and thigh.',
        'Flexible comfort stretch.',
        'Five-pocket heritage styling.',
        'Durable weekend-ready construction.',
      ]
    ),
  },
  '7_For_All_Mankind_Austyn_Relaxed_Straight_Leg_Jeans_in_Fishers_at_Nordstrom_Rack__Size_32': {
    name: 'RELAXED STRAIGHT-LEG AUSTYN DENIM JEANS',
    color: 'Blue',
    style: 'straight',
    fit: 'relaxed',
    price: 6400,
    featured: true,
    description: fmt(
      'Relaxed straight-leg Austyn denim jeans — easy straight cut with lived-in medium wash.',
      [
        'Medium indigo wash with natural fading.',
        'Relaxed straight-leg profile.',
        'Premium five-pocket denim build.',
        'Comfortable mid-rise waist.',
        'Elevated casual denim separate.',
      ]
    ),
  },
  KOTTY_Mens_Regular_Fit_Mide_Rise_Strachable_Jeans: {
    name: 'MID-RISE STRETCH REGULAR-FIT JEANS',
    color: 'Blue',
    style: 'regular',
    fit: 'regular',
    price: 4800,
    description: fmt(
      'Mid-rise stretch regular-fit jeans — flexible denim for all-day movement and casual polish.',
      [
        'Stretch denim for ease of movement.',
        'Mid-rise waist with regular straight leg.',
        'Classic five-pocket design.',
        'Medium blue everyday wash.',
        'Smart-casual denim staple.',
      ]
    ),
  },
  'MAC_Jeans_Men_s_Straight': {
    name: 'MAC STRAIGHT-LEG DARK DENIM JEANS',
    color: 'Indigo',
    style: 'straight',
    fit: 'straight',
    price: 5900,
    description: fmt(
      'MAC straight-leg dark denim jeans — deep indigo wash with clean European tailoring lines.',
      [
        'Dark indigo denim wash.',
        'Straight-leg MAC-inspired cut.',
        'Five-pocket styling with rivets.',
        'Zip fly and button closure.',
        'Refined casual denim option.',
      ]
    ),
  },
  'Men_s_BeanFlex__Jeans__Standard_Fit_Slim_Straight__Denim_Cotton_Blend': {
    name: 'SLIM STRAIGHT BEANFLEX DENIM JEANS',
    color: 'Blue',
    style: 'slim-straight',
    fit: 'slim',
    price: 5400,
    description: fmt(
      'Slim straight BeanFlex denim jeans — cotton blend with a modern tapered leg profile.',
      [
        'Medium blue cotton-blend denim.',
        'Slim straight leg from knee to hem.',
        'Comfort stretch waist and thigh.',
        'Classic five-pocket details.',
        'Modern casual office-to-weekend denim.',
      ]
    ),
  },
  'Men_s_BeanFlex__Jeans__Standard_Fit__Denim_Cotton_Blend': {
    name: 'STANDARD FIT BEANFLEX DENIM JEANS',
    color: 'Blue',
    style: 'regular',
    fit: 'regular',
    price: 5100,
    description: fmt(
      'Standard-fit BeanFlex denim jeans — easy regular cut in versatile medium blue wash.',
      [
        'Standard regular fit silhouette.',
        'Medium wash cotton-blend denim.',
        'Flexible comfort through the day.',
        'Traditional five-pocket build.',
        'Everyday Prince Esquire denim.',
      ]
    ),
  },
  'Men_s_Denim': {
    name: 'CLASSIC MEDIUM-WASH DENIM JEANS',
    color: 'Blue',
    style: 'classic',
    fit: 'regular',
    price: 5000,
    description: fmt(
      'Classic medium-wash denim jeans — straightforward five-pocket style for daily wear.',
      [
        'Classic medium blue denim.',
        'Regular straight-leg fit.',
        'Contrast stitching detail.',
        'Button-zip front closure.',
        'Essential wardrobe denim.',
      ]
    ),
  },
  'Men_s_Double_L__Jeans__Classic_Fit__Cotton__1_': {
    name: 'CLASSIC FIT DOUBLE L COTTON JEANS',
    color: 'Blue',
    style: 'classic',
    fit: 'classic',
    price: 5300,
    description: fmt(
      'Classic-fit Double L cotton jeans — heritage denim styling with comfortable regular cut.',
      [
        '100% cotton denim construction.',
        'Classic fit with straight leg.',
        'Medium wash with natural fading.',
        'Leather-look back patch detail.',
        'Durable heritage-inspired jeans.',
      ]
    ),
  },
  'Men_s_Double_L__Jeans__Classic_Fit__Cotton': {
    name: 'DOUBLE L CLASSIC COTTON DENIM JEANS',
    color: 'Blue',
    style: 'classic',
    fit: 'classic',
    price: 5300,
    description: fmt(
      'Double L classic cotton denim jeans — timeless straight fit in medium indigo wash.',
      [
        'Pure cotton denim fabric.',
        'Classic straight-leg fit.',
        'Five-pocket ranch-inspired styling.',
        'Medium blue wash finish.',
        'Reliable casual denim separate.',
      ]
    ),
  },
  'Men_s_Business_Casual_Lyocell_Jeans_Summer_Thin_High_Waist_-_Light_Blue_11___34': {
    name: 'LIGHT BLUE LYOCELL SUMMER JEANS',
    color: 'Light Blue',
    style: 'lightweight',
    fit: 'slim',
    price: 5500,
    featured: true,
    description: fmt(
      'Light blue lyocell summer jeans — breathable high-waist denim for warm Nairobi days.',
      [
        'Lightweight lyocell denim blend.',
        'High-waist slim summer cut.',
        'Soft light-blue wash.',
        'Breathable business-casual styling.',
        'Ideal for warm-weather smart casual.',
      ]
    ),
  },
  'Men_s_Double_LA_Jeans': {
    name: 'DOUBLE LA CLASSIC DENIM JEANS',
    color: 'Blue',
    style: 'classic',
    fit: 'regular',
    price: 5200,
    description: fmt(
      'Double LA classic denim jeans — medium wash five-pocket jeans with straight-leg ease.',
      [
        'Medium blue classic wash.',
        'Regular straight-leg fit.',
        'Cotton denim with soft hand.',
        'Traditional belt-loop waist.',
        'Weekend and travel denim.',
      ]
    ),
  },
  Men_s_BeanFlexa: {
    name: 'BEANFLEX COMFORT STRETCH JEANS',
    color: 'Blue',
    style: 'stretch',
    fit: 'regular',
    price: 5100,
    description: fmt(
      'BeanFlex comfort stretch jeans — flexible denim with classic five-pocket styling.',
      [
        'Stretch denim for mobility.',
        'Regular fit straight leg.',
        'Medium blue wash.',
        'Comfort waistband flex.',
        'Easy everyday denim.',
      ]
    ),
  },
  Classic_Light_Blue_Wide_Leg_Jeans_for_Men___Casual_Street_Style_Denim: {
    name: 'LIGHT BLUE WIDE-LEG STREET DENIM JEANS',
    color: 'Light Blue',
    style: 'wide-leg',
    fit: 'relaxed',
    price: 6200,
    description: fmt(
      'Light blue wide-leg street denim jeans — relaxed silhouette for contemporary casual style.',
      [
        'Pale light-blue denim wash.',
        'Wide-leg street-style cut.',
        'Relaxed fit through hip and leg.',
        'Five-pocket denim construction.',
        'Trend-forward casual denim.',
      ]
    ),
  },
  'Men_s_BeanFlex_Jeans': {
    name: 'BEANFLEX REGULAR DENIM JEANS',
    color: 'Blue',
    style: 'regular',
    fit: 'regular',
    price: 5000,
    description: fmt(
      'BeanFlex regular denim jeans — versatile medium-wash jeans for daily Prince Esquire wear.',
      [
        'Medium wash denim.',
        'Regular comfortable fit.',
        'Classic five-pocket design.',
        'Durable cotton blend.',
        'Core casual denim piece.',
      ]
    ),
  },
  Qazel_Vorrlon_Men_s_Blue_Skinny_Jeans_Stretch_Washed_Slim_Fit_Pencil_Pants: {
    name: 'BLUE SKINNY STRETCH DENIM JEANS',
    color: 'Blue',
    style: 'skinny',
    fit: 'skinny',
    price: 4900,
    description: fmt(
      'Blue skinny stretch denim jeans — slim pencil-leg cut with washed finish.',
      [
        'Skinny slim-fit leg.',
        'Stretch washed denim.',
        'Medium blue faded wash.',
        'Modern tapered silhouette.',
        'Sharp casual evening denim.',
      ]
    ),
  },
  'Mens_Next_Classic_Stretch_Jeans_-_Blue': {
    name: 'CLASSIC STRETCH BLUE DENIM JEANS',
    color: 'Blue',
    style: 'stretch',
    fit: 'classic',
    price: 5200,
    description: fmt(
      'Classic stretch blue denim jeans — comfortable flex denim with timeless straight styling.',
      [
        'Classic fit with stretch comfort.',
        'Medium blue denim wash.',
        'Five-pocket jean styling.',
        'Flexible all-day wear.',
        'Smart-casual denim essential.',
      ]
    ),
  },
  'JACK___JONES_Male_Regular_fit_Jeans_JJICLARK_Jjoriginal_AM_416_NOOS_Regular_fit_Jeans': {
    name: 'JACK & JONES REGULAR-FIT DENIM JEANS',
    color: 'Blue',
    style: 'regular',
    fit: 'regular',
    price: 5700,
    description: fmt(
      'Jack & Jones inspired regular-fit denim jeans — medium wash with whiskered thigh detail.',
      [
        'Regular fit straight leg.',
        'Medium blue whiskered wash.',
        'Five-pocket denim build.',
        'Contemporary casual branding style.',
        'Versatile weekend denim.',
      ]
    ),
  },
  'Men_s_Double_L__Jeans__Classic_Fit__Straight_Leg__Cotton': {
    name: 'STRAIGHT LEG DOUBLE L COTTON JEANS',
    color: 'Blue',
    style: 'straight',
    fit: 'classic',
    price: 5400,
    description: fmt(
      'Straight-leg Double L cotton jeans — classic fit heritage denim with thigh fading.',
      [
        'Straight-leg classic cotton denim.',
        'Medium wash with thigh fade.',
        'Five-pocket heritage cut.',
        'Durable everyday construction.',
        'Timeless casual denim.',
      ]
    ),
  },
  'Diesel_Jeans_Straight_Jeans_2001_D-Macro_09H57': {
    name: 'DIESEL STRAIGHT LIGHT-WASH DENIM JEANS',
    color: 'Light Blue',
    style: 'straight',
    fit: 'regular',
    price: 6800,
    featured: true,
    description: fmt(
      'Diesel-inspired straight light-wash denim jeans — premium street denim with signature pocket tag.',
      [
        'Light blue washed denim.',
        'Straight-leg D-Macro silhouette.',
        'Premium five-pocket styling.',
        'Subtle thigh whiskering.',
        'Designer casual denim statement.',
      ]
    ),
  },
  'Reiss_Light_Washed_Grey_Cotton-stretch_Slim-fit_Jeans__34S': {
    name: 'LIGHT GREY SLIM STRETCH DENIM JEANS',
    color: 'Grey',
    style: 'slim',
    fit: 'slim',
    price: 6000,
    description: fmt(
      'Light grey slim stretch denim jeans — cotton-stretch fabric in a refined neutral wash.',
      [
        'Light washed grey denim.',
        'Slim-fit tapered leg.',
        'Cotton-stretch comfort blend.',
        'Minimal five-pocket design.',
        'Smart neutral casual denim.',
      ]
    ),
  },
  'MAC_JEANS_Macflexx_Jean_Droit_Homme': {
    name: 'MAC FLEXX STRAIGHT DARK DENIM JEANS',
    color: 'Black',
    style: 'straight',
    fit: 'slim',
    price: 6100,
    description: fmt(
      'MAC Flexx straight dark denim jeans — near-black slim straight jean for sharp casual looks.',
      [
        'Dark charcoal-black denim.',
        'Slim straight MAC-inspired cut.',
        'Five-pocket classic styling.',
        'Clean minimal wash.',
        'Evening-ready casual denim.',
      ]
    ),
  },
  'MAINE_REGULAR-FIT_JEANS_IN_BLUE_COMFORT-STRETCH_DENIM': {
    name: 'MAINE COMFORT-STRETCH REGULAR JEANS',
    color: 'Blue',
    style: 'stretch',
    fit: 'regular',
    price: 5500,
    description: fmt(
      'Maine comfort-stretch regular jeans — blue denim with easy regular fit and flexible waist.',
      [
        'Comfort-stretch blue denim.',
        'Regular fit straight leg.',
        'Soft medium wash finish.',
        'Flexible movement-friendly fabric.',
        'Reliable daily denim.',
      ]
    ),
  },
};

const OUT = path.join(__dirname, '..', 'data', 'jeans-specs.json');
fs.writeFileSync(OUT, JSON.stringify(SPECS, null, 2));
console.log(`Written ${Object.keys(SPECS).length} jeans specs → ${OUT}`);
