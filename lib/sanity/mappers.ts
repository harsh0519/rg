import type { ProductSummary, ProductDetail, PriceTier, Variant, SizeRunPack } from '@/lib/types'
import type { CatalogProduct } from '@/lib/catalog-filters'

/** Shapes returned by the GROQ in queries.ts (kept explicit to avoid `any`). */
interface RawTier { minQty: number; maxQty: number | null; price: number }
export interface RawProductSummary {
  id: string
  slug: string | null
  name: string
  category: string
  fabric: string | null
  moq: number | null
  thumbnail: string | null
  thumbnailLqip: string | null
  dimensions: { width: number; height: number } | null
  basePrice: number | null
  priceTiers: RawTier[] | null
  priceTierLabel: string | null
  inStock: boolean
  colors: (string | null)[] | null
  sizes: (string | null)[] | null
  skus: (string | null)[] | null
}
export interface RawProductDetail extends RawProductSummary {
  description: string | null
  care: string | null
  leadTime: string | null
  images: (string | null)[] | null
  imageBlur: (string | null)[] | null
  variants: { id: string; sku: string; size: string; color: string | null; stock: number }[] | null
  sizeRuns: { id: string; label: string; perSize: number; sizes: string[] }[] | null
}

const clean = (xs: (string | null)[] | null): string[] => (xs ?? []).filter((x): x is string => !!x)
const mapTier = (t: RawTier): PriceTier => ({ min_qty: t.minQty, max_qty: t.maxQty ?? null, price: t.price })

/** Lowest advertised price: cheapest tier, else base. */
function fromPrice(base: number, tiers: RawTier[]): number {
  const prices = [base, ...tiers.map((t) => t.price)].filter((n) => n > 0)
  return prices.length ? Math.min(...prices) : base
}

/**
 * Price gating is enforced HERE, server-side: non-approved buyers get from_price null and no tiers.
 * The mapper runs on the server before the DTO is serialized to the client.
 */
export function mapSummary(r: RawProductSummary, approved: boolean): ProductSummary {
  const base = r.basePrice ?? 0
  const tiers = r.priceTiers ?? []
  return {
    id: r.id,
    slug: r.slug ?? r.id,
    name: r.name,
    category: r.category,
    fabric: r.fabric ?? '',
    moq: r.moq ?? 1,
    thumbnail: r.thumbnail ?? '',
    from_price: approved ? fromPrice(base, tiers) : null,
    in_stock: r.inStock,
    colors: clean(r.colors),
    sizes: clean(r.sizes),
    price_tier_label: r.priceTierLabel ?? '',
  }
}

/** Catalog card + SKUs for client-side search. */
export function mapCatalogItem(r: RawProductSummary, approved: boolean): CatalogProduct {
  return { ...mapSummary(r, approved), skus: clean(r.skus) }
}

export function mapDetail(r: RawProductDetail, approved: boolean): ProductDetail {
  const base = r.basePrice ?? 0
  const tiers = r.priceTiers ?? []
  const variants: Variant[] = (r.variants ?? []).map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color ?? '',
    stock: v.stock,
  }))
  const sizeRuns: SizeRunPack[] = (r.sizeRuns ?? []).map((s) => ({ id: s.id, label: s.label, per_size: s.perSize, sizes: s.sizes }))
  return {
    ...mapSummary(r, approved),
    description: r.description ?? '',
    care: r.care ?? '',
    lead_time: r.leadTime ?? '',
    images: clean(r.images),
    variants,
    // gated: non-approved buyers never receive prices or tiers
    price_tiers: approved ? tiers.map(mapTier) : [],
    base_price: approved ? base : 0,
    size_runs: sizeRuns,
  }
}
