# RG Enterprises — B2B Wholesale Storefront

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4, with **Sanity** as the live backend.
Approved retail buyers browse a catalog, see tiered wholesale pricing, and order by a size×colour
matrix; admins approve buyers and manage content. Design system: "The page is the object"
(see `design.md`). Architecture + decisions: `docs/phase-1-audit.md`.

## Stack
- **Next.js 16.4.2** App Router (server components, server actions, `proxy.ts` middleware)
- **Sanity** (`next-sanity`) — catalog + transactional content; embedded Studio at `/adminpanel`
- **Auth** — custom httpOnly JWT session (`jose`) + bcrypt password hashing
- **Vitest** unit tests · **ESLint** · GitHub Actions CI

## Setup

```bash
npm install
```

Create `.env.local` (see `.env.example`):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=zaix9ccv     # your Sanity project id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=<Viewer token>        # required (production is private)
SANITY_API_WRITE_TOKEN=<Editor token>       # required for writes/import/auth
SESSION_SECRET=<random 32+ chars>           # signs session cookies
SANITY_REVALIDATE_SECRET=<random>           # Sanity webhook shared secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # used by sitemap/robots
```

Tokens: [sanity.io/manage](https://www.sanity.io/manage) → your project → API → Tokens
(or `npx sanity tokens add "rg-app" --role=editor`). Generate secrets with
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.

```bash
npm run dev          # http://localhost:3000  ·  Studio at /adminpanel
```

## Data
- `npm run import:catalog` — import the catalog from the CSVs (idempotent; images uploaded as assets).
- `npm run seed:dev` — seed admin + buyers into `development` (password `password123`).
- Bootstrap a production admin: `tsx scripts/seed-dev.ts --dataset=production --allow-production`.

Catalog is served live from Sanity; add/edit products in the Studio at `/adminpanel` (see `docs/runbook.md`).

## Scripts
| Script | What |
|--------|------|
| `dev` / `build` / `start` | Next dev / production build / serve |
| `lint` / `typecheck` | ESLint · `tsc --noEmit` |
| `test` / `test:cov` | Vitest (business logic) · with coverage |
| `typegen` | Sanity schema extract + TypeGen |
| `import:catalog` / `seed:dev` | catalog import · dev seed |

## Testing & CI
- **Unit (Vitest):** `npm test` — pricing, GST (CGST/SGST vs IGST), min-order, validation, INR, CSV parsing, cart computation, price-gating (48 tests).
- **E2E (Playwright):** `npm run e2e:install` once, then `npm run test:e2e` — anonymous price-gating + route protection, login/approval, admin protection, and the full add-to-cart → checkout → order flow. Runs against an **isolated `development` dataset** (seed first: `npm run import:catalog -- --dataset=development && npm run seed:dev`). Stop any running `next dev` first (Next 16 allows one dev server per project).
- **CI** (`.github/workflows/ci.yml`): `verify` job (typecheck → lint → unit → build) on every push/PR; an `e2e` job runs Playwright when Sanity secrets are configured.

## Deploy (Vercel + Sanity)
1. Push to GitHub; import the repo in Vercel.
2. Set env vars (above) in Vercel. Keep `production` dataset **private**; use a dedicated Viewer
   read token + Editor write token (rotate the dev token).
3. Create the Sanity revalidation webhook → `https://<host>/api/revalidate` with the
   `x-webhook-secret` header (see `docs/runbook.md`).
4. Health check: `GET /api/health`.

**Rollback:** redeploy the previous Vercel build; restore data with
`npx sanity dataset import <backup>.tar.gz production --replace`.

## ⚠️ Before public launch
Product images are **scraped Jaypore/Fabindia photos + AI-generated angle renders** — commercial-reuse
risk. Replace with licensed/own photography. Wholesale prices, tiers, MOQ, GSTIN and HSN codes are
**placeholders**. See `docs/launch-checklist.md`.
