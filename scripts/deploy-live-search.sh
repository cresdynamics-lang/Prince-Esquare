#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
LOCAL="/Users/airm1/Projects/Prince-Esquare"
ROOT="/var/www/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/searchController.js" \
  "$LOCAL/backend/src/routes/searchRoutes.js" \
  "$LOCAL/backend/src/db/migrations/053_restock_alerts.sql" \
  "$HOST:$ROOT/backend/src/controllers/" 2>/dev/null || true

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/routes/searchRoutes.js" \
  "$HOST:$ROOT/backend/src/routes/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/db/migrations/053_restock_alerts.sql" \
  "$HOST:$ROOT/backend/src/db/migrations/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/SearchOverlay.jsx" \
  "$LOCAL/frontend/src/components/Navbar.jsx" \
  "$HOST:$ROOT/frontend/src/components/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

# Patch api.js if searchAPI missing
if ! grep -q 'searchAPI' frontend/src/services/api.js; then
  python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/services/api.js")
text = p.read_text()
block = """
export const searchAPI = {
  search: (q) => API.get('/search', { params: { q } }),
  suggestions: (q) => API.get('/search/suggestions', { params: { q } }),
  restockAlert: (body) => API.post('/search/restock-alert', body),
};
"""
needle = "export const productAPI = {"
if needle in text and "searchAPI" not in text:
    end = text.find("};", text.find(needle)) + 2
    text = text[:end] + "\n\n" + block + text[end:]
    p.write_text(text)
    print("searchAPI added to api.js")
PY
fi

cd backend
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -f src/db/migrations/053_restock_alerts.sql 2>/dev/null || node -e "
const fs=require('fs'); const db=require('./src/config/db');
(async()=>{
  await db.query(fs.readFileSync('src/db/migrations/053_restock_alerts.sql','utf8'));
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
"

cd ../frontend
npm run build 2>&1 | tail -4
echo "Bundle: $(grep -o 'index-[^.]*\.js' dist/index.html)"
pm2 restart prince-backend
REMOTE

echo "Live search deployed."
