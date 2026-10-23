import { defineField, defineType, defineArrayMember } from 'sanity'
import { HomeIcon } from '@sanity/icons'

// Singleton. Drives app/page.tsx — replaces the hard-coded hero + "how it works" copy and the picsum hero.
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() })],
    }),
    defineField({ name: 'heroTitle', title: 'Hero title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'heroSubtitle', title: 'Hero subtitle', type: 'text', rows: 2 }),
    defineField({ name: 'heroStats', title: 'Hero stats', type: 'array', of: [defineArrayMember({ type: 'labeledValue' })], validation: (r) => r.max(4) }),
    defineField({ name: 'buyingSteps', title: 'How buying works', type: 'array', of: [defineArrayMember({ type: 'titledStep' })] }),
    defineField({ name: 'priceSteps', title: 'How your price is set', type: 'array', of: [defineArrayMember({ type: 'titledStep' })] }),
    defineField({ name: 'promoBanner', title: 'Promo banner', type: 'reference', to: [{ type: 'banner' }] }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
})
