import { defineQuery } from 'next-sanity'

// Raw product projection — everything the summary + detail DTOs need. Prices are present here
// (same for everyone); the mapper strips them for non-approved buyers before anything is sent.
const PRODUCT_FIELDS = /* groq */ `
  "id": _id,
  "slug": slug.current,
  name,
  "category": coalesce(category->title, "Uncategorised"),
  fabric,
  moq,
  "thumbnail": primaryImage.asset->url,
  "thumbnailLqip": primaryImage.asset->metadata.lqip,
  "dimensions": primaryImage.asset->metadata.dimensions{width, height},
  basePrice,
  "priceTiers": priceTiers[]{minQty, maxQty, price},
  priceTierLabel,
  "inStock": count(variants[stock > 0]) > 0,
  "colors": array::unique(variants[].colour->name),
  "sizes": array::unique(variants[].size),
  "skus": coalesce(variants[].sku, [])
`

export const PRODUCTS_QUERY = defineQuery(`*[_type == "product"] | order(name asc){
  ${PRODUCT_FIELDS}
}`)

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[_type == "product" && slug.current == $slug][0]{
  ${PRODUCT_FIELDS},
  description,
  care,
  leadTime,
  "images": [primaryImage.asset->url, ...coalesce(gallery[].asset->url, [])],
  "imageBlur": [primaryImage.asset->metadata.lqip, ...coalesce(gallery[].asset->metadata.lqip, [])],
  "variants": variants[]{
    "id": _key,
    sku,
    size,
    "color": colour->name,
    stock
  },
  "sizeRuns": sizeRuns[]{"id": _key, label, perSize, sizes}
}`)

export const PRODUCT_SLUGS_QUERY = defineQuery(`*[_type == "product" && defined(slug.current)].slug.current`)

export const SITE_SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  brandName,
  sellerGstin,
  sellerState,
  gstRate,
  minOrderValue,
  defaultTierLabel,
  "defaultPriceTiers": defaultPriceTiers[]{minQty, maxQty, price},
  contact,
  footerLegalNote
}`)

export const HOMEPAGE_QUERY = defineQuery(`*[_id == "homepage"][0]{
  "heroImage": heroImage.asset->url,
  "heroImageLqip": heroImage.asset->metadata.lqip,
  "heroImageAlt": heroImage.alt,
  heroTitle,
  heroSubtitle,
  "heroStats": heroStats[]{_key, label, value},
  "buyingSteps": buyingSteps[]{_key, title, body},
  "priceSteps": priceSteps[]{_key, title, body}
}`)
