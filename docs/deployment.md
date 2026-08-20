# Deployment

The frontend and backend are separate services from the same Git repository.

## 1. Deploy the backend to Railway

Create a Railway project with:

- one service connected to this repository, with **Root Directory** set to `backend`
- one Railway PostgreSQL service
- one persistent volume mounted on the API service at `/data/uploads`

Railway detects `backend/railway.json` and `backend/Dockerfile`. The release command runs migrations before `/aspio-api` starts.

Set these API variables:

```text
APP_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}?sslmode=require
CORS_ALLOWED_ORIGINS=https://aspio-ethiopia.vercel.app
AUTO_MIGRATE=false
UPLOAD_DIR=/data/uploads
SESSION_TTL=24h
TRUST_PROXY_HEADERS=true
IP_HASH_SECRET=GENERATE_A_UNIQUE_RANDOM_VALUE_OF_AT_LEAST_32_CHARACTERS
RESEND_API_KEY=YOUR_RESEND_KEY
LEAD_RECIPIENT_EMAIL=amanuel.t@aspio.se
LEAD_FROM_EMAIL=Aspio Leads <YOUR_VERIFIED_RESEND_SENDER>
RAILWAY_RUN_UID=0
```

Railway supplies `PORT`; do not set `HTTP_ADDR` there. Generate a public HTTPS domain after the first successful deployment and verify:

```text
https://YOUR-RAILWAY-DOMAIN/healthz
https://YOUR-RAILWAY-DOMAIN/readyz
```

Create the first super administrator with the included `/aspio-admin` command. Supply `ASPIO_ADMIN_PASSWORD` temporarily and delete the variable immediately after the account is created.

## 2. Deploy the frontend to Vercel

Import the repository as a Vercel project and configure:

```text
Framework Preset: Next.js
Root Directory: frontend
Build Command: next build
Output Directory: Next.js default
```

Set this public environment variable for Production and Preview:

```text
NEXT_PUBLIC_ASPIO_API_URL=https://YOUR-RAILWAY-DOMAIN
```

Redeploy after adding or changing a `NEXT_PUBLIC_` variable because it is compiled into the browser bundle.

Verify these routes:

- `/ethiopia`
- `/ethiopia/gallery`
- `/ethiopia/register`
- `/ethiopia/contact`
- `/ethiopia/admin`

Submit a test lead, log in to the admin, upload one image and one video, and confirm that both remain available after a Railway redeploy.

## 3. Complete the connection

When the final frontend domain is known, set the exact origin in Railway:

```text
CORS_ALLOWED_ORIGINS=https://your-production-domain.example
```

For multiple allowed frontend origins, use a comma-separated list. Origins must not include paths, query strings, or trailing route fragments.

## Rollback

- Vercel: promote the last known-good deployment.
- Railway API: redeploy the last known-good image or commit.
- Database: migrations are forward-only. Restore from a verified PostgreSQL backup for destructive data incidents rather than editing applied migration history.
- Media: restore the Railway volume from its independent backup; database restoration alone does not restore files.
