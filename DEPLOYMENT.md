# Deployment guide

The frontend and API are deployed separately:

- Vercel serves this Vinext/React frontend.
- A container host serves `backend`, PostgreSQL and persistent media storage.

## 1. Deploy the frontend to Vercel

1. Sign in to Vercel with the GitHub account that can access `amanuelt-cmyk/aspio_ethiopia`.
2. Select **Add New → Project**, import `amanuelt-cmyk/aspio_ethiopia`, and leave **Root Directory** as the repository root.
3. Vercel reads `vercel.json`; it installs with `npm ci` and builds with `npm run build:vercel`.
4. Under **Settings → Environment Variables**, add this variable for Production and Preview:

   ```text
   NEXT_PUBLIC_ASPIO_API_URL=https://api.your-domain.example
   ```

   This is a public URL, not a secret. Do not put database, email, admin or CRM credentials in a `NEXT_PUBLIC_` variable.
5. Deploy and verify `/`, `/ethiopia`, `/ethiopia/en/gallery`, `/ethiopia/en/register` and `/ethiopia/admin`.
6. After adding a custom domain, update the API's `CORS_ALLOWED_ORIGINS` and redeploy the API.

Commits to `main` produce production deployments. Other branches produce preview deployments.

## 2. Deploy the Go API

The API should not be moved into a temporary serverless function unchanged. It relies on PostgreSQL, durable delivery jobs and persistent uploaded media. Use a container service with a managed PostgreSQL database and either a persistent volume or object storage.

Set at least:

```text
APP_ENV=production
HTTP_ADDR=:8080
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
CORS_ALLOWED_ORIGINS=https://your-vercel-domain.example
AUTO_MIGRATE=false
UPLOAD_DIR=/persistent/path/uploads
SESSION_TTL=24h
IP_HASH_SECRET=GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
RESEND_API_KEY=YOUR_RESEND_KEY
LEAD_RECIPIENT_EMAIL=amanuel.t@aspio.se
LEAD_FROM_EMAIL=Aspio Leads <leads@aspio.se>
```

Use the additional optional variables documented in `backend/.env.example` for CRM delivery and upload limits.

Run database migrations once during deployment:

```text
go run ./cmd/migrate
```

Then start the API:

```text
go run ./cmd/api
```

When the API has a public HTTPS URL, put that URL in Vercel as `NEXT_PUBLIC_ASPIO_API_URL` and redeploy the frontend.

## Local Vercel-compatible build

From the repository root in PowerShell:

```powershell
$env:VERCEL = "1"
$env:NITRO_PRESET = "vercel"
npm run build:vercel
Remove-Item Env:VERCEL
Remove-Item Env:NITRO_PRESET
```

Nitro generates Vercel's native Build Output in `.vercel/output`.
