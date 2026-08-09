#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/storeContact.js" \
  "$HOST:$ROOT/frontend/src/lib/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/orderController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" 'cd /var/www/Prince-Esquare/frontend && npm run build && cd ../backend && pm2 restart prince-backend'

echo "WhatsApp order message (product + image links) deployed"
