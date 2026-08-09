#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/db/migrations/056_whatsapp_order_click.sql" \
  "$HOST:$ROOT/backend/src/db/migrations/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/visitorController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/VisitorTracker.jsx" \
  "$LOCAL/frontend/src/components/ProductCard.jsx" \
  "$HOST:$ROOT/frontend/src/components/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/StoreAnalyticsViews.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare/backend
export $(grep -v '^#' .env | xargs)
node -e "
const fs=require('fs');
const db=require('./src/config/db');
(async()=>{
  const sql=fs.readFileSync('src/db/migrations/056_whatsapp_order_click.sql','utf8');
  await db.query(sql);
  console.log('migration 056 ok');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
"
cd ../frontend && npm run build
cd ../backend && pm2 restart prince-backend
REMOTE

echo "WhatsApp click tracking deployed"
