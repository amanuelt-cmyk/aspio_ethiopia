# Aspio API

Standalone Go API for the Aspio Ethiopia marketplace, blog, admin operations, and lead delivery. It belongs only to the Ethiopia project, runs independently from both frontends, and stores business data in PostgreSQL.

## What is included

- public localized salon, map-pin, curated featured-place, gallery, and blog APIs
- authenticated salon image/video uploads with validated file types and persistent local storage
- protected salon, gallery, featured-place, and blog CRUD APIs
- super-admin/admin access levels with Argon2id password hashes
- protected administrator creation, role management, deactivation, and session-revoking password resets
- random, hashed, revocable server-side sessions (no permanent admin API key)
- durable lead storage and transactional email/CRM delivery jobs
- Resend delivery with idempotency and exponential retry
- pagination, filters, validation, exact-origin CORS, request IDs, structured logs, rate limiting, health checks, and graceful shutdown
- embedded, forward-only migrations and idempotent starter data
- Docker development stack and an OpenAPI 3.1 contract

## Run locally with Docker

From this `backend` directory:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

The API is available at `http://localhost:18080`; PostgreSQL is exposed at `localhost:55432` to avoid collisions with an existing local database.

Compose reads only `backend/.env`. Keep the real Resend key and all other API secrets there (or in the production platform's secret store), never in a frontend environment.

Verify the service:

```powershell
Invoke-RestMethod http://localhost:18080/readyz
```

Load the starter salons from a terminal with Go installed:

```powershell
$env:DATABASE_URL = "postgres://aspio:aspio@localhost:55432/aspio?sslmode=disable"
go run ./cmd/seed
```

## Run the Go commands directly

Start only PostgreSQL:

```powershell
docker compose up -d postgres
$env:DATABASE_URL = "postgres://aspio:aspio@localhost:55432/aspio?sslmode=disable"
go run ./cmd/migrate
go run ./cmd/seed
go run ./cmd/api
```

Create the first administrator without putting the password in shell history:

```powershell
$env:ASPIO_ADMIN_PASSWORD = Read-Host "Admin password"
go run ./cmd/admin -email "amanuel.t@aspio.se" -name "Amanuel" -role super_admin
Remove-Item Env:ASPIO_ADMIN_PASSWORD
```

Then authenticate at `POST /api/v1/admin/auth/login`. Send the returned token as `Authorization: Bearer <token>` to protected endpoints.

## Connect the frontend

Copy `sites/ethiopia/.env.example` to `sites/ethiopia/.env.local` and restart the Ethiopia frontend:

```dotenv
NEXT_PUBLIC_ASPIO_API_URL=http://localhost:18080
```

The Ethiopia marketplace and featured salon grid will then read published salons from Go. The demo and contact forms submit leads to Go. Bundled salon cards can still render during an API outage, but lead submission deliberately fails closed; there is no frontend email fallback.

## Browser admin

After the API and frontend are running, open:

```text
http://localhost:5173/ethiopia/admin
```

If Vite chooses another port, use the frontend URL printed in your terminal and append `/ethiopia/admin`.

Use the administrator created with `cmd/admin`. The dashboard is intentionally absent from public navigation and provides:

- operational overview and publishing totals
- salon creation/editing, bilingual copy, Google Maps link placement, pricing, imagery, and visibility
- salon-specific cover media with image/video upload, preview, and deletion
- separate public image and video gallery workspaces with bulk upload progress, captions, ordering, and publishing controls
- curated Featured Places workspace for established salon and barbershop partners
- administrator profile editing with persistent contact details and profile-picture upload
- a super-admin-only Administrators workspace for creating accounts, managing roles, revoking access, and resetting temporary passwords
- bilingual blog drafting and publishing with Markdown-ready content and SEO fields
- lead details, email-delivery state, and sales-stage management

The frontend keeps the revocable admin token in `sessionStorage`, so closing the browser tab clears the browser-side session. Signing out also revokes the session in PostgreSQL.

## Main routes

| Access | Method and route | Purpose |
| --- | --- | --- |
| Public | `GET /api/v1/salons` | Localized marketplace list |
| Public | `GET /api/v1/salons/{slug}` | Salon detail |
| Public | `GET /api/v1/map/salons` | Lightweight map pins |
| Public | `GET /api/v1/gallery` | Published image and video gallery items |
| Public | `GET /api/v1/featured-places` | Curated salon and barbershop partners |
| Public | `GET /api/v1/blog/posts` | Published posts |
| Public | `GET /api/v1/blog/posts/{slug}` | Published post detail |
| Public | `POST /api/v1/leads` | Persist a demo/contact request |
| Admin | `POST /api/v1/admin/auth/login` | Create a revocable session |
| Super admin | `GET/POST /api/v1/admin/users` | List and create administrator accounts |
| Super admin | `PUT /api/v1/admin/users/{id}` | Manage an administrator's role and access |
| Super admin | `POST /api/v1/admin/users/{id}/password` | Reset a password and revoke that account's sessions |
| Admin | `POST /api/v1/admin/locations/resolve` | Resolve a Google Maps share link inside Addis Ababa |
| Admin | `/api/v1/admin/salons` | List/create/get/replace/soft-delete salons |
| Admin | `GET/POST /api/v1/admin/salons/{id}/media` | List or upload salon images and videos |
| Admin | `DELETE /api/v1/admin/salons/{id}/media/{mediaId}` | Delete salon media |
| Admin | `GET /api/v1/admin/gallery` | List image or video gallery items |
| Admin | `POST /api/v1/admin/gallery/{kind}` | Upload an image or video gallery item |
| Admin | `PUT/DELETE /api/v1/admin/gallery/items/{id}` | Edit, publish, order, or remove gallery media |
| Admin | `GET/POST /api/v1/admin/featured-places` | List or curate featured partners |
| Admin | `PUT/DELETE /api/v1/admin/featured-places/{id}` | Edit, order, hide, or remove a featured partner |
| Admin | `/api/v1/admin/blog/posts` | List/create/get/replace/soft-delete posts |
| Admin | `GET /api/v1/admin/leads` | Review registrations and contact requests |
| Admin | `PATCH /api/v1/admin/leads/{id}/status` | Move a lead through the sales workflow |

The complete request and response contract is in [`docs/openapi.yaml`](docs/openapi.yaml).

## Publishing behavior

New salons and posts should begin as `draft`. A public endpoint returns a record only after its status becomes `published`. Deletes are soft deletes, preserving operational history. Blog content is stored as Markdown-ready text; render it with a sanitizer on the frontend.

The browser admin uploads real media files. The API verifies the detected MIME type, limits images to 15 MB and videos to 150 MB, and keeps its metadata in PostgreSQL. Compose stores the files in the persistent `aspio_uploads` volume. `UPLOAD_DIR` can point at another local mount in production; the storage package is intentionally isolated so an R2 or S3 implementation can replace it later without changing salon or frontend contracts.

Salon placement does not require a Google API key. Paste the link from Google Maps **Share → Copy link** in the admin editor. The API accepts full Google Maps URLs and `maps.app.goo.gl` short links, validates that the destination stays on Google, extracts its coordinates, and rejects locations outside the Addis Ababa service area. Publishing the salon makes that coordinate available to the landing-page map.

## Lead guarantees

`POST /api/v1/leads` writes the lead and its delivery jobs in one database transaction and returns `202 Accepted`. Email delivery happens outside the request, so a slow or unavailable provider cannot lose the registration. Jobs are claimed with `FOR UPDATE SKIP LOCKED`, reclaimed after interrupted workers, retried with exponential delay, and marked `dead` after eight attempts for operational review.

Set these values for email:

```dotenv
RESEND_API_KEY=re_your_real_key
LEAD_RECIPIENT_EMAIL=amanuel.t@aspio.se
LEAD_FROM_EMAIL=Aspio Leads <leads@aspio.se>
IP_HASH_SECRET=generate-a-unique-random-value-of-at-least-32-characters
```

Set `CRM_WEBHOOK_URL` and optionally `CRM_WEBHOOK_TOKEN` when the CRM is ready; no code change is required.

## Production checklist

- use a managed PostgreSQL database with backups and `sslmode=require`, `verify-ca`, or `verify-full`; production startup rejects plaintext database connections
- inject secrets through the hosting platform; never bake `.env` into the image
- use a unique `IP_HASH_SECRET` to pseudonymize lead IP addresses with HMAC rather than storing network identifiers directly
- run `cmd/migrate` once during deployment and leave `AUTO_MIGRATE=false` with multiple replicas
- allow only the exact production frontend origins in `CORS_ALLOWED_ORIGINS`
- verify `aspio.se` with Resend and use an address on that domain
- put the API behind HTTPS and a reverse proxy/load balancer
- use Go 1.26.6 or a newer patched release and run `govulncheck ./...` before releases
- add centralized metrics/alerting for `delivery_jobs.status='dead'`
- use an object store and signed upload flow when the admin media interface is added

## Verification

```powershell
go test ./...
docker compose config
```
