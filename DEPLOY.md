# Deployment guide

## Prerequisites

- PostgreSQL database
- [Cloudinary](docs/CLOUDINARY_SETUP.md) credentials (required for production images)
- Node 20+ (or Docker)

## Option A — Docker Compose (local / VPS)

```bash
docker compose up --build
```

- API: http://localhost:8000
- Web: http://localhost:5173
- Postgres: localhost:5432

Set real secrets in `docker-compose.yml` or an override file before production use.

## Option B — Render

1. Connect repo [cresdynamics-lang/Prince-Esquare](https://github.com/cresdynamics-lang/Prince-Esquare).
2. Use `render.yaml` blueprint or create services manually:
   - **Web service** — Docker, `backend/Dockerfile`, health check `/api/health`
   - **Static site** — `frontend`, build `npm ci && npm run build`, publish `dist`
   - **PostgreSQL** — attach `DATABASE_URL`
3. Set environment variables (see `backend/.env.example`):
   - `CLOUDINARY_URL`, `JWT_SECRET`, `INTERNAL_KEY`, `FRONTEND_URL`, `VITE_API_URL`
4. Run migrations once: Render shell → `npm run db:migrate`

## Option C — Manual

### Backend

```bash
cd backend
cp .env.example .env   # fill values
npm ci
npm run db:migrate
npm start
```

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL to your API
npm ci
npm run build
# Serve dist/ with nginx, Vercel, Netlify, or Cloudflare Pages
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push to `main`:

- Backend syntax check
- Frontend production build
- Docker image builds

## Angle product images
This feature is now handled automatically.

## Health checks

- `GET /api/health` — liveness
- `GET /api/health/data` — counts + Cloudinary / M-Pesa status
