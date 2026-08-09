#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/BlogsView.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/utils/compressImage.js" \
  "$HOST:$ROOT/frontend/src/utils/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/blogController.js")
text = p.read_text()
old = "{ folder: 'prince-esquare/blog', resource_type: 'auto' }"
new = "{ folder: 'prince-esquare/blog', resource_type: 'image', quality: 'auto:good', fetch_format: 'auto' }"
if old in text:
    p.write_text(text.replace(old, new))
    print("cloudinary compress options added")
elif "quality: 'auto:good'" in text:
    print("cloudinary already patched")
else:
    print("WARN: cloudinary patch not applied")
PY

# Wrap BlogsView in Suspense like ProductsView
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
if "case 'blogs':" in text and "BlogsView" in text and "heavySection" not in text.split("case 'blogs'")[0][-500:]:
    pass
if "case 'blogs': return <BlogsView />" in text:
    text = text.replace(
        "case 'blogs': return <BlogsView />",
        "case 'blogs':\n        return (\n          <Suspense fallback={<SectionLoader />}>\n            <BlogsView />\n          </Suspense>\n        )",
    )
    p.write_text(text)
    print("BlogsView Suspense wrapper added")
PY

cd frontend
npm run build 2>&1 | tail -5
grep -o 'index-[^.]*\.js' dist/index.html
REMOTE

echo "Blog admin deployed."
