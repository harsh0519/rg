import { defineField, defineType } from 'sanity'
import { BillIcon } from '@sanity/icons'

/**
 * Invoice (lib/types.ts Invoice). Transactional, server-written. `invoiceNo` is allocated
 * atomically from the `counter` singleton. GST + GSTINs are an immutable snapshot for compliance.
 */
export const invoice = defineType({
  name: 'invoice',
  title: 'Invoice',
  type: 'document',
  icon: BillIcon,
  fields: [
    defineField({ name: 'invoiceNo', title: 'Invoice no', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'order', type: 'reference', to: [{ type: 'order' }], validation: (r) => r.required() }),
    defineField({ name: 'orderNo', title: 'Order no', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'issuedAt', title: 'Issued at', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'total', title: 'Total (₹)', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'unpaid',
      options: { list: ['paid', 'unpaid', 'overdue'], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'pdfUrl', title: 'PDF URL', type: 'url', description: 'Signed/authorized URL set by the PDF service.' }),
    defineField({ name: 'gst', title: 'GST', type: 'gstBreakdown', validation: (r) => r.required() }),
    defineField({ name: 'buyerGstin', title: 'Buyer GSTIN', type: 'string' }),
    defineField({ name: 'sellerGstin', title: 'Seller GSTIN', type: 'string' }),
    defineField({ name: 'financialYear', title: 'Financial year', type: 'string' }),
  ],
  orderings: [{ title: 'Issued (newest)', name: 'issuedDesc', by: [{ field: 'issuedAt', direction: 'desc' }] }],
  preview: {
    select: { invoiceNo: 'invoiceNo', orderNo: 'orderNo', total: 'total', status: 'status' },
    prepare({ invoiceNo, orderNo, total, status }) {
      return { title: invoiceNo, subtitle: `${orderNo} · ₹${total} · ${status}` }
    },
  },
})
