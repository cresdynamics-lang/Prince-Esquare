#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/db/migrations/055_product_is_on_sale.sql" \
  "$HOST:$ROOT/backend/src/db/migrations/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/visitorController.js" \
  "$LOCAL/backend/src/controllers/seoController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/routes/adminVisitorRoutes.js" \
  "$HOST:$ROOT/backend/src/routes/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/feeds/metaCatalogFeed.js" \
  "$HOST:$ROOT/backend/src/feeds/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/StoreAnalyticsViews.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path

# Patch api.js endpoints without overwriting whole file
p = Path("frontend/src/services/api.js")
text = p.read_text()
if "getSaleCatalogPicker" not in text:
    old = """export const adminVisitorAPI = {
  getLive: (windowKey = '24h') => API.get('/admin/visitors/live', { params: { window: windowKey } }),
  getSaleCatalog: () => API.get('/admin/visitors/sale-catalog'),
};"""
    new = """export const adminVisitorAPI = {
  getLive: (windowKey = '24h') => API.get('/admin/visitors/live', { params: { window: windowKey } }),
  getSaleCatalog: () => API.get('/admin/visitors/sale-catalog'),
  getSaleCatalogPicker: (params = {}) => API.get('/admin/visitors/sale-catalog/picker', { params }),
  setSaleCatalog: (body) => API.patch('/admin/visitors/sale-catalog', body),
};"""
    if old not in text:
        # fallback: insert after getSaleCatalog line
        marker = "getSaleCatalog: () => API.get('/admin/visitors/sale-catalog'),"
        if marker not in text:
            raise SystemExit("api.js adminVisitorAPI marker not found")
        text = text.replace(
            marker,
            marker + "\n  getSaleCatalogPicker: (params = {}) => API.get('/admin/visitors/sale-catalog/picker', { params }),\n  setSaleCatalog: (body) => API.patch('/admin/visitors/sale-catalog', body),",
            1,
        )
    else:
        text = text.replace(old, new, 1)
    p.write_text(text)
    print("api.js sale catalog manage endpoints added")
else:
    print("api.js already has sale catalog manage endpoints")

# Surgically replace SALE_SECTIONS + getSaleProducts in production productController
pc = Path("backend/src/controllers/productController.js")
text = pc.read_text()
start = text.find("const SALE_SECTIONS = [")
end = text.find("// @desc    Get featured products")
if start < 0 or end < 0:
    raise SystemExit("productController sale section markers not found")

replacement = r'''function sectionFromProduct(product) {
  const cat = product.category_slug || '';
  const parent = product.parent_category_slug || '';
  const name = product.name || '';

  if (cat === 'track-suits' || parent === 'track-suits') {
    return { title: 'Track Suits', slug: 'track-suits' };
  }
  if (cat === 'khaki' || parent === 'khaki') {
    return { title: 'Khaki Trousers', slug: 'khaki' };
  }
  if (cat === 'boots' || parent === 'boots' || /boot/i.test(name)) {
    return { title: 'Official Boots', slug: 'boots' };
  }
  if (cat === 'formal-shoes' || parent === 'formal-shoes' || parent === 'shoes' || cat.includes('shoe')) {
    return { title: 'Official Shoes', slug: 'formal-shoes' };
  }
  return {
    title: product.category_name || product.parent_category_name || 'Sale Picks',
    slug: cat || parent || 'sale',
  };
}

async function fetchOnSaleProducts() {
  const sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug,
           p_cat.name AS parent_category_name, p_cat.slug AS parent_category_slug,
           b.name AS brand_name,
           COALESCE(sales.units_sold, 0)::int AS units_sold,
           COALESCE(carts.cart_adds, 0)::int AS cart_adds
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN (
      SELECT oi.product_id, SUM(oi.quantity) AS units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      GROUP BY oi.product_id
    ) sales ON sales.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS cart_adds
      FROM product_events
      WHERE event_type = 'cart_add' AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY product_id
    ) carts ON carts.product_id = p.id
    WHERE p.is_active = true AND p.stock_quantity > 0 AND p.is_on_sale = true
    ORDER BY COALESCE(sales.units_sold, 0) DESC, COALESCE(carts.cart_adds, 0) DESC,
             p.is_featured DESC, p.created_at DESC
  `;

  try {
    const result = await db.query(sql);
    return result.rows;
  } catch (err) {
    if (err.code !== '42P01') throw err;
    const fallbackSql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             p_cat.name AS parent_category_name, p_cat.slug AS parent_category_slug,
             b.name AS brand_name,
             COALESCE(sales.units_sold, 0)::int AS units_sold,
             0::int AS cart_adds
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN (
        SELECT oi.product_id, SUM(oi.quantity) AS units_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
        GROUP BY oi.product_id
      ) sales ON sales.product_id = p.id
      WHERE p.is_active = true AND p.stock_quantity > 0 AND p.is_on_sale = true
      ORDER BY COALESCE(sales.units_sold, 0) DESC, p.is_featured DESC, p.created_at DESC
    `;
    const result = await db.query(fallbackSql);
    return result.rows;
  }
}

// @desc    Sale showcase — admin-managed is_on_sale products
// @route   GET /api/products/sale
exports.getSaleProducts = async (req, res, next) => {
  try {
    const products = await fetchOnSaleProducts();
    const sectionMap = new Map();

    for (const product of products) {
      const section = sectionFromProduct(product);
      if (!sectionMap.has(section.slug)) {
        sectionMap.set(section.slug, { title: section.title, slug: section.slug, products: [] });
      }
      sectionMap.get(section.slug).products.push(product);
    }

    formatResponse(res, 200, true, 'Sale products fetched', {
      sections: Array.from(sectionMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

'''

text = text[:start] + replacement + text[end:]
pc.write_text(text)
print("productController getSaleProducts switched to is_on_sale")
PY

# Migration + seed current sale products
cd backend
export $(grep -v '^#' .env | xargs)
node -e "
const fs=require('fs');
const db=require('./src/config/db');
(async()=>{
  const sql=fs.readFileSync('src/db/migrations/055_product_is_on_sale.sql','utf8');
  await db.query(sql);
  const r=await db.query('SELECT COUNT(*)::int AS c FROM products WHERE is_on_sale=true');
  console.log('is_on_sale products:', r.rows[0].c);
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
"

cd ../frontend && npm run build
cd ../backend && pm2 restart prince-backend
sleep 2
curl -sS http://127.0.0.1:5000/api/products/sale -o /tmp/sale.json
python3 - <<'V'
import json
d=json.load(open('/tmp/sale.json'))
secs=d.get('data',{}).get('sections',[])
print('sections', len(secs))
for s in secs:
    print(f"  {s.get('title')}: {len(s.get('products',[]))}")
print('TOTAL', sum(len(s.get('products',[])) for s in secs))
V
REMOTE

echo "Sale catalog Add/Subtract management deployed"
