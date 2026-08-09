#!/bin/bash
# Re-apply all session patches to production (dashboard, orders, users, blogs).
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/controllers/analyticsInsightsController.js" \
  "$HOST:$ROOT/backend/src/controllers/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/utils/productAnalytics.js" \
  "$HOST:$ROOT/backend/src/utils/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/admin/AdminDashboardCharts.jsx" \
  "$LOCAL/frontend/src/components/admin/BlogsView.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/adminOrderHelpers.js" \
  "$HOST:$ROOT/frontend/src/lib/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/utils/compressImage.js" \
  "$HOST:$ROOT/frontend/src/utils/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
ROOT=/var/www/Prince-Esquare
cd "$ROOT"

echo "=== 1. Analytics insights route ==="
python3 <<'PY'
from pathlib import Path
p = Path("backend/src/routes/analyticsRoutes.js")
text = p.read_text()
if "analyticsInsightsController" not in text:
    text = "const analyticsInsightsController = require('../controllers/analyticsInsightsController');\n" + text
if "/insights" not in text:
    text = text.replace(
        "router.get('/stats', protect, analyticsController.getDashboardStats);",
        "router.get('/insights', protect, analyticsInsightsController.getDashboardInsights);\nrouter.get('/stats', protect, analyticsController.getDashboardStats);",
    )
p.write_text(text)
print("analyticsRoutes OK")
PY

echo "=== 2. API getInsights ==="
grep -q getInsights frontend/src/services/api.js || \
  sed -i "/getStats: () => API.get('\/admin\/dashboard\/stats'),/a\\  getInsights: () => API.get('/admin/dashboard/insights')," frontend/src/services/api.js

echo "=== 3. DashboardView + charts ==="
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
if "AdminDashboardCharts" not in text:
    text = text.replace(
        "import AdminDashboardCharts from '../components/admin/AdminDashboardCharts';",
        "",
    )
    text = text.replace(
        "import { useEffect } from 'react';",
        "import { useEffect } from 'react';\nimport AdminDashboardCharts from '../components/admin/AdminDashboardCharts';",
        1,
    )
lines = text.splitlines(keepends=True)
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
lines[start:end] = [replacement]
text = "".join(lines)
text = text.replace(
    "{ id: 'blogs', label: 'Blog', icon: BookOpen, section: 'Store' },",
    "{ id: 'blogs', label: 'Blog & SEO', icon: BookOpen, section: 'Marketing' },",
)
if "case 'blogs': return <BlogsView />;" in text:
    text = text.replace(
        "case 'blogs': return <BlogsView />;",
        "case 'blogs':\n        return (\n          <Suspense fallback={<SectionLoader />}>\n            <BlogsView />\n          </Suspense>\n        );",
    )
Path("frontend/src/pages/AdminDashboard.jsx").write_text(text)
print("DashboardView OK")
PY

echo "=== 4. Order helpers + modal ==="
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
imp = "import { formatPaymentLabel, parseOrderAddress, ORDER_STATUSES, PAYMENT_STATUSES } from '../lib/adminOrderHelpers';"
if "adminOrderHelpers" not in text:
    text = text.replace(
        "import AdminDashboardCharts from '../components/admin/AdminDashboardCharts';",
        "import AdminDashboardCharts from '../components/admin/AdminDashboardCharts';\n" + imp,
    )
elif "ORDER_STATUSES" not in text:
    text = text.replace(
        "import { formatPaymentLabel, parseOrderAddress } from '../lib/adminOrderHelpers';",
        imp,
    )
old_fetch = "      const res = await adminOrderAPI.getAll();\n      setOrders(Array.isArray(res.data.data) ? res.data.data : []);"
new_fetch = "      const res = await adminOrderAPI.getAll();\n      const rows = res.data?.data ?? res.data?.orders ?? [];\n      setOrders(Array.isArray(rows) ? rows : []);"
text = text.replace(old_fetch, new_fetch)
text = text.replace(
    "orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase())",
    "orders.filter((o) => (o.status || '').toLowerCase() === filter.toLowerCase())",
)
old_modal = """      {(detailLoading || detailOrder || actionError) && !editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">"""
new_modal = """      {(detailLoading || detailOrder || actionError) && !editOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" aria-label="Close order details" className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>"""
if old_modal in text:
    text = text.replace(old_modal, new_modal)
old_edit = """      {editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-md w-full">"""
new_edit = """      {editOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" aria-label="Close edit order" className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>"""
if old_edit in text:
    text = text.replace(old_edit, new_edit)
old_addr = """                  <p className="text-gold-100">
                    {[detailAddress.first_name, detailAddress.last_name].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.line1}</p>"""
if old_addr in text and "detailAddress ?" not in text:
    text = text.replace(
        """                <div className="bg-navy-950/60 border border-gold-500/10 rounded-xl p-4 text-sm">
                  <p className="text-[10px]   text-gold-500/40 mb-2">Shipping</p>
                  <p className="text-gold-100">
                    {[detailAddress.first_name, detailAddress.last_name].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.line1}</p>
                  <p className="text-gold-500/70 text-xs">{detailAddress.city}, {detailAddress.country || 'Kenya'}</p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.phone}</p>
                  <p className="text-gold-500/70 text-xs">{detailAddress.email}</p>
                </div>""",
        """                <div className="bg-navy-950/60 border border-gold-500/10 rounded-xl p-4 text-sm">
                  <p className="text-[10px]   text-gold-500/40 mb-2">Shipping</p>
                  {detailAddress ? (
                    <>
                      <p className="text-gold-100">{[detailAddress.first_name, detailAddress.last_name].filter(Boolean).join(' ')}</p>
                      <p className="text-gold-500/70 text-xs mt-1">{detailAddress.line1 || '—'}</p>
                      <p className="text-gold-500/70 text-xs">{detailAddress.city || '—'}, {detailAddress.country || 'Kenya'}</p>
                      <p className="text-gold-500/70 text-xs mt-1">{detailAddress.phone || '—'}</p>
                      <p className="text-gold-500/70 text-xs">{detailAddress.email || '—'}</p>
                    </>
                  ) : (
                    <p className="text-gold-500/50 text-xs">No shipping address on file.</p>
                  )}
                </div>""",
    )
p.write_text(text)
print("Orders OK")
PY

echo "=== 5. Delete customer (correct schema) ==="
python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/adminCustomerController.js")
text = p.read_text()
# Remove broken deleteCustomer if present
import re
text = re.sub(r'\nexports\.deleteCustomer = async \(req, res, next\) => \{[\s\S]*?\n\};\n(?=\s*$|\s*exports\.)', '\n', text)
delete_fn = '''
exports.deleteCustomer = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (String(req.user.id) === String(id)) {
            return formatResponse(res, 400, false, 'You cannot delete your own account');
        }
        const userR = await db.query('SELECT id, role, email FROM users WHERE id = $1', [id]);
        if (!userR.rows.length) {
            return formatResponse(res, 404, false, 'User not found');
        }
        const user = userR.rows[0];
        if (user.role === 'admin') {
            return formatResponse(res, 403, false, 'Admin accounts cannot be deleted here');
        }
        if (user.role === 'staff') {
            return formatResponse(res, 400, false, 'Use the Staff tab to remove staff accounts');
        }
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE orders SET user_id = NULL WHERE user_id = $1', [id]);
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [id]);
            await client.query('DELETE FROM wishlist WHERE user_id = $1', [id]);
            await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
            await client.query('UPDATE reviews SET user_id = NULL WHERE user_id = $1', [id]);
            const result = await client.query(
                "DELETE FROM users WHERE id = $1 AND role = 'customer' RETURNING id, name, email",
                [id]
            );
            if (!result.rows.length) {
                await client.query('ROLLBACK');
                return formatResponse(res, 404, false, 'Customer not found');
            }
            await client.query('COMMIT');
            formatResponse(res, 200, true, 'Customer deleted successfully', result.rows[0]);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
};
'''
if "exports.deleteCustomer" not in text:
    p.write_text(text.rstrip() + delete_fn)
else:
    p.write_text(text)
print("deleteCustomer OK")
PY

grep -q "deleteCustomer" backend/src/routes/customerRoutes.js || \
  sed -i "/router.delete('\/staff\/:id'/a router.delete('/:id', protect, requireAdmin, adminCustomerController.deleteCustomer);" backend/src/routes/customerRoutes.js

grep -q deleteCustomer frontend/src/services/api.js || \
  sed -i "/deleteStaff: (id) => API.delete/a\\  deleteCustomer: (id) => API.delete(\`/admin/customers/\${id}\`)," frontend/src/services/api.js

echo "=== 6. User delete UI ==="
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
if "handleDeleteCustomer" not in text:
    fn = '''
  const handleDeleteCustomer = async (customer) => {
    const ok = await confirm({
      title: 'Delete customer',
      message: `Permanently delete ${customer.name || customer.email}? Their order history will be kept but unlinked.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminCustomerAPI.deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(null);
      adminToast.success('Customer deleted');
    } catch (error) {
      adminToast.error(apiErrorMessage(error, 'Could not delete customer'));
    }
  };

'''
    text = text.replace("  const closeModal = () => setSelectedCustomer(null);", fn + "  const closeModal = () => setSelectedCustomer(null);")
    btn = '''                      <button type="button" onClick={() => handleDeleteCustomer(c)} className="rounded-lg p-2 text-red-400/50 transition-all hover:bg-red-400/10 hover:text-red-400" title="Delete customer"><Trash2 size={16} /></button>
'''
    text = text.replace(
        '''                      <button
                        type="button"
                        onClick={() => handleViewCustomer(c.id)}''',
        btn + '''                      <button
                        type="button"
                        onClick={() => handleViewCustomer(c.id)}''',
        1,
    )
if "handleDeleteStaff" not in text:
    fn2 = '''
  const handleDeleteStaff = async (member) => {
    const ok = await confirm({
      title: 'Remove staff member',
      message: `Remove ${member.name || member.email} from staff?`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminCustomerAPI.deleteStaff(member.id);
      await fetchAdmins();
      adminToast.success('Staff member removed');
    } catch (error) {
      adminToast.error(apiErrorMessage(error, 'Could not remove staff'));
    }
  };

'''
    text = text.replace(
        "  const filteredAdmins = roleFilter ? users.filter(a => a.role === roleFilter) : users;",
        fn2 + "  const filteredAdmins = roleFilter ? users.filter(a => a.role === roleFilter) : users;",
    )
    text = text.replace(
        "                      {currentUser?.email === 'jones@gmail.com' && (",
        """                      {admin.role === 'staff' && (
                        <button type="button" onClick={() => handleDeleteStaff(admin)} className="rounded-lg p-2 text-red-400/50 transition-all hover:bg-red-400/10 hover:text-red-400" title="Remove staff"><Trash2 size={16} /></button>
                      )}
                      {currentUser?.email === 'jones@gmail.com' && (""",
        1,
    )
p.write_text(text)
print("User UI OK")
PY

echo "=== 7. Blog cloudinary compress ==="
python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/blogController.js")
text = p.read_text()
text = text.replace(
    "{ folder: 'prince-esquare/blog', resource_type: 'auto' }",
    "{ folder: 'prince-esquare/blog', resource_type: 'image', quality: 'auto:good', fetch_format: 'auto' }",
)
p.write_text(text)
print("blog upload OK")
PY

echo "=== 8. Build frontend ==="
cd frontend
npm install recharts --save 2>&1 | tail -2
npm run build 2>&1 | tail -4
BUNDLE=$(grep -o 'index-[^.]*\.js' dist/index.html)
echo "Bundle: $BUNDLE"

pm2 restart prince-backend
sleep 2

echo "=== VERIFY ==="
grep -c "getInsights\|AdminDashboardCharts\|Blog & SEO\|handleDeleteCustomer\|ORDER_STATUSES" ../frontend/src/pages/AdminDashboard.jsx
grep -c "compressImageFile\|Choose from device" ../frontend/src/components/admin/BlogsView.jsx
grep -c insights ../backend/src/routes/analyticsRoutes.js
grep -c deleteCustomer ../backend/src/controllers/adminCustomerController.js
curl -s -o /dev/null -w "insights:%{http_code} homepage:%{http_code}\n" http://localhost:5000/api/admin/dashboard/insights http://localhost:5000/api/homepage
REMOTE

echo "Production restore complete."
