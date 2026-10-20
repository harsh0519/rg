# Jaypore Men's Kurta — Scrape & Garment Cutouts

**Date:** 2026-10-21
**Source:** https://www.jaypore.com/c/men-kurta
**Scope done:** Page 1 — 24 of 470 products in the category.

## What this is

Product data (photo, name, pricing) for Jaypore men's kurtas, plus AI-generated
**garment-only** images (model removed) for each product on page 1.

## Files

| Path | What it is |
|------|------------|
| `../jaypore_men_kurta_page1.csv` | 24 products: name, sale price, MRP, discount, source image URL, product URL |
| `onmodel/` | 3 original on-model source photos (downloaded for the test; the rest were streamed straight to the AI) |
| `kurta_only/` | 24 AI cutouts — kurta on white, no model (`<productid>_<colour>_cutout.png`) |

## Key finding

Jaypore photographs men's kurtas **on a live model only**. Checked across multiple
products: every full-garment image is worn by a person; the only model-free images are
tight fabric/placket detail crops, never a whole kurta. So a "kurta without model"
image **does not exist on the source** and had to be created.

## How the cutouts were made

Per product, the front on-model shot (image `#0`, = the CSV `image_url`) was run through:

```
media_import_url (Jaypore CDN URL)
  → generate_image  model=gpt_image_2_5
     prompt: "Remove the person entirely. Show only the kurta as a flat,
              front-facing product photo on pure white, ghost-mannequin style…
              preserve exact colour, texture, pattern, collar, placket, buttons."
  → download PNG (1024×1024) into kurta_only/
```

- Cost: **0.25 credits/image → ~6 credits** for all 24.
- GPT-Image-2.5 rate-limits bursts (HTTP 429); images were submitted in throttled
  groups of ~4 with a wait between each.

## Caveats / risks

- **Cutouts are AI-generated, not photographs.** Colour, weave and pattern are
  reproduced faithfully in spot-checks, but fine details (button count, exact stitch,
  hem) may differ slightly from the real garment. Verify before any commercial use.
- **446 products remain** (pages 2–~20) — not done. Same pipeline scales; ~117 credits
  for the full catalog.
- **Copyright:** source photos are Jaypore's. Derived cutouts are for your own use —
  reusing them commercially is a rights question to settle on your side.
- Source images were taken as the single front shot per product; back/detail views
  were not processed.

## To continue (full catalog)

1. Paginate `https://www.jaypore.com/c/men-kurta?page=N` for N=1…~20, extracting the
   same card fields (selector `.PlpProductCard_categoryProduct__aIy70`).
2. Feed each `image_url` through the pipeline above in throttled batches of ~4.
