import { resolveUnitPrice, computeGst, minOrderCheck, round2 } from '@/lib/pricing'
import type { Cart, CartItem, CartLineView, PriceTier } from '@/lib/types'

// Pure (no IO) — safe to unit test. getServerCart() wires the Sanity reads around this.
export interface CartProductRow {
  id: string
  slug: string | null
  name: string
  basePrice: number | null
  priceTiers: { minQty: number; maxQty: number | null; price: number }[] | null
  variants: { id: string; sku: string; size: string; color: string | null; stock: number }[]
}

export interface CartContext {
  approved: boolean
  sellerState: string
  gstRate: number
  minOrderValue: number
  buyerState: string | null
}

export function emptyCart(minOrderValue: number): Cart {
  return {
    items: [],
    lines: [],
    subtotal: null,
    tax: null,
    total: null,
    min_order_check: minOrderCheck(0, minOrderValue),
    priced: false,
  }
}

/** Recompute the whole cart from items + product data. Prices/GST are gated for non-approved buyers. */
export function computeCart(items: CartItem[], products: CartProductRow[], ctx: CartContext): Cart {
  if (items.length === 0) return emptyCart(ctx.minOrderValue)

  const vindex = new Map<string, { p: CartProductRow; v: CartProductRow['variants'][number] }>()
  for (const p of products) for (const v of p.variants) vindex.set(v.id, { p, v })

  // Tier price uses TOTAL qty of a product across its variants (doc §4).
  const qtyByProduct = new Map<string, number>()
  for (const it of items) {
    const f = vindex.get(it.variant_id)
    if (f) qtyByProduct.set(f.p.id, (qtyByProduct.get(f.p.id) ?? 0) + it.qty)
  }

  const validItems = items.filter((i) => vindex.has(i.variant_id))
  const lines: CartLineView[] = []
  let subtotal = 0

  for (const it of validItems) {
    const { p, v } = vindex.get(it.variant_id)!
    const tiers: PriceTier[] = (p.priceTiers ?? []).map((t) => ({ min_qty: t.minQty, max_qty: t.maxQty ?? null, price: t.price }))
    const totalQty = qtyByProduct.get(p.id) ?? it.qty
    const unit = ctx.approved ? resolveUnitPrice(tiers, p.basePrice ?? 0, totalQty, null) : null
    const lineTotal = unit == null ? null : round2(unit * it.qty)
    if (lineTotal != null) subtotal += lineTotal
    lines.push({
      variant_id: it.variant_id,
      product_id: p.id,
      product_slug: p.slug ?? p.id,
      product_name: p.name,
      sku: v.sku,
      size: v.size,
      color: v.color ?? '',
      qty: it.qty,
      stock: v.stock,
      unit_price: unit,
      line_total: lineTotal,
    })
  }

  if (!ctx.approved) {
    return { items: validItems, lines, subtotal: null, tax: null, total: null, min_order_check: minOrderCheck(0, ctx.minOrderValue), priced: false }
  }

  subtotal = round2(subtotal)
  const tax = computeGst(subtotal, ctx.buyerState, ctx.sellerState, ctx.gstRate)
  const total = round2(subtotal + tax.total_tax)
  const min_order_check = minOrderCheck(subtotal, ctx.minOrderValue)
  return { items: validItems, lines, subtotal, tax, total, min_order_check, priced: true }
}
