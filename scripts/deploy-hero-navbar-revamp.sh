#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"
SSH="ssh -i $KEY -o BatchMode=yes -o ConnectTimeout=25"

rsync -az -e "$SSH" "$LOCAL/frontend/src/data/homepageContent.js" "$HOST:$ROOT/frontend/src/data/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/components/HeroSlider.jsx" "$HOST:$ROOT/frontend/src/components/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/components/Navbar.jsx" "$HOST:$ROOT/frontend/src/components/"
rsync -az -e "$SSH" "$LOCAL/frontend/src/pages/Home.jsx" "$HOST:$ROOT/frontend/src/pages/"
rsync -az -e "$SSH" "$LOCAL/frontend/index.html" "$HOST:$ROOT/frontend/"

# Patch boutique address into production seoData.js (kept server-side authoritative)
$SSH "$HOST" "cd $ROOT/frontend/src/seo && \
  sed -i \"s|streetAddress: 'Prince Esquire Boutique',|streetAddress: 'Yala Towers, Nairobi CBD',|\" seoData.js && \
  grep -q \"streetAddress: 'Yala Towers'\" seoData.js || \
  sed -i \"0,/addressLocality: 'Nairobi',/s//streetAddress: 'Yala Towers',\n    addressLocality: 'Nairobi',/\" seoData.js"

$SSH "$HOST" 'cd /var/www/Prince-Esquare/frontend && npm run build'

echo "Deployed: hero revamp + right-side click navbar + optimized images"
