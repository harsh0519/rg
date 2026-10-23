# Launch checklist — items needing input before go-live

Status legend: 🔴 blocker · 🟠 needs business input · 🟢 done/automated

## 0. Catalog scope (interim)
- 🟠 **Only the 6 AI-angle products are imported** ("only angle image as the product for now"): 2 kurtas, 2 bedsheets, 2 towels, each with a 3-image angle gallery. The other 66 scraped products are excluded. Re-expand later by restoring the full import (and, per §3, replacing scraped/AI imagery with real photography). `scripts/import-catalog.ts` currently skips any product without an angle gallery; `scripts/purge-catalog.ts` clears the dataset for a clean re-import.

## 1. Credentials & infrastructure
- 🟠 **Sanity API tokens.** A dev **Editor** token (`rg-app-editor`) is provisioned and in `.env.local` as both `SANITY_API_WRITE_TOKEN` and `SANITY_API_READ_TOKEN` — this unblocks transactional work locally. **Before production:** split into a Viewer read token + an Editor write token, and **rotate** the dev token (it has full write access). Manage at [sanity.io/manage](https://www.sanity.io/manage) → `zaix9ccv` → API → Tokens.
- 🟠 **Dataset privacy.** `production` is currently **public** (catalog is public by nature). Before any real buyer/order data exists, decide: make `production` private (needs the read token wired everywhere) **or** keep catalog public and store transactional docs in a separate private dataset. Transactional data must not be publicly readable.
- 🟠 **Test dataset / plan.** Free plan caps at 2 datasets (`production`, `development` exist); a dedicated `test` dataset for e2e needs a plan upgrade. Interim: e2e runs against `development`.
- 🟠 **Email (Resend).** API key + verified sending domain → order/application/RFQ emails. Dev/test use a console transport.
- 🟠 **Observability (Sentry).** DSN for error tracking (Phase 6).
- 🟠 **Deploy (Vercel).** Project + env vars + the Sanity webhook (`/api/revalidate` with `SANITY_REVALIDATE_SECRET`). Remote `harsh0519/rg` exists for CI.

## 2. Business data — placeholders the import did NOT invent
These are seeded with clearly-marked placeholders; confirm real values in Studio before launch.
- 🟠 **Wholesale prices.** `product.basePrice` is currently the **scraped retail sale price** (a stand-in). Real wholesale per-piece prices must replace it.
- 🟠 **Quantity tiers.** `product.priceTiers` and `siteSettings.defaultPriceTiers` are **empty** — add the real qty-break wholesale prices.
- 🟠 **MOQ.** Defaulted to `10` pcs per product — confirm per product/category.
- 🟠 **Variants / stock.** Sizes are category defaults (kurtas S–XXL, bedsheets Single/Double/King, towels Standard) with placeholder stock `100`. Replace with real SKUs, size breaks, and live inventory.
- 🟠 **Seller GSTIN.** `siteSettings.sellerGstin` is empty (footer shows a placeholder). Add the real GSTIN.
- 🟠 **HSN codes.** `product.hsnCode` is empty — add per category for GST-compliant invoices.
- 🟠 **GST slab.** Flat **5%** is applied (`siteSettings.gstRate`). If premium lines need 12%, implement the slab rule (currently out of scope).
- 🟠 **Contact / legal.** `siteSettings.contact` + footer legal note are placeholders.

## 3. Rights & content
- 🔴 **Product imagery.** Current images are scraped Jaypore/Fabindia photos + AI-derived angle renders — **commercial-reuse risk.** Replace with real RG Enterprises photography / licensed assets before public launch.
- 🟠 **Legal pages.** Terms, privacy, returns/refund policy — not yet present.
- 🟠 **Copy review.** Homepage/marketing copy in the `homepage` singleton is placeholder; review for brand voice.

## 4. Pre-launch verification (once tokens exist)
- [ ] Make `production` private (or split transactional dataset) and wire the read token.
- [ ] Full e2e green (anonymous price-gating, apply→approve→prices, min-order, checkout→order+invoice with correct CGST/SGST vs IGST, reorder, RFQ, admin protection, rate limits).
- [ ] `npm audit`: 4 high / 5 moderate remain, **all in the Sanity CLI/runtime dev tooling** (`@sanity/runtime-cli`, `adm-zip`, `js-yaml`) — used only for import/typegen, **not in the production bundle**. `npm audit fix --force` would break the Sanity install. Accept, or pin when Sanity ships patched CLI deps.
- 🟠 **Accessibility — colour contrast.** axe (WCAG AA) flags `color-contrast` on some muted text in the Sand & moss palette (e.g. `text-muted`). Not changed (design tokens are approval-gated — `design.md`). Review token contrast with the business before launch. Labels/links were fixed; the Playwright a11y suite passes with `color-contrast` excluded.
- [ ] Lighthouse ≥ 90/95/95 on home, catalog, product.
- [ ] Rotate any tokens used during development; never commit `.env.local` (already gitignored).
