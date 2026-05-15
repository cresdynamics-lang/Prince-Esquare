const db = require('./src/config/db');
const catalog = require('./seed/catalogData');

const CATEGORY_STRUCTURE = [
  { name: 'Polo T-shirts', sub: ['Knitted Polos', 'Polos'] },
  { name: 'Shoes', sub: ['Formal shoes', 'Casual', 'Boots', 'Sandals', 'Loafers'] },
  { name: 'Shirts', sub: ['Formal shirts', 'Casual', 'Presidential'] },
  { name: 'Suits', sub: ['Two piece', 'Three piece'] },
  { name: 'Blazers', sub: [] },
  { name: 'Track Suits', sub: [] },
  { name: 'Jackets', sub: ['Jackets', 'Half jackets'] },
  { name: 'Trousers', sub: ['khaki', 'Formal', 'Chino', 'Jeans', 'Gurkha'] },
  { name: 'Linen', sub: ['Linen Set', 'Linen Trousers', 'Linen shirts', 'Linen shorts'] },
  { name: 'Caps & Hats', sub: [] },
  { name: 'Belts & Ties', sub: [] },
  { name: 'Sweaters', sub: [] },
  { name: 'T-shirts', sub: ['Sweat-shirts', 'Round-neck T-shirts', 'V-neck T-shirts'] },
];

async function ensureCategory(name, parentId = null) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const found = await db.query('SELECT id, parent_id FROM categories WHERE slug = $1', [slug]);
  if (found.rows.length) {
    if (parentId && !found.rows[0].parent_id) {
       await db.query('UPDATE categories SET parent_id = $1 WHERE id = $2', [parentId, found.rows[0].id]);
    }
    return found.rows[0].id;
  }
  const ins = await db.query(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, slug, `${name} — Prince Esquire`, parentId]
  );
  return ins.rows[0].id;
}

async function ensureBrand(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const found = await db.query('SELECT id FROM brands WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;
  const ins = await db.query(
    'INSERT INTO brands (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [name, slug, `${name}`]
  );
  return ins.rows[0].id;
}

async function seedStore() {
  try {
    const slugToId = {};

    for (const cat of CATEGORY_STRUCTURE) {
      const parentId = await ensureCategory(cat.name);
      const parentSlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      slugToId[parentSlug] = parentId;
      
      for (const sub of cat.sub) {
        const subId = await ensureCategory(sub, parentId);
        const subSlug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        slugToId[subSlug] = subId;
      }
    }

    // Manual mapping for legacy slugs in catalogData.js
    const legacyMap = {
      'tracksuits': slugToId['track-suits'],
      'outerwear': slugToId['jackets']
    };

    for (const row of catalog) {
      let categoryId = legacyMap[row.categorySlug] || slugToId[row.categorySlug];
      
      // If a subcategory is specified, use it
      if (row.subCategory) {
        const subSlug = row.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (slugToId[subSlug]) {
          categoryId = slugToId[subSlug];
        }
      }

      if (!categoryId) {
        console.warn(`Category not found for slug: ${row.categorySlug}, skipping product: ${row.name}`);
        continue;
      }
      
      const brandId = await ensureBrand(row.brandName);

      const images = JSON.stringify([row.thumbnail]);
      const pRes = await db.query(
        'INSERT INTO products (name, slug, description, price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active) ' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, true) ' +
        'ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, ' +
        'category_id = EXCLUDED.category_id, brand_id = EXCLUDED.brand_id, is_featured = EXCLUDED.is_featured, ' +
        'thumbnail = EXCLUDED.thumbnail, images = EXCLUDED.images, is_active = true ' +
        'RETURNING id',
        [
          row.name,
          row.slug,
          row.description,
          row.price,
          categoryId,
          brandId,
          99,
          row.featured,
          row.thumbnail,
          row.images || images,
        ]
      );
      const productId = pRes.rows[0].id;

      const existingV = await db.query('SELECT COUNT(*)::int AS c FROM product_variants WHERE product_id = $1', [productId]);
      if (existingV.rows[0].c > 0) continue;

      for (const color of (row.colors || [])) {
        await db.query(
          'INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity) VALUES ($1, $2, $3, 0, 20)',
          [productId, 'Color', color]
        );
      }
    }

    console.log('Store catalog seeded successfully.');
    process.exit(0);
  } catch (e) {
    console.error('seed-store failed:', e);
    process.exit(1);
  }
}

seedStore();
