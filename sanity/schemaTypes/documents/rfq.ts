import { defineField, defineType, defineArrayMember } from 'sanity'
import { EnvelopeIcon } from '@sanity/icons'

/**
 * RFQ (lib/types.ts RfqRecord). Transactional, server-written. Attachments are real Sanity
 * file assets (the mock kept only filenames). `response` holds the admin's quote.
 */
export const rfq = defineType({
  name: 'rfq',
  title: 'RFQ',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({ name: 'businessName', title: 'Business name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'contact', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'productInterest', title: 'Product interest', type: 'string' }),
    defineField({ name: 'details', type: 'text', rows: 3 }),
    defineField({ name: 'quantities', type: 'string' }),
    defineField({ name: 'privateLabel', title: 'Private label', type: 'boolean', initialValue: false }),
    defineField({ name: 'attachments', type: 'array', of: [defineArrayMember({ type: 'file' })] }),
    defineField({ name: 'receivedAt', title: 'Received at', type: 'datetime', validation: (r) => r.required() }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'open',
      options: { list: ['open', 'quoted', 'closed'], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'response', title: 'Quote / response', type: 'text', rows: 3 }),
  ],
  orderings: [{ title: 'Received (newest)', name: 'receivedDesc', by: [{ field: 'receivedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'businessName', status: 'status', interest: 'productInterest' },
    prepare({ title, status, interest }) {
      return { title, subtitle: `${status}${interest ? ` · ${interest}` : ''}` }
    },
  },
})
