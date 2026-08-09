#!/bin/bash
set -euo pipefail

STAMP=$(date +%Y%m%d-%H%M%S)
KEY="/Users/airm1/Projects/Prince-Esquare/.cursor/ssh/prince_agent_ed25519"
HOST="root@161.35.58.181"
LOCAL_ROOT="/Users/airm1/Backups/Prince-Esquire"
REMOTE_DIR="/tmp/prince-esquire-backup-${STAMP}"
REMOTE_ARCHIVE="/tmp/prince-esquire-backup-${STAMP}.tar.gz"

mkdir -p "$LOCAL_ROOT"

echo "==> Creating remote backup ${STAMP}"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$HOST" \
  "STAMP='${STAMP}' REMOTE_DIR='${REMOTE_DIR}' bash -s" <<'REMOTE'
set -euo pipefail
mkdir -p "$REMOTE_DIR"/database "$REMOTE_DIR"/config "$REMOTE_DIR"/app "$REMOTE_DIR"/meta

ENV_FILE="/var/www/Prince-Esquare/backend/.env"
test -f "$ENV_FILE"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

echo "Dumping database $DB_NAME ..."
# Write as root via stdout redirect — postgres cannot write into root-owned /tmp subdirs.
sudo -u postgres pg_dump -d "$DB_NAME" -Fc > "$REMOTE_DIR/database/prince_esquare.dump"
sudo -u postgres pg_dump -d "$DB_NAME" --no-owner --no-acl | gzip -9 > "$REMOTE_DIR/database/prince_esquare.sql.gz"
sudo -u postgres pg_dump -d "$DB_NAME" --schema-only --no-owner --no-acl | gzip -9 > "$REMOTE_DIR/database/schema.sql.gz"
sudo -u postgres pg_dumpall --roles-only 2>/dev/null | gzip -9 > "$REMOTE_DIR/database/roles.sql.gz" || true

sudo -u postgres psql -d "$DB_NAME" -Atc "SELECT relname || chr(9) || n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" > "$REMOTE_DIR/meta/table_row_counts.tsv"
sudo -u postgres psql -d "$DB_NAME" -Atc "SELECT pg_size_pretty(pg_database_size(current_database()));" > "$REMOTE_DIR/meta/db_size.txt"
sudo -u postgres psql -d "$DB_NAME" -Atc "SELECT COUNT(*) FROM products;" > "$REMOTE_DIR/meta/products_count.txt"
sudo -u postgres psql -d "$DB_NAME" -Atc "SELECT COUNT(*) FROM orders;" > "$REMOTE_DIR/meta/orders_count.txt" || echo 0 > "$REMOTE_DIR/meta/orders_count.txt"
sudo -u postgres psql -d "$DB_NAME" -Atc "SELECT COUNT(*) FROM users;" > "$REMOTE_DIR/meta/users_count.txt" || echo 0 > "$REMOTE_DIR/meta/users_count.txt"

cp "$ENV_FILE" "$REMOTE_DIR/config/backend.env"
cp /etc/nginx/sites-enabled/prince-esquire "$REMOTE_DIR/config/nginx-prince-esquire.conf" 2>/dev/null || true
cp /etc/nginx/sites-available/prince-esquire "$REMOTE_DIR/config/nginx-sites-available-prince-esquire.conf" 2>/dev/null || true
cp /root/.pm2/dump.pm2 "$REMOTE_DIR/config/pm2.dump.pm2" 2>/dev/null || true
cp /var/www/Prince-Esquare/docker-compose.yml "$REMOTE_DIR/config/docker-compose.yml" 2>/dev/null || true
cp /var/www/Prince-Esquare/package.json "$REMOTE_DIR/config/root-package.json" 2>/dev/null || true
cp /var/www/Prince-Esquare/backend/package.json "$REMOTE_DIR/config/backend-package.json" 2>/dev/null || true
cp /var/www/Prince-Esquare/frontend/package.json "$REMOTE_DIR/config/frontend-package.json" 2>/dev/null || true

echo "Archiving app source..."
tar -C /var/www/Prince-Esquare \
  --exclude=node_modules \
  --exclude=frontend/node_modules \
  --exclude=backend/node_modules \
  --exclude=frontend/dist \
  --exclude=.git \
  -czf "$REMOTE_DIR/app/prince-esquire-source.tar.gz" .

(cd /var/www/Prince-Esquare && git rev-parse HEAD; git status -sb; git remote -v) > "$REMOTE_DIR/meta/git-status.txt" 2>/dev/null || true

{
  echo "backup_stamp=$STAMP"
  echo "hostname=$(hostname)"
  echo "date_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "droplet_ip=161.35.58.181"
  echo "app_path=/var/www/Prince-Esquare"
  echo "db_name=$DB_NAME"
  uname -a
  node -v 2>/dev/null || true
  psql --version 2>/dev/null || true
} > "$REMOTE_DIR/meta/server-info.txt"

(cd "$REMOTE_DIR" && find . -type f | sort | xargs sha256sum) > "$REMOTE_DIR/meta/SHA256SUMS"

tar -C /tmp -czf "/tmp/prince-esquire-backup-${STAMP}.tar.gz" "prince-esquire-backup-${STAMP}"
ls -lh "/tmp/prince-esquire-backup-${STAMP}.tar.gz"
echo "REMOTE_OK=$STAMP"
REMOTE

echo "==> Downloading archive to laptop"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new \
  "$HOST:$REMOTE_ARCHIVE" \
  "$LOCAL_ROOT/prince-esquire-backup-${STAMP}.tar.gz"

echo "==> Extracting"
tar -xzf "$LOCAL_ROOT/prince-esquire-backup-${STAMP}.tar.gz" -C "$LOCAL_ROOT"

cat > "$LOCAL_ROOT/prince-esquire-backup-${STAMP}/RESTORE.md" <<'EOF'
# Prince Esquire backup — restore guide

## What’s included
- `database/prince_esquire.dump` — PostgreSQL custom-format dump (best for restore)
- `database/prince_esquare.sql.gz` — plain SQL gzip (portable)
- `database/schema.sql.gz` — schema only
- `database/roles.sql.gz` — DB roles (if available)
- `config/backend.env` — production env (secrets; keep private)
- `config/nginx-*.conf` — nginx site config
- `app/prince-esquire-source.tar.gz` — app source snapshot
- `meta/` — counts, checksums, server info

Product images live on **Cloudinary** (URLs stored in the DB). After restore, use the same Cloudinary keys from `config/backend.env`.

## Restore database
```bash
createdb prince_esquare
pg_restore --no-owner --no-acl -d prince_esquire database/prince_esquare.dump
# or:
gunzip -c database/prince_esquare.sql.gz | psql -d prince_esquare
```

Keep this folder private — it contains secrets and customer data. Do not commit it to git.
EOF

echo "==> Cleaning remote temp files"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$HOST" \
  "rm -rf '${REMOTE_DIR}' '${REMOTE_ARCHIVE}'"

echo ""
echo "======== BACKUP COMPLETE ========"
echo "Folder:  $LOCAL_ROOT/prince-esquire-backup-${STAMP}"
echo "Archive: $LOCAL_ROOT/prince-esquire-backup-${STAMP}.tar.gz"
ls -lh "$LOCAL_ROOT/prince-esquire-backup-${STAMP}.tar.gz"
du -sh "$LOCAL_ROOT/prince-esquire-backup-${STAMP}"
echo "DB size: $(cat "$LOCAL_ROOT/prince-esquire-backup-${STAMP}/meta/db_size.txt")"
echo "Products: $(cat "$LOCAL_ROOT/prince-esquire-backup-${STAMP}/meta/products_count.txt")"
echo "Orders: $(cat "$LOCAL_ROOT/prince-esquire-backup-${STAMP}/meta/orders_count.txt")"
echo "Users: $(cat "$LOCAL_ROOT/prince-esquire-backup-${STAMP}/meta/users_count.txt")"
echo "Top tables:"
head -15 "$LOCAL_ROOT/prince-esquire-backup-${STAMP}/meta/table_row_counts.tsv"
open "$LOCAL_ROOT" 2>/dev/null || true
