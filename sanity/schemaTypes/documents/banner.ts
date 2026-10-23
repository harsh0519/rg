import { defineField, defineType } from 'sanity'
import { ImageIcon } from '@sanity/icons'

// Optional promo banner surfaced on the homepage / catalog.
export const banner = defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', type: 'string' }),
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() })],
    }),
    defineField({ name: 'ctaLabel', title: 'Button label', type: 'string' }),
    defineField({ name: 'ctaHref', title: 'Button link', type: 'string' }),
    defineField({ name: 'active', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'subtitle', media: 'image', active: 'active' },
    prepare({ title, subtitle, media, active }) {
      return { title: `${active ? '● ' : '○ '}${title}`, subtitle, media }
    },
  },
})
