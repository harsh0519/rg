import { defineField, defineType, defineArrayMember } from 'sanity'

/**
 * Shared object types (not documents). These map 1:1 to the typed contract in
 * `lib/types.ts` so the GROQ data layer can project straight into the DTOs.
 */

// PriceTier (lib/types.ts). Embedded in `product.priceTiers`. maxQty null = open-ended top tier.
export const priceTier = defineType({
  name: 'priceTier',
  title: 'Price tier',
  type: 'object',
  fields: [
    defineField({ name: 'minQty', title: 'Min qty', type: 'number', validation: (r) => r.required().integer().min(1) }),
    defineField({
      name: 'maxQty',
      title: 'Max qty',
      type: 'number',
      description: 'Leave blank for the open-ended top tier (e.g. 200+).',
      validation: (r) =>
        r.integer().min(1).custom((maxQty, ctx) => {
          const min = (ctx.parent as { minQty?: number })?.minQty
          if (maxQty != null && min != null && maxQty < min) return 'Max qty must be ≥ min qty'
          return true
        }),
    }),
    defineField({ name: 'price', title: 'Price (₹/pc)', type: 'number', validation: (r) => r.required().min(0) }),
  ],
  preview: {
    select: { minQty: 'minQty', maxQty: 'maxQty', price: 'price' },
    prepare({ minQty, maxQty, price }) {
      return { title: `${minQty}–${maxQty ?? '∞'} pcs`, subtitle: `₹${price}/pc` }
    },
  },
})

// Variant (lib/types.ts Variant). Embedded in `product.variants`.
export const variant = defineType({
  name: 'variant',
  title: 'Variant',
  type: 'object',
  fields: [
    defineField({ name: 'sku', title: 'SKU', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'size', title: 'Size', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'colour', title: 'Colour', type: 'reference', to: [{ type: 'colour' }], validation: (r) => r.required() }),
    defineField({ name: 'stock', title: 'Stock (pcs)', type: 'number', initialValue: 0, validation: (r) => r.required().integer().min(0) }),
  ],
  preview: {
    select: { size: 'size', sku: 'sku', stock: 'stock', colourName: 'colour.name' },
    prepare({ size, sku, stock, colourName }) {
      return { title: `${colourName ?? '—'} / ${size}`, subtitle: `${sku} · ${stock} in stock` }
    },
  },
})

// SizeRunPack (lib/types.ts). Embedded in `product.sizeRuns`.
export const sizeRunPack = defineType({
  name: 'sizeRunPack',
  title: 'Size-run pack',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'perSize', title: 'Units per size', type: 'number', validation: (r) => r.required().integer().min(1) }),
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { label: 'label', perSize: 'perSize', sizes: 'sizes' },
    prepare({ label, perSize, sizes }) {
      return { title: label, subtitle: `${(sizes ?? []).join('/')} × ${perSize}` }
    },
  },
})

// GstBreakdown (lib/types.ts). Snapshot stored on order/invoice — never recomputed from here.
export const gstBreakdown = defineType({
  name: 'gstBreakdown',
  title: 'GST breakdown',
  type: 'object',
  fields: [
    defineField({ name: 'taxable', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'cgst', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'sgst', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'igst', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'totalTax', title: 'Total tax', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'interstate', title: 'Inter-state (IGST)', type: 'boolean', validation: (r) => r.required() }),
  ],
})

// Address (lib/types.ts Address). Embedded snapshot on orders.
export const address = defineType({
  name: 'address',
  title: 'Address',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'line1', title: 'Address', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'city', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'state', title: 'State code', type: 'string', validation: (r) => r.required().uppercase().length(2) }),
    defineField({ name: 'pincode', type: 'string', validation: (r) => r.required().regex(/^[1-9][0-9]{5}$/, 'pincode') }),
    defineField({ name: 'phone', type: 'string', validation: (r) => r.required().regex(/^[6-9][0-9]{9}$/, 'phone') }),
  ],
})

// Order line snapshot (CartLineView-shaped, immutable record of what was ordered/priced).
export const orderLine = defineType({
  name: 'orderLine',
  title: 'Order line',
  type: 'object',
  fields: [
    defineField({ name: 'product', type: 'reference', to: [{ type: 'product' }], description: 'Link for traceability; display uses the snapshot fields.' }),
    defineField({ name: 'variantId', title: 'Variant id', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'productName', title: 'Product name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'productSlug', title: 'Product slug', type: 'string' }),
    defineField({ name: 'sku', title: 'SKU', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'size', type: 'string' }),
    defineField({ name: 'colour', type: 'string' }),
    defineField({ name: 'qty', type: 'number', validation: (r) => r.required().integer().min(1) }),
    defineField({ name: 'unitPrice', title: 'Unit price (₹)', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'lineTotal', title: 'Line total (₹)', type: 'number', validation: (r) => r.required().min(0) }),
  ],
  preview: {
    select: { name: 'productName', sku: 'sku', qty: 'qty', total: 'lineTotal' },
    prepare({ name, sku, qty, total }) {
      return { title: `${qty} × ${name}`, subtitle: `${sku} · ₹${total}` }
    },
  },
})

// Simple labelled value, used in homepage hero stats.
export const labeledValue = defineType({
  name: 'labeledValue',
  title: 'Stat',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'value', type: 'string', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'label', subtitle: 'value' } },
})

// Titled rich-ish step, used in homepage "how it works" lists.
export const titledStep = defineType({
  name: 'titledStep',
  title: 'Step',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'body', type: 'text', rows: 2, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'body' } },
})

export const objectTypes = [
  priceTier,
  variant,
  sizeRunPack,
  gstBreakdown,
  address,
  orderLine,
  labeledValue,
  titledStep,
]
