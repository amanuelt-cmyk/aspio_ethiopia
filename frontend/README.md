# Aspio Ethiopia frontend

Next.js App Router application for the public Ethiopia website and private browser administration dashboard.

## Commands

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
npm run typecheck
npm run lint
npm run build
npm start
```

`NEXT_PUBLIC_ASPIO_API_URL` must contain the API origin without a trailing slash, for example `http://localhost:18080`.

## Routes

| Route | Purpose |
| --- | --- |
| `/ethiopia` | Public landing page |
| `/ethiopia/gallery` | Published gallery media |
| `/ethiopia/business` | Business plan overview |
| `/ethiopia/contact` | Contact lead form |
| `/ethiopia/register` | Demo registration form |
| `/ethiopia/admin` | Private administration dashboard |

The public site currently ships in English. Historical `/ethiopia/en/*` and `/ethiopia/am/*` URLs redirect to the canonical English routes. Marketplace and salon interactions continue to `https://app.aspio.io/`.

Deploy this directory as the Vercel project root. No server secret belongs in a `NEXT_PUBLIC_` environment variable.
