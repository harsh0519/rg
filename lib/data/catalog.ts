import { unstable_cache } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { PRODUCTS_QUERY, PRODUCT_BY_SLUG_QUERY, PRODUCT_SLUGS_QUERY } from '@/lib/sanity/queries'
import { mapCatalogItem, mapDetail, type RawProductSummary, type RawProductDetail } from '@/lib/sanity/mappers'
import type { ProductDetail } from '@/lib/types'
import type { CatalogProduct } from '@/lib/catalog-filters'

// Raw Sanity reads are cached (same for everyone) and tagged; the webhook revalidates `product`.
// Gating is applied per-request in the mapper, outside the cache, so prices never leak.
const getRawProducts = unstable_cache(
  async () => (await client.fetch(PRODUCTS_QUERY)) as unknown as RawProductSummary[],
  ['catalog:products'],
  { tags: ['product'], revalidate: 3600 },
)

export async function getProducts(approved: boolean): Promise<CatalogProduct[]> {
  const raw = await getRawProducts()
  return raw.map((r) => mapCatalogItem(r, approved))
}

export async function getProduct(slug: string, approved: boolean): Promise<ProductDetail | null> {
  const raw = await unstable_cache(
    async () => (await client.fetch(PRODUCT_BY_SLUG_QUERY, { slug })) as unknown as RawProductDetail | null,
    ['catalog:product', slug],
    { tags: ['product', `product:${slug}`], revalidate: 3600 },
  )()
  return raw ? mapDetail(raw, approved) : null
}

export const getProductSlugs = unstable_cache(
  async () => (await client.fetch(PRODUCT_SLUGS_QUERY)) as string[],
  ['catalog:slugs'],
  { tags: ['product'], revalidate: 3600 },
)
