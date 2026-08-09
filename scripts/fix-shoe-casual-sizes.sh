#!/bin/bash
# Fix: Shoes → Casual must use EU shoe sizes (38–46), not S/M/L
set -euo pipefail
KEY="${SSH_KEY:-$HOME/.ssh/prince_esquire_ed25519}"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes \
  "$LOCAL/frontend/src/utils/inventoryVariants.js" \
  "$HOST:$ROOT/frontend/src/utils/inventoryVariants.js"

scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes \
  "$LOCAL/frontend/src/components/admin/ProductsView.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/ProductsView.jsx"

scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes \
  "$LOCAL/frontend/src/lib/productSizes.js" \
  "$HOST:$ROOT/frontend/src/lib/productSizes.js"

scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes \
  "$LOCAL/frontend/src/pages/ProductDetail.jsx" \
  "$HOST:$ROOT/frontend/src/pages/ProductDetail.jsx"

ssh -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$HOST" \
  'cd /var/www/Prince-Esquare/frontend && npm run build'

echo "Deployed. Hard-refresh admin and re-open New/Edit Product → Shoes → Casual."
