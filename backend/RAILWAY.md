# Railway deployment

Deploy this directory as the root of a Railway service. The checked-in `railway.json` builds the Dockerfile, runs database migrations before release, starts the API and verifies `/readyz` before routing traffic.

Create a PostgreSQL service in the same Railway project and attach a persistent volume to the API at `/data/uploads`.

Set these API service variables:

```text
APP_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}?sslmode=require
CORS_ALLOWED_ORIGINS=https://aspio-ethiopia.vercel.app
AUTO_MIGRATE=false
UPLOAD_DIR=/data/uploads
SESSION_TTL=24h
TRUST_PROXY_HEADERS=true
IP_HASH_SECRET=GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
RESEND_API_KEY=YOUR_RESEND_KEY
LEAD_RECIPIENT_EMAIL=amanuel.t@aspio.se
LEAD_FROM_EMAIL=Aspio Leads <YOUR_VERIFIED_RESEND_SENDER>
RAILWAY_RUN_UID=0
```

`PORT` is supplied by Railway and is used automatically when `HTTP_ADDR` is not set. Do not define `HTTP_ADDR` on Railway.

After deployment, generate a public domain in the service Networking settings. Connect that URL to the Vercel frontend as `NEXT_PUBLIC_ASPIO_API_URL`, then redeploy the frontend.

The container includes one-off maintenance commands:

```text
/aspio-migrate
/aspio-seed
/aspio-admin -email amanuel.t@aspio.se -name Amanuel -role super_admin
```

For the admin command, temporarily add `ASPIO_ADMIN_PASSWORD` as a Railway service secret, run the command through `railway ssh`, and remove the secret immediately afterward.
