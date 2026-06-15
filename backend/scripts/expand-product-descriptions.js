/**
 * Expand short product descriptions across the entire catalogue.
 * Adds intro paragraph, detailed features, fit/styling, and care notes.
 *
 * Usage: node scripts/expand-product-descriptions.js [--dry-run]
 */
require('dotenv').config();
const db = require('../src/config/db');
const { invalidateCatalogueCache } = require('../src/controllers/catalogueController');

const DRY_RUN = process.argv.includes('--dry-run');
const MIN_LENGTH = 380;

const rich = (intro, features, fit, care, closing) =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    `Care: ${care}`,
    '',
    closing,
  ].join('\n');

const parseName = (name) => {
  const upper = String(name || '').toUpperCase();
  const colors = [
    'WHITE', 'BLACK', 'NAVY', 'BLUE', 'GREY', 'GRAY', 'GREEN', 'BURGUNDY', 'MAROON',
    'BEIGE', 'TAN', 'CREAM', 'BROWN', 'RED', 'BURGUNDY', 'CHARCOAL', 'KHAKI', 'OLIVE',
  ];
  const color = colors.find((c) => upper.includes(c)) || null;
  const brands = ['NIKE', 'ADIDAS', 'PUMA', 'VANS', 'LACOSTE', 'TOMMY', 'TIMBERLAND', 'CLARKS', 'GUCCI', 'SHEIN'];
  const brand = brands.find((b) => upper.includes(b)) || null;
  return { color: color ? color.charAt(0) + color.slice(1).toLowerCase() : null, brand };
};

const categoryTemplate = (cat, parent, name, color, brand) => {
  const c = `${parent || ''} ${cat || ''}`.toLowerCase();
  const n = name.toLowerCase();
  const col = color || 'classic';

  if (c.includes('sweat') || n.includes('sweatshirt') || n.includes('crewneck')) {
    return {
      intro: `Prince Esquire ${col} crewneck sweatshirt — premium fleece pullover designed for warmth, comfort, and effortless casual style. ${brand ? `Featuring ${brand} quality and branding.` : 'Crafted for everyday wear with a relaxed streetwear appeal.'}`,
      features: [
        `${col.charAt(0).toUpperCase() + col.slice(1)} cotton-blend fleece with soft brushed interior.`,
        'Ribbed crew neck, cuffs, and waistband for shape retention.',
        'Relaxed fit suitable for layering over tees or under jackets.',
        'Durable construction with reinforced seams.',
        'Breathable yet warm — ideal for cool weather and indoor comfort.',
        brand ? `${brand} signature detailing and quality finish.` : 'Versatile solid or graphic styling for casual wardrobes.',
      ],
      fit: 'Wear with jeans, chinos, joggers, or cargo pants. Layer under a bomber, denim jacket, or overcoat for transitional weather.',
      care: 'Machine wash cold inside out. Tumble dry low. Do not bleach. Iron on low heat avoiding prints.',
      closing: 'Available sizes M–3XL. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('round-neck') || c.includes('t-shirt') || c.includes('t-shirts') || n.includes('t-shirt') || n.includes('round-neck') || n.includes('tee')) {
    return {
      intro: `Prince Esquire ${col} round-neck T-shirt — soft cotton jersey essential built for breathable comfort and everyday versatility. ${brand ? `${brand} athletic heritage meets casual style.` : 'A wardrobe staple for casual, streetwear, and weekend looks.'}`,
      features: [
        `${col.charAt(0).toUpperCase() + col.slice(1)} breathable cotton or cotton-blend jersey.`,
        'Classic ribbed round-neck (crew neck) collar.',
        'Short sleeves with reinforced double-stitched hems.',
        n.includes('graphic') || n.includes('print') || n.includes('logo') ? 'Durable chest graphic with quality screen print.' : 'Clean design — easy to layer or wear on its own.',
        'Soft hand-feel with comfortable regular-to-relaxed fit.',
        'Suitable for casual outings, travel, and daily wear.',
      ],
      fit: 'Pair with denim, chinos, shorts, or joggers. Tuck for smart-casual or leave untucked for relaxed street style.',
      care: 'Machine wash cold. Tumble dry low. Iron on low heat if needed. Wash inside out to preserve prints.',
      closing: 'Available sizes M–3XL. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('loafer') || n.includes('loafer')) {
    return {
      intro: `Prince Esquire ${col} leather loafers — refined slip-on footwear combining polished elegance with all-day comfort. ${brand ? `${brand} craftsmanship for discerning gentlemen.` : 'Perfect for business casual, events, and smart everyday dressing.'}`,
      features: [
        'Premium leather upper with smooth or textured finish.',
        'Classic penny or plain loafer silhouette.',
        'Cushioned insole for extended wear comfort.',
        'Durable rubber or leather outsole with grip.',
        'Slip-on design for effortless on-and-off.',
        'Hand-finished details for a refined appearance.',
      ],
      fit: 'Pair with tailored trousers, chinos, or dark denim for smart-casual and formal-casual occasions.',
      care: 'Wipe clean with a damp cloth. Use leather conditioner periodically. Store with shoe trees to maintain shape.',
      closing: 'Available EU sizes 40–46. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('casual') && (c.includes('shoe') || n.includes('sneaker') || n.includes('trainer'))) {
    return {
      intro: `Prince Esquire ${col} casual sneakers — versatile low-top trainers designed for comfort, style, and daily wear. ${brand ? `${brand} sport-inspired design for modern gentlemen.` : 'From city streets to weekend outings.'}`,
      features: [
        'Quality leather, suede, or mesh upper construction.',
        'Padded collar and cushioned insole for comfort.',
        'Rubber cupsole or EVA sole for traction and support.',
        'Lace-up closure for secure adjustable fit.',
        'Breathable lining for all-day wear.',
        brand ? `Iconic ${brand} branding and detailing.` : 'Clean contemporary trainer profile.',
      ],
      fit: 'Style with jeans, joggers, shorts, or casual chinos. A go-to sneaker for everyday versatility.',
      care: 'Brush off dirt after wear. Clean with appropriate leather or fabric cleaner. Air dry away from direct heat.',
      closing: 'Available EU sizes 40–46. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('formal shoe') || n.includes('oxford') || n.includes('derby') || n.includes('brogue')) {
    return {
      intro: `Prince Esquire ${col} formal dress shoes — expertly crafted leather footwear for business, weddings, and black-tie occasions.`,
      features: [
        'Full-grain or polished leather upper.',
        'Classic formal shoe construction with clean lines.',
        'Leather or cushioned insole for comfort.',
        'Durable leather or rubber outsole.',
        'Lace-up closure for refined fit.',
        'Professional finish suitable for suiting.',
      ],
      fit: 'Essential with suits, dress trousers, and formal wear. Polished leather elevates any professional ensemble.',
      care: 'Polish regularly. Use shoe trees. Protect from rain with leather protector spray.',
      closing: 'Available EU sizes 40–46. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('shirt') || n.includes('shirt')) {
    return {
      intro: `Prince Esquire ${col} shirt — tailored menswear piece combining refined fabric with comfortable everyday wearability.`,
      features: [
        'Quality cotton, linen, or blended fabric.',
        'Structured collar with button placket.',
        'Precision stitching and durable construction.',
        'Breathable weave for all-day comfort.',
        'Versatile for office, events, or smart-casual wear.',
        'Easy-care fabric with lasting colour.',
      ],
      fit: 'Wear tucked with trousers for formal looks or untucked with chinos for relaxed smart-casual style.',
      care: 'Machine wash cold or dry clean as appropriate. Iron on medium heat. Hang dry for best results.',
      closing: 'Available sizes M–3XL. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('suit') || n.includes('suit') || n.includes('blazer')) {
    return {
      intro: `Prince Esquire ${col} suit — impeccably tailored menswear for formal occasions, business, and distinguished events.`,
      features: [
        'Premium suiting fabric with refined drape.',
        'Structured shoulders and clean silhouette.',
        'Fully lined jacket for comfort and shape.',
        'Flat-front or pleated trousers with precise cut.',
        'Quality buttons and finishing details.',
        'Designed for weddings, galas, and professional settings.',
      ],
      fit: 'Pair with dress shoes, a crisp shirt, and tie or pocket square. Alterations available for perfect fit.',
      care: 'Dry clean only. Hang on wide-shoulder hangers. Steam to remove wrinkles.',
      closing: 'Available in standard and custom sizing. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('trouser') || c.includes('khaki') || c.includes('chino') || c.includes('jean') || n.includes('trouser') || n.includes('jean')) {
    return {
      intro: `Prince Esquire ${col} trousers — precision-cut bottoms designed for comfort, structure, and versatile styling.`,
      features: [
        'Quality cotton, twill, or denim fabric.',
        'Tailored waist with belt loops and secure closure.',
        'Reinforced seams for durability.',
        'Comfortable fit through hip and thigh.',
        'Clean hem finish — ready to wear.',
        'Suitable for casual through smart-casual occasions.',
      ],
      fit: 'Pair with shirts, polos, blazers, or tees depending on the occasion. Belt and footwear complete the look.',
      care: 'Machine wash cold. Tumble dry low or hang dry. Iron on medium heat.',
      closing: 'Available sizes 30–40 waist. Exclusively at Prince Esquire.',
    };
  }

  if (c.includes('polo') || n.includes('polo')) {
    return {
      intro: `Prince Esquire ${col} polo shirt — classic collared knit combining sporty heritage with smart-casual versatility.`,
      features: [
        'Pique or jersey cotton knit fabric.',
        'Ribbed polo collar with button placket.',
        'Short sleeves with ribbed cuffs.',
        'Breathable construction for warm weather.',
        brand ? `${brand} embroidered logo detail.` : 'Clean minimal or branded styling.',
        'Easy transition from casual to smart-casual.',
      ],
      fit: 'Wear with chinos, shorts, or under a blazer. A summer essential for golf, travel, and weekends.',
      care: 'Machine wash cold. Tumble dry low. Iron collar on medium heat.',
      closing: 'Available sizes M–3XL. Exclusively at Prince Esquire.',
    };
  }

  return {
    intro: `Prince Esquire ${name} — premium menswear crafted for quality, comfort, and distinguished style.`,
    features: [
      'Quality materials selected for durability and comfort.',
      'Thoughtful construction with attention to detail.',
      'Versatile design for everyday and special occasions.',
      'Refined finish befitting the Prince Esquire standard.',
      'Comfortable fit designed for the modern gentleman.',
      brand ? `${brand} quality you can trust.` : 'Exclusively curated for our clientele.',
    ],
    fit: 'Style according to occasion — pair with complementary pieces from the Prince Esquire collection.',
    care: 'Follow care label instructions. Store properly to maintain shape and appearance.',
    closing: 'Available at Prince Esquire — Kenya\'s destination for premium menswear.',
  };
};

const needsExpansion = (description) => {
  if (!description || description.trim().length < MIN_LENGTH) return true;
  if (!/fit\s*&\s*styling/i.test(description)) return true;
  if (!/care:/i.test(description)) return true;
  const bullets = (description.match(/^• /gm) || []).length;
  return bullets < 4;
};

const expandDescription = (product) => {
  const { name, description, category_name: cat, parent_category_name: parent, brand_name: brand } = product;
  const parsed = parseName(name);
  const color = parsed.color;
  const tpl = categoryTemplate(cat, parent, name, color, brand || parsed.brand);

  if (description && description.length >= MIN_LENGTH && /fit\s*&\s*styling/i.test(description) && /care:/i.test(description)) {
    return null;
  }

  const existingBullets = (description || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('•'))
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

  const features = existingBullets.length >= 4
    ? [...existingBullets.slice(0, 5), ...tpl.features.slice(existingBullets.length)].slice(0, 6)
    : tpl.features;

  const introLine = (description || '').split('\n').find((l) => l.trim() && !l.startsWith('•') && !/^key features/i.test(l));
  const intro = introLine && introLine.length > 60 ? introLine.trim() : tpl.intro;

  return rich(intro, features, tpl.fit, tpl.care, tpl.closing);
};

async function run() {
  const { rows } = await db.query(
    `SELECT p.id, p.name, p.slug, p.description,
            c.name AS category_name,
            pc.name AS parent_category_name,
            b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.is_active = true
     ORDER BY p.id`
  );

  let updated = 0;
  let skipped = 0;

  for (const product of rows) {
    if (!needsExpansion(product.description)) {
      skipped += 1;
      continue;
    }

    const expanded = expandDescription(product);
    if (!expanded) {
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY] ${product.name} (${product.description?.length || 0} → ${expanded.length} chars)`);
    } else {
      await db.query('UPDATE products SET description = $1, updated_at = NOW() WHERE id = $2', [
        expanded,
        product.id,
      ]);
      console.log(`Updated: ${product.name}`);
    }
    updated += 1;
  }

  if (!DRY_RUN) invalidateCatalogueCache();

  console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'} ${updated} descriptions (${skipped} already sufficient).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('expand-product-descriptions failed:', err);
  process.exit(1);
});
