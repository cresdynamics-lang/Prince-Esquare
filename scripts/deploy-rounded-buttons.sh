#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"
SSH="ssh -i $KEY -o BatchMode=yes -o ConnectTimeout=25"

rsync -az -e "$SSH" "$LOCAL/frontend/src/components/ProductCard.jsx" "$HOST:$ROOT/frontend/src/components/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/components/ProductShowcase.jsx" "$HOST:$ROOT/frontend/src/components/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/components/HeroSlider.jsx" "$HOST:$ROOT/frontend/src/components/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/components/Navbar.jsx" "$HOST:$ROOT/frontend/src/components/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/pages/Home.jsx" "$HOST:$ROOT/frontend/src/pages/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/pages/Products.jsx" "$HOST:$ROOT/frontend/src/pages/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/pages/ProductDetail.jsx" "$HOST:$ROOT/frontend/src/pages/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/pages/Cart.jsx" "$HOST:$ROOT/frontend/src/pages/"

$SSH "$HOST" 'cd /var/www/Prince-Esquare/frontend && npm run build'

echo "Deployed: rounded buttons across storefront"
