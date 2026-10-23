import { describe, it, expect } from 'vitest'
import { computeCart, type CartProductRow, type CartContext } from '@/lib/cart/compute'
import type { CartItem } from '@/lib/types'

const products: CartProductRow[] = [
  {
    id: 'p1',
    slug: 'towel',
    name: 'Towel',
    basePrice: 1000,
    priceTiers: [
      { minQty: 10, maxQty: 49, price: 900 },
      { minQty: 50, maxQty: null, price: 800 },
    ],
    variants: [
      { id: 'v1', sku: 'T-S', size: 'S', color: 'Blue', stock: 100 },
      { id: 'v2', sku: 'T-M', size: 'M', color: 'Blue', stock: 100 },
    ],
  },
]

const ctx = (over: Partial<CartContext> = {}): CartContext => ({
  approved: true,
  sellerState: 'MH',
  gstRate: 0.05,
  minOrderValue: 15000,
  buyerState: 'MH',
  ...over,
})

describe('computeCart', () => {
  it('returns an empty, unpriced cart for no items', () => {
    const c = computeCart([], products, ctx())
    expect(c.priced).toBe(false)
    expect(c.lines).toEqual([])
    expect(c.min_order_check.met).toBe(false)
  })

  it('gates all prices for non-approved buyers', () => {
    const c = computeCart([{ variant_id: 'v1', qty: 30 }], products, ctx({ approved: false }))
    expect(c.priced).toBe(false)
    expect(c.subtotal).toBeNull()
    expect(c.total).toBeNull()
    expect(c.lines[0].unit_price).toBeNull()
    expect(c.lines[0].qty).toBe(30) // non-price data still present
  })

  it('prices an approved intra-state cart with CGST+SGST', () => {
    const c = computeCart([{ variant_id: 'v1', qty: 30 }], products, ctx())
    expect(c.priced).toBe(true)
    expect(c.lines[0].unit_price).toBe(900) // 30 falls in the 10–49 tier
    expect(c.subtotal).toBe(27000)
    expect(c.tax?.interstate).toBe(false)
    expect(c.tax?.cgst).toBe(675)
    expect(c.tax?.sgst).toBe(675)
    expect(c.total).toBe(28350)
    expect(c.min_order_check.met).toBe(true)
  })

  it('applies IGST for an inter-state buyer', () => {
    const c = computeCart([{ variant_id: 'v1', qty: 30 }], products, ctx({ buyerState: 'DL' }))
    expect(c.tax?.interstate).toBe(true)
    expect(c.tax?.igst).toBe(1350)
    expect(c.tax?.cgst).toBe(0)
  })

  it('picks the tier by TOTAL qty across variants of a product', () => {
    const items: CartItem[] = [
      { variant_id: 'v1', qty: 30 },
      { variant_id: 'v2', qty: 25 },
    ]
    const c = computeCart(items, products, ctx()) // total 55 → 50+ tier @ 800
    expect(c.lines.every((l) => l.unit_price === 800)).toBe(true)
    expect(c.subtotal).toBe(55 * 800)
  })

  it('reports a min-order shortfall below the minimum', () => {
    const c = computeCart([{ variant_id: 'v1', qty: 10 }], products, ctx()) // 10 × 900 = 9000
    expect(c.subtotal).toBe(9000)
    expect(c.min_order_check.met).toBe(false)
    expect(c.min_order_check.shortfall).toBe(6000)
  })

  it('drops cart items whose variant no longer exists', () => {
    const c = computeCart([{ variant_id: 'gone', qty: 5 }], products, ctx())
    expect(c.lines).toEqual([])
    expect(c.items).toEqual([])
  })
})
