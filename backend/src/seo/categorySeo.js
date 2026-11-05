/**
 * Search-facing copy for every category landing.
 *
 * The brand lines in the taxonomy ("The rooms you walk into…") stay on the page
 * as taglines, but the H1, <title> and meta description must say what the page
 * sells, because that is what people type into Google.
 *
 * Only state facts the business actually stands behind. Prices and counts are
 * injected from the live catalogue by buildCategorySeo, never written by hand.
 */

const { GUIDES } = require('./categoryGuides');

const COPY = {
  suits: {
    h1: "Men's Suits in Nairobi, Kenya",
    title: "Men's Suits in Nairobi, Kenya",
    plural: "men's suits",
    lead: 'Two-piece suits, blazers and tailored separates for weddings, business and formal occasions.',
    intro:
      "Shop men's suits at Prince Esquire, The Man's Shop at Yala Towers, Nairobi. Choose from two-piece suits, blazers and vests for weddings, boardrooms and formal evenings, then finish the look with formal shoes, belts and ties from the same collection.",
  },
  'suit-sets': {
    h1: 'Complete Suit Sets for Men in Kenya',
    title: 'Complete Suit Sets for Men in Kenya',
    plural: 'suit sets',
    lead: 'Complete suit looks, ready for weddings, business and formal days.',
    intro:
      'Complete suit sets for the day that matters. Every look is put together so the jacket and trousers already work, which makes these an easy choice for weddings, interviews and formal events in Nairobi and across Kenya.',
  },
  'two-piece': {
    h1: 'Two-Piece Suits for Men in Kenya',
    title: 'Two-Piece Suits for Men in Kenya',
    plural: 'two-piece suits',
    lead: 'Clean-lined jacket and trouser suits for business and occasions.',
    intro:
      'A two-piece suit is the most versatile tailoring a man can own. Wear it complete for business or a wedding, or split the jacket and trousers for sharper everyday dressing. Browse the current two-piece collection from Prince Esquire in Nairobi.',
  },
  'wedding-suits': {
    h1: 'Wedding Suits for Men in Nairobi, Kenya',
    title: 'Wedding Suits for Men in Nairobi, Kenya',
    plural: 'wedding suits',
    lead: 'Two-piece suits for grooms, groomsmen and wedding guests.',
    intro:
      "Wedding suits at Prince Esquire, Yala Towers, Nairobi. Two-piece suits in navy, royal blue, steel blue and charcoal for grooms, groomsmen and guests. Visit the shop or message us on WhatsApp to plan the whole look, including shirts, belts and shoes.",
  },
  'three-piece': {
    h1: 'Three-Piece Suits for Men in Kenya',
    title: 'Three-Piece Suits for Men in Kenya',
    plural: 'three-piece suits',
    lead: 'Jacket, waistcoat and trousers for grooms and formal occasions.',
    intro:
      'Jacket, waistcoat and trousers for the occasions that ask for more. Three-piece suits suit grooms, groomsmen and formal evenings, and the waistcoat keeps the look finished even when the jacket comes off.',
  },
  blazers: {
    h1: "Men's Blazers in Kenya",
    title: "Men's Blazers in Nairobi, Kenya",
    plural: "men's blazers",
    lead: 'Check, windowpane and solid blazers for office and evening wear.',
    intro:
      "Men's blazers in check, windowpane and solid colours. A blazer gives you structure without a full suit, and works over a shirt and trousers at the office, at dinner or at a smart-casual event in Nairobi.",
  },
  waistcoats: {
    h1: "Men's Waistcoats in Kenya",
    title: "Men's Waistcoats in Kenya",
    plural: 'waistcoats',
    lead: 'Waistcoats to layer with suits, shirts and formal trousers.',
    intro:
      'A waistcoat adds a finished layer to a suit, or dresses up a shirt and trousers on its own. Pair it with formal shoes and a matching tie for weddings and formal occasions.',
  },
  vests: {
    h1: "Men's Vests in Kenya",
    title: "Men's Vests in Kenya",
    plural: 'vests',
    lead: 'Sharp vests to wear between the jacket and the shirt.',
    intro:
      'Vests sit neatly between the jacket and the shirt. Wear one under a blazer for extra polish, or on its own with tailored trousers for a sharper take on smart-casual dressing.',
  },
  shirts: {
    h1: "Men's Shirts in Nairobi, Kenya",
    title: "Men's Shirts in Nairobi, Kenya",
    plural: "men's shirts",
    lead: 'Formal shirts, casual shirts, polos and T-shirts for every day of the week.',
    intro:
      "Shop men's shirts at Prince Esquire in Nairobi: crisp formal shirts for the office, casual shirts for the weekend, plus polos and T-shirts. Pair them with our trousers, blazers and suits to build a complete wardrobe in one place.",
  },
  'formal-shirts': {
    h1: "Men's Official Shirts in Nairobi, Kenya",
    title: "Men's Official Shirts in Nairobi, Kenya",
    plural: 'official shirts',
    lead: 'Official shirts in plain, striped, gingham and contrast-collar styles for the office and events.',
    intro:
      "Shop men's official shirts at Prince Esquire, Yala Towers, Nairobi. Choose plain whites and blues, stripes, gingham checks and contrast collars for the office, meetings and events, plus shirt-and-trouser outfits put together for you.",
  },
  'presidential-shirts': {
    h1: 'Presidential Shirts in Nairobi, Kenya',
    title: 'Presidential Shirts for Men in Nairobi, Kenya',
    plural: 'Presidential shirts',
    lead: 'Printed paisley, floral and checked long-sleeve shirts for occasions and events.',
    intro:
      "Presidential shirts at Prince Esquire, Yala Towers, Nairobi. Long-sleeve paisley, floral and checked prints for men who want the shirt to carry the look. Wear them with plain trousers and clean leather shoes.",
  },
  'shirts-casual': {
    h1: 'Casual Shirts for Men in Kenya',
    title: 'Casual Shirts for Men in Kenya',
    plural: 'casual shirts',
    lead: 'Relaxed shirts for weekends, dinners and off-duty days.',
    intro:
      'Casual shirts that are relaxed without looking careless. Wear them with chinos, jeans or linen trousers for weekends, dinners and days when a formal shirt is too much.',
  },
  'polo-t-shirts': {
    h1: 'Polo Shirts for Men in Kenya',
    title: 'Polo Shirts for Men in Nairobi, Kenya',
    plural: 'polo shirts',
    lead: 'Polo shirts for weekends, golf days and smart-casual dressing.',
    intro:
      'Polo shirts sit between a T-shirt and a shirt, which makes them the easiest smart-casual piece in a wardrobe. Wear yours with chinos or khakis for weekends, golf days and relaxed Nairobi lunches.',
  },
  't-shirts': {
    h1: "Men's T-Shirts in Kenya",
    title: "Men's T-Shirts in Nairobi, Kenya",
    plural: 'T-shirts',
    lead: 'Quality T-shirts for layering or wearing on their own.',
    intro:
      "Men's T-shirts to wear alone or layer under a jacket or blazer. They pair easily with jeans and casual shoes for an off-duty look that still feels put together.",
  },
  'sweat-shirts': {
    h1: "Men's Sweatshirts in Kenya",
    title: "Men's Sweatshirts in Kenya",
    plural: 'sweatshirts',
    lead: 'Soft, structured sweatshirts for cool Nairobi mornings and evenings.',
    intro:
      "Sweatshirts for Nairobi's cooler mornings and evenings. Soft enough for off-duty days, and structured enough to wear with chinos or jeans when you step out.",
  },
  trousers: {
    h1: "Men's Trousers in Nairobi, Kenya",
    title: "Men's Trousers in Nairobi, Kenya",
    plural: "men's trousers",
    lead: 'Chinos, khakis and jeans for the office and the weekend.',
    intro:
      "Shop men's trousers at Prince Esquire in Nairobi, from chinos and khakis to denim jeans. The right pair anchors everything above it, so choose a colour and fit that work with your shirts, blazers and shoes.",
  },
  chino: {
    h1: 'Chino Trousers for Men in Kenya',
    title: 'Chino Trousers for Men in Kenya',
    plural: 'chinos',
    lead: 'Everyday chinos that work from the office to the weekend.',
    intro:
      'Chinos work a full day without asking for attention. Dress them up with a formal shirt and blazer, or keep them relaxed with a polo and casual shoes.',
  },
  khaki: {
    h1: 'Khaki Trousers for Men in Kenya',
    title: 'Khaki Trousers for Men in Nairobi, Kenya',
    plural: 'khaki trousers',
    lead: 'Khaki trousers in earthy colours and clean, steady cuts.',
    intro:
      'Khaki trousers are a wardrobe staple in Kenya: comfortable, easy to match and suited to both work and weekends. Pair yours with a shirt or polo and brown or tan shoes.',
  },
  'linen-trousers': {
    h1: "Men's Linen Trousers in Kenya",
    title: "Men's Linen Trousers in Kenya",
    plural: 'linen trousers',
    lead: 'Breathable linen trousers for warm weather and the coast.',
    intro:
      'Linen trousers keep you cool through warm Nairobi days and coastal trips. Wear them with a linen shirt for a matched look, or a polo for something more relaxed.',
  },
  jeans: {
    h1: "Men's Jeans in Kenya",
    title: "Men's Jeans in Nairobi, Kenya",
    plural: "men's jeans",
    lead: 'Denim jeans for casual days and smart off-duty looks.',
    intro:
      "Men's denim jeans that pair with T-shirts, casual shirts and jackets. Choose a wash that suits how you dress, and finish with casual shoes or loafers.",
  },
  cargo: {
    h1: "Men's Cargo Trousers in Kenya",
    title: "Men's Cargo Trousers in Kenya",
    plural: 'cargo trousers',
    lead: 'Utility-cut cargo trousers with a cleaner finish.',
    intro:
      'Cargo trousers bring practical pockets and a utility cut, with a finish clean enough to wear beyond the weekend. Pair them with T-shirts and casual shoes.',
  },
  jackets: {
    h1: "Men's Jackets in Nairobi, Kenya",
    title: "Men's Jackets & Outerwear in Nairobi, Kenya",
    plural: "men's jackets",
    lead: 'Quilted, puffer and zip jackets plus track tops for cool days.',
    intro:
      "Men's jackets and outerwear for Nairobi's cooler days, including quilted and puffer jackets, half jackets and track tops. A good jacket is the last thing people see you in, so pick one that works with your everyday wardrobe.",
  },
  'full-jackets': {
    h1: 'Full Jackets for Men in Kenya',
    title: "Men's Full Jackets in Nairobi, Kenya",
    plural: 'full jackets',
    lead: 'Quilted and puffer jackets for cool mornings and evenings.',
    intro:
      "Full jackets for Nairobi's cool mornings and evenings. Browse quilted, puffer and zip-up styles that layer over shirts and T-shirts through the colder months.",
  },
  'half-jackets': {
    h1: 'Half Jackets for Men in Kenya',
    title: 'Half Jackets for Men in Kenya',
    plural: 'half jackets',
    lead: 'Lighter half jackets with the same presence.',
    intro:
      'Half jackets give you warmth through the body with free arms, which makes them a useful layer for changeable Nairobi weather and smart-casual outfits.',
  },
  tracksuits: {
    h1: "Men's Tracksuits in Nairobi, Kenya",
    title: "Men's Tracksuits in Nairobi, Kenya",
    plural: "men's tracksuits",
    lead: 'Matching zip-up and hooded tracksuits for travel, weekends and off-duty days.',
    intro:
      "Shop men's tracksuits at Prince Esquire, The Man's Shop at Yala Towers, Nairobi. Matching tops and bottoms in black, white and dark green, ready for travel, weekends and off-duty days, with same-day delivery in Nairobi.",
  },
  shoes: {
    h1: "Men's Shoes in Nairobi, Kenya",
    title: "Men's Official Shoes, Boots & Loafers in Nairobi",
    plural: "men's shoes",
    lead: 'Formal shoes, loafers and casual footwear for every occasion.',
    intro:
      "Shop men's shoes at Prince Esquire in Nairobi: formal shoes for work and weddings, loafers for smart-casual days, and casual pairs for the weekend. Shoes finish every outfit, so match the colour to your belt and the formality to the room.",
  },
  'formal-shoes': {
    h1: "Men's Official Shoes in Nairobi, Kenya",
    title: "Men's Official Shoes in Nairobi, Kenya",
    plural: 'official shoes',
    lead: 'Official shoes in black, brown and tan for the office, weddings and events.',
    intro:
      "Men's official shoes in black, brown and tan for the office, weddings and events. Choose Oxfords, Derbies, brogues and Chelsea boots at Prince Esquire, Yala Towers, Nairobi. Pair black with navy or charcoal suits, and brown or tan with blue, grey and earth tones.",
  },
  'chelsea-boots': {
    h1: "Men's Chelsea Boots in Nairobi, Kenya",
    title: "Men's Chelsea Boots in Nairobi, Kenya",
    plural: 'Chelsea boots',
    lead: 'Leather Chelsea boots in black, brown and burnished tan.',
    intro:
      "Men's Chelsea boots at Prince Esquire, Yala Towers, Nairobi. Slip-on leather boots with elastic side panels in black, brown and burnished tan, sharp enough for a suit and easy with chinos.",
  },
  brogues: {
    h1: "Men's Brogues in Nairobi, Kenya",
    title: "Men's Brogue Shoes in Nairobi, Kenya",
    plural: 'brogues',
    lead: 'Wingtip brogues and brogue boots in black, brown and tan.',
    intro:
      "Men's brogues at Prince Esquire, Yala Towers, Nairobi. Wingtip Oxfords and brogue boots in black, brown and tan, with decorative punching that suits business-casual outfits and checked blazers.",
  },
  'bespoke-formal': {
    h1: 'Bespoke Formal Shoes in Nairobi',
    title: 'Bespoke Formal Shoes in Nairobi, Kenya',
    plural: 'bespoke formal shoes',
    lead: 'Formal shoes made to your measure and built to order.',
    intro:
      'Bespoke formal shoes are built to order around your foot. Speak to Prince Esquire at Yala Towers or on WhatsApp to begin a fitting and discuss styles, materials and lead time.',
  },
  loafers: {
    h1: "Men's Loafers in Kenya",
    title: "Men's Loafers in Nairobi, Kenya",
    plural: 'loafers',
    lead: 'Slip-on loafers with an easy, evening-ready finish.',
    intro:
      "Men's loafers for smart-casual days and evenings. Slip-on and easy to wear, they work with chinos, tailored trousers and linen, with or without a jacket.",
  },
  casual: {
    h1: "Men's Casual Shoes in Kenya",
    title: "Men's Casual Shoes in Nairobi, Kenya",
    plural: 'casual shoes',
    lead: 'Casual shoes and sneakers for weekends and off-duty days.',
    intro:
      "Men's casual shoes for weekends and off-duty days. Wear them with jeans, chinos or a track suit for an outfit that stays comfortable and still looks considered.",
  },
  accessories: {
    h1: "Men's Accessories in Nairobi, Kenya",
    title: "Men's Accessories in Nairobi, Kenya",
    plural: "men's accessories",
    lead: 'Belts, ties and caps that finish the outfit.',
    intro:
      "Men's accessories from Prince Esquire in Nairobi, including leather belts, ties and caps. The small details are what people notice up close, so match your belt to your shoes and choose a tie that lifts the suit.",
  },
  belts: {
    h1: "Men's Belts in Kenya",
    title: "Men's Leather Belts in Nairobi, Kenya",
    plural: 'belts',
    lead: 'Belts for suits, formal trousers and everyday wear.',
    intro:
      "Men's belts for suits, formal trousers and everyday wear. As a simple rule, match the belt to your shoes, and pick a slimmer buckle for formal outfits.",
  },
  ties: {
    h1: "Men's Ties in Kenya",
    title: "Men's Ties in Nairobi, Kenya",
    plural: 'ties',
    lead: 'Ties in colours and patterns chosen to lift a suit.',
    intro:
      'A tie is often the only colour in a formal outfit, so it is worth choosing with care. Browse ties to pair with your suits and formal shirts for work, weddings and events.',
  },
  caps: {
    h1: "Men's Caps in Kenya",
    title: "Men's Caps in Nairobi, Kenya",
    plural: 'caps',
    lead: 'Caps that keep a sharper silhouette under the sun.',
    intro:
      "Men's caps for sunny days and off-duty outfits. Wear them with a polo or T-shirt to keep a casual look sharp.",
  },
  hats: {
    h1: "Men's Hats in Kenya",
    title: "Men's Hats in Nairobi, Kenya",
    plural: 'hats',
    lead: 'Hats that add presence from the crown down.',
    intro:
      "Men's hats for occasions and sunny days. A well-chosen hat adds presence to a simple outfit, whether you are dressing for an event or a day outdoors.",
  },
  'gift-sets': {
    h1: 'Gift Sets for Men in Kenya',
    title: 'Luxury Gift Sets for Men in Nairobi, Kenya',
    plural: 'gift sets',
    lead: 'Curated boxed menswear gifts, already put together for you.',
    intro:
      'Gift sets and boxes for men, already put together so you do not have to guess. A thoughtful choice for birthdays, weddings, Father\'s Day and corporate gifting, with delivery across Kenya.',
  },
  'linen-edit': {
    h1: "Men's Linen Clothing in Kenya",
    title: "Men's Linen Shirts, Trousers & Sets in Kenya",
    plural: 'linen pieces',
    lead: 'Linen shirts, trousers and sets for warm weather.',
    intro:
      'The Linen Edit brings together linen shirts, trousers and matched sets for warm weather. Breathable and relaxed, linen suits hot Nairobi days, coastal trips and outdoor events.',
  },
  'linen-shirts': {
    h1: "Men's Linen Shirts in Kenya",
    title: "Men's Linen Shirts in Kenya",
    plural: 'linen shirts',
    lead: 'Open-weave linen shirts for warm days.',
    intro:
      'Linen shirts stay cool through warm days and look better with a little texture. Wear them with linen or chino trousers, in town or at the coast.',
  },
  'linen-set': {
    h1: "Men's Linen Sets in Kenya",
    title: "Men's Linen Sets in Kenya",
    plural: 'linen sets',
    lead: 'Matched linen shirt and trouser sets.',
    intro:
      'One easy decision: a linen shirt and trousers that already match. Linen sets are ideal for coastal trips, warm-weather weddings and relaxed events.',
  },
};

const money = (n) => `KSh ${Math.round(Number(n)).toLocaleString('en-KE')}`;

function clip(text, max) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

/**
 * @param {{slug:string,name:string}} category
 * @param {{count?:number,minPrice?:number|null,maxPrice?:number|null}} stats live catalogue figures
 */
function buildCategorySeo(category, stats = {}) {
  const name = category?.name || 'Menswear';
  const copy = COPY[category?.slug] || {
    h1: `${name} for Men in Kenya`,
    title: `${name} for Men in Kenya`,
    plural: String(name).toLowerCase(),
    lead: `Shop ${String(name).toLowerCase()} at Prince Esquire, Nairobi.`,
    intro: `Shop ${String(name).toLowerCase()} at Prince Esquire, The Man's Shop at Yala Towers, Nairobi, with delivery across Kenya.`,
  };

  const count = Number(stats.count) || 0;
  const min = Number(stats.minPrice) || 0;
  const max = Number(stats.maxPrice) || 0;
  const priceLine = count > 0 && min > 0 ? `${count} styles from ${money(min)}.` : '';

  const faqs = [
    {
      question: `Where can I buy ${copy.plural} in Nairobi?`,
      answer:
        `Prince Esquire, The Man's Shop, is at Yala Towers in Nairobi. You can visit the store, order on this website, or order on WhatsApp on +254 724 494089.`,
    },
  ];
  if (count > 0 && min > 0) {
    faqs.push({
      question: `How much do ${copy.plural} cost at Prince Esquire?`,
      answer:
        min === max
          ? `We currently have ${count} ${count === 1 ? 'style' : 'styles'} at ${money(min)}.`
          : `We currently have ${count} styles priced from ${money(min)} to ${money(max)}.`,
    });
  }
  faqs.push(
    {
      question: 'Do you deliver outside Nairobi?',
      answer:
        'Yes, we deliver across Kenya. Delivery within Nairobi is same day, in just 1-2 hours, and countrywide delivery takes 1-2 days.',
    },
    {
      question: 'Can I return or exchange an item?',
      answer:
        'Returns are accepted within 5 days of delivery if the item is unworn, unwashed and has its tags attached. Size exchanges are free within 5 days of delivery, subject to availability.',
    }
  );

  return {
    h1: copy.h1,
    title: clip(`${copy.title} | Prince Esquire`, 70),
    description: clip(
      [
        `${copy.lead} ${priceLine} Same-day delivery in Nairobi, 1-2 days countrywide.`,
        `${copy.lead} ${priceLine} Same-day delivery in Nairobi.`,
      ]
        .map((text) => text.replace(/\s+/g, ' '))
        .find((text) => text.length <= 158) || copy.lead,
      158
    ),
    intro: copy.intro,
    guide: GUIDES[category?.slug]?.sections || [],
    faqs,
    count,
    minPrice: min || null,
    maxPrice: max || null,
  };
}

module.exports = { buildCategorySeo, clip, money, COPY };
