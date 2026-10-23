import { describe, it, expect } from 'vitest'
import { mapSummary, mapDetail, type RawProductSummary, type RawProductDetail } from '@/lib/sanity/mappers'

const rawSummary: RawProductSummary = {
  id: 'product.1',
  slug: 'p-1',
  name: 'Blue Towel',
  category: 'Towels',
  fabric: 'Cotton',
  moq: 10,
  thumbnail: 'https://cdn.sanity.io/t.jpg',
  thumbnailLqip: null,
  dimensions: null,
  basePrice: 500,
  priceTiers: [
    { minQty: 10, maxQty: 49, price: 450 },
    { minQty: 50, maxQty: null, price: 400 },
  ],
  priceTierLabel: 'Tier A',
  inStock: true,
  colors: ['Blue', null],
  sizes: ['S', 'M'],
  skus: ['SKU-1', null],
}

const rawDetail: RawProductDetail = {
  ...rawSummary,
  description: 'desc',
  care: 'care',
  leadTime: '7–20 days',
  images: ['https://cdn.sanity.io/a.jpg', null],
  imageBlur: null,
  variants: [{ id: 'v1', sku: 'SKU-1', size: 'S', color: 'Blue', stock: 5 }],
  sizeRuns: [{ id: 'sr1', label: 'run', perSize: 2, sizes: ['S', 'M'] }],
}

describe('price gating (server-side)', () => {
  it('approved buyers get the lowest price and tiers', () => {
    const s = mapSummary(rawSummary, true)
    expect(s.from_price).toBe(400) // min(base, tiers)
    expect(s.colors).toEqual(['Blue']) // nulls filtered

    const d = mapDetail(rawDetail, true)
    expect(d.base_price).toBe(500)
    expect(d.price_tiers).toHaveLength(2)
    expect(d.price_tiers[0]).toEqual({ min_qty: 10, max_qty: 49, price: 450 })
    expect(d.images).toEqual(['https://cdn.sanity.io/a.jpg'])
  })

  it('non-approved buyers never receive prices or tiers', () => {
    const s = mapSummary(rawSummary, false)
    expect(s.from_price).toBeNull()

    const d = mapDetail(rawDetail, false)
    expect(d.from_price).toBeNull()
    expect(d.base_price).toBe(0)
    expect(d.price_tiers).toEqual([])
    // non-price data still flows (variants/stock drive the matrix)
    expect(d.variants).toHaveLength(1)
    expect(d.variants[0].stock).toBe(5)
  })
})
