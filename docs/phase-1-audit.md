# Phase 1 — Audit & Architecture Decisions

Pre-migration audit (mock → Sanity + real auth). Produced by a 7-reader + completeness-critic
fan-out over every `app/` route, `lib/` module, `components/` file, `scripts/`, and the local
Next.js 16 docs. Critic verdict: **complete enough to start Phase 2** — 49/49 source files covered
(only `app/globals.css` skipped, migration-neutral), no contradictions.

---

## A. Written audit — what is mock, fixture-bound, in-memory, or needs persistence

### The whole data layer is a fixture-backed mock
- **`lib/fixtures.ts`** — module-level seed data: `PRODUCTS` (6), `BUYERS` (4), `ORDERS` (2),
  `INVOICES` (2), `RFQS` (2), `PRICE_LISTS` (buyer per-pc overrides), `DEFAULT_ME` (hardcoded
  logged-in buyer "Anand Retail Co."), and the config constants `SELLER_STATE='MH'`,
  `GST_RATE=0.05`, `MIN_ORDER_VALUE=15000`. **All product imagery is picsum** (`picsum.photos/id/...`).
- **`lib/mockApi.ts`** — buyer-facing API against fixtures with 180 ms fake latency. Session identity
  is faked via `localStorage['rg_view_status']` ("View as" dev override). Cart is `localStorage['rg_cart']`
  only (device-local, no buyer key). **`applyBuyer`/`postRfq`/`postOrder` are no-ops** — `postOrder`
  fabricates `RG-${1000+rand}`, clears the cart, and **discards the order** (never persisted).
- **`lib/adminApi.ts`** — all admin writes mutate the shared fixture arrays **in place → reset on reload**
  (`setBuyerStatus`, `updateBuyer`, `setVariantStock`, `setOrderStatus`, `setRfqStatus`, `generateInvoice`).
- **`lib/session.tsx` / `lib/cart.tsx`** — client contexts; `me`/`cart` in `useState`, re-fetched on mount.
  `approved = me.logged_in && me.status==='approved'`.

### Routes
- **Public** (`catalog`, `products/[slug]`, `cart`, `checkout`, `apply`, `login`, `rfq`): all `'use client'`,
  all read `mockApi`. `app/page.tsx`/`layout.tsx` are server components (page has one **picsum hero**).
  `login` is a pure stub (ignores credentials, calls `changeStatus('approved')`). `products/[slug]` uses
  client `useParams` (blocks server rendering/SEO).
- **Admin** (`/admin/*`): **zero auth gating** — `admin/layout.tsx` renders to anyone, labelled
  "Mock panel — no real backend". `products` New/Import buttons are toast stubs.
- **Account** (`/account/*`): only gate is a **client-side** `useSession` check (bypassable);
  `getOrders`/`getInvoices` return the shared fixtures **unscoped** (every buyer would see the same orders);
  invoice download is a toast stub.

### Components
- Mostly pure/prop-driven → migrate cleanly. Real coupling: **`ProductView`** imports `PRICE_LISTS` and
  resolves buyer price client-side; **`Filters`** imports `ProductFilters` type from `lib/mockApi`;
  **`StatusSwitcher`** (in the Footer, every page) lets anyone switch buyer status client-side — **remove/gate**.
  **`ProductCard` + `ProductView` use raw `<img>`** (deliberate perf choice) → need `next/image` + Sanity loader.
  Footer has placeholder GSTIN `27XXXXX0000X1Z5`.

## B. Business rules to preserve EXACTLY (and port to Vitest)

From `lib/pricing.ts`, `lib/validation.ts`, `lib/format.ts` + the two self-check scripts. These are
backend-independent pure functions — **keep them as-is**; only their inputs move to Sanity config.

| Rule | Exact behaviour |
|------|-----------------|
| **Tier price** (`resolveUnitPrice`) | priority: `buyerPrice` (if `!= null`, so `0` is honoured) → first tier where `totalQty >= min_qty && (max_qty==null || totalQty <= max_qty)` → `basePrice`. **Tier chosen by TOTAL product qty across all variants.** |
| **Active tier** (`activeTierIndex`) | same predicate; `-1` if none. Must stay in sync with the above. |
| **GST** (`computeGst`) | `interstate = buyerState !== sellerState`. Inter → `IGST = round2(taxable*rate)`, cgst=sgst=0. Intra → `half=round2(totalTax/2)` (cgst), `sgst = totalTax - half` (so **cgst+sgst == total_tax** exactly). `buyerState == null` ⇒ treated **inter-state (IGST)**. |
| **GST rate / seller state** | NOT constants in `lib/` — passed in. Live in fixtures as `GST_RATE=0.05`, `SELLER_STATE='MH'`. Flat 5% (fixtures note a deferred 5%/12% slab upgrade — out of scope). |
| **Min order** (`minOrderCheck`) | `met = current >= min` (inclusive); `shortfall = met ? 0 : round2(min-current)`. `MIN_ORDER_VALUE=15000`. |
| **Rounding** (`round2`) | `Math.round((n + Number.EPSILON)*100)/100`. |
| **Price gating** (type contract) | only `approved` buyers get prices; else `from_price`/`unit_price`/`subtotal`/`tax`/`total` are `null` and `Cart.priced=false`. |
| **INR** (`formatINR`) | `Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0})`; `null`→`'—'`. |
| **Validators** | GSTIN 15-char regex (format-only, no checksum); Pincode `/^[1-9][0-9]{5}$/`; Phone `/^[6-9][0-9]{9}$/`; Email basic. Trim + required messages. |

**Self-check assertions to port** (from `scripts/pricing-check.mjs`, `scripts/validation-check.mjs`):
tiers `[{10,49,195},{50,199,175},{200,null,165}]`, base 210 → `resolve(…,300,150)=150`, `(…,10)=195`,
`(…,50)=175`, `(…,500)=165`, `(…,5)=210`; `activeTierIndex(…,60)=1`, `(…,5)=-1`;
`computeGst(1000,'MH','MH',.05)`→cgst+sgst=50,igst=0; `computeGst(1000,'DL','MH',.05)`→igst=50;
`minOrderCheck(20000,15000).met=true`; `minOrderCheck(12000,15000)={…,met:false,shortfall:3000}`;
GSTIN `27ABCDE1234F1Z5` valid; Pincode `400001` valid / `012345` invalid; Phone `9820012345` valid.
Both scripts currently pass (exit 0).

## C. Next.js 16.4.2 gotchas that change how we build this

`cacheComponents` is **OFF** (per `next.config.ts`) → the pre-Cache-Components caching model applies.

1. **Async request APIs** — `cookies()`, `headers()`, `params`, `searchParams` are **Promises only** (sync shim removed; now throws). `await` everywhere — critical for auth cookies and `products/[slug]`.
2. **`revalidateTag` requires a 2nd arg** in 16: `revalidateTag('products','max')`. For read-your-writes in a Server Action use the new `updateTag`. `revalidatePath` still works.
3. **`middleware.ts` → `proxy.ts`** (nodejs-only runtime, no edge). Auth route-protection lives here + in a server layout (defense in depth).
4. **`@sanity/client` uses its own transport**, not global `fetch` → `next:{tags}` won't cache it. Wrap GROQ reads in **`unstable_cache(fn, keys, {tags, revalidate})`**; webhook revalidates those tags.
5. **`next/image`**: `images.domains` deprecated → use **`remotePatterns` for `cdn.sanity.io`**; default `qualities=[75]` (set explicitly if serving others); `minimumCacheTTL` now 4 h; remote images need explicit w/h and **LQIP via `asset.metadata.lqip` as `blurDataURL`** (no auto blur).
6. **Route handlers** not cached by default; only `GET` opts in. Webhook/auth routes stay uncached (correct).
7. **`serverRuntimeConfig`/`publicRuntimeConfig` removed** → secrets via `process.env` (server-only) / `NEXT_PUBLIC_` (client). Consider the taint API to stop the Sanity write token reaching a client component.
8. `sitemap.ts`/`robots.ts` static-by-default; `generateSitemaps` `id` is now a Promise.

## D. Architecture decisions (defaults confirmed; forced Next-16 deviations noted)

1. **Backend: Sanity via `next-sanity@13.3.4`** — peers `next ^16`, `react ^19.2.3`, `sanity ^6`; matches our Next 16.4.2 / React 19.3 → ✅ no blocker. Studio embedded at `/studio`.
2. **Config → Sanity `siteSettings` singleton** — `GST_RATE`, `SELLER_STATE`, `MIN_ORDER_VALUE`, default tier config, brand/GSTIN/contact become business-editable; the pure `lib/pricing` functions keep taking them as params (unchanged).
3. **Price gating server-side** — GROQ projections omit price fields unless the server session is `approved`; `PRICE_LISTS` resolve server-side so price data never reaches an anonymous/unapproved client.
4. **Cart = signed httpOnly cookie holding only `{variantId, qty}`** (no prices), server recomputes pricing/GST/min-order on every read. *Deviation from the brief's "per-buyer Sanity cart" — justification:* avoids a Sanity write per keystroke (cost/rate-limit) and keeps prices entirely off the client; merges into the buyer context at login. Will confirm with you.
5. **Auth = Auth.js (NextAuth v5) credentials** backed by `buyer` docs, argon2id hashes, httpOnly cookies, CSRF, login rate-limit. *Risk:* v5 is beta and Next-16 support is bleeding-edge — if incompatible in Phase 4, fall back to a minimal custom credentials + iron-session cookie (same security properties). Add **`role: 'admin'|'buyer'`** to the user doc (no role concept exists today).
6. **Order/invoice numbers** — Sanity singleton counter per financial year, incremented in a server action via `patch(...).ifRevisionId(rev)` with retry on 409. Format `RG/25-26/0001`.
7. **Images** — `next/image` + `@sanity/image-url`, `remotePatterns` for `cdn.sanity.io`, LQIP blur; replace raw `<img>` in `ProductCard`/`ProductView`.
8. **Money unit** — store integer **rupees** (CSV prices are whole-rupee; `formatINR` already renders 0 decimals). Documented in the import script.
9. **Datasets** — `development` / `test` / `production`, env-driven. Transactional docs (`buyer`/`order`/`invoice`/`rfq`) private (strict dataset ACL), written only with `SANITY_API_WRITE_TOKEN`.

## E. What I will NOT invent (→ launch checklist)
Real wholesale tier prices & MOQ, real seller **GSTIN**, **HSN** codes per category, licensed product
photography (scraped Jaypore/Fabindia + AI images carry commercial-reuse risk), email sending domain.
Import maps these to clearly-marked placeholders in `siteSettings`; Fabindia `sale_price` ranges →
`priceMin`/`priceMax`, blank MRP/discount left `null` (never fabricated).

## F. Blocker for Phase 2 (needs you)
Creating the Sanity project and tokens requires **your Sanity account** (`sanity login` is interactive
browser OAuth — I can't do it headless). To start Phase 2 live I need **one** of:
- you run `sanity login` then `npx sanity@latest init` and paste the **projectId** + an API **read** and **write** token, **or**
- you create them at sanity.io/manage and paste `projectId` + tokens, **or**
- "use placeholders" — I scaffold all Phase 2 **code** (schemas, Studio config, data layer, import script, env validation) against a placeholder projectId now, and we run the live `init`/`import`/`typegen` once you supply credentials.

Deferrable (not Phase-2 blockers): Resend key (Phase 5 — dev uses a console transport), Sentry DSN
(Phase 6), Vercel (Phase 8). GitHub remote already exists (`harsh0519/rg`).
