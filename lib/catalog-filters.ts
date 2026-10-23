import type { ProductSummary } from '@/lib/types'

/** Catalog card + the SKUs needed for client-side search (not shown, just matched). */
export type CatalogProduct = ProductSummary & { skus: string[] }

// Catalog filters (doc §3.2) — owned by the data layer.
export interface ProductFilters {
  category?: string
  fabric?: string
  color?: string
  size?: string
  tier?: string
  inStockOnly?: boolean
  search?: string
}

export interface FilterOptions {
  categories: string[]
  fabrics: string[]
  colors: string[]
  sizes: string[]
  tiers: string[]
}

const uniq = (xs: string[]): string[] => [...new Set(xs.filter(Boolean))].sort()

export function buildFilterOptions(all: CatalogProduct[]): FilterOptions {
  return {
    categories: uniq(all.map((p) => p.category)),
    fabrics: uniq(all.map((p) => p.fabric)),
    colors: uniq(all.flatMap((p) => p.colors)),
    sizes: uniq(all.flatMap((p) => p.sizes)),
    tiers: uniq(all.map((p) => p.price_tier_label)),
  }
}

/** Same predicate the mock used: exact match on facets, substring on name/SKU for search. */
export function filterProducts(items: CatalogProduct[], f: ProductFilters): CatalogProduct[] {
  const q = f.search?.trim().toLowerCase()
  return items.filter((p) => {
    if (f.category && p.category !== f.category) return false
    if (f.fabric && p.fabric !== f.fabric) return false
    if (f.color && !p.colors.includes(f.color)) return false
    if (f.size && !p.sizes.includes(f.size)) return false
    if (f.tier && p.price_tier_label !== f.tier) return false
    if (f.inStockOnly && !p.in_stock) return false
    if (q && !(p.name.toLowerCase().includes(q) || p.skus.some((s) => s.toLowerCase().includes(q)))) return false
    return true
  })
}
