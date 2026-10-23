import { describe, it, expect } from 'vitest'
import { filterProducts, buildFilterOptions, type CatalogProduct } from '@/lib/catalog-filters'

const mk = (over: Partial<CatalogProduct>): CatalogProduct => ({
  id: 'p', slug: 'p', name: 'Item', category: 'Towels', fabric: 'Cotton', moq: 10,
  thumbnail: 't', from_price: null, in_stock: true, colors: ['Blue'], sizes: ['S'],
  price_tier_label: 'Tier A', skus: ['SKU-1'], ...over,
})

const items: CatalogProduct[] = [
  mk({ id: '1', name: 'Blue Towel', category: 'Towels', colors: ['Blue'], sizes: ['Standard'], skus: ['20051184-STD'] }),
  mk({ id: '2', name: 'Pink Bedsheet', category: 'Bedsheets', fabric: 'Cotton Linen', colors: ['Pink'], sizes: ['King'], in_stock: false, skus: ['20290205-KING'] }),
  mk({ id: '3', name: 'Beige Kurta', category: "Men's Kurtas", colors: ['Beige'], sizes: ['M', 'L'], skus: ['39829697-M'] }),
]

describe('filterProducts', () => {
  it('filters by category', () => {
    expect(filterProducts(items, { category: 'Towels' }).map((p) => p.id)).toEqual(['1'])
  })
  it('filters by colour membership', () => {
    expect(filterProducts(items, { color: 'Pink' }).map((p) => p.id)).toEqual(['2'])
  })
  it('in-stock-only drops out-of-stock', () => {
    expect(filterProducts(items, { inStockOnly: true }).map((p) => p.id)).toEqual(['1', '3'])
  })
  it('search matches name or SKU, case-insensitively', () => {
    expect(filterProducts(items, { search: 'kurta' }).map((p) => p.id)).toEqual(['3'])
    expect(filterProducts(items, { search: '20290205' }).map((p) => p.id)).toEqual(['2'])
  })
  it('combines facets (AND)', () => {
    expect(filterProducts(items, { category: 'Towels', size: 'King' })).toHaveLength(0)
  })
})

describe('buildFilterOptions', () => {
  it('collects sorted unique facet values', () => {
    const o = buildFilterOptions(items)
    expect(o.categories).toEqual(['Bedsheets', "Men's Kurtas", 'Towels'])
    expect(o.colors).toEqual(['Beige', 'Blue', 'Pink'])
    expect(o.fabrics).toEqual(['Cotton', 'Cotton Linen'])
  })
})
