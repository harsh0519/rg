# RG Enterprises — B2B Wholesale Storefront · Build Plan

Source of truth: *Wholesale Clothing Website: Frontend Design Document*.
Stack: Next.js 16 (App Router, TS) + Tailwind v4. Backend mocked behind a typed contract.
Visual design: taste-skill v2 direction **"The page is the object"** (see `design.md`).

## Milestones (from doc §10)

- [x] **M1 — Setup** · project, design tokens, layout shell, routing, mock API
- [x] **M2 — Browse** · catalog + filters, product page (order matrix, tier pricing)
- [x] **M3 — Buy** · cart, min-order validation, GST preview, checkout
- [x] **M4 — Account** · apply/login, orders, reorder, invoices
- [x] **M5 — Finish** · RFQ, admin screens, accessibility + performance pass

> All milestones built in one pass (user requested). Verified: `npm run build` ✓ (16 routes),
> `npm run lint` ✓ (0 errors, 3 `<img>` placeholder warnings), pricing + validation self-checks ✓,
> every route 200, core flow driven in a real browser (matrix → buyer-price → cart GST → checkout).

## M2–M5 — what was built

**M2 Browse**
- `components/catalog/ProductCard.tsx` — states: default · out of stock · MOQ badge · price hidden.
- `components/catalog/Filters.tsx` + `app/catalog/page.tsx` — category/fabric/colour/size/tier/in-stock
  filters (desktop sidebar + mobile drawer), search by name/SKU, loading/empty/error states.
- `components/product/OrderMatrix.tsx` — rows=colours × cols=sizes, keyboard nav, paste-from-
  spreadsheet, row/column/grand totals, sticky headers, per-colour accordion on mobile; cell states
  (out-of-stock disabled, over-stock warning).
- `components/product/TierPriceTable.tsx` — active tier highlight · single tier · buyer-price override.
- `components/product/ProductView.tsx` — gallery, info, size-run packs, live total, MOQ warning, gating.

**M3 Buy**
- `components/cart/CartLine.tsx` (editable qty · stock warning · removed/undo), `MinOrderBanner.tsx`
  (below/met), `app/cart/page.tsx` (GST CGST/SGST vs IGST breakdown, totals, gating, empty state).
- `app/checkout/page.tsx` — address + freight + payment terms + PO + notes, validation, confirmation.

**M4 Account**
- `app/apply/page.tsx` — full application, GSTIN/pincode/phone/email validation, inline errors, draft autosave.
- `app/login/page.tsx` — mock sign-in (sets approved session).
- `app/account/{orders,invoices}/page.tsx` + layout — order history, status, one-click reorder (re-validated),
  invoices with PDF download (mock). `OrderStatusChip`.

**M5 Finish**
- `app/rfq/page.tsx` — custom-quote form + line-sheet download (mock).
- `app/admin/*` — dashboard, buyers (approve/reject/suspend + edit credit/price-list/terms), products
  (inventory edit + tiers + CSV import mock), orders (status + invoice generation), RFQ inbox. Code-split.
- Shared UI: `Toast`, `Modal`, `DataTable`, `Field`, `Skeleton`. Providers: `CartProvider`.
- a11y/perf: keyboard-operable matrix, labelled inputs, visible focus, reduced-motion, lazy images with
  fixed aspect ratio, admin code-split by route.

## Known limitations / to wire before launch
- Images are picsum placeholders (3 lint `<img>` warnings) — swap for real product photography; draw
  garments as SVG per the taste direction. Then `next/image` + remotePatterns.
- Full taste finishing pass (imagery floor, motion layer, `inspect.mjs` look-loop) not run on public pages.
- Admin/account have no real auth gate (mock). Invoice/line-sheet PDFs and CSV import are mocked.
- Catalog not paginated (only 6 fixture products — not needed at this scale).
- Admin fixture mutations are in-memory (reset on reload).

## M1 — done

Scaffold (`create-next-app`, copied into this folder — name has spaces so it was built
in a temp dir first), then:

- **Tokens** `app/globals.css` — Sand & moss palette + Libre Franklin / Source Serif 4,
  five type steps, focus/selection, reduced-motion. Mapped to Tailwind v4 `@theme`.
- **Fonts** `app/layout.tsx` via `next/font` (`--ff-display`, `--ff-serif`).
- **Shell** `components/layout/` — Header (price-gating-aware nav + status badge),
  Footer (name-first, bottom-cropped wordmark), StatusSwitcher (dev "view as").
- **Session** `lib/session.tsx` — loads `GET /me` once, exposes `approved` for gating.
- **Mock API** `lib/` — `types.ts` (full §5 contract), `fixtures.ts` (6 products,
  tiers, variants, size runs, buyer price list, orders, invoices), `mockApi.ts`
  (every §5 endpoint, price gating, cart in localStorage), `pricing.ts` (resolver +
  GST + min-order, pure/tested), `format.ts` (INR).
- **Routes** every §8 route exists; built ones = `/` (landing). Rest are on-brand stubs
  naming their milestone.
- **Verify** `npm run build` ✓ (13 routes), `npm run lint` ✓, `node scripts/pricing-check.mjs` ✓,
  dev smoke test (all routes 200), home screenshot reviewed.

### Open decisions resolved (doc §11)
- Brand = **RG Enterprises** (from folder name). Seller state **MH**.
- Component primitives: **fully custom** on Tailwind (no headless lib).
- Mock contract format: **shared TypeScript types** + fixtures (no OpenAPI).
- **Mobile-first.**
- GST: flat **5%** on apparel (shortcut — upgrade to 5%/12% slab if premium lines added).
- Min order value: **₹15,000** (whole cart).

## Deferred to later milestones (tracked)
- Order matrix: virtualized grid, keyboard nav, paste-from-spreadsheet, row/col totals,
  sticky headers, per-color accordion on mobile (M2).
- Full taste-skill finishing pass on public pages — imagery floor (≥4 real credited
  pictures), motion layer (≥8 moving elements), `inspect.mjs` 3-round look loop. M1 home
  applies the tokens + house rules but has **not** had the full inspect/motion pass.
- Real product imagery (currently picsum placeholders) + drawn SVG garments.
- `next/image` remote config when real images land.
