import { type SchemaTypeDefinition } from 'sanity'

import { objectTypes } from './objects'
import { category } from './documents/category'
import { colour } from './documents/colour'
import { product } from './documents/product'
import { banner } from './documents/banner'
import { siteSettings } from './documents/siteSettings'
import { homepage } from './documents/homepage'
import { buyer } from './documents/buyer'
import { order } from './documents/order'
import { invoice } from './documents/invoice'
import { rfq } from './documents/rfq'
import { counter } from './documents/counter'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // shared objects
    ...objectTypes,
    // catalog + marketing
    category,
    colour,
    product,
    banner,
    siteSettings,
    homepage,
    // transactional
    buyer,
    order,
    invoice,
    rfq,
    counter,
  ],
}
