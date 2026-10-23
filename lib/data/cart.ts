import 'server-only'
import { client } from '@/sanity/lib/client'
import { readCartCookie } from '@/lib/cart/cookie'
import { getCurrentBuyer } from '@/lib/data/buyers'
import { getSiteSettings } from '@/lib/data/site'
import { computeCart, emptyCart, type CartProductRow } from '@/lib/cart/compute'
import type { Cart } from '@/lib/types'

const CART_PRODUCTS_QUERY = `*[_type == "product" && count(variants[_key in $keys]) > 0]{
  "id": _id,
  "slug": slug.current,
  name,
  basePrice,
  "priceTiers": priceTiers[]{minQty, maxQty, price},
  "variants": variants[]{"id": _key, sku, size, "color": colour->name, stock}
}`

/**
 * Recompute the cart entirely server-side from the cookie's {variant_id, qty} + Sanity data.
 * Prices/GST/min-order are NEVER read from the client (see computeCart, which is unit-tested).
 */
export async function getServerCart(): Promise<Cart> {
  const items = await readCartCookie()
  const settings = await getSiteSettings()
  if (items.length === 0) return emptyCart(settings.minOrderValue)

  const buyer = await getCurrentBuyer()
  const products = (await client.fetch(CART_PRODUCTS_QUERY, { keys: items.map((i) => i.variant_id) })) as CartProductRow[]

  return computeCart(items, products, {
    approved: buyer?.status === 'approved',
    sellerState: settings.sellerState,
    gstRate: settings.gstRate,
    minOrderValue: settings.minOrderValue,
    buyerState: buyer?.state ?? null,
  })
}
