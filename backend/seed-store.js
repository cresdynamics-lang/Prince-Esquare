const db = require('./src/config/db');
const catalog = require('./seed/catalogData');

const CATEGORY_ROWS = [
  ['Shoes', 'shoes'],
  ['Tracksuits', 'tracksuits'],
  ['Trousers', 'trousers'],
  ['Shirts', 'shirts'],
  ['Outerwear', 'outerwear'],
];

async function ensureCategory(name, slug) {
  const found = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;
  const ins = await db.query(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [name, slug, `${name} — Prince Esquire`]
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
    for (const [name, slug] of CATEGORY_ROWS) {
      await ensureCategory(name, slug);
    }

    for (const row of catalog) {
      const categoryId = await ensureCategory(
        CATEGORY_ROWS.find((c) => c[1] === row.categorySlug)[0],
        row.categorySlug
      );
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
          images,
        ]
      );
      const productId = pRes.rows[0].id;

      const existingV = await db.query('SELECT COUNT(*)::int AS c FROM product_variants WHERE product_id = $1', [productId]);
      if (existingV.rows[0].c > 0) continue;

      for (const color of row.colors) {
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
