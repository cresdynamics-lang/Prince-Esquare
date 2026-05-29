const db = require('./src/config/db');

const CATEGORY_STRUCTURE = [
  { name: 'Polo T-shirts', sub: ['Knitted Polos', 'Polos'] },
  { name: 'Shoes', sub: ['Formal shoes', 'Casual', 'Boots', 'Sandals', 'Loafers'] },
  { name: 'Shirts', sub: ['Formal shirts', 'Casual', 'Presidential'] },
  { name: 'Suits', sub: ['Two piece', 'Three piece'] },
  { name: 'Blazers', sub: ['Modern', 'Casual', 'Classic'] },
  { name: 'Track Suits', sub: [] },
  { name: 'Jackets', sub: ['Jackets', 'Half jackets'] },
  { name: 'Trousers', sub: ['Khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'] },
  { name: 'Linen', sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'] },
  { name: 'Caps & Hats', sub: [] },
  { name: 'Belts & Ties', sub: [] },
  { name: 'Sweaters', sub: [] },
  { name: 'T-shirts', sub: ['Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'] },
];

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const sizesForCategory = (categoryName) => {
  const name = String(categoryName || '').toLowerCase();
  if (name.includes('shoe')) return ['39', '40', '41', '42', '43', '44', '45', '46'];
  if (name.includes('trouser') || name.includes('pant')) return ['30', '32', '34', '36', '38'];
  if (name.includes('shirt') || name.includes('polo')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  return ['M', 'L', 'XL', 'XXL'];
};

const inferCategoryName = (product) => {
  const category = String(product.category_name || '').toLowerCase();
  const sub = String(product.subcategory || '');

  if (category === 'more' && sub.toLowerCase() === 'track suits') return 'Track Suits';
  if (category === 'more' && sub.toLowerCase().includes('jacket')) return 'Jackets';
  if (category === 'more') return sub || 'T-shirts';

  const bySlug = CATEGORY_STRUCTURE.find((item) => slugify(item.name) === category);
  return bySlug?.name || product.category_name;
};

const inferColor = (product) => {
  const name = String(product.name || '');
  const inMatch = name.match(/\bin\s+(.+)$/i);
  if (inMatch) return inMatch[1].replace(/\s+\(V\d+\)$/i, '').trim();

  const color = name.match(/\b(Dark Brown|Navy Blue|Light Blue|Dark Black|Steel Grey|Grey|Black|Brown|Tan|Blue|Green|White|Red|Sandstone|Checked)\b/i);
  return color ? color[1] : 'Default';
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
  const { DUMMY_PRODUCTS } = await import('../frontend/src/utils/dummyData.js');
  const categoryIds = new Map();

  for (const category of CATEGORY_STRUCTURE) {
    const parentId = await ensureCategory(category.name);
    categoryIds.set(category.name.toLowerCase(), parentId);
    categoryIds.set(slugify(category.name), parentId);

    for (const sub of category.sub) {
      const subId = await ensureCategory(sub, parentId);
      categoryIds.set(sub.toLowerCase(), subId);
      categoryIds.set(slugify(sub), subId);
    }
  }

  for (const product of DUMMY_PRODUCTS) {
    const parentName = inferCategoryName(product);
    const categoryId = categoryIds.get(slugify(product.subcategory)) || categoryIds.get(slugify(parentName));
    const brandId = await ensureBrand(product.brand_name);
    const images = JSON.stringify([product.thumbnail].filter(Boolean));

    const productResult = await db.query(
      'INSERT INTO products (name, slug, description, price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9::jsonb, true) ' +
      'ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, category_id = EXCLUDED.category_id, brand_id = EXCLUDED.brand_id, thumbnail = EXCLUDED.thumbnail, images = EXCLUDED.images, is_active = true ' +
      'RETURNING id',
      [
        product.name,
        product.slug,
        `Exquisite ${product.name} from our latest collection. Crafted with precision and the finest materials.`,
        product.price || 0,
        categoryId,
        brandId,
        24,
        product.thumbnail,
        images,
      ]
    );

    const productId = productResult.rows[0].id;
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

    const color = inferColor(product);
    const stockId = `${slugify(product.slug).toUpperCase()}-${slugify(color).toUpperCase()}`;
    for (const size of sizesForCategory(parentName)) {
      await db.query(
        'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, image_url, color, size, stock_id) VALUES ($1, $2, $3, 0, 6, $4, $5, $6, $7)',
        [productId, 'Variant', `${size} / ${color}`, product.thumbnail, color, size, stockId]
      );
    }
  }

  console.log(`Seeded ${DUMMY_PRODUCTS.length} storefront products into the database.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('seed-dummy-products failed:', error);
  process.exit(1);
});
