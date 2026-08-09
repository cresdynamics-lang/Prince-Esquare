#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/visitorController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/StoreAnalyticsViews.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/services/api.js")
text = p.read_text()
old = "getLive: () => API.get('/admin/visitors/live'),"
new = "getLive: (windowKey = '24h') => API.get('/admin/visitors/live', { params: { window: windowKey } }),"
if "params: { window:" in text:
    print("api.js already has window param")
elif old in text:
    p.write_text(text.replace(old, new, 1))
    print("api.js getLive patched")
else:
    raise SystemExit("api.js getLive marker not found")
PY

cd frontend && npm run build
cd ../backend && pm2 restart prince-backend
node -e "require('./src/controllers/visitorController'); console.log('visitorController loads')"
REMOTE

echo "Live visitors dashboard deployed"
