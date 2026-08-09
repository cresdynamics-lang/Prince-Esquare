#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/adminOrderHelpers.js" \
  "$HOST:$ROOT/frontend/src/lib/"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/backend/src/db/migrations/052_blog_seo_meta.sql" \
  "$HOST:$ROOT/backend/src/db/migrations/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
ROOT=/var/www/Prince-Esquare
cd "$ROOT"

# ── DB: blog SEO columns ──
sudo -u postgres psql prince_esquare -f backend/src/db/migrations/052_blog_seo_meta.sql 2>/dev/null \
  || PGPASSWORD="$(grep DATABASE_URL backend/.env | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')" \
     psql "$(grep DATABASE_URL backend/.env | cut -d= -f2- | tr -d '"')" -f backend/src/db/migrations/052_blog_seo_meta.sql \
  || node -e "
require('dotenv').config({ path: 'backend/.env' });
const db = require('./backend/src/config/db');
const fs = require('fs');
const sql = fs.readFileSync('backend/src/db/migrations/052_blog_seo_meta.sql','utf8');
db.query(sql).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

# ── Backend: delete customer ──
python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/adminCustomerController.js")
text = p.read_text()
if "exports.deleteCustomer" not in text:
    insert = '''
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
            await client.query(
                'DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)',
                [id]
            );
            await client.query('DELETE FROM carts WHERE user_id = $1', [id]);
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
    p.write_text(text.rstrip() + insert)
PY

python3 <<'PY'
from pathlib import Path
p = Path("backend/src/routes/customerRoutes.js")
text = p.read_text()
if "deleteCustomer" not in text:
    text = text.replace(
        "router.delete('/staff/:id', protect, requireAdmin, adminCustomerController.deleteStaff);",
        "router.delete('/staff/:id', protect, requireAdmin, adminCustomerController.deleteStaff);\n"
        "router.delete('/:id', protect, requireAdmin, adminCustomerController.deleteCustomer);",
    )
    p.write_text(text)
PY

# ── Blog controller: meta fields ──
python3 <<'PY'
from pathlib import Path
p = Path("backend/src/controllers/blogController.js")
text = p.read_text()
if "meta_title" not in text:
    text = text.replace(
        "let query = 'SELECT id, title, slug, excerpt, category, author_name, featured_image_url, is_published, views, published_date, created_at, updated_at FROM blog_posts';",
        "let query = 'SELECT id, title, slug, excerpt, content, category, author_name, featured_image_url, is_published, views, published_date, created_at, updated_at, meta_title, meta_description FROM blog_posts';",
    )
    text = text.replace(
        "const { title, slug, excerpt, content, category, author_name, featured_image_url, is_published } = req.body;",
        "const { title, slug, excerpt, content, category, author_name, featured_image_url, is_published, meta_title, meta_description } = req.body;",
        1,
    )
    text = text.replace(
        "`INSERT INTO blog_posts (title, slug, excerpt, content, category, author_name, featured_image_url, is_published, published_date)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`",
        "`INSERT INTO blog_posts (title, slug, excerpt, content, category, author_name, featured_image_url, is_published, published_date, meta_title, meta_description)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`",
    )
    text = text.replace(
        "[title, slug, excerpt, content, category, author_name, featured_image_url || null, is_published || false, is_published ? new Date() : null]",
        "[title, slug, excerpt, content, category, author_name, featured_image_url || null, is_published || false, is_published ? new Date() : null, meta_title || null, meta_description || null]",
    )
    for field in ("meta_title", "meta_description"):
        block = f"    if ({field} !== undefined) {{\n      params.push({field});\n      updates.push(`{field} = ${{paramIndex++}}`);\n    }}\n"
        if block.strip() not in text and "if (slug !== undefined)" in text:
            text = text.replace("    if (slug !== undefined) {", block + "    if (slug !== undefined) {", 1)
    p.write_text(text)
PY

# ── Frontend API: delete customer ──
if ! grep -q "deleteCustomer" frontend/src/services/api.js; then
  sed -i "/deleteStaff: (id) => API.delete/a\\  deleteCustomer: (id) => API.delete(\`/admin/customers/\${id}\`)," frontend/src/services/api.js
fi

# ── AdminDashboard: order helpers import + resilient fetch ──
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
if "adminOrderHelpers" not in text:
    text = text.replace(
        "import AdminDashboardCharts from '../components/admin/AdminDashboardCharts';",
        "import AdminDashboardCharts from '../components/admin/AdminDashboardCharts';\nimport { formatPaymentLabel, parseOrderAddress } from '../lib/adminOrderHelpers';",
    )
old_fetch = "      const res = await adminOrderAPI.getAll();\n      setOrders(Array.isArray(res.data.data) ? res.data.data : []);"
new_fetch = "      const res = await adminOrderAPI.getAll();\n      const rows = res.data?.data ?? res.data?.orders ?? [];\n      setOrders(Array.isArray(rows) ? rows : []);"
if old_fetch in text:
    text = text.replace(old_fetch, new_fetch)
old_filter = "orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase())"
new_filter = "orders.filter((o) => (o.status || '').toLowerCase() === filter.toLowerCase())"
if old_filter in text:
    text = text.replace(old_filter, new_filter)
# Blog sidebar → Marketing
text = text.replace(
    "{ id: 'blogs', label: 'Blog', icon: BookOpen, section: 'Store' },",
    "{ id: 'blogs', label: 'Blog & SEO', icon: BookOpen, section: 'Marketing' },",
)
p.write_text(text)
PY

# ── CustomersView: delete button ──
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
if "handleDeleteCustomer" not in text:
    insert_fn = '''
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
    text = text.replace("  const closeModal = () => setSelectedCustomer(null);", insert_fn + "  const closeModal = () => setSelectedCustomer(null);")
    delete_btn = '''                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(c)}
                        className="rounded-lg p-2 text-red-400/50 transition-all hover:bg-red-400/10 hover:text-red-400"
                        title="Delete customer"
                      >
                        <Trash2 size={16} />
                      </button>
'''
    text = text.replace(
        '''                      <button
                        type="button"
                        onClick={() => handleViewCustomer(c.id)}
                        className="rounded-lg p-2 text-gold-500/40 transition-all hover:bg-navy-800 hover:text-gold-500"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>''',
        delete_btn + '''                      <button
                        type="button"
                        onClick={() => handleViewCustomer(c.id)}
                        className="rounded-lg p-2 text-gold-500/40 transition-all hover:bg-navy-800 hover:text-gold-500"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>''',
        1,
    )
    p.write_text(text)
PY

# ── AdminsView: delete staff ──
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()
if "handleDeleteStaff" not in text:
    fn = '''
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
    text = text.replace("  const filteredAdmins = roleFilter ? users.filter(a => a.role === roleFilter) : users;", fn + "  const filteredAdmins = roleFilter ? users.filter(a => a.role === roleFilter) : users;")
    staff_btn = '''                      {admin.role === 'staff' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(admin)}
                          className="rounded-lg p-2 text-red-400/50 transition-all hover:bg-red-400/10 hover:text-red-400"
                          title="Remove staff"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
'''
    text = text.replace(
        "                      {currentUser?.email === 'jones@gmail.com' && (",
        staff_btn + "                      {currentUser?.email === 'jones@gmail.com' && (",
        1,
    )
    p.write_text(text)
PY

# ── Staff permissions: blogs ──
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/utils/staffPermissions.js")
text = p.read_text()
if "'blogs'" not in text:
    text = text.replace(
        "    permissions: ['products', 'orders', 'customers', 'dashboard'],\n    hint: 'Website catalogue and orders.',",
        "    permissions: ['products', 'orders', 'customers', 'dashboard', 'blogs'],\n    hint: 'Website catalogue, orders, and blog.',",
    )
    marketing = '''  {
    label: 'Marketing',
    permissions: ['blogs', 'reviews'],
    hint: 'Blog posts for SEO and review moderation.',
  },
'''
    if "label: 'Inventory'" in text and "Marketing" not in text:
        text = text.replace("  {\n    label: 'Inventory',", marketing + "  {\n    label: 'Inventory',")
    p.write_text(text)
PY

# ── BlogsView: SEO fields ──
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/components/admin/BlogsView.jsx")
text = p.read_text()
if "meta_title" not in text:
    text = text.replace(
        "  is_published: false,\n};",
        "  is_published: false,\n  meta_title: '',\n  meta_description: '',\n};",
    )
    text = text.replace(
        "        is_published: Boolean(payload.is_published),\n      });",
        "        is_published: Boolean(payload.is_published),\n        meta_title: payload.meta_title || '',\n        meta_description: payload.meta_description || '',\n      });",
    )
    text = text.replace(
        '<h2 className="text-xl font-serif font-bold text-gold-100">Blog Management</h2>\n          <p className="mt-1 text-xs text-gold-500/40">Published and draft posts with thumbnail previews.</p>',
        '<h2 className="text-xl font-serif font-bold text-gold-100">Blog & SEO</h2>\n          <p className="mt-1 text-xs text-gold-500/40">Publish articles for Google — use clear titles, slugs, and meta descriptions.</p>',
    )
    seo_block = '''
          <div className="rounded-2xl border border-gold-500/15 bg-navy-950/30 p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500/50">SEO (search engines)</p>
            <input
              type="text"
              name="meta_title"
              placeholder="Meta title (optional — defaults to post title)"
              value={formData.meta_title}
              onChange={handleInputChange}
              maxLength={60}
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <textarea
              name="meta_description"
              placeholder="Meta description for Google (optional — defaults to excerpt)"
              value={formData.meta_description}
              onChange={handleInputChange}
              maxLength={160}
              rows={2}
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <p className="text-[10px] text-gold-500/35">Public URL: /blog/{formData.slug || 'your-slug'}</p>
          </div>

'''
    text = text.replace(
        '          <textarea\n            name="excerpt"',
        seo_block + '          <textarea\n            name="excerpt"',
    )
    p.write_text(text)
PY

# ── BlogArticle: use meta fields ──
python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/BlogArticle.jsx")
text = p.read_text()
if "blog.meta_title" not in text:
    text = text.replace(
        '        title={blog.title}\n        description={blog.excerpt || blog.title}',
        '        title={blog.meta_title || blog.title}\n        description={blog.meta_description || blog.excerpt || blog.title}',
    )
    p.write_text(text)
PY

mkdir -p frontend/src/lib
cd frontend
npm run build 2>&1 | tail -6
pm2 restart prince-backend
sleep 2
curl -s -o /dev/null -w "orders:%{http_code} customers:%{http_code}\n" \
  -H "Authorization: Bearer $(cd ../backend && node -e "require('dotenv').config();const {signToken}=require('./src/utils/jwt');console.log(signToken({id:'ea7c67a0-6da3-4712-bf52-1a9267b01c56'}))")" \
  http://localhost:5000/api/admin/orders \
  http://localhost:5000/api/admin/customers/all
REMOTE

echo "Admin nav fixes deployed."
