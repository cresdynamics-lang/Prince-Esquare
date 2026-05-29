# Sync Prince Esquire database (local → Ubuntu server)

This guide copies your **local PostgreSQL** data (products, variants, categories, customers, etc.) to your **Ubuntu production server** so both databases match.

---

## Prerequisites

| Machine | Requirements |
|---------|----------------|
| **Local (Windows)** | PostgreSQL client tools (`pg_dump`), project `.env` with DB credentials |
| **Ubuntu server** | PostgreSQL, Node.js 18+, project cloned, `.env` configured |

Database name used in examples: `prince_esquare` (match your `.env`).

---

## Option A — Full database copy (recommended)

Best when you want the server to be **identical** to local (all products, variants, users, orders).

### 1. On your local machine — export

```powershell
cd C:\Users\HomePC\Desktop\Cres\Prince-Esquare\backend

# Set variables (adjust password/host as in your .env)
$env:PGPASSWORD = "YOUR_LOCAL_DB_PASSWORD"

pg_dump -h localhost -p 5432 -U postgres -d prince_esquare -F c -f prince_esquare_backup.dump
```

Plain SQL format (alternative):

```powershell
pg_dump -h localhost -p 5432 -U postgres -d prince_esquare > prince_esquare_backup.sql
```

### 2. Copy file to Ubuntu

```powershell
scp prince_esquare_backup.dump user@YOUR_SERVER_IP:/home/user/
```

### 3. On Ubuntu — restore

```bash
ssh user@YOUR_SERVER_IP
cd ~/Prince-Esquare/backend

# Stop API while restoring (if using pm2)
pm2 stop prince-api   # or your process name

export PGPASSWORD='YOUR_SERVER_DB_PASSWORD'

# Create DB if missing
psql -h localhost -U postgres -c "CREATE DATABASE prince_esquare;" 2>/dev/null || true

# Restore (custom format)
pg_restore -h localhost -U postgres -d prince_esquare --clean --if-exists ~/prince_esquare_backup.dump

# OR restore (SQL file)
# psql -h localhost -U postgres -d prince_esquare < ~/prince_esquare_backup.sql
```

### 4. Run migrations (safe to re-run)

```bash
npm run db:migrate
```

### 5. Restart API

```bash
pm2 start prince-api
# or: npm run start
```

---

## Option B — Seed catalog only (no user/order data)

Use when the server DB is empty and you only need **products + categories** like local dummy data.

### On Ubuntu

```bash
cd ~/Prince-Esquare/backend
npm install
cp .env.example .env   # then edit with production values

# Run schema migrations first
npm run db:migrate

# Seed all storefront products from frontend dummy catalog
npm run seed:dummy-products

# Optional: seed categories/brands from catalog file
npm run seed:store

# Create admin login
npm run seed:admin
```

Default admin is created by `seed-admin.js` (check that file for email/password).

---

## Option C — Export products as JSON (for inspection / manual import)

### On local machine

```bash
cd backend
node scripts/export-products-json.js
```

Creates `backend/data/products-export.json` with products, variants, and **optimized image JSON** fields.

To import on server (after migrations):

```bash
node scripts/import-products-json.js
```

---

## Cloudinary preset (images)

Uploads use preset **`prince-esquire`** and folder **`prince-esquire`**.

In Cloudinary Dashboard → Settings → Upload → Upload presets:

1. Create or edit preset named exactly: `prince-esquire`
2. Set signing mode as required by your account (unsigned preset for direct uploads, or signed via API key in backend `.env`)

Add to **both** local and server `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_UPLOAD_PRESET=prince-esquire
CLOUDINARY_FOLDER=prince-esquire
```

Product `images` column stores JSON like:

```json
[
  {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "optimized": "https://res.cloudinary.com/.../upload/f_auto,q_auto,w_800/...",
    "thumbnail": "https://res.cloudinary.com/.../upload/f_auto,q_auto,w_400/..."
  }
]
```

---

## Useful SQL checks on Ubuntu

```bash
psql -h localhost -U postgres -d prince_esquare
```

```sql
-- Count products
SELECT COUNT(*) FROM products;

-- Products with variants
SELECT p.name, COUNT(v.id) AS variants
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
GROUP BY p.id, p.name
ORDER BY p.name;

-- Customers
SELECT id, name, email, role, created_at FROM users WHERE role = 'customer';

-- Admins & staff
SELECT id, name, email, role FROM users WHERE role IN ('admin', 'staff');
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `pg_dump: command not found` | Install PostgreSQL client: `sudo apt install postgresql-client` |
| Restore fails on roles/owners | Add `--no-owner --no-acl` to `pg_restore` |
| Images broken after copy | URLs are Cloudinary links; ensure same Cloudinary account on server `.env` |
| Empty admin customers list | API: `GET /api/admin/customers/all?role=customer` (requires admin JWT) |
| Empty admins list | `GET /api/admin/customers/all?role=admin` and `?role=staff` |

---

## Quick reference — npm scripts

```bash
npm run db:migrate          # Apply SQL migrations
npm run seed:dummy-products # Products from dummyData.js
npm run seed:store          # Categories/brands from catalog
npm run seed:admin          # Admin user
```
