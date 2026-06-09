# Cloudinary setup (required for production)

Local `/uploads` works in development only. On Render, Railway, or similar hosts, the filesystem is wiped on every deploy — use Cloudinary for persistent product images.

## Steps

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy **Cloud name**, **API Key**, and **API Secret**.
3. Add to `backend/.env`:

```env
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
CLOUDINARY_UPLOAD_PRESET=PRINCE-eSQUIIRE
CLOUDINARY_FOLDER=PRINCE-eSQUIIRE
REQUIRE_CLOUDINARY=true
STORAGE_ALLOW_LOCAL=false
```

4. In Cloudinary → Settings → Upload → Upload presets:
   - Create preset `PRINCE-eSQUIIRE` (unsigned is fine for admin uploads via server-side signed stream).
5. Verify:

```bash
cd backend
npm run verify:cloudinary
```

6. Restart the backend. `/api/health` should report `mediaStorage: cloudinary` and `productionReady: true`.

## Production behaviour

- `NODE_ENV=production` + `REQUIRE_CLOUDINARY=true` → server **refuses to start** without Cloudinary credentials.
- Upload API uses Cloudinary first; local fallback is disabled unless `STORAGE_ALLOW_LOCAL=true`.
