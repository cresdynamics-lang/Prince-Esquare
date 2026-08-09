#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"
RS="rsync -az -e ssh\ -i\ $KEY\ -o\ BatchMode=yes"

# New Meta Pixel helper + event wiring
eval $RS "$LOCAL/frontend/src/lib/metaPixel.js"        "$HOST:$ROOT/frontend/src/lib/"
eval $RS "$LOCAL/frontend/src/pages/ProductDetail.jsx" "$HOST:$ROOT/frontend/src/pages/"
eval $RS "$LOCAL/frontend/src/pages/Payment.jsx"       "$HOST:$ROOT/frontend/src/pages/"
eval $RS "$LOCAL/frontend/src/store/useCartStore.js"   "$HOST:$ROOT/frontend/src/store/"
eval $RS "$LOCAL/backend/src/controllers/orderController.js" "$HOST:$ROOT/backend/src/controllers/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" 'cd /var/www/Prince-Esquare/frontend && npm run build && cd ../backend && pm2 restart prince-backend'

echo "Deployed: Meta Pixel ViewContent + AddToCart + Purchase events"
