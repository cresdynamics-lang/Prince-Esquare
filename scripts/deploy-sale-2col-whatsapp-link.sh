#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/pages/Sale.jsx" \
  "$HOST:$ROOT/frontend/src/pages/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/ProductCard.jsx" \
  "$HOST:$ROOT/frontend/src/components/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/storeContact.js" \
  "$HOST:$ROOT/frontend/src/lib/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/StoreAnalyticsViews.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" 'cd /var/www/Prince-Esquare/frontend && npm run build && cd ../backend && pm2 restart prince-backend'

echo "Sale 2-col grid + WhatsApp product link deployed"
