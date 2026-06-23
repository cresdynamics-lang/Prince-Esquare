#!/bin/bash
# Safe production update Ã¢â‚¬â€ run ON the server from the repo root (e.g. /var/www/Prince-Esquare).
# Does NOT delete data. Runs only pending SQL migrations.
#
# Usage:
#   cd /path/to/Prince-Esquare
#   bash scripts/server-update.sh
#
# Optional env:
#   SKIP_BACKUP=1        skip pg_dump
#   SKIP_BUILD=1         skip frontend build
#   RUN_MIGRATE=1        run db:migrate (default 1)
#   AUTO_BOOTSTRAP=false set in backend/.env before restart if you want no auto POS link sync

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/prince-esquare}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RUN_MIGRATE="${RUN_MIGRATE:-1}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

echo "=== Prince Esquare production update ==="
echo "Repo: $REPO_ROOT"

if [ ! -f "$BACKEND/package.json" ]; then
  echo "ERROR: backend/package.json not found. Wrong directory?"
  exit 1
fi

if [ ! -f "$BACKEND/.env" ]; then
  echo "ERROR: backend/.env missing. Copy from .env.example and fill production values."
  exit 1
fi

# Load DB name for backup
set -a
# shellcheck disable=SC1091
source "$BACKEND/.env" 2>/dev/null || true
set +a
DB_NAME="${DB_NAME:-prince_esquare}"

if [ "$SKIP_BACKUP" != "1" ]; then
  echo ""
  echo "=== Database backup ==="
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$DB_NAME" | gzip > "$BACKUP_FILE"
    echo "Saved: $BACKUP_FILE"
  else
    echo "WARN: pg_dump not found Ã¢â‚¬â€ backup skipped. Set SKIP_BACKUP=1 to silence."
  fi
fi

echo ""
echo "=== Git pull ==="
git fetch origin
git pull origin main

echo ""
echo "=== Backend dependencies ==="
cd "$BACKEND"
npm ci --omit=dev

if [ "$RUN_MIGRATE" = "1" ]; then
  echo ""
  echo "=== Database migrations (pending only Ã¢â‚¬â€ existing rows preserved) ==="
  echo "Migrations add columns/tables/indexes; they do NOT truncate live data."
  npm run db:migrate
fi

echo ""
echo "=== Frontend ==="
cd "$FRONTEND"
# NODE_ENV=production skips devDependencies; Vite build needs them.
npm ci --include=dev 2>/dev/null || NODE_ENV=development npm install
if [ "$SKIP_BUILD" != "1" ]; then
  NODE_ENV=production npm run build
  # Ensure nginx (www-data) can read Vite output Ã¢â‚¬â€ SCP/uploads sometimes leave assets at 700
  chmod -R a+rX "$FRONTEND/dist/assets" 2>/dev/null || true
fi

echo ""
echo "=== Restart API ==="
cd "$BACKEND"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || pm2 start src/index.js --name prince-api
  pm2 save
else
  echo "PM2 not found. Restart your node service manually (systemd/supervisor)."
fi

echo ""
echo ""
echo "=== Health check ==="
HEALTH_PORT="${PORT:-5000}"
HEALTH_URL="http://127.0.0.1:${HEALTH_PORT}/api/health"
health_ok=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "$HEALTH_URL" >/dev/null; then
    curl -sf "$HEALTH_URL"
    echo ""
    health_ok=1
    break
  fi
  sleep 3
done

if [ "$health_ok" -ne 1 ]; then
  echo "WARN: local health check failed -- tried $HEALTH_URL"
fi

echo ""
echo "=== Done ==="
echo "Skipped on purpose (do NOT run on live without review):"
echo "  - seed scripts"
echo "  - angles:apply (overwrites product angle images)"
echo "  - import:stock (resets stock from Excel)"
