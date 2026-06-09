#!/bin/bash
# Run on the DigitalOcean droplet after SSH login — locates the app directory.
set -e

echo "=== Host ==="
hostname; whoami; pwd

echo ""
echo "=== PM2 processes ==="
pm2 list 2>/dev/null || echo "(pm2 not installed or no processes)"

echo ""
echo "=== Nginx sites ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
grep -r "root\|proxy_pass\|Prince\|esquare\|esquire" /etc/nginx/sites-enabled/ 2>/dev/null || true

echo ""
echo "=== Search backend package.json ==="
find /var/www /home /opt /root -maxdepth 5 -type f -path "*/backend/package.json" 2>/dev/null

echo ""
echo "=== Search frontend (vite/react) ==="
find /var/www /home /opt /root -maxdepth 5 -type f -path "*/frontend/package.json" 2>/dev/null

echo ""
echo "=== Running node processes ==="
ps aux | grep -E "node|nginx" | grep -v grep || true

echo ""
echo "=== PostgreSQL ==="
systemctl is-active postgresql 2>/dev/null || true
sudo -u postgres psql -l 2>/dev/null | grep -i prince || true
