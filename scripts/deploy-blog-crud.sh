#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/BlogsView.jsx" \
  "$LOCAL/frontend/src/components/admin/ConfirmDialog.jsx" \
  "$LOCAL/frontend/src/lib/adminToast.js" \
  "$LOCAL/frontend/src/utils/cloudinary.js" \
  "$HOST:$ROOT/frontend/src/components/admin/" 2>/dev/null || true

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/adminToast.js" \
  "$HOST:$ROOT/frontend/src/lib/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/utils/cloudinary.js" \
  "$HOST:$ROOT/frontend/src/utils/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/blogController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

# Patch adminBlogAPI into server api.js if missing
ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

if ! grep -q 'adminBlogAPI' frontend/src/services/api.js; then
  python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/services/api.js")
text = p.read_text()
block = """
// ── ADMIN – BLOGS ─────────────────────────────────────────────────────
export const adminBlogAPI = {
  list: (params) => API.get('/admin/blog', { params }),
  getOne: (id) => API.get(`/admin/blog/${id}`),
  create: (data) => API.post('/admin/blog', data),
  update: (id, data) => API.put(`/admin/blog/${id}`, data),
  remove: (id) => API.delete(`/admin/blog/${id}`),
  uploadImage: (formData) =>
    API.post('/admin/blog/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
"""
if "export default API" in text:
    text = text.replace("export default API", block + "\nexport default API")
    p.write_text(text)
    print("adminBlogAPI added to api.js")
PY
fi

cd frontend
npm install react-hot-toast --save 2>/dev/null || true
npm run build 2>&1 | tail -5
echo "Bundle: $(grep -o 'index-[^.]*\.js' dist/index.html)"
pm2 restart prince-backend
REMOTE

echo "Blog CRUD deployed."
