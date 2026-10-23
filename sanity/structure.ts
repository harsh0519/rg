import type { StructureResolver } from 'sanity/structure'
import {
  CogIcon,
  HomeIcon,
  PackageIcon,
  TagIcon,
  DropIcon,
  ImageIcon,
  UsersIcon,
  BasketIcon,
  BillIcon,
  EnvelopeIcon,
} from '@sanity/icons'
import type { ComponentType } from 'react'

// Document types managed outside the generic list (singletons + code-managed counters + grouped docs).
const MANAGED = [
  'siteSettings',
  'homepage',
  'product',
  'category',
  'colour',
  'banner',
  'buyer',
  'order',
  'invoice',
  'rfq',
  'counter',
]

function singleton(
  S: Parameters<StructureResolver>[0],
  id: string,
  title: string,
  icon: ComponentType,
) {
  return S.listItem()
    .title(title)
    .id(id)
    .icon(icon)
    .child(S.document().schemaType(id).documentId(id).title(title))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('RG Enterprises')
    .items([
      singleton(S, 'siteSettings', 'Site settings', CogIcon),
      singleton(S, 'homepage', 'Homepage', HomeIcon),
      S.divider(),
      S.listItem()
        .title('Catalog')
        .icon(PackageIcon)
        .child(
          S.list()
            .title('Catalog')
            .items([
              S.documentTypeListItem('product').title('Products').icon(PackageIcon),
              S.documentTypeListItem('category').title('Categories').icon(TagIcon),
              S.documentTypeListItem('colour').title('Colours').icon(DropIcon),
              S.documentTypeListItem('banner').title('Banners').icon(ImageIcon),
            ]),
        ),
      S.divider(),
      S.documentTypeListItem('buyer').title('Buyers').icon(UsersIcon),
      S.documentTypeListItem('order').title('Orders').icon(BasketIcon),
      S.documentTypeListItem('invoice').title('Invoices').icon(BillIcon),
      S.documentTypeListItem('rfq').title('RFQs').icon(EnvelopeIcon),
      S.divider(),
      // anything added later that isn't explicitly placed above (counters stay code-managed, hidden)
      ...S.documentTypeListItems().filter((li) => !MANAGED.includes(li.getId() as string)),
    ])
