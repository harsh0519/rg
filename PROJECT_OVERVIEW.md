# RG Enterprises — Project Overview, Assets, Stack & Design

Single reference doc: **what has been created**, the **tech stack**, and the **design system** —
for the B2B wholesale storefront and its scraped/generated product assets.

Last updated: 2026-10-23 · Brand: **RG Enterprises** (seller state MH) · Status: storefront M1–M5 built; product assets in progress.

---

## 1. What we have created

### 1.1 Product data (scraped CSVs)

All share the schema: `name, sale_price, mrp, discount, image_url, product_url`.

| File | Rows | Source | Notes |
|------|-----:|--------|-------|
| `jaypore_men_kurta_page1.csv` | 24 | jaypore.com/c/men-kurta | Per-item sale price, MRP, % discount (earlier work). |
| `fabindia_bedsheets_page1.csv` | 24 | fabindia.com/home/bedsheets | `sale_price` is a **price range** (varies by size: Single/Double/King); `mrp`/`discount` blank — Fabindia tiles don't show them. |
| `fabindia_towels_page1.csv` | 24 | fabindia.com/home/towels | `sale_price` is a **price range** (varies by size); `mrp`/`discount` blank. |

Each row's `product_url` ends in the product ID (`pid`); the image folders below are keyed to that `pid`.

### 1.2 Scraped product images (72)

| Folder | Files | Naming | What it is |
|--------|------:|--------|------------|
| `kurta_images/kurta_only/` | 24 | `<pid>_<colour>_cutout.png` | AI garment-only cutouts (model removed) — earlier work. |
| `bedsheet_images/` | 24 | `bedsheet_<pid>.jpg` | Fabindia listing photo per product (~400×508). |
| `towel_images/` | 24 | `towel_<pid>.jpg` | Fabindia listing photo per product (~400×508). |

`kurta_images/` also holds `onmodel/` (3 original source photos) and its own `README.md`.

### 1.3 Generated multi-angle images (18) → `angle_images/`

Six source products (2 per category) × 3 angles each, generated with **Higgsfield GPT Image 2.5**
(`gpt_image_2_5`, medium quality, 1k) using each source photo as an `image_references` input.

```
angle_images/
├── kurta/     kurta_39642548_{front,3quarter,back}.png      (grey/white stripe, ghost-mannequin)
│              kurta_39658462_{front,3quarter,back}.png       (brown/tan stripe)
├── towel/     towel_20051184_{flat,folded,rolled}.png        (cream + rust leaf print)
│              towel_20308940_{flat,folded,rolled}.png        (ivory gamcha, green border, fringe)
└── bedsheet/  bedsheet_20290202_{front,angle,flatlay}.png    (blue hand-block buti)
               bedsheet_20180742_{front,angle,flatlay}.png    (mustard damask)
```

- **Kurtas:** front / three-quarter / back, ghost-mannequin on pure white.
- **Towels:** laid-flat (full pattern) / folded / rolled.
- **Bedsheets:** styled made-bed front / three-quarter / top-down flat-lay with pillow covers.

**Caveats:** AI-generated, not photographs — fine details (button count, exact motif repeat, fringe)
may drift. Kurta back/3-quarter views are reconstructed (source was front-only). Bedsheet shots
re-render the whole room, so only the sheet/pillow print is meant to match. Source photos are
Jaypore's / Fabindia's; commercial reuse of derived images is a rights question to settle.

### 1.4 The storefront (built earlier, M1–M5)

Catalog + filters, product page (size×colour order matrix, tier pricing), cart with min-order +
GST, checkout, apply/login, account orders/invoices/reorder, RFQ, and the full admin suite — all on
a mocked typed API. See `plan.md` for the milestone breakdown and known pre-launch gaps.

---

## 2. Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16.4.2** (App Router) | ⚠️ Breaking changes vs. older Next — see `AGENTS.md`; read `node_modules/next/dist/docs/` before coding. |
| UI runtime | **React 19.3.0** | |
| Language | **TypeScript 5** | |
| Styling | **Tailwind CSS v4** (`@tailwindcss/turbopack`) | Design tokens in `app/globals.css` `@theme`. |
| Components | **Fully custom** on Tailwind | No headless/UI library. House primitives in `components/ui/`. |
| Backend | **Mocked** behind a typed contract | `lib/` — types, fixtures, mock API, pricing resolver, INR format. |
| Lint | ESLint 9 + `eslint-config-next` | |
| Scripts | `npm run dev` · `build` · `start` · `lint` | Self-checks: `scripts/pricing-check.mjs`, `scripts/validation-check.mjs`. |

**Key conventions:** mobile-first; GST flat 5% on apparel; min order value ₹15,000 (whole cart);
price gating by buyer approval status; admin code-split by route; admin/account mutations are
in-memory fixtures (reset on reload).

---

## 3. Design system — "The page is the object"

Direction (taste-skill v2): the wholesale **size-run order form** becomes the layout itself —
each section is filled stationery with real edges, print-like alignment, two inks. Full detail in `design.md`.

### Palette — Sand & moss
| Role | Token | Hex |
|------|-------|-----|
| Ground | `--color-bg` | `#ddd6c6` |
| Surface (tone step) | `--color-surface` | `#d2cab8` |
| Paper (hero card) | `--color-paper` | `#e7e1d4` |
| Ink (running text) | `--color-ink` | `#2a2a26` |
| Muted (secondary) | `--color-muted` | `#59574e` |
| Accent (actions) | `--color-accent` | `#4f6238` |
| Accent ink | `--color-accent-ink` | `#ffffff` |
| Field (footer band) | `--color-field` | `#3f5a2a` |
| Danger (rejected/stock) | `--color-danger` | `#8a3324` |

One ground, one ink, one accent. Green reserved for buttons + the closing field. Surfaces separated
by a tone step — never a line or shadow.

### Type — Libre Franklin / Source Serif 4
- **Display:** Libre Franklin 700 — headings, nav, buttons (tracking -0.035em, leading 0.95).
- **Text:** Source Serif 4 400/600 + italic — body (leading 1.55).
- Five steps only: `--text-small / --text-body / --text-lead / --text-head / --text-display`.
- Tabular figures (`.tnum`) on all money/quantity numerals.

### House rules (enforced)
No eyebrows, no monospace outside code, no index numbers, no thin rules, no gradients, no shadows at
rest, no tiny tracked caps, no icon-card grids, no glass. Headlines ≤ 2 lines. Buttons: flat, one
fill, square corners, one size scale.

### Imagery plan
Current public pages use picsum placeholders. The scraped `*_images/` photos and the new
`angle_images/` are the first real product imagery — not yet wired into `lib/fixtures.ts` or
`app/page.tsx` (both still reference picsum). Wiring these in (then `next/image` + `remotePatterns`)
is the obvious next step.

---

## 4. File map (this repo)

```
app/            routes (catalog, product, cart, checkout, account, admin, rfq, apply, login)
components/     catalog · product · cart · account · layout · ui primitives
lib/            types, fixtures, mock API, pricing, session/cart providers, INR format
scripts/        pricing-check.mjs, validation-check.mjs
plan.md         build plan + milestones + known pre-launch gaps
design.md       full design system
AGENTS.md       Next.js 16 agent rules (read before coding)
PROJECT_OVERVIEW.md   ← this file

jaypore_men_kurta_page1.csv      fabindia_bedsheets_page1.csv      fabindia_towels_page1.csv
kurta_images/   bedsheet_images/   towel_images/   angle_images/
```
