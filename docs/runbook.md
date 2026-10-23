# Runbook — RG Enterprises storefront

Operational guide for running the live system. Pairs with `docs/launch-checklist.md` (pre-launch
items) and `docs/phase-1-audit.md` (architecture).

## Datasets
- `production` — **private** (buyer/order PII + password hashes are not publicly readable; image
  assets on `cdn.sanity.io` remain public). Catalog + transactional content.
- `development` — private. Dev/e2e (free plan caps at 2 datasets; no separate `test`).

## Content: add / edit products
1. Go to **`/adminpanel`** (embedded Sanity Studio) and sign in with your Sanity account.
2. Studio structure: **Catalog → Products** (and Categories, Colours, Banners). Singletons
   **Site settings** and **Homepage** are at the top.
3. A non-developer can create a product: name, slug (auto), category, fabric, MOQ, primary image
   (+ gallery), variants (sku/size/colour/stock), base price, tiers, size runs, HSN.
4. After an edit, the storefront cache refreshes via the webhook (below) — or within 1 h, or on a
   server restart.

## Catalog import (bulk, from CSV)
- `npm run import:catalog` — idempotent; re-runs replace by deterministic `_id` (`product.<pid>`).
  Currently imports only the 6 AI-angle products (see launch-checklist §0). `--dry-run` to preview.
- `npx tsx scripts/purge-catalog.ts --dataset=production` — clears all product+colour docs for a clean re-import.

## Buyers & approval
- A buyer self-registers at **`/apply`** (creates a `buyer`, `status: pending`, with a password).
- An **admin** approves at **`/admin/buyers`** → Approve / Reject / Suspend, or Edit (credit,
  price list, payment terms). Approval is live — the buyer sees wholesale prices on their next page load.
- Admin access requires `role: admin` on the buyer doc (set in Studio or the seed).

## Auth / accounts
- Seed dev accounts: `npm run seed:dev` (→ `development`). Password for all: `password123`.
- Bootstrap the first production admin: `tsx scripts/seed-dev.ts --dataset=production --allow-production`
  (creates `admin@rg.test` / `anand@rg.test` / `surya@rg.test`). **Rotate these before launch.**
- Sessions are httpOnly JWT cookies (`rg_session`, 7 d), signed with `SESSION_SECRET`.

## Cache revalidation (Sanity → Next)
- Webhook target: `POST /api/revalidate` with header `x-webhook-secret: $SANITY_REVALIDATE_SECRET`,
  body projecting `{ "_type": _type }`. It calls `revalidateTag` for the affected tag.
- Create it: `npx sanity hooks create` (GROQ webhook) pointing at `https://<host>/api/revalidate`.
- Without the webhook, external edits appear within the 1 h cache TTL or after a server restart
  (`rm -rf .next` clears the local cache in dev).

## Health
- `GET /api/health` → `{ status: "ok", sanity: "reachable" }` (503 if Sanity is unreachable).

## Tokens
- `.env.local` holds `SANITY_API_WRITE_TOKEN` / `SANITY_API_READ_TOKEN` (dev: one Editor token).
- Rotate / split (Viewer read + Editor write) at sanity.io/manage → `zaix9ccv` → API → Tokens.
- Delete a token: `npx sanity tokens delete`.

## Backup / restore
- Export: `npx sanity dataset export production backup.tar.gz`.
- Import/restore: `npx sanity dataset import backup.tar.gz production --replace`.
