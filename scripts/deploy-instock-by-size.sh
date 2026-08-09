#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"
RS="rsync -az -e ssh\ -i\ $KEY\ -o\ BatchMode=yes\ -o\ ConnectTimeout=25"

eval $RS "$LOCAL/backend/src/utils/productAvailability.js" "$HOST:$ROOT/backend/src/utils/"
eval $RS "$LOCAL/backend/src/controllers/productController.js" "$HOST:$ROOT/backend/src/controllers/"
eval $RS "$LOCAL/frontend/src/pages/ProductDetail.jsx" "$HOST:$ROOT/frontend/src/pages/"
eval $RS "$LOCAL/frontend/src/pages/Products.jsx" "$HOST:$ROOT/frontend/src/pages/"
eval $RS "$LOCAL/frontend/src/components/ProductCard.jsx" "$HOST:$ROOT/frontend/src/components/"
eval $RS "$LOCAL/frontend/src/lib/storeContact.js" "$HOST:$ROOT/frontend/src/lib/"
eval $RS "$LOCAL/frontend/src/pages/Sale.jsx" "$HOST:$ROOT/frontend/src/pages/"

ssh -i "$KEY" -o BatchMode=yes -o ConnectTimeout=25 "$HOST" \
  'cd /var/www/Prince-Esquare/frontend && npm run build && cd ../backend && pm2 restart prince-backend'

echo "Deployed: storefront always in stock + WhatsApp cards"
