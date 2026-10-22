# RG Enterprises — Production Migration Plan (mock → Sanity, live)

> Saved verbatim from the engineering brief. This is the source-of-truth task spec for taking the
> storefront from a mocked prototype to a production-ready, live system. Execution is phased with a
> checkpoint + report after each phase.

# ROLE
You are a senior full-stack engineer taking the RG Enterprises B2B wholesale storefront from a mocked prototype to a production-ready, live system. You own this end to end: architecture, implementation, migration, tests, CI, and deployment readiness. Work autonomously, but stop at each phase checkpoint and report before continuing.

# BEFORE YOU WRITE ANY CODE
1. Read `AGENTS.md`, then `node_modules/next/dist/docs/` for Next.js 16.4.2. This version has breaking changes versus older Next; do not rely on memory of older APIs.
2. Read `PROJECT_OVERVIEW.md`, `plan.md` (including "known pre-launch gaps"), and `design.md`.
3. Audit the repo: every route in `app/`, every module in `lib/` (types, fixtures, mock API, pricing resolver, session/cart providers, INR format), `components/`, and `scripts/`.
4. Produce a short written audit: what is mocked, what depends on fixtures, what is in-memory and resets on reload, and what needs real persistence. Then proceed.

# CONTEXT (do not change unless told)
- Stack: Next.js 16.4.2 (App Router), React 19.3, TypeScript 5, Tailwind v4 with tokens in `app/globals.css` `@theme`, fully custom components in `components/ui/`, no UI library.
- Design system "The page is the object" (Sand & moss palette, Libre Franklin / Source Serif 4, house rules in `design.md`). Do NOT alter visual design. This task is a data/backend/quality task, not a redesign.
- Business rules to preserve exactly: GST flat 5% on apparel; minimum order value ₹15,000 on the whole cart; price gating by buyer approval status (unapproved/anonymous users never see wholesale prices, enforced server-side, not just hidden in UI); tier pricing; size × colour order matrix; seller state MH (drives CGST+SGST vs IGST on invoices).
- Product data sources: `jaypore_men_kurta_page1.csv`, `fabindia_bedsheets_page1.csv`, `fabindia_towels_page1.csv` (schema: name, sale_price, mrp, discount, image_url, product_url; `pid` is the trailing ID of product_url). Images: `kurta_images/kurta_only/`, `bedsheet_images/`, `towel_images/`, `angle_images/` (18 AI-generated multi-angle images for 6 products).
- Working style: when you modify a file, output/write the complete file, not partial diffs or snippets.

# GOAL
1. Remove ALL seeded/mock data and picsum placeholders.
2. Add Sanity as the backend so catalog and business data are created, edited, and served live.
3. Make every feature work against real persistence.
4. Ship production-ready: full test suite, CI, security hardening, observability, deployment docs.

# ARCHITECTURE DECISIONS (state your choices up front, with one-line justification each)
Use these defaults unless you find a concrete blocker, in which case explain and propose an alternative before proceeding:

**Sanity (use `next-sanity`; verify its version supports Next 16 and React 19 first)**
- Content/catalog documents: `product`, `category`, `collection`, `colour`, `sizeRun`/size definitions, `priceTier` (or tiers embedded in product), `homepage`, `siteSettings` (brand, seller GSTIN/state, min order value, GST rate, contact), `banner`/promo content.
- Transactional documents: `buyer` (application + approval status), `order`, `invoice`, `rfq`. Written ONLY from server code using a server-side write token (`SANITY_API_WRITE_TOKEN`), never exposed to the client. Use an unguessable-draft-free dataset policy: private dataset or strict ACL so transactional data is not publicly readable.
- Embed Sanity Studio at `/studio` (protected), with a custom desk structure grouping Catalog / Buyers / Orders / RFQs / Settings. Provide validation rules in schemas (required fields, positive prices, unique SKU/slug, MRP ≥ sale price, valid HSN/GST fields).
- Use GROQ with typed results (use `sanity typegen` or equivalent) so lib/types stay the single source of truth. No `any`.
- Images: Sanity image assets with hotspot/crop; render through `next/image` with `remotePatterns` for `cdn.sanity.io`. Generate blur placeholders (LQIP).
- Caching: use Next 16 caching/revalidation primitives per the local docs. Catalog reads cached with tags; a signed Sanity webhook (`/api/revalidate`, signature verified with `SANITY_REVALIDATE_SECRET`) revalidates affected tags. Transactional/account reads are never cached across users.

**Auth and identity**
- Replace the mock session provider with real auth. Default: Auth.js (NextAuth v5) credentials provider backed by `buyer` documents in Sanity, passwords hashed with argon2id (or bcrypt cost ≥ 12), secure httpOnly cookies, CSRF protection, login rate limiting, password reset via email token. If you propose a hosted alternative (Clerk, etc.), justify it first.
- Roles: `buyer` and `admin`. Admin routes and server actions enforce role checks server-side. Buyer approval flow: apply → pending → admin approves/rejects → price visibility changes accordingly.

**Server boundary**
- All mutations through server actions or route handlers with Zod validation of every input. No trusting client-submitted prices, totals, tax, or approval status: recompute pricing, tier, GST, and min-order check on the server from Sanity data at checkout.
- Replace `lib/` mock API with a real data layer (`lib/sanity/` client, queries, mappers; `lib/data/` service functions) that keeps the same typed contract so UI changes stay minimal.
- Order numbers and invoice numbers: generated atomically and sequentially per financial year (e.g. `RG/25-26/0001`) using a Sanity counter document with transactional patch (`ifRevisionID`) and retry on conflict.
- Carts: persist per buyer (server-side or signed cookie + Sanity), not in-memory.
- Email (order confirmation, application status, RFQ acknowledgment): use Resend (or equivalent) behind a small adapter with a console/no-op transport for dev and tests.

# DATA MIGRATION (remove seeded data, load real data)
1. Delete `lib/fixtures.ts` and every import of it, all picsum URLs, and any hard-coded product, order, buyer, or invoice data. Grep to prove zero remaining references (`picsum`, `fixtures`, `mock`, hard-coded sample names). Keep test factories only inside the test directory.
2. Write an idempotent import script `scripts/import-catalog.ts` (run with `tsx`) that:
   - Reads the three CSVs; derives `pid` from `product_url`; creates deterministic `_id`s (e.g. `product.<pid>`) so re-runs update rather than duplicate.
   - Uploads images from `kurta_images/kurta_only/`, `bedsheet_images/`, `towel_images/` and attaches them as the primary image; attaches `angle_images/` sets to the six matching products as additional gallery images in a defined order (front/3quarter/back; flat/folded/rolled; front/angle/flatlay).
   - Handles Fabindia `sale_price` ranges (size-dependent): parse into min/max and map to per-size price rows where possible; where MRP/discount are blank, leave null, never invent values. Normalise INR strings to integers (paise or rupees: pick one and document it).
   - Derives category (Men's Kurtas / Bedsheets / Towels), colour from filenames where available, and slugs.
   - Wholesale tier pricing and MOQ are NOT in the CSVs: create a clearly documented default tier config in `siteSettings` (e.g. editable in Studio) and flag in your report that the business must confirm real wholesale prices and tiers before launch. Do not silently fabricate final prices.
   - Supports `--dry-run`, logs counts (created/updated/skipped/failed), and exits non-zero on failure.
3. Provide `scripts/seed-dev.ts` that creates a minimal admin user and one approved + one pending buyer in a SEPARATE dev/test dataset only; it must refuse to run against the production dataset.
4. Use separate Sanity datasets: `development`, `test` (e2e), `production`. Env-driven.

# FEATURE WIRING (every item must work against real data)
- Catalog + filters (category, colour, size, price band, stock) via GROQ with pagination and URL-driven filter state.
- Product page: size × colour order matrix, tier pricing, stock states, gallery from Sanity images, price gating enforced server-side.
- Cart: min-order ₹15,000 (whole cart), GST 5%, tier recalculation, persisted.
- Checkout: server-side recomputation, order + invoice creation with sequential numbering, correct CGST/SGST vs IGST by buyer state vs MH, confirmation page and email.
- Apply / login / password reset / logout.
- Account: orders, invoices (downloadable PDF), reorder.
- RFQ: submit, admin response, status tracking.
- Admin: buyer approval queue, order management and status updates, RFQ handling, inventory/price edits. Either wire the existing admin pages to Sanity mutations or deep-link to Studio for catalog editing; do not duplicate Studio's catalog editing. Admin mutations must persist.
- Homepage and marketing sections driven by Sanity (`homepage` document), no hard-coded imagery.
- Empty states, loading states (`loading.tsx`/Suspense), `error.tsx`, `not-found.tsx` for every route group.

# PRODUCTION READINESS
- **Env management:** `lib/env.ts` validates all env vars with Zod at startup (fail fast). Provide `.env.example` with every variable documented. No secrets in client bundles; confirm with a bundle check.
- **Security:** security headers and CSP (`next.config`), rate limiting on auth/apply/RFQ/checkout, input sanitisation, authorization checks on every server action, no PII in logs, Sanity tokens server-only, webhook signature verification, dependency audit clean.
- **Performance:** server components by default, minimal client JS, `next/image` everywhere, caching tags, Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on home, catalog, product.
- **SEO and metadata:** per-page metadata, Open Graph, JSON-LD Product schema, `sitemap.ts`, `robots.ts` (disallow account/admin/studio).
- **Accessibility:** WCAG 2.2 AA: keyboard flows, focus states, labels, contrast on the Sand & moss palette (verify, report any failures, do not change tokens without approval).
- **Observability:** Sentry (or equivalent) for errors with PII scrubbing; structured server logs; `/api/health` endpoint checking Sanity reachability.
- **Legal/commercial fields:** GSTIN, HSN codes, invoice format compliant with Indian GST (seller details, buyer GSTIN, HSN, tax breakup). Flag anything needing the business's confirmation.
- **Rights:** the scraped Jaypore/Fabindia images and AI-derived images carry commercial-reuse risk. Add a prominent note in the README and your final report that real RG Enterprises product photography/licensed assets must replace them before public launch.

# TESTING (all must pass; this is a hard gate)
- **Unit (Vitest):** pricing resolver, tier logic, GST/CGST/SGST/IGST calc, min-order rule, INR formatting, CSV parsing/price-range parsing, order/invoice number generation, Zod schemas, price-gating logic. Port `scripts/pricing-check.mjs` and `scripts/validation-check.mjs` into proper tests, then remove the scripts.
- **Integration:** data layer against a Sanity `test` dataset (or a mocked Sanity client with recorded fixtures if network is unavailable in CI), server actions (auth, authorization, validation failures, concurrency on invoice counter), webhook revalidation handler (valid/invalid signature).
- **E2E (Playwright, desktop + mobile viewports):** anonymous browse (prices hidden); apply → admin approves → buyer sees prices; add to cart below min order (blocked) and above (allowed); checkout creates order + invoice with correct tax; reorder; RFQ submit and admin respond; admin-only route protection; login rate limit; logout. Seed and clean the `test` dataset per run.
- **Static checks:** `tsc --noEmit` strict, ESLint clean, no `any`, no unused exports, `npm audit` (no high/critical), `next build` succeeds.
- **Accessibility tests:** axe via Playwright on key pages.
- **Coverage:** ≥ 85% on `lib/` business logic.
- **CI:** GitHub Actions workflow running install, typecheck, lint, unit, integration, build, Playwright e2e; cache deps; required on PRs. Add scripts to `package.json`: `test`, `test:unit`, `test:e2e`, `typecheck`, `import:catalog`, `seed:dev`, `typegen`.

# PHASES AND CHECKPOINTS
Report after each phase with: what changed, files touched, commands run with real output, test results, open risks. Do not claim anything passes unless you ran it.
1. Audit + architecture decisions (no code yet; wait for my go-ahead if any decision deviates from the defaults above).
2. Sanity setup: project, schemas, Studio, typegen, env validation, datasets.
3. Data layer + migration: replace mock API, import script, delete fixtures, prove zero seed/picsum references.
4. Auth, buyers, approval flow, server-side price gating.
5. Cart, checkout, orders, invoices, numbering, email, RFQ, admin wiring.
6. Hardening: security, caching/webhook, SEO, a11y, performance, observability.
7. Full test suite, CI, final verification run.
8. Docs and handover.

# DOCS TO DELIVER
- `README.md`: setup, env vars, Sanity project/dataset setup, running import/seed scripts, running tests, deploy steps (Vercel + Sanity webhook + env checklist), rollback notes.
- Update `PROJECT_OVERVIEW.md`, `plan.md` (close resolved gaps), and `AGENTS.md` if conventions changed.
- `docs/runbook.md`: how to add products in Studio, approve buyers, handle orders/invoices, rotate tokens, restore from dataset backup (`sanity dataset export`).
- `docs/launch-checklist.md`: items needing business input (real wholesale prices/tiers, GSTIN, HSN codes, licensed photography, email domain, legal pages).

# DEFINITION OF DONE
- Zero mock data, fixtures, or picsum references (grep output shown).
- All catalog and business data served from Sanity; Studio usable by a non-developer to add products.
- Every feature in "Feature wiring" works end to end, proven by passing e2e.
- `typecheck`, `lint`, `test`, `test:e2e`, `build` all green locally and in CI, with real output pasted.
- No secrets in the repo or client bundle; env validation in place.
- Final report listing: what was built, decisions made, anything not done and why, and items requiring my input before launch.

# RULES
- Do not change visual design, tokens, or house rules in `design.md`.
- Do not invent business data (prices, GSTIN, HSN, tiers); use clearly marked placeholders and list them in the launch checklist.
- Do not skip, weaken, or delete a failing test to make it pass; fix the cause.
- If a requirement is ambiguous or blocked, state the assumption, choose the safest option, and continue; ask only if the choice is irreversible or costly.
- Prefer small, reviewable commits per phase with clear messages.
