#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/ProductCard.jsx" \
  "$LOCAL/frontend/src/pages/Sale.jsx" \
  "$LOCAL/frontend/src/lib/storeContact.js" \
  "$LOCAL/frontend/src/lib/productSizes.js" \
  "$HOST:$ROOT/frontend/src/components/" 2>/dev/null || true

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/ProductCard.jsx" \
  "$HOST:$ROOT/frontend/src/components/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/pages/Sale.jsx" \
  "$HOST:$ROOT/frontend/src/pages/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/storeContact.js" \
  "$LOCAL/frontend/src/lib/productSizes.js" \
  "$HOST:$ROOT/frontend/src/lib/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path
pc = Path("backend/src/controllers/productController.js")
text = pc.read_text()

if "attachVariants" not in text:
    helper = '''
async function attachVariants(products) {
  if (!products.length) return products;
  const ids = products.map((p) => p.id);
  const result = await db.query(
    'SELECT * FROM product_variants WHERE product_id = ANY($1::uuid[]) ORDER BY value ASC',
    [ids],
  );
  const byProduct = {};
  for (const variant of result.rows) {
    if (!byProduct[variant.product_id]) byProduct[variant.product_id] = [];
    byProduct[variant.product_id].push(variant);
  }
  return products.map((p) => ({ ...p, variants: byProduct[p.id] || [] }));
}

'''
    marker = "// @desc    Sale showcase — admin-managed is_on_sale products"
    if marker not in text:
        raise SystemExit("sale marker not found")
    text = text.replace(marker, helper + marker, 1)
    text = text.replace(
        "const products = await fetchOnSaleProducts();",
        "const products = await attachVariants(await fetchOnSaleProducts());",
        1,
    )
    pc.write_text(text)
    print("productController attachVariants added")
else:
    print("productController already has attachVariants")
PY

cd frontend && npm run build
cd ../backend && pm2 restart prince-backend
REMOTE

echo "Sale WhatsApp Order deployed"
