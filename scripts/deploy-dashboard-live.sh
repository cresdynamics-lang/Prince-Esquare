#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

do_rsync() {
  rsync -az -e "ssh -i $KEY -o BatchMode=yes" "$1" "$HOST:$2"
}

do_rsync "$LOCAL/backend/src/controllers/analyticsInsightsController.js" "$ROOT/backend/src/controllers/"
do_rsync "$LOCAL/backend/src/utils/productAnalytics.js" "$ROOT/backend/src/utils/"
do_rsync "$LOCAL/frontend/src/components/admin/AdminDashboardCharts.jsx" "$ROOT/frontend/src/components/admin/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
ROOT=/var/www/Prince-Esquare
cd "$ROOT"

# Route for insights
if ! grep -q analyticsInsightsController backend/src/routes/analyticsRoutes.js; then
  sed -i "1a const analyticsInsightsController = require('../controllers/analyticsInsightsController');" backend/src/routes/analyticsRoutes.js
  sed -i "/router.get('\/stats'/i router.get('/insights', protect, analyticsInsightsController.getDashboardInsights);" backend/src/routes/analyticsRoutes.js
fi

# API client
if ! grep -q getInsights frontend/src/services/api.js; then
  sed -i "/getStats: () => API.get('\/admin\/dashboard\/stats'),/a\\  getInsights: () => API.get('/admin/dashboard/insights')," frontend/src/services/api.js
fi

# Product view tracking
PC=backend/src/controllers/productController.js
if ! grep -q productAnalytics "$PC"; then
  sed -i "4a const { recordProductEvent } = require('../utils/productAnalytics');" "$PC"
fi
if ! grep -q "recordProductEvent(product.id, 'view')" "$PC"; then
  python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/productController.js")
text = p.read_text()
needle = "const product = productResult.rows[0];"
insert = needle + "\n        recordProductEvent(product.id, 'view');"
if insert not in text and needle in text:
    text = text.replace(needle, insert, 1)
    p.write_text(text)
PY
fi

# Cart add tracking
CC=backend/src/controllers/cartController.js
if ! grep -q productAnalytics "$CC"; then
  sed -i "2a const { recordProductEvent } = require('../utils/productAnalytics');" "$CC"
fi
if ! grep -q "recordProductEvent(product_id, 'cart_add'" "$CC"; then
  python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/cartController.js")
text = p.read_text()
old = "return formatResponse(res, 200, true, 'Cart item quantity updated', result.rows[0]);"
new = old.replace("return formatResponse", "recordProductEvent(product_id, 'cart_add', qty);\n            return formatResponse")
if old in text and "recordProductEvent(product_id" not in text:
    text = text.replace(old, new, 1)
old2 = "formatResponse(res, 201, true, 'Item added to cart', result.rows[0]);"
new2 = "recordProductEvent(product_id, 'cart_add', qty);\n\n        formatResponse(res, 201, true, 'Item added to cart', result.rows[0]);"
if old2 in text:
    text = text.replace(old2, new2, 1)
p.write_text(text)
PY
fi

# Replace DashboardView (lines 354-471)
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
lines = p.read_text().splitlines(keepends=True)
start = next(i for i,l in enumerate(lines) if l.startswith("const DashboardView"))
end = next(i for i,l in enumerate(lines) if l.startswith("const OrdersView"))
replacement = '''const DashboardView = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminAnalyticsAPI.getInsights();
        if (!cancelled && res.data?.success) setInsights(res.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <AdminDashboardCharts data={insights} loading={loading} />;
};

'''
if "AdminDashboardCharts" not in p.read_text():
    for i, l in enumerate(lines):
        if l.startswith("import { useEffect }"):
            lines[i] = l.rstrip("\n") + "\nimport AdminDashboardCharts from '../components/admin/AdminDashboardCharts';\n"
            break
lines[start:end] = [replacement]
p.write_text("".join(lines))
PY

cd frontend
npm install recharts --save 2>&1 | tail -3
npm run build 2>&1 | tail -8

pm2 restart prince-backend
sleep 2
curl -s -o /dev/null -w "homepage:%{http_code} insights:%{http_code}\n" \
  https://prince-esquire.co.ke/api/homepage \
  https://prince-esquire.co.ke/api/admin/dashboard/insights
REMOTE

echo "Deploy finished."
