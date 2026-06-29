require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

const PRODUCTS_JSON = path.join(__dirname, '..', 'frontend', 'public', 'products.json');

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const CATEGORY_MAP = {
  Footwear: { parentSlug: 'shoes' },
  Apparel: { parentSlug: 'polo-t-shirts' }, // default, overridden by subcategory
};

const SUBCATEGORY_MAP = {
  'Knit Polo': 'knitted-polos',
  'Outerwear / Jacket': 'jackets',
  'Derby': 'formal-shoes',
  'Oxford': 'formal-shoes',
  'Dual-Texture Oxford': 'formal-shoes',
  'Dual-Texture Derby': 'formal-shoes',
  'Brogue': 'formal-shoes',
  'Semi-Brogue Oxford': 'formal-shoes',
  'Chelsea Boot': 'boots',
  'Chukka Boot': 'boots',
};

function resolveCategorySlug(product) {
  const sub = product.subcategory;
  if (SUBCATEGORY_MAP[sub]) return SUBCATEGORY_MAP[sub];
  if (product.category === 'Footwear') return 'formal-shoes';
  if (product.category === 'Apparel') return 'polo-t-shirts';
  return 'shoes';
}

function resolvePrice(name) {
  const n = name.toLowerCase();
  if (n.includes('chelsea') || n.includes('chukka')) return 35000;
  if (n.includes('brogue')) return 28000;
  if (n.includes('oxford') || n.includes('derby')) return 22000;
  if (n.includes('polo')) return 7500;
  if (n.includes('bomber') || n.includes('jacket') || n.includes('outerwear')) return 45000;
  return 20000;
}

async function ensureCategory(name, parentId = null) {
  const slug = slugify(name);
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
  const slug = slugify(name);
  const found = await db.query('SELECT id FROM brands WHERE slug = $1', [slug]);
  if (found.rows.length) return found.rows[0].id;
  const ins = await db.query(
    'INSERT INTO brands (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [name, slug, name]
  );
  return ins.rows[0].id;
}

async function run() {
  const raw = fs.readFileSync(PRODUCTS_JSON, 'utf8');
  const products = JSON.parse(raw);

  const allCategories = await db.query('SELECT id, name, slug, parent_id FROM categories');
  const bySlug = {};
  const byName = {};
  allCategories.rows.forEach((r) => {
    bySlug[r.slug] = r;
    byName[r.name.toLowerCase()] = r;
  });

  function findCategory(slug) {
    if (bySlug[slug]) return bySlug[slug];
    const capitalized = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    if (bySlug[capitalized.toLowerCase()]) return bySlug[capitalized.toLowerCase()];
    if (byName[capitalized.toLowerCase()]) return byName[capitalized.toLowerCase()];
    return null;
  }

  for (const row of products) {
    const subSlug = SUBCATEGORY_MAP[row.subcategory];
    let categoryId = null;

    if (subSlug) {
      const subCat = findCategory(subSlug);
      if (subCat) categoryId = subCat.id;
    }

    if (!categoryId) {
      const catSlug = CATEGORY_MAP[row.category]?.parentSlug;
      const parentCat = findCategory(catSlug || '');
      if (parentCat) {
        const children = allCategories.rows.filter((c) => c.parent_id === parentCat.id);
        if (children.length) categoryId = children[0].id;
        else categoryId = parentCat.id;
      }
    }

    if (!categoryId) {
      console.warn(`Category not found for ${row.category}/${row.subcategory}, skipping: ${row.name}`);
      continue;
    }

    const brandId = await ensureBrand(row.brand || 'Prince Esquire');
    const slug = `${slugify(row.name)}-${row.id}`;
    const description = row.description || `Exquisite ${row.name} from our latest collection.`;
    const thumb = `/images/products/${row.fileName.replace(/\.HEIC$/i, '.jpg')}`;
    const price = resolvePrice(row.name);

    const pRes = await db.query(
      `INSERT INTO products (name, slug, description, price, category_id, brand_id, stock_quantity, is_featured, thumbnail, images, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
         category_id = EXCLUDED.category_id, brand_id = EXCLUDED.brand_id, thumbnail = EXCLUDED.thumbnail, is_active = EXCLUDED.is_active
       RETURNING id`,
      [row.name, slug, description, price, categoryId, brandId, 20, true, thumb, JSON.stringify([thumb]), true]
    );

    const productId = pRes.rows[0].id;
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
    await db.query(
      `INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity) VALUES ($1, 'Default', $2, 0, 20)`,
      [productId, row.color || 'Default']
    );

    console.log(`Upserted: ${row.id} -> ${row.name}`);
  }

  console.log('Done importing new arrivals.');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
