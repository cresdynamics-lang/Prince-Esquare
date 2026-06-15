/**
 * Format product descriptions for rich PDP display (Strada-style sections).
 */

const BULLET_RE = /^[\s•\-*–—]+\s*/;
const SECTION_HEADERS = [
  { key: 'features', patterns: [/key features/i, /^features$/i, /🔥/] },
  { key: 'colors', patterns: [/available color/i, /color variants?/i, /🎨/] },
  { key: 'sizes', patterns: [/available sizes?/i, /size run/i, /📏/] },
  { key: 'delivery', patterns: [/delivery\s*&\s*service/i, /shipping\s*&\s*delivery/i] },
  { key: 'why', patterns: [/why prince esquire/i, /why choose/i] },
];

const cleanLine = (line) => line.replace(BULLET_RE, '').replace(/^[🔥🎨📏]\s*/, '').trim();

export const parseDescriptionSections = (raw = '') => {
  const text = String(raw || '').trim();
  if (!text) {
    return { intro: [], features: [], colors: [], sizes: [], delivery: [], why: [], footer: [] };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const intro = [];
  const features = [];
  const colors = [];
  const sizes = [];
  const delivery = [];
  const why = [];
  const footer = [];
  let section = 'intro';

  const pushToSection = (key, value) => {
    if (key === 'features') features.push(value);
    else if (key === 'colors') colors.push(value);
    else if (key === 'sizes') sizes.push(value);
    else if (key === 'delivery') delivery.push(value);
    else if (key === 'why') why.push(value);
    else if (key === 'intro') intro.push(value);
    else footer.push(value);
  };

  for (const line of lines) {
    const header = SECTION_HEADERS.find((h) => h.patterns.some((p) => p.test(line)));
    if (header) {
      section = header.key;
      continue;
    }

    const cleaned = cleanLine(line);
    if (!cleaned) continue;

    if (BULLET_RE.test(line) || section !== 'intro') {
      pushToSection(section, cleaned);
    } else {
      pushToSection(section, cleaned);
    }
  }

  return { intro, features, colors, sizes, delivery, why, footer };
};

export const buildVariantMeta = (variants = [], categoryName = '') => {
  const normalized = variants.map((v) => {
    let color = v.color;
    let size = v.size;
    if (!color && !size && v.value?.includes('/')) {
      const [s, c] = v.value.split('/').map((x) => x.trim());
      size = s;
      color = c;
    }
    if (!color) color = v.value || 'Original';
    if (!size) size = 'Standard';
    return { ...v, color, size };
  });

  const colorOrder = [];
  const colorMap = new Map();
  for (const v of normalized) {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, []);
      colorOrder.push(v.color);
    }
    colorMap.get(v.color).push(v);
  }

  const isShoe = (categoryName || '').toLowerCase().includes('shoe');
  const defaultSizes = isShoe
    ? ['38', '39', '40', '41', '42', '43', '44', '45']
    : ['M', 'L', 'XL', 'XXL'];

  return {
    variants: normalized,
    colors: colorOrder.map((color) => ({
      color,
      variants: colorMap.get(color),
    })),
    defaultSizes,
    isShoe,
  };
};

const CATEGORY_FEATURES = {
  shoe: [
    'Premium materials selected for comfort, durability, and everyday wear',
    'Cushioned insole support for all-day movement',
    'Durable outsole designed for grip and long-lasting performance',
    'Versatile lifestyle design — pairs effortlessly with casual and smart-casual looks',
    'True-to-size EU fit; suitable for men and women (unisex styling)',
  ],
  suit: [
    'Tailored cut with a refined silhouette for formal and occasion wear',
    'Quality fabric blend for structure, comfort, and all-day elegance',
    'Precision stitching and finishing throughout',
    'Designed to elevate boardroom, wedding, and evening looks',
    'Available in classic colourways to match your wardrobe',
  ],
  shirt: [
    'Breathable fabric for comfort in Nairobi\'s climate',
    'Clean lines and a polished fit for office and weekend wear',
    'Durable construction that holds shape after repeated wear',
    'Easy to style with trousers, denim, or layered under outerwear',
  ],
  trouser: [
    'Tailored fit with comfortable stretch for daily movement',
    'Premium fabric with a clean, structured drape',
    'Reinforced seams for durability',
    'Versatile styling — dress up or down with ease',
  ],
  default: [
    'Curated by Prince Esquire for quality, style, and lasting value',
    'Premium construction with attention to detail in every stitch',
    'Designed for the modern Kenyan wardrobe — versatile and refined',
    'Easy care; built for repeat wear season after season',
  ],
};

const detectCategoryKey = (categoryName = '', parentCategoryName = '') => {
  const n = `${categoryName} ${parentCategoryName}`.toLowerCase();
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('footwear') || n.includes('loafer') || n.includes('boot')) return 'shoe';
  if (n.includes('suit')) return 'suit';
  if (n.includes('shirt') || n.includes('polo')) return 'shirt';
  if (n.includes('trouser') || n.includes('pant') || n.includes('chino') || n.includes('khaki')) return 'trouser';
  return 'default';
};

const isBriefDescription = (raw, parsed) => {
  const text = String(raw || '').trim();
  if (!text) return true;
  if (parsed.features.length >= 3) return false;
  if (text.length >= 280 && parsed.intro.length >= 1 && parsed.features.length >= 2) return false;
  if (text.length < 200) return true;
  if (parsed.intro.length <= 1 && parsed.features.length < 2) return true;
  return false;
};

/**
 * Expand thin admin descriptions into Strada-style rich PDP copy.
 * Preserves full custom descriptions when they are already detailed.
 */
export const buildRichDescription = (product, variantMeta = {}, parentCategoryName = '') => {
  const raw = String(product?.description || '').trim();
  const parsed = parseDescriptionSections(raw);
  const colors = (variantMeta.colors || []).map((c) => c.color).filter(Boolean);
  const allSizes = sortSizes(
    (variantMeta.variants || []).map((v) => v.size),
    variantMeta.isShoe
  );
  const categoryKey = detectCategoryKey(
    product?.category_name,
    parentCategoryName || product?.parent_category_name
  );
  const brand = product?.brand_name || 'Prince Esquire';
  const name = product?.name || 'This piece';

  if (!isBriefDescription(raw, parsed)) {
    return raw;
  }

  const sizeLine = variantMeta.isShoe && allSizes.length
    ? `EU ${allSizes[0]} – ${allSizes[allSizes.length - 1]} (Unisex fit — suitable for men & women)`
    : allSizes.length
      ? allSizes.join(', ')
      : 'See size selector above';

  const intro = parsed.intro.length
    ? parsed.intro
    : [
        `${name} — a standout addition to the ${brand} collection. Crafted for discerning taste, this piece blends premium quality with everyday versatility so you look polished from morning to evening.`,
        `Whether you are building a capsule wardrobe or adding a statement piece, ${name} delivers the refined finish Prince Esquire is known for across Nairobi and beyond.`,
      ];

  const features = parsed.features.length
    ? parsed.features
    : CATEGORY_FEATURES[categoryKey];

  const colorLines = parsed.colors.length ? parsed.colors : colors;
  const sizeLines = parsed.sizes.length ? parsed.sizes : [sizeLine];

  const deliveryNote = [
    'Orders are confirmed by our team before dispatch. Nairobi CBD and surrounding areas may qualify for in-house rider delivery; prepaid orders ship via your preferred courier. Fulfilment depends on size and colour availability at time of confirmation.',
  ];

  const blocks = [
    ...intro,
    '',
    'Key Features',
    ...features.map((f) => `• ${f}`),
  ];

  if (colorLines.length) {
    blocks.push('', 'Available Color Variants', ...colorLines.map((c) => `• ${c}`));
  }

  if (sizeLines.length) {
    blocks.push('', 'Available Sizes', ...sizeLines);
  }

  blocks.push(
    '',
    'Delivery & Service',
    ...deliveryNote,
    '',
    'Why Prince Esquire',
    '• Curated luxury fashion with transparent pricing',
    '• Fast, reliable delivery across Kenya',
    '• In-store availability at our Nairobi location',
    '• Dedicated customer support before and after your purchase',
  );

  if (parsed.footer.length) {
    blocks.push('', ...parsed.footer);
  }

  return blocks.join('\n');
};

export const sortSizes = (sizes, isShoe = false) => {
  const unique = [...new Set(sizes.filter(Boolean))];
  const numeric = unique.every((s) => /^\d+$/.test(String(s).trim()));
  if (numeric || isShoe) {
    return unique.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
  return unique.sort((a, b) => {
    const ai = order.indexOf(String(a).toUpperCase());
    const bi = order.indexOf(String(b).toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return String(a).localeCompare(String(b));
  });
};
