# Update live site on DigitalOcean (161.35.58.181)

## 1. SSH into the server

You need the droplet SSH private key (from DigitalOcean → Droplet → Access).

```bash
ssh root@161.35.58.181
# or
ssh ubuntu@161.35.58.181
```

If `Permission denied (publickey)`, add your key in DigitalOcean console or use the one-time password reset.

## 2. Find the app directory

```bash
bash /path/to/Prince-Esquare/scripts/server-find-app.sh
```

Common locations:

- `/var/www/Prince-Esquare`
- `/var/www/prince-esquare`
- `/home/ubuntu/Prince-Esquare`

Look for a folder that contains both `backend/` and `frontend/`.

Also check:

```bash
pm2 list
cat /etc/nginx/sites-enabled/*
```

## 3. Backup database (required before update)

```bash
pg_dump prince_esquare | gzip > ~/backup_$(date +%F).sql.gz
```

## 4. Update code safely

```bash
cd /var/www/Prince-Esquare   # your actual path
git pull origin main
bash scripts/server-update.sh
```

The update script:

- Backs up the database
- Pulls latest code
- Runs **only pending** migrations (skips already-applied SQL)
- Builds frontend
- Restarts PM2

## 5. Database — what changes on live data

Migrations are **additive** (new tables/columns/indexes). Existing products, orders, and stock rows stay.

**Do not run on production:**

- `npm run seed:dummy-products`
- `npm run angles:apply` (unless you want to replace product images)

## 6. Production `.env` tips

In `backend/.env` on the server:

```env
NODE_ENV=production
REQUIRE_CLOUDINARY=true
STORAGE_ALLOW_LOCAL=false
CLOUDINARY_URL=...
FRONTEND_URL=https://your-domain.com
```

Set `AUTO_BOOTSTRAP=false` for the first restart if you want to skip automatic POS link sync; turn back on after verifying.

## 7. Nginx

After frontend build, nginx should serve `frontend/dist`. Example:

```nginx
root /var/www/Prince-Esquare/frontend/dist;
location /api/ {
    proxy_pass http://127.0.0.1:8000;
}
```

Reload: `sudo nginx -t && sudo systemctl reload nginx`

## 8. Verify

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/health/data
```

Open the site in a browser and test product page + admin login.
