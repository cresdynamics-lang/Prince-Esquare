#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes -o ConnectTimeout=25" \
  "$LOCAL/frontend/src/pages/Products.jsx" \
  "$HOST:$ROOT/frontend/src/pages/"

ssh -i "$KEY" -o BatchMode=yes -o ConnectTimeout=25 "$HOST" \
  'cd /var/www/Prince-Esquare/frontend && npm run build'

echo "Deployed: featured products below category buttons"
