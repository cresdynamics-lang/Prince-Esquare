#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

# Safe to sync: these match production structure (or are greenfield admin-analytics files)
rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/feeds/metaCatalogFeed.js" \
  "$HOST:$ROOT/backend/src/feeds/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/visitorController.js" \
  "$LOCAL/backend/src/controllers/feedController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/Navbar.jsx" \
  "$HOST:$ROOT/frontend/src/components/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path

# --- productController: add Khaki section after Track Suits ---
p = Path("backend/src/controllers/productController.js")
text = p.read_text()
if "slug: 'khaki'" not in text:
    old = """  {
    title: 'Track Suits',
    slug: 'track-suits',
    where: "c.slug = 'track-suits'",
  },
  {
    title: 'Official Shoes',"""
    new = """  {
    title: 'Track Suits',
    slug: 'track-suits',
    where: "c.slug = 'track-suits'",
  },
  {
    title: 'Khaki Trousers',
    slug: 'khaki',
    where: "c.slug = 'khaki'",
  },
  {
    title: 'Official Shoes',"""
    if old not in text:
        raise SystemExit("productController SALE_SECTIONS marker not found")
    text = text.replace(old, new, 1)
    p.write_text(text)
    print("productController SALE_SECTIONS +khaki")
else:
    print("productController already has khaki")

# --- seoController: add khaki section ---
p = Path("backend/src/controllers/seoController.js")
text = p.read_text()
if "Khaki Trousers" not in text:
    old = """    { title: 'Track Suits', where: "c.slug = 'track-suits'" },
    { title: 'Official Shoes', where: "c.slug = 'formal-shoes' AND p.name NOT ILIKE '%boot%'" },"""
    new = """    { title: 'Track Suits', where: "c.slug = 'track-suits'" },
    { title: 'Khaki Trousers', where: "c.slug = 'khaki'" },
    { title: 'Official Shoes', where: "c.slug = 'formal-shoes' AND p.name NOT ILIKE '%boot%'" },"""
    if old not in text:
        raise SystemExit("seoController sections marker not found")
    text = text.replace(old, new, 1)
    p.write_text(text)
    print("seoController +khaki")
else:
    print("seoController already has khaki")

print("metaCatalogFeed khaki:", "c.slug = 'khaki'" in Path("backend/src/feeds/metaCatalogFeed.js").read_text())
print("visitorController khaki:", "c.slug = 'khaki'" in Path("backend/src/controllers/visitorController.js").read_text())
print("feedController note khaki:", "Khaki" in Path("backend/src/controllers/feedController.js").read_text())
print("Navbar khaki link:", "khaki:" in Path("frontend/src/components/Navbar.jsx").read_text() or "'khaki'" in Path("frontend/src/components/Navbar.jsx").read_text())
PY

cd frontend && npm run build
cd ../backend && pm2 restart prince-backend

# Verify sale API includes khaki
sleep 2
curl -sS http://127.0.0.1:5000/api/products/sale > /tmp/sale.json
python3 - <<'PY'
import json
d = json.load(open("/tmp/sale.json"))
sections = d.get("data", {}).get("sections", [])
for s in sections:
    print(f"{s['title']}: {len(s.get('products', []))} products")
khaki = next((s for s in sections if s.get("slug") == "khaki" or s.get("title", "").lower().startswith("khaki")), None)
print("KHAKI_OK" if khaki else "KHAKI_MISSING")
PY

curl -sS http://127.0.0.1:5000/feeds/meta-sale-catalog.csv > /tmp/sale-feed.csv
python3 - <<'PY'
lines = open("/tmp/sale-feed.csv").read().strip().splitlines()
print("feed_rows", max(0, len(lines) - 1))
khaki_lines = [l for l in lines if "khaki" in l.lower()]
print("khaki_feed_rows", len(khaki_lines))
PY
REMOTE
