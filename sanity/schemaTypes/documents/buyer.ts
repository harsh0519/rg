import { defineField, defineType, defineArrayMember } from 'sanity'
import { UsersIcon } from '@sanity/icons'

const BUSINESS_TYPES = [
  { title: 'Retailer', value: 'retailer' },
  { title: 'Reseller', value: 'reseller' },
  { title: 'Distributor', value: 'distributor' },
  { title: 'Other', value: 'other' },
]

/**
 * Buyer — the application + account + auth identity (lib/types.ts Buyer/Me).
 * Transactional: written only by server code. `passwordHash` is set by the auth layer and
 * must never be edited in Studio. `role` gates /admin and admin server actions.
 */
export const buyer = defineType({
  name: 'buyer',
  title: 'Buyer',
  type: 'document',
  icon: UsersIcon,
  groups: [
    { name: 'business', title: 'Business', default: true },
    { name: 'account', title: 'Account & terms' },
  ],
  fields: [
    defineField({ name: 'businessName', title: 'Business name', type: 'string', group: 'business', validation: (r) => r.required() }),
    defineField({ name: 'contactName', title: 'Contact name', type: 'string', group: 'business', validation: (r) => r.required() }),
    defineField({ name: 'email', type: 'string', group: 'business', validation: (r) => r.required().email() }),
    defineField({ name: 'phone', type: 'string', group: 'business', validation: (r) => r.regex(/^[6-9][0-9]{9}$/, { name: 'phone' }) }),
    defineField({ name: 'gstin', title: 'GSTIN', type: 'string', group: 'business', validation: (r) => r.regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { name: 'GSTIN' }) }),
    defineField({ name: 'address', type: 'text', rows: 2, group: 'business' }),
    defineField({ name: 'pincode', type: 'string', group: 'business', validation: (r) => r.regex(/^[1-9][0-9]{5}$/, { name: 'pincode' }) }),
    defineField({ name: 'state', title: 'State code', type: 'string', group: 'business', validation: (r) => r.uppercase().length(2) }),
    defineField({ name: 'businessType', title: 'Business type', type: 'string', group: 'business', options: { list: BUSINESS_TYPES, layout: 'radio' } }),

    defineField({
      name: 'status',
      type: 'string',
      group: 'account',
      initialValue: 'pending',
      options: { list: ['pending', 'approved', 'rejected', 'suspended'], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      group: 'account',
      initialValue: 'buyer',
      description: 'Admins can access /admin and admin server actions.',
      options: { list: ['buyer', 'admin'], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'paymentTerms',
      title: 'Payment terms',
      type: 'array',
      group: 'account',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: ['advance', 'cod', 'credit'] },
    }),
    defineField({ name: 'creditLimit', title: 'Credit limit (₹)', type: 'number', group: 'account', initialValue: 0, validation: (r) => r.min(0) }),
    defineField({ name: 'priceListId', title: 'Price list id', type: 'string', group: 'account', description: 'Optional buyer-specific price list key.' }),
    defineField({
      name: 'passwordHash',
      title: 'Password hash',
      type: 'string',
      group: 'account',
      readOnly: true,
      description: 'Set by the auth layer (argon2id). Never edit here.',
    }),
    defineField({ name: 'appliedAt', title: 'Applied at', type: 'datetime', group: 'account' }),
    defineField({ name: 'approvedAt', title: 'Approved at', type: 'datetime', group: 'account' }),
  ],
  preview: {
    select: { title: 'businessName', status: 'status', role: 'role', email: 'email' },
    prepare({ title, status, role, email }) {
      return { title, subtitle: `${status}${role === 'admin' ? ' · admin' : ''} · ${email}` }
    },
  },
})
