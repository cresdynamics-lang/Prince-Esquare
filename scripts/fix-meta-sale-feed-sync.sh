#!/bin/bash
# Fix Meta sale feed so it matches /sale (was excluding products with stock_quantity = 0)
set -euo pipefail
KEY="${SSH_KEY:-$HOME/.ssh/prince_esquare_ed25519}"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes \
  "$LOCAL/backend/src/feeds/metaCatalogFeed.js" \
  "$HOST:$ROOT/backend/src/feeds/metaCatalogFeed.js"

scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes \
  "$LOCAL/backend/src/controllers/feedController.js" \
  "$HOST:$ROOT/backend/src/controllers/feedController.js"

ssh -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
pm2 restart prince-backend --update-env
sleep 2
LINES=$(curl -s http://127.0.0.1:5000/feeds/meta-sale-catalog.csv | wc -l)
echo "FEED_LINES=$LINES"
echo "FEED_PRODUCTS=$((LINES - 1))"
curl -s http://127.0.0.1:5000/api/products/sale | python3 -c 'import sys,json; d=json.load(sys.stdin).get("data") or {}; print("SALE_API", len(d.get("products") or []))'
curl -s http://127.0.0.1:5000/feeds/meta-sale-catalog.csv | head -2
REMOTE

echo
echo "Public URL: https://prince-esquire.co.ke/feeds/meta-sale-catalog.csv"
echo "In Meta: Commerce Manager → Data sources → Upload now (CSV)"
