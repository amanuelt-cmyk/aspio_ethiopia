# Aspio Ethiopia

Production repository for the Aspio Ethiopia website, administration dashboard, and API. The Swedish Aspio application and all earlier prototypes are intentionally excluded.

## Repository layout

```text
aspio_ethiopia/
├── frontend/                 Next.js website and browser admin
│   ├── public/               Versioned static assets
│   └── src/
│       ├── app/              App Router pages, layouts, and route-local UI
│       └── lib/              Shared frontend types and utilities
├── backend/                  Standalone Go API
│   ├── cmd/                  API and operational commands
│   ├── internal/             Private application packages
│   └── docs/openapi.yaml     HTTP API contract
├── docs/                     Architecture, deployment, security, and copy
└── .github/workflows/        Automated validation
```

The two applications deploy independently:

- `frontend` → Vercel
- `backend` → Railway, with PostgreSQL and a persistent media volume

## Local development

Requirements: Node.js 22.13+, Go 1.26.6+, Docker Desktop, and npm.

Start the API and PostgreSQL:

```powershell
Set-Location backend
Copy-Item .env.example .env
docker compose up --build -d
```

Start the website in another terminal:

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000/ethiopia`. The private dashboard is at `http://localhost:3000/ethiopia/admin`.

## Validation

```powershell
Set-Location frontend
npm run typecheck
npm run lint
npm run build

Set-Location ../backend
go test ./...
go vet ./...
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Website copy](docs/content/website-copy.md)
- [Backend operations](backend/README.md)

Never commit `.env` files, database credentials, admin passwords, Resend keys, or production exports.
