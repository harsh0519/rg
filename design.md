# RG Enterprises — Design System

Dealt by taste-skill v2 (`.taste-skill/direction.json`, seed 962535680).
Reprint: `node <skill>/scripts/draw.mjs --show`.

## Direction — "The page is the object"
The artefact of the wholesale trade is the **line sheet / size-run order form** (the thing
JOOR/NuORDER are studied for in doc §2). The page *is* that sheet; each section is more of the
same stationery (filled panels with real edges, print-like alignment, two inks).

**Idea sentence:** *On this page, the wholesale size-run order form becomes the layout itself.*
This ties the brand surface to the app's core feature — the size×colour order matrix.

**Live thing (later):** the order matrix with a live tier price + running total.

## Palette — Sand & moss
| Role | Token | Hex |
| --- | --- | --- |
| Ground | `--color-bg` | `#ddd6c6` |
| Surface (tone step) | `--color-surface` | `#d2cab8` |
| Paper (hero card) | `--color-paper` | `#e7e1d4` |
| Ink (all running text) | `--color-ink` | `#2a2a26` |
| Muted (secondary only) | `--color-muted` | `#59574e` |
| Accent (actions) | `--color-accent` | `#4f6238` |
| Accent ink | `--color-accent-ink` | `#ffffff` |
| Field (closing band/footer) | `--color-field` | `#3f5a2a` |
| Danger (rejected/stock) | `--color-danger` | `#8a3324` |

One ground, one ink, one accent. Green reserved for buttons + the closing field.
Surfaces separated by a tone step, never a line or shadow.

## Type — Libre Franklin / Source Serif 4
- **Display:** Libre Franklin 700 — headings, nav, buttons. tracking -0.035em, leading 0.95.
- **Text:** Source Serif 4 400/600 + italic — body, descriptions. leading 1.55.
- Five steps only: `--text-small / --text-body / --text-lead / --text-head / --text-display`.
- Tabular figures (`.tnum`) on all money/quantity numerals.

## House rules enforced (taste)
No eyebrows, no monospace outside code, no 01/02 index numbers, no thin rules, no gradients,
no shadows at rest, no tiny tracked caps, no icon-card grids, no glass. Headlines ≤ 2 lines.
Buttons: flat, one fill, square corners, one size scale.

## Tailwind v4 mapping
Tokens live in `app/globals.css` `@theme`, used as utilities: `bg-bg`, `text-ink`,
`bg-accent`, `text-lead`, `font-display`, `font-serif`, etc. Opacity modifiers (`bg-bg/95`)
for subtle tone steps only.

## Component states (doc §9) — all built
- [x] ProductCard: default · out of stock · MOQ badge · price hidden — `components/catalog/ProductCard.tsx`
- [x] OrderMatrix: empty · partial · over stock · below MOQ · valid — `components/product/OrderMatrix.tsx`
- [x] TierPriceTable: active tier highlighted · single tier (+ buyer-price override) — `components/product/TierPriceTable.tsx`
- [x] CartLine: editable qty · stock warning · removed — `components/cart/CartLine.tsx`
- [x] MinOrderBanner: below minimum · met — `components/cart/MinOrderBanner.tsx`
- [x] BuyerStatusBadge: pending · approved · rejected · suspended — `components/ui/BuyerStatusBadge.tsx`
- [x] Filters: desktop sidebar · mobile drawer — `components/catalog/Filters.tsx`
- [x] Page states: loading skeleton · empty results · network error — `components/ui/Skeleton.tsx` + per page

## Imagery plan
Current: picsum placeholders (home hero). Target per direction §5: draw garments as flat
SVG in palette colours, surround with real credited pictures of the textile trade
(`scripts/assets.mjs`). Product photography is required before launch — list in M5 report.
