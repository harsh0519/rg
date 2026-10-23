import { defineField, defineType } from 'sanity'
import { DropIcon } from '@sanity/icons'

// Colour taxonomy. Variants reference this; catalog filters by it.
export const colour = defineType({
  name: 'colour',
  title: 'Colour',
  type: 'document',
  icon: DropIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'hex',
      title: 'Swatch hex',
      type: 'string',
      description: 'Optional display swatch, e.g. #4f6238.',
      validation: (r) => r.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { name: 'hex colour' }),
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'hex' } },
})
