# Architecture

## System boundaries

The repository contains two independently deployable applications:

1. `frontend` is a Next.js application. It renders the marketing website, forms, map, gallery, and the browser admin.
2. `backend` is a Go HTTP service. It owns authentication, validation, persistence, media storage, lead delivery, and the public/admin API.

PostgreSQL is the source of truth. Uploaded media is stored on the backend's mounted volume and its metadata is stored in PostgreSQL. Resend and the future CRM adapter are isolated behind the delivery package.

```text
Browser
  ├── Next.js pages ─────────────── Vercel
  └── HTTPS /api/v1/* ───────────── Go API on Railway
                                      ├── PostgreSQL
                                      ├── persistent /data/uploads
                                      ├── Resend
                                      └── optional CRM webhook
```

## Frontend organization

- `src/app` contains App Router routes and layouts.
- Ethiopia marketing components remain close to their route under `src/app/ethiopia/components`.
- Admin components are isolated under `src/app/ethiopia/admin` and are excluded from public navigation and search indexing.
- `src/lib` contains code shared across routes.
- Public routes are canonical under `/ethiopia/*`; compatibility redirects live in `next.config.ts`.

The website currently displays English only. Optional Amharic fields remain in the API and admin data model deliberately, so existing records are not destroyed and localization can return without another database migration.

## Backend organization

- `cmd/api` starts the HTTP API and delivery worker.
- `cmd/migrate`, `cmd/seed`, and `cmd/admin` are explicit operational commands.
- `internal/httpapi` owns transport concerns.
- `internal/store` owns PostgreSQL queries.
- `internal/domain` owns shared domain models.
- `internal/security`, `internal/media`, `internal/location`, and `internal/delivery` isolate sensitive integrations.
- `internal/migrations/sql` contains forward-only database migrations embedded in the migration binary.

Packages under `internal` cannot be imported by unrelated Go modules, keeping the backend boundary enforceable.

## Data flow

- Public salon, featured-place, and gallery requests degrade to curated frontend demo data if the API is unavailable.
- Lead forms fail closed: a successful browser message is shown only after the API persists the lead.
- Lead and delivery jobs are written in one transaction. The worker retries email and CRM delivery independently.
- Admin sessions are random bearer tokens; only token hashes are stored in PostgreSQL.
- Uploaded files receive generated names and are served from `/uploads/*`; original file names are metadata only.
