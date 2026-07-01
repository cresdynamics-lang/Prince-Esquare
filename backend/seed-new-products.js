const db = require('./src/config/db');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const NEW_PRODUCTS = [
  // Moncler Tracksuits
  {
    name: 'Moncler Tricolor Zip-Up Sportswear Tracksuit - Alpine White',
    slug: 'moncler-tricolor-zip-up-tracksuit-alpine-white',
    category: 'Track Suits',
    subcategory: 'All',
    price: 8000,
    color: 'Alpine White',
    thumbnail: '/images/products/WhatsApp Image 2026-07-01 at 17.48.56.jpg',
    description: 'A premium luxury two-piece sportswear set featuring a sleek zip-up mock neck jacket and matching tailored joggers. Designed with Moncler\'s iconic tricolor ribbon accents along the main zipper and pocket borders, finished with signature chest and thigh logo embroidery. Key features: Iconic red, white, and navy tricolor zipper detailing, Embroidered Moncler signature logo on the chest and thigh, Premium heavyweight, breathable cotton-blend stretch fabric, Mock neck collar jacket with ribbed cuffs and hem, Adjustable drawstring elastic waistband with tricolor zippered side pockets on joggers.'
  },
  {
    name: 'Moncler Tricolor Zip-Up Sportswear Tracksuit - Onyx Black',
    slug: 'moncler-tricolor-zip-up-tracksuit-onyx-black',
    category: 'Track Suits',
    subcategory: 'All',
    price: 8000,
    color: 'Onyx Black',
    thumbnail: '/images/products/WhatsApp Image 2026-07-01 at 17.48.57.jpg',
    description: 'An ultra-sharp, high-end two-piece luxury tracksuit combination crafted for a clean, athletic silhouette. Highlights a deep onyx black palette contrasted sharply against the signature heritage tricolor trim along the main zip enclosures and utility pockets. Key features: Deep fade-resistant matte black utility textile base, High-contrast red, white, and navy tricolor pocket and front zip borders, Embroidered signature Moncler brand insignias, Secure zippered side utility pockets on both jacket and trousers, Ribbed elastic trim and cuffs for a streamlined, tailored fit.'
  },
  // Knit Polos
  {
    name: 'The Onyx Avant-Garde Polo',
    slug: 'onyx-avant-garde-polo',
    category: 'Polo T-shirts',
    subcategory: 'Knitted Polos',
    price: 8500,
    color: 'Obsidian Navy',
    thumbnail: '/images/products/IMG_3707.jpg',
    description: 'A sleek, deep obsidian navy knit polo shirt featuring a distinctive white-accented zipper placket and an architecturally structured textured collar. Crafted from Textured Pique Luxury Cotton Blend.'
  },
  {
    name: 'The Alabaster Knit Polo',
    slug: 'alabaster-knit-polo',
    category: 'Polo T-shirts',
    subcategory: 'Knitted Polos',
    price: 8500,
    color: 'Pristine White',
    thumbnail: '/images/products/IMG_3710.jpg',
    description: 'A pristine, luxury white textured polo with minimal contrast black tipping details along a crisp, modern zipper collar system. Crafted from Premium Textured Cotton.'
  },
  {
    name: 'The Aero Zenith Zip Polo',
    slug: 'aero-zenith-zip-polo',
    category: 'Polo T-shirts',
    subcategory: 'Knitted Polos',
    price: 8500,
    color: 'Muted Ice Blue',
    thumbnail: '/images/products/IMG_3714.jpg',
    description: 'An elegant, muted ice-blue luxury polo balancing a refined micro-textured knit surface, modern structural collar, and minimal silver zip detailing. Crafted from Luxury Lightweight Cotton Blend.'
  },
  // Formal Shoes - Derby
  {
    name: 'The Kingsley Mahogany Derby',
    slug: 'kingsley-mahogany-derby',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Mahogany Brown',
    thumbnail: '/images/products/IMG_4056.jpg',
    description: 'An exquisite smooth, rich deep-brown leather dress shoe featuring a classic closed lace system, structural silhouette, and refined finish. Tailored flawlessly for executive wardrobes. Crafted from Premium Calfskin Leather.'
  },
  {
    name: 'The Executive Mahogany Derby',
    slug: 'executive-mahogany-derby',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Dark Mahogany',
    thumbnail: '/images/products/IMG_4054.jpg',
    description: 'A detailed, angled display layout showcasing the rich brown undertones and flawless master polish of our executive-class leather derby. Crafted from Smooth Full-Grain Leather.'
  },
  {
    name: 'The Monarch Nero Derby',
    slug: 'monarch-nero-derby',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Nero Black',
    thumbnail: '/images/products/IMG_4066.jpg',
    description: 'Premium black dress shoe with a sophisticated matte-to-gloss sheen finish. Features clean curves and a modern structural build perfect for professional settings. Crafted from Polished Smooth Leather.'
  },
  {
    name: 'The Brunswick Textured Derby',
    slug: 'brunswick-textured-derby',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Dark Brown',
    thumbnail: '/images/products/IMG_4068.jpg',
    description: 'A side-profile showcase of our textured deep-brown leather shoe. Highlights outstanding artisan craftsmanship and contrasting side panel textures. Crafted from Pebble-Grain & Smooth Leather.'
  },
  {
    name: 'The Obsidian Pebble Derby',
    slug: 'obsidian-pebble-debry',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Nero Black',
    thumbnail: '/images/products/IMG_4051.jpg',
    description: 'An elevated view of the dual-textured black calfskin derby shoe, emphasizing its clean executive aesthetic and superior craftsmanship layout. Crafted from Premium Mixed Leathers.'
  },
  {
    name: 'The Heritage Walnut Derby',
    slug: 'heritage-walnut-derby',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Warm Walnut Brown',
    thumbnail: '/images/products/IMG_4080.jpg',
    description: 'A smooth, warm walnut-brown leather dress shoe displaying a sleek minimalist profile and highly refined curves on an upscale presentation mount. Crafted from Smooth Full-Grain Leather.'
  },
  {
    name: 'The Obsidian Classic Derby',
    slug: 'obsidian-classic-derby',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 18500,
    color: 'Timeless Black',
    thumbnail: '/images/products/IMG_4076.jpg',
    description: 'Clean, timeless jet-black leather dress shoe with a flawless luxury polish. Built specifically to match with premium corporate evening suits. Crafted from Premium Smooth Leather.'
  },
  // Formal Shoes - Oxford
  {
    name: 'The Heritage Oak Oxford',
    slug: 'heritage-oak-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Dark Oak Brown',
    thumbnail: '/images/products/IMG_4057.jpg',
    description: 'Elegant, highly polished dark oak brown dress shoe with precise stitching metrics. Showcases an upscale tone optimized for luxury tailoring and formal wear. Crafted from Polished Full-Grain Leather.'
  },
  {
    name: 'The Obsidian Nero Dress Shoe',
    slug: 'obsidian-nero-dress-shoe',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Obsidian Black',
    thumbnail: '/images/products/IMG_4064.jpg',
    description: 'Sleek, ultra-smooth jet black calfskin dress shoe with a brilliant premium sheen finish. Perfect choice for elite formal dressing and evening black-tie events. Crafted from Premium Smooth Leather.'
  },
  {
    name: 'The Sovereign Black Oxford',
    slug: 'sovereign-black-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Classic Black',
    thumbnail: '/images/products/IMG_4065.jpg',
    description: 'A minimalist, sharp black leather dress shoe styled elegantly with a sleek profile. Engineered to offer maximum comfort while projecting timeless luxury status. Crafted from Full-Grain Calfskin Leather.'
  },
  {
    name: 'The Windsor Brunette Oxford',
    slug: 'windsor-brunette-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Chocolate Brown',
    thumbnail: '/images/products/IMG_4052.jpg',
    description: 'A sleek, chocolate-brown leather dress shoe featuring an ultra-smooth pristine surface finish and formal closed lace structure. Crafted from Smooth Calfskin Leather.'
  },
  {
    name: 'The Regent Umber Dress Shoe',
    slug: 'regent-umber-dress-shoe',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Regent Umber Brown',
    thumbnail: '/images/products/IMG_4053.jpg',
    description: 'A striking side-profile shot capturing the elegant silhouette of our premium deep-brown leather oxford dress shoe mounted on luxury gold hardware. Crafted from Polished Premium Leather.'
  },
  {
    name: 'The Heritage Brunette Cap-Toe',
    slug: 'heritage-brunette-cap-toe',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Dark Brunette Brown',
    thumbnail: '/images/products/IMG_4055.jpg',
    description: 'A beautifully balanced pair arrangement highlighting the rich tone, deep shadows, and sophisticated build of our signature brown dress shoes. Crafted from Polished Luxury Calfskin.'
  },
  {
    name: 'The Windsor Chestnut Oxford',
    slug: 'windsor-chestnut-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Chestnut Brown',
    thumbnail: '/images/products/IMG_4081.jpg',
    description: 'High-end chestnut brown dress shoe emphasizing a flawless premium sheen finish, deep color gradients, and elegant formal closed lacing. Crafted from Polished Smooth Leather.'
  },
  {
    name: 'The Executive Burnished Amber',
    slug: 'executive-burnished-amber',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Burnished Amber Tan',
    thumbnail: '/images/products/IMG_4103.jpg',
    description: 'A gorgeous amber tan dress shoe featuring an artisan high-shine finish and exquisite dark-burnished shading details concentrated at the toe box and seams. Crafted from Hand-Burnished Luxury Leather.'
  },
  {
    name: 'The Obsidian Cap-Toe Oxford',
    slug: 'obsidian-cap-toe-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 19500,
    color: 'Jet Black',
    thumbnail: '/images/products/IMG_4106.jpg',
    description: 'A pristine, highly formal jet-black leather oxford with minimal stitching lines and a sleek modern profile, designed perfectly for premium bespoke tailoring. Crafted from Premium Calfskin Leather.'
  },
  // Dual-Texture Shoes
  {
    name: 'The Apex Pebble-Grain Espresso',
    slug: 'apex-pebble-grain-espresso',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Espresso Brown',
    thumbnail: '/images/products/IMG_4067.jpg',
    description: 'Distinctive split-texture dress shoe featuring a smooth leather cap-toe box combined beautifully with a rich, textured espresso brown pebbled leather quarter. Crafted from Smooth & Pebbled Leather.'
  },
  {
    name: 'The Legacy Espresso Cap-Toe',
    slug: 'legacy-espresso-cap-toe',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Deep Espresso',
    thumbnail: '/images/products/IMG_4069.jpg',
    description: 'High-end dark brown dress shoe emphasizing the elegant contrast of pebbled leather grain side panels against a highly polished smooth leather cap-toe box. Crafted from Premium Pebbled & Calfskin Leather.'
  },
  {
    name: 'The Churchill Dual-Texture Oxford',
    slug: 'churchill-dual-texture-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Rich Espresso Brown',
    thumbnail: '/images/products/IMG_4070.jpg',
    description: 'A stunning pair presentation showcasing the balance of pebbled leather grain and smooth espresso surfaces. Ideal for adding rich texture to corporate ensembles. Crafted from Premium Mixed Leather Blend.'
  },
  {
    name: 'The Sovereign Pebble Nero',
    slug: 'sovereign-pebble-nero',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Obsidian Black',
    thumbnail: '/images/products/IMG_4049.jpg',
    description: 'A magnificent dual-textured black calfskin oxford showcasing premium stitched lines and high-contrast smooth versus textured leather segments. Crafted from Calfskin & Textured Grain Leather.'
  },
  {
    name: 'The Onyx Dual-Grain Oxford',
    slug: 'onyx-dual-grain-oxford',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Midnight Black',
    thumbnail: '/images/products/IMG_4071.jpg',
    description: 'A premium pair display of a sleek black oxford dress shoe combining rich pebbled side panels with highly polished smooth toe-cap segments. Crafted from Pebbled & Smooth Calfskin.'
  },
  {
    name: 'The Sovereign Textured Cap-Toe',
    slug: 'sovereign-textured-cap-toe',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Jet Black',
    thumbnail: '/images/products/IMG_4072.jpg',
    description: 'Striking side-profile shot of the luxury black dress shoe, emphasizing the exceptional texture transitions along the quarter paneling. Crafted from Premium Mixed Grains.'
  },
  {
    name: 'The Churchill Textured Espresso',
    slug: 'churchill-textured-espresso',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Espresso Dark Brown',
    thumbnail: '/images/products/IMG_4099.jpg',
    description: 'A superb dress shoe presentation showcasing a rich dark brown color palette across high-contrast grain panels and structural lining metrics. Crafted from Premium Pebbled & Smooth Grain Blend.'
  },
  {
    name: 'The Monarch Dual-Grain Nero',
    slug: 'monarch-dual-grain-nero',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 20500,
    color: 'Matte Jet Black',
    thumbnail: '/images/products/IMG_4102.jpg',
    description: 'An exceptional formal dress shoe combining smooth black leather base structures with finely micro-textured side quarters for a premium artistic contrast. Crafted from Smooth & Grained Calfskin Blend.'
  },
  // Brogue Shoes
  {
    name: 'The Kensington Burnished Brogue',
    slug: 'kensington-burnished-brogue',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 21500,
    color: 'Burnished Espresso Brown',
    thumbnail: '/images/products/IMG_4073.jpg',
    description: 'Elegant deep espresso brown leather dress shoe featuring delicate wingtip brogue perforations and a sophisticated dark burnished toe box finish. Crafted from Full-Grain Luxury Leather.'
  },
  {
    name: 'The Apex Midnight Semi-Brogue',
    slug: 'apex-midnight-semi-brogue',
    category: 'Shoes',
    subcategory: 'Formal shoes',
    price: 21500,
    color: 'Midnight Black',
    thumbnail: '/images/products/IMG_4077.jpg',
    description: 'Sophisticated black leather dress shoe highlighting a subtle perforated design layout along the cap-toe borders and side panel joints. Crafted from Calfskin Leather.'
  },
  // Boots
  {
    name: 'The Nero Croc-Embossed Chelsea',
    slug: 'nero-croc-embossed-chelsea',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 22500,
    color: 'Obsidian Black',
    thumbnail: '/images/products/IMG_4082.jpg',
    description: 'A bold, luxury mid-top boot wrapped completely in deep black crocodile-embossed leather texture with a streamlined side metallic zipper design. Crafted from Crocodile-Embossed Leather.'
  },
  {
    name: 'The Espresso Croc-Embossed Chelsea',
    slug: 'espresso-croc-embossed-chelsea',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 22500,
    color: 'Rich Espresso Brown',
    thumbnail: '/images/products/IMG_4085.jpg',
    description: 'An upscale, dramatic fashion boot styled in rich espresso dark brown crocodile-embossed leather. Engineered for an elite casual or formal statement wardrobe. Crafted from Crocodile-Embossed Leather.'
  },
  {
    name: 'The Kingsley Nero Chukka',
    slug: 'kingsley-nero-chukka',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 22000,
    color: 'Nero Black',
    thumbnail: '/images/products/IMG_4086.jpg',
    description: 'An exquisite mid-top chukka dress boot crafted from smooth, premium black calfskin leather with a minimal three-eyelet lace-up structure. Crafted from Smooth Luxury Calfskin.'
  },
  {
    name: 'The Sovereign Black Chelsea',
    slug: 'sovereign-black-chelsea',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 22500,
    color: 'Classic Black',
    thumbnail: '/images/products/IMG_4089.jpg',
    description: 'A sleek, timeless black leather Chelsea boot featuring flexible side gussets, dual pull tabs, a flawless polish, and a streamlined premium toe profile. Crafted from Premium Smooth Leather.'
  },
  {
    name: 'The Regent Nero Ankle Boot',
    slug: 'regent-nero-ankle-boot',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 22500,
    color: 'Deep Black',
    thumbnail: '/images/products/IMG_4090.jpg',
    description: 'A sharp side-profile presentation of our formal black leather Chelsea boot resting elegantly on minimalist gold display stands. Crafted from Polished Full-Grain Leather.'
  },
  {
    name: 'The Cognac Heritage Chelsea',
    slug: 'cognac-heritage-chelsea',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 23500,
    color: 'Warm Cognac Tan',
    thumbnail: '/images/products/IMG_4091.jpg',
    description: 'A magnificent luxury boot finished in a rich, warm cognac brown hue, offering exceptional depth, dark wood-grain shaded accents, and premium elasticity. Crafted from Hand-Finished Burnished Leather.'
  },
  {
    name: 'The Vanguard Wingtip Chelsea',
    slug: 'vanguard-wingtip-chelsea',
    category: 'Shoes',
    subcategory: 'Boots',
    price: 24500,
    color: 'Obsidian Black',
    thumbnail: '/images/products/IMG_4094.jpg',
    description: 'A striking black leather Chelsea boot upgraded beautifully with traditional wingtip perforation details and brogue patterns for an elite visual presence. Crafted from Calfskin Leather with Brogueing.'
  },
  // Jackets
  {
    name: 'The Vanguard Technical Bomber',
    slug: 'vanguard-technical-bomber',
    category: 'Jackets',
    subcategory: 'Jackets',
    price: 35000,
    color: 'Obsidian Midnight Blue',
    thumbnail: '/images/products/IMG_4265.jpg',
    description: 'A high-end, structured technical bomber jacket in deep obsidian midnight blue. Features architectural shoulder seam paneling, a subtle silver-grey contrast double-stripe tipping along the ribbed stand collar and hemline, full-zip front hardware, and streamlined zippered utility pockets. Crafted from Premium High-Density Technical Matte Nylon Blend.'
  },
  {
    name: 'The Stealth Aviator Bomber',
    slug: 'stealth-aviator-bomber',
    category: 'Jackets',
    subcategory: 'Jackets',
    price: 35000,
    color: 'Matte Obsidian Black',
    thumbnail: '/images/products/IMG_4282.jpg',
    description: 'An ultra-premium outerwear piece showcasing a crisp matte obsidian black colorway. Features a minimalist ribbed knit stand collar, comfortable elasticized cuffs, matching front-zip hardware closures, and a sophisticated low-profile utility flap-pocket accent seamlessly built onto the left sleeve upper arm. Crafted from High-Performance Weatherproof Matte Fabric Blend.'
  },
  {
    name: 'The Sentinel Luxury Field Jacket',
    slug: 'sentinel-luxury-field-jacket',
    category: 'Jackets',
    subcategory: 'Jackets',
    price: 35000,
    color: 'Classic Onyx Black',
    thumbnail: '/images/products/IMG_4283.jpg',
    description: 'An elegant, side-angled showcase of our signature onyx black smart-casual jacket. Engineered with clean minimal lines, a premium ribbed collar trim, and an architectural sleeve pocket profile that perfectly bridges high-performance utility with sharp luxury fashion styling. Crafted from Sleek Water-Resistant Structured Shell.'
  }
];

const sizesForCategory = (categoryName) => {
  const name = String(categoryName || '').toLowerCase();
  if (name.includes('shoe') || name.includes('loafer')) return ['39', '40', '41', '42', '43', '44', '45', '46'];
  if (name.includes('trouser') || name.includes('pant')) return ['30', '32', '34', '36', '38'];
  if (name.includes('shirt') || name.includes('polo')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (name.includes('tracksuit')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  return ['M', 'L', 'XL', 'XXL'];
};

async function ensureCategory(name, parentId = null) {
  const slug = slugify(name);
  const found = await db.query('SELECT id, parent_id FROM categories WHERE slug = $1', [slug]);
  if (found.rows.length) {
    if (parentId && !found.rows[0].parent_id) {
      await db.query('UPDATE categories SET parent_id = $1 WHERE id = $2', [parentId, found.rows[0].id]);
    }
    return found.rows[0].id;
  }

  const result = await db.query(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, slug, `${name} - Prince Esquire`, parentId]
  );
  return result.rows[0].id;
}

async function ensureBrand(name) {
  const brandName = name || 'Prince Esquire';
  const slug = slugify(brandName);
  const found = await db.query('SELECT id FROM brands WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;

  const result = await db.query(
    'INSERT INTO brands (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [brandName, slug, brandName]
  );
  return result.rows[0].id;
}

async function seed() {
  const categoryIds = new Map();

  // Ensure parent categories
  const shoesParentId = await ensureCategory('Shoes');
  categoryIds.set('shoes', shoesParentId);
  categoryIds.set(slugify('Shoes'), shoesParentId);

  const poloParentId = await ensureCategory('Polo T-shirts');
  categoryIds.set('polo t-shirts', poloParentId);
  categoryIds.set(slugify('Polo T-shirts'), poloParentId);

  const jacketsParentId = await ensureCategory('Jackets');
  categoryIds.set('jackets', jacketsParentId);
  categoryIds.set(slugify('Jackets'), jacketsParentId);

  const tracksuitsParentId = await ensureCategory('Track Suits');
  categoryIds.set('track suits', tracksuitsParentId);
  categoryIds.set(slugify('Track Suits'), tracksuitsParentId);
  categoryIds.set('tracksuits', tracksuitsParentId);
  categoryIds.set(slugify('Tracksuits'), tracksuitsParentId);

  // Ensure subcategories
  const formalShoesId = await ensureCategory('Formal shoes', shoesParentId);
  categoryIds.set('formal shoes', formalShoesId);
  categoryIds.set(slugify('Formal shoes'), formalShoesId);

  const bootsId = await ensureCategory('Boots', shoesParentId);
  categoryIds.set('boots', bootsId);
  categoryIds.set(slugify('Boots'), bootsId);

  const knittedPolosId = await ensureCategory('Knitted Polos', poloParentId);
  categoryIds.set('knitted polos', knittedPolosId);
  categoryIds.set(slugify('Knitted Polos'), knittedPolosId);

  const jacketsSubId = await ensureCategory('Jackets', jacketsParentId);
  categoryIds.set('jackets-sub', jacketsSubId);
  categoryIds.set(slugify('Jackets'), jacketsSubId);

  const sportswearId = await ensureCategory('Sportswear', tracksuitsParentId);
  categoryIds.set('sportswear', sportswearId);
  categoryIds.set(slugify('Sportswear'), sportswearId);

  const brandId = await ensureBrand('Prince Esquire');

  for (const product of NEW_PRODUCTS) {
    let categoryId = categoryIds.get(slugify(product.subcategory));
    if (!categoryId || product.subcategory === 'All') {
      categoryId = categoryIds.get(slugify(product.category));
    }
    const images = JSON.stringify([product.thumbnail].filter(Boolean));

    const productResult = await db.query(
      'INSERT INTO products (name, slug, description, price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9::jsonb, true) ' +
      'ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, category_id = EXCLUDED.category_id, brand_id = EXCLUDED.brand_id, thumbnail = EXCLUDED.thumbnail, images = EXCLUDED.images, is_active = true ' +
      'RETURNING id',
      [
        product.name,
        product.slug,
        product.description,
        product.price,
        categoryId,
        brandId,
        24,
        product.thumbnail,
        images,
      ]
    );

    const productId = productResult.rows[0].id;
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

    const color = product.color;
    const stockId = `${slugify(product.slug).toUpperCase()}-${slugify(color).toUpperCase()}`;
    for (const size of sizesForCategory(product.category)) {
      await db.query(
        'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, stock_id) VALUES ($1, $2, $3, 0, 6, $4, $5, $6, $7)',
        [productId, 'Variant', `${size} / ${color}`, product.thumbnail, color, size, stockId]
      );
    }

    console.log(`✓ Seeded: ${product.name}`);
  }

  console.log(`\n✓ Seeded ${NEW_PRODUCTS.length} new products into the database.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('seed-new-products failed:', error);
  process.exit(1);
});
