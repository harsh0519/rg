import { unstable_cache } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY, HOMEPAGE_QUERY } from '@/lib/sanity/queries'
import type { StateCode } from '@/lib/types'

export interface SiteSettings {
  brandName: string
  sellerGstin: string | null
  sellerState: StateCode
  gstRate: number
  minOrderValue: number
  defaultTierLabel: string | null
  defaultPriceTiers: { min_qty: number; max_qty: number | null; price: number }[]
  contact: { email?: string | null; phone?: string | null; addressLines?: string[] | null } | null
  footerLegalNote: string | null
}

const FALLBACK: SiteSettings = {
  brandName: 'RG Enterprises',
  sellerGstin: null,
  sellerState: 'MH',
  gstRate: 0.05,
  minOrderValue: 15000,
  defaultTierLabel: 'Tier A',
  defaultPriceTiers: [],
  contact: null,
  footerLegalNote: null,
}

interface RawSettings {
  brandName: string | null
  sellerGstin: string | null
  sellerState: string | null
  gstRate: number | null
  minOrderValue: number | null
  defaultTierLabel: string | null
  defaultPriceTiers: { minQty: number; maxQty: number | null; price: number }[] | null
  contact: SiteSettings['contact']
  footerLegalNote: string | null
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const s = (await client.fetch(SITE_SETTINGS_QUERY)) as unknown as RawSettings | null
    if (!s) return FALLBACK
    return {
      brandName: s.brandName ?? FALLBACK.brandName,
      sellerGstin: s.sellerGstin ?? null,
      sellerState: s.sellerState ?? 'MH',
      gstRate: s.gstRate ?? 0.05,
      minOrderValue: s.minOrderValue ?? 15000,
      defaultTierLabel: s.defaultTierLabel ?? 'Tier A',
      defaultPriceTiers: (s.defaultPriceTiers ?? []).map((t) => ({ min_qty: t.minQty, max_qty: t.maxQty ?? null, price: t.price })),
      contact: s.contact ?? null,
      footerLegalNote: s.footerLegalNote ?? null,
    }
  },
  ['site:settings'],
  { tags: ['settings'], revalidate: 3600 },
)

export interface HomepageData {
  heroImage: string | null
  heroImageLqip: string | null
  heroImageAlt: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  heroStats: { _key: string; label: string; value: string }[] | null
  buyingSteps: { _key: string; title: string; body: string }[] | null
  priceSteps: { _key: string; title: string; body: string }[] | null
}

export const getHomepage = unstable_cache(
  async () => (await client.fetch(HOMEPAGE_QUERY)) as unknown as HomepageData | null,
  ['site:homepage'],
  { tags: ['homepage'], revalidate: 3600 },
)
