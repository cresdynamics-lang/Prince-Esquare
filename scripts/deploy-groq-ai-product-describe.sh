#!/bin/bash
set -euo pipefail
KEY_FILE="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"
SSH=(ssh -i "$KEY_FILE" -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=25)
RSYNC=(rsync -az -e "ssh -i $KEY_FILE -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=25")

GROQ_API_KEY_VALUE="${GROQ_API_KEY:?Set GROQ_API_KEY in the environment before deploying}"

"${RSYNC[@]}" "$LOCAL/backend/src/services/groqProductVision.js" "$HOST:$ROOT/backend/src/services/"
"${RSYNC[@]}" "$LOCAL/backend/src/controllers/aiProductController.js" "$HOST:$ROOT/backend/src/controllers/"
"${RSYNC[@]}" "$LOCAL/backend/src/controllers/productController.js" "$HOST:$ROOT/backend/src/controllers/"
"${RSYNC[@]}" "$LOCAL/backend/src/routes/adminProductRoutes.js" "$HOST:$ROOT/backend/src/routes/"
"${RSYNC[@]}" "$LOCAL/backend/src/middleware/multer.js" "$HOST:$ROOT/backend/src/middleware/"
"${RSYNC[@]}" "$LOCAL/backend/src/db/migrations/057_product_focus_description.sql" "$HOST:$ROOT/backend/src/db/migrations/"
"${RSYNC[@]}" "$LOCAL/frontend/src/components/admin/ProductsView.jsx" "$HOST:$ROOT/frontend/src/components/admin/"
"${RSYNC[@]}" "$LOCAL/.tmp-prod/api.prod.js" "$HOST:$ROOT/frontend/src/services/api.js"

"${SSH[@]}" "$HOST" "GROQ_API_KEY_VALUE='$GROQ_API_KEY_VALUE' bash -s" <<'REMOTE'
set -euo pipefail
ROOT="/var/www/Prince-Esquare"
ENV_FILE="$ROOT/backend/.env"

# Migration
if [ -f "$ENV_FILE" ] && grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  DB_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT/backend/src/db/migrations/057_product_focus_description.sql"
else
  sudo -u postgres psql -d prince_esquire -v ON_ERROR_STOP=1 -f "$ROOT/backend/src/db/migrations/057_product_focus_description.sql"
fi

touch "$ENV_FILE"
if grep -q '^GROQ_API_KEY=' "$ENV_FILE"; then
  sed -i "s|^GROQ_API_KEY=.*|GROQ_API_KEY=${GROQ_API_KEY_VALUE}|" "$ENV_FILE"
else
  printf '\nGROQ_API_KEY=%s\n' "${GROQ_API_KEY_VALUE}" >> "$ENV_FILE"
fi
grep -q '^GROQ_VISION_MODEL=' "$ENV_FILE" || echo 'GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct' >> "$ENV_FILE"

# Product detail: show focus_description when present
PD="$ROOT/frontend/src/pages/ProductDetail.jsx"
python3 - <<'PY'
from pathlib import Path
p = Path("/var/www/Prince-Esquare/frontend/src/pages/ProductDetail.jsx")
if not p.exists():
    raise SystemExit(0)
t = p.read_text()
if "product.focus_description" in t:
    print("ProductDetail already has focus_description")
else:
    t2 = t.replace(
        "description={product.description}",
        """description={
                    product.focus_description
                      ? `${product.focus_description}\\n\\n${product.description || ''}`.trim()
                      : product.description
                  }""",
        1,
    )
    if t2 == t:
        print("WARN: ProductDescription description prop not patched")
    else:
        p.write_text(t2)
        print("ProductDetail patched")
PY

cd "$ROOT/backend" && pm2 restart prince-backend --update-env
sleep 2
pm2 ls | head -8
cd "$ROOT/frontend" && npm run build
echo "Deployed: Groq AI product describe"
REMOTE
