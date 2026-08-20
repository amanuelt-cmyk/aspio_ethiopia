# Aspio Ethiopia

Aspio Ethiopia's public website and administration interface, with a separate Go API for leads, salons, featured places, gallery media, blog content and administrator accounts.

## Project structure

- `app`, `lib`, `worker`: Vinext/React frontend
- `public`: frontend images, video and static assets
- `backend`: standalone Go API and PostgreSQL migrations
- `DEPLOYMENT.md`: Vercel frontend and API deployment guide

The Swedish Aspio website is intentionally not part of this repository.

## Local development

Requirements: Node.js 22.13 or newer, Go 1.24 or newer, Docker Desktop and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The frontend opens at `http://localhost:5173`. To run the complete system, follow the backend setup in [backend/README.md](backend/README.md) and set `NEXT_PUBLIC_ASPIO_API_URL=http://localhost:18080` in `.env.local`.

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```

## Deployment

The frontend is ready for Vercel. The Go API must run as a separate persistent service. See [DEPLOYMENT.md](DEPLOYMENT.md) for the full procedure and required environment variables.
