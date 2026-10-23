import { defineField, defineType, defineArrayMember } from 'sanity'
import { CogIcon } from '@sanity/icons'

/**
 * Singleton. Holds the business config that was previously hard-coded in lib/fixtures.ts
 * (SELLER_STATE, GST_RATE, MIN_ORDER_VALUE) plus the default wholesale tier config.
 * The pure pricing functions in lib/pricing.ts still take these as params — this is just the source.
 * sellerGstin / default tiers are PLACEHOLDERS until the business confirms (docs/launch-checklist.md).
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'brand', title: 'Brand', default: true },
    { name: 'commerce', title: 'Commerce rules' },
    { name: 'contact', title: 'Contact' },
  ],
  fields: [
    defineField({ name: 'brandName', type: 'string', group: 'brand', initialValue: 'RG Enterprises', validation: (r) => r.required() }),
    defineField({
      name: 'sellerGstin',
      title: 'Seller GSTIN',
      type: 'string',
      group: 'brand',
      description: 'PLACEHOLDER — confirm the real GSTIN before launch.',
      validation: (r) => r.regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { name: 'GSTIN' }),
    }),
    defineField({ name: 'sellerState', title: 'Seller state code', type: 'string', group: 'commerce', initialValue: 'MH', validation: (r) => r.required().uppercase().length(2) }),
    defineField({
      name: 'gstRate',
      title: 'GST rate (fraction)',
      type: 'number',
      group: 'commerce',
      description: 'Flat rate on apparel, e.g. 0.05 for 5%.',
      initialValue: 0.05,
      validation: (r) => r.required().min(0).max(1),
    }),
    defineField({ name: 'minOrderValue', title: 'Minimum order value (₹)', type: 'number', group: 'commerce', initialValue: 15000, validation: (r) => r.required().min(0) }),
    defineField({ name: 'defaultTierLabel', title: 'Default tier label', type: 'string', group: 'commerce', initialValue: 'Tier A' }),
    defineField({
      name: 'defaultPriceTiers',
      title: 'Default price tiers',
      type: 'array',
      group: 'commerce',
      of: [defineArrayMember({ type: 'priceTier' })],
      description: 'Seed tiers applied to imported products. PLACEHOLDER — confirm real wholesale prices.',
    }),
    defineField({
      name: 'contact',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({ name: 'email', type: 'string', validation: (r) => r.email() }),
        defineField({ name: 'phone', type: 'string' }),
        defineField({ name: 'addressLines', title: 'Address lines', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
      ],
    }),
    defineField({ name: 'footerLegalNote', title: 'Footer legal note', type: 'string', group: 'brand' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
