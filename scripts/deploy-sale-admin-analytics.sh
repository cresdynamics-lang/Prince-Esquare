#!/bin/bash
set -euo pipefail
KEY="$HOME/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

RSYNC="rsync -az -e ssh\ -i\ $KEY\ -o\ BatchMode=yes"

# Backend
eval $RSYNC "$LOCAL/backend/src/db/migrations/054_site_visitor_events.sql" "$HOST:$ROOT/backend/src/db/migrations/"
eval $RSYNC "$LOCAL/backend/src/utils/siteAnalytics.js" "$HOST:$ROOT/backend/src/utils/"
eval $RSYNC "$LOCAL/backend/src/controllers/visitorController.js" "$HOST:$ROOT/backend/src/controllers/"
eval $RSYNC "$LOCAL/backend/src/routes/analyticsTrackRoutes.js" "$LOCAL/backend/src/routes/adminVisitorRoutes.js" "$HOST:$ROOT/backend/src/routes/"
eval $RSYNC "$LOCAL/backend/src/lib/socket.js" "$HOST:$ROOT/backend/src/lib/"

# Frontend
eval $RSYNC "$LOCAL/frontend/src/components/VisitorTracker.jsx" "$LOCAL/frontend/src/components/ProductCard.jsx" "$HOST:$ROOT/frontend/src/components/"
eval $RSYNC "$LOCAL/frontend/src/components/admin/StoreAnalyticsViews.jsx" "$HOST:$ROOT/frontend/src/components/admin/"
eval $RSYNC "$LOCAL/frontend/src/pages/Sale.jsx" "$LOCAL/frontend/src/pages/Cart.jsx" "$HOST:$ROOT/frontend/src/pages/"
eval $RSYNC "$LOCAL/frontend/src/lib/socket.js" "$HOST:$ROOT/frontend/src/lib/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path

# Backend routes
p = Path("backend/src/app.js")
text = p.read_text()
if "analyticsTrackRoutes" not in text:
    needle = "app.use('/api/search', require('./routes/searchRoutes'));"
    if needle not in text:
        needle = "app.use('/api/feeds', require('./routes/feedRoutes'));"
    text = text.replace(
        needle,
        needle + "\napp.use('/api/analytics', require('./routes/analyticsTrackRoutes'));\napp.use('/api/admin/visitors', require('./routes/adminVisitorRoutes'));",
    )
    p.write_text(text)
    print("app.js routes added")

# AdminDashboard
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()

if "StoreAnalyticsViews" not in text:
    text = text.replace(
        "import { ensureSocket, disconnectSocket } from '../lib/socket';",
        "import { ensureSocket, disconnectSocket } from '../lib/socket';\nimport SaleCatalogView, { LiveVisitorsView } from '../components/admin/StoreAnalyticsViews';",
    )

if "id: 'sale-catalog'" not in text:
    text = text.replace(
        "{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },",
        "{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },\n    { id: 'live-visitors', label: 'Live Visitors', icon: Eye, section: 'Overview' },",
    )
    text = text.replace(
        "{ id: 'orders', label: 'Orders', icon: Package, section: 'Store' },",
        "{ id: 'orders', label: 'Orders', icon: Package, section: 'Store' },\n    { id: 'sale-catalog', label: 'Sale Catalog', icon: ShoppingBag, section: 'Store' },",
    )

if "sale-catalog' || item.id === 'live-visitors'" not in text:
    text = text.replace(
        "if (user?.role === 'staff') {",
        "if (user?.role === 'staff') {\n        if (item.id === 'sale-catalog' || item.id === 'live-visitors') return true;",
    )

if "case 'sale-catalog'" not in text:
    text = text.replace(
        "case 'orders': return <OrdersView readOnly={isSeller} />;",
        "case 'sale-catalog': return <SaleCatalogView />;\n      case 'live-visitors': return <LiveVisitorsView />;\n      case 'orders': return <OrdersView readOnly={isSeller} />;",
    )
    p.write_text(text)
    print("AdminDashboard patched")
elif "StoreAnalyticsViews" in text and "case 'sale-catalog'" not in text:
    p.write_text(text)
    print("AdminDashboard import only")

# App.jsx VisitorTracker
p = Path("frontend/src/App.jsx")
text = p.read_text()
if "VisitorTracker" not in text:
    text = text.replace(
        "import AnalyticsPageView from './components/AnalyticsPageView';",
        "import AnalyticsPageView from './components/AnalyticsPageView';\nimport VisitorTracker from './components/VisitorTracker';",
    )
    text = text.replace(
        "<AnalyticsPageView />",
        "<AnalyticsPageView />\n      <VisitorTracker />",
    )
    p.write_text(text)
    print("App.jsx patched")

# api.js
p = Path("frontend/src/services/api.js")
text = p.read_text()
if "adminVisitorAPI" not in text:
    insert = """
export const analyticsAPI = {
  track: (body) => API.post('/analytics/track', body),
};

export const adminVisitorAPI = {
  getLive: () => API.get('/admin/visitors/live'),
  getSaleCatalog: () => API.get('/admin/visitors/sale-catalog'),
};

"""
    for marker in ["export const searchAPI = {", "export const productAPI = {"]:
        if marker in text:
            text = text.replace(marker, insert + marker)
            break
    p.write_text(text)
    print("api.js patched")

# WhatsApp product links
p = Path("frontend/src/lib/storeContact.js")
text = p.read_text()
block = text.split("buildWhatsAppOrderUrl")[1].split("export")[0] if "buildWhatsAppOrderUrl" in text else ""
if "product/" not in block and "buildWhatsAppOrderUrl" in text:
    text = text.replace(
        "return `- ${item.name}${size} × ${qty} — KSh ${lineTotal.toLocaleString()}`;",
        "const slug = item.slug || item.product_slug;\n        const productUrl = slug ? `https://prince-esquare.co.ke/product/${slug}` : null;\n        const linkPart = productUrl ? `\\n  ${productUrl}` : '';\n        return `- ${item.name}${size} × ${qty} — KSh ${lineTotal.toLocaleString()}${linkPart}`;",
    )
    p.write_text(text)
    print("storeContact patched")
PY

# Migration
cd backend
export $(grep -v '^#' .env | xargs)
node -e "
const fs=require('fs');
const db=require('./src/config/db');
(async()=>{
  const sql=fs.readFileSync('src/db/migrations/054_site_visitor_events.sql','utf8');
  await db.query(sql);
  console.log('migration ok');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
"

cd ../frontend && npm run build
cd ../backend && pm2 restart prince-backend
REMOTE

echo "Done: https://prince-esquare.co.ke/sale | Admin → Sale Catalog & Live Visitors"
