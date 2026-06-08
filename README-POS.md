# Prince Esquire — POS & Inventory

## Setup

### 1. Environment

Copy and fill `backend/.env` from `backend/.env.example`:

- `ADMIN_EMAIL` — low-stock alert recipient
- `INTERNAL_KEY` — shared secret for online order → POS stock deduction
- `FRONTEND_URL` — Socket.io CORS (e.g. `http://localhost:5173`)
- `DATABASE_URL` — for Prisma (optional if using SQL migrations only)

Copy `frontend/.env.example` → `frontend/.env` and set `VITE_INTERNAL_KEY` to the same value as `INTERNAL_KEY`.

### 2. Database

Run SQL migrations (includes `011_pos_inventory.sql`):

```bash
cd backend
npm run db:migrate
```

Or Prisma:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_pos_inventory
```

### 3. Import stock from Excel

Your `Stock.xlsx` format is supported:

| Item | Opening Stock | sales | Stock Out | Stock In | Closing Stock |

```bash
# From bundled file (copied from your spreadsheet)
cd backend
npm run import:stock

# Or any file path
node scripts/import-stock-excel.js "C:/path/to/Stock.xlsx"

# Or seed catalog baked into repo
npm run db:seed:pos
```

Imports **24 products** (Shirts through Gurkha Pants) with opening/closing qty and daily snapshots.

### 4. Prisma client (if POS API errors)

Stop the backend, then:

```bash
npx prisma generate
```

## Access

| Role | Login URL | Notes |
|------|-----------|-------|
| Admin / Staff | `/admin/login` | Existing `users` table credentials. One JWT unlocks e-commerce admin **and** POS admin sections in the dashboard sidebar. |
| Seller | `/pos/login` | `pos_profiles` with `role: SELLER`. Cannot access `/admin/*`. |

After admin login → `/admin/dashboard` → click **POS & Inventory** in the sidebar. Everything (stock, sales, shifts, sellers, reports, settings) is in one tabbed hub. The main dashboard also shows a POS summary card with a quick link.

Finance → **Shop Inventory** tab opens the same hub on the Stock tab.

## Onboard a seller

1. Log in as admin at `/admin/login`.
2. Open **Team → Sellers** in the dashboard.
3. Click **Add Seller** (name, email, password).
4. Seller logs in at `/pos/login`, clocks in, and uses the terminal at `/pos`.

## Close a day

1. Admin → **POS & Inventory → Daily Sheet**.
2. Review opening / movements / closing per product.
3. Click **Close Day** (snapshots today; tomorrow’s opening = today’s closing).

## Excel upload / download (dashboard)

Admin → **POS & Inventory** → **Stock** or **Daily Sheet** toolbar:

- **Upload .xlsx** — syncs products, closing qty, and daily snapshot (same format as your `Stock.xlsx`)
- **Download Stock.xlsx** — export current sheet
- **Template** — blank template with correct columns

## Reports

Admin → **POS & Inventory** → **Reports** — download Excel files (daily sales, stock, movements, low stock, end of day).

## Receipts

- POS terminal: PDF after each sale
- Dashboard → **POS Sales** → **Receipt** button per row

Shift report: `GET /api/reports/shift-report?shiftId=<uuid>` (with admin JWT).

## Online orders

When an e-commerce order is paid, call `POST /api/pos/online-sale` with header `x-internal-key` to deduct POS stock. Wire this in your payment completion handler.

## Socket events

- `stock:updated` — `{ productId, newQty }` (live stock on storefront)
- `stock:lowAlert` — low-stock toast in admin overview
