import { defineField, defineType } from 'sanity'
import { ControlsIcon } from '@sanity/icons'

/**
 * Counter — atomic sequential allocator for order/invoice numbers per financial year.
 * One doc per (scope, financialYear) with a deterministic _id like `counter.order.2025-26`.
 * Incremented via a patch guarded by ifRevisionId(rev) with retry-on-conflict in server code.
 */
export const counter = defineType({
  name: 'counter',
  title: 'Counter',
  type: 'document',
  icon: ControlsIcon,
  fields: [
    defineField({ name: 'scope', type: 'string', options: { list: ['order', 'invoice'] }, validation: (r) => r.required() }),
    defineField({ name: 'financialYear', title: 'Financial year', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'value', type: 'number', initialValue: 0, validation: (r) => r.required().integer().min(0) }),
  ],
  preview: {
    select: { scope: 'scope', fy: 'financialYear', value: 'value' },
    prepare({ scope, fy, value }) {
      return { title: `${scope} ${fy}`, subtitle: `next: ${(value ?? 0) + 1}` }
    },
  },
})
