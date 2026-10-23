import { defineField, defineType, defineArrayMember } from 'sanity'
import { PackageIcon } from '@sanity/icons'

/**
 * Product — maps to ProductDetail/ProductSummary in lib/types.ts.
 * Derived contract fields are computed in GROQ, not stored:
 *   thumbnail  <- primaryImage           in_stock <- count(variants[stock>0])>0
 *   images[]   <- [primaryImage,...gallery]   colors/sizes <- distinct(variants[].colour->name / .size)
 *   from_price <- min(priceTiers[].price, basePrice)  (nulled server-side for non-approved buyers)
 *
 * `basePrice`, `priceTiers`, `hsnCode` are WHOLESALE/TAX values the business must confirm
 * (see docs/launch-checklist.md) — the CSV import seeds them from siteSettings defaults, never fabricates finals.
 */
export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Media' },
    { name: 'variants', title: 'Variants & stock' },
    { name: 'pricing', title: 'Wholesale pricing' },
    { name: 'tax', title: 'Tax & source' },
  ],
  fields: [
    defineField({ name: 'name', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: { source: 'name', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'pid',
      title: 'Source product id',
      type: 'string',
      group: 'tax',
      description: 'External id from the source catalogue (trailing id of product_url). Used as the import key.',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'category', type: 'reference', to: [{ type: 'category' }], group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'fabric', title: 'Fabric / material', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'description', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'care', title: 'Care', type: 'text', rows: 2, group: 'content' }),
    defineField({ name: 'leadTime', title: 'Lead time', type: 'string', group: 'content', initialValue: '7–20 days' }),
    defineField({ name: 'moq', title: 'MOQ (pcs)', type: 'number', group: 'content', validation: (r) => r.required().integer().min(1) }),

    defineField({
      name: 'primaryImage',
      title: 'Primary image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() })],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() })],
        }),
      ],
    }),

    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      group: 'variants',
      of: [defineArrayMember({ type: 'variant' })],
      validation: (r) => r.required().min(1).custom((vs) => {
        const skus = (vs as { sku?: string }[] | undefined)?.map((v) => v?.sku).filter(Boolean) ?? []
        return new Set(skus).size === skus.length || 'SKUs must be unique within a product'
      }),
    }),

    defineField({ name: 'basePrice', title: 'Base wholesale price (₹/pc)', type: 'number', group: 'pricing', validation: (r) => r.required().min(0) }),
    defineField({ name: 'priceTierLabel', title: 'Price tier label', type: 'string', group: 'pricing', initialValue: 'Tier A' }),
    defineField({
      name: 'priceTiers',
      title: 'Quantity price tiers',
      type: 'array',
      group: 'pricing',
      of: [defineArrayMember({ type: 'priceTier' })],
      description: 'Qty-break wholesale prices. Must confirm with the business before launch.',
    }),
    defineField({
      name: 'sizeRuns',
      title: 'Size-run packs',
      type: 'array',
      group: 'pricing',
      of: [defineArrayMember({ type: 'sizeRunPack' })],
    }),

    defineField({ name: 'hsnCode', title: 'HSN code', type: 'string', group: 'tax', description: 'GST HSN — confirm per category before launch.' }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url', group: 'tax' }),
    defineField({ name: 'srcMrp', title: 'Source MRP (₹, retail ref)', type: 'number', group: 'tax', description: 'Scraped retail reference only — not a wholesale price.' }),
    defineField({ name: 'srcSalePriceMin', title: 'Source sale price min (₹)', type: 'number', group: 'tax' }),
    defineField({ name: 'srcSalePriceMax', title: 'Source sale price max (₹)', type: 'number', group: 'tax' }),
  ],
  preview: {
    select: { title: 'name', category: 'category.title', media: 'primaryImage', base: 'basePrice' },
    prepare({ title, category, media, base }) {
      return { title, subtitle: `${category ?? 'Uncategorised'}${base ? ` · ₹${base}/pc` : ''}`, media }
    },
  },
})
