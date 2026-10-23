import { defineField, defineType, defineArrayMember } from 'sanity'
import { BasketIcon } from '@sanity/icons'

const ORDER_STATUS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

/**
 * Order (lib/types.ts Order). Transactional, server-written. `orderNo` is allocated atomically
 * from the `counter` singleton (format RG/25-26/0001). Totals/GST are a server-recomputed snapshot.
 */
export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  icon: BasketIcon,
  fields: [
    defineField({ name: 'orderNo', title: 'Order no', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'buyer', type: 'reference', to: [{ type: 'buyer' }], validation: (r) => r.required() }),
    defineField({ name: 'placedAt', title: 'Placed at', type: 'datetime', validation: (r) => r.required() }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'placed',
      options: { list: ORDER_STATUS },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'lines', type: 'array', of: [defineArrayMember({ type: 'orderLine' })], validation: (r) => r.required().min(1) }),
    defineField({ name: 'subtotal', title: 'Subtotal (₹)', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'gst', title: 'GST', type: 'gstBreakdown', validation: (r) => r.required() }),
    defineField({ name: 'total', title: 'Total (₹)', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'address', title: 'Ship-to address', type: 'address', validation: (r) => r.required() }),
    defineField({ name: 'paymentTerms', title: 'Payment terms', type: 'string', options: { list: ['advance', 'cod', 'credit'] }, validation: (r) => r.required() }),
    defineField({ name: 'poNumber', title: 'PO number', type: 'string' }),
    defineField({ name: 'freight', type: 'string', options: { list: ['standard', 'express', 'self_pickup'] }, validation: (r) => r.required() }),
    defineField({ name: 'notes', type: 'text', rows: 2 }),
    defineField({ name: 'invoiceNo', title: 'Invoice no', type: 'string', description: 'Null until an invoice is generated.' }),
    defineField({ name: 'financialYear', title: 'Financial year', type: 'string', description: 'e.g. 2025-26 — drives sequential numbering.' }),
  ],
  orderings: [{ title: 'Placed (newest)', name: 'placedDesc', by: [{ field: 'placedAt', direction: 'desc' }] }],
  preview: {
    select: { orderNo: 'orderNo', status: 'status', total: 'total', buyer: 'buyer.businessName' },
    prepare({ orderNo, status, total, buyer }) {
      return { title: `${orderNo} · ${buyer ?? '—'}`, subtitle: `${status} · ₹${total}` }
    },
  },
})
