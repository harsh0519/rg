import { describe, it, expect } from 'vitest'
import { resolveUnitPrice, activeTierIndex, computeGst, minOrderCheck, round2 } from '@/lib/pricing'
import type { PriceTier } from '@/lib/types'

const tiers: PriceTier[] = [
  { min_qty: 10, max_qty: 49, price: 195 },
  { min_qty: 50, max_qty: 199, price: 175 },
  { min_qty: 200, max_qty: null, price: 165 },
]
const base = 210

describe('resolveUnitPrice (doc §4 priority order)', () => {
  it('buyer price-list wins over tiers and base', () => {
    expect(resolveUnitPrice(tiers, base, 300, 150)).toBe(150)
  })
  it('honours a buyer price of 0 (loose null check)', () => {
    expect(resolveUnitPrice(tiers, base, 300, 0)).toBe(0)
  })
  it('selects the tier by total qty across variants', () => {
    expect(resolveUnitPrice(tiers, base, 10, null)).toBe(195)
    expect(resolveUnitPrice(tiers, base, 49, null)).toBe(195)
    expect(resolveUnitPrice(tiers, base, 50, null)).toBe(175)
    expect(resolveUnitPrice(tiers, base, 500, null)).toBe(165) // open-ended top tier
  })
  it('falls back to base below the lowest tier', () => {
    expect(resolveUnitPrice(tiers, base, 5, null)).toBe(210)
  })
})

describe('activeTierIndex', () => {
  it('returns the 0-based tier index, or -1 below all tiers', () => {
    expect(activeTierIndex(tiers, 60)).toBe(1)
    expect(activeTierIndex(tiers, 5)).toBe(-1)
  })
})

describe('computeGst (CGST+SGST vs IGST)', () => {
  it('intra-state splits into CGST+SGST', () => {
    const g = computeGst(1000, 'MH', 'MH', 0.05)
    expect(g.interstate).toBe(false)
    expect(g.igst).toBe(0)
    expect(g.cgst).toBe(25)
    expect(g.sgst).toBe(25)
    expect(g.cgst + g.sgst).toBe(g.total_tax)
  })
  it('inter-state is a single IGST', () => {
    const g = computeGst(1000, 'DL', 'MH', 0.05)
    expect(g.interstate).toBe(true)
    expect(g.igst).toBe(50)
    expect(g.cgst).toBe(0)
    expect(g.sgst).toBe(0)
  })
  it('treats an unknown (null) buyer state as inter-state', () => {
    expect(computeGst(1000, null, 'MH', 0.05).interstate).toBe(true)
  })
  it('keeps CGST+SGST == total_tax on odd-paisa amounts', () => {
    const g = computeGst(999, 'MH', 'MH', 0.05) // 49.95 tax
    expect(g.total_tax).toBe(49.95)
    expect(g.cgst + g.sgst).toBe(g.total_tax)
  })
})

describe('minOrderCheck', () => {
  it('is met at exactly the minimum (inclusive)', () => {
    expect(minOrderCheck(15000, 15000).met).toBe(true)
    expect(minOrderCheck(20000, 15000).met).toBe(true)
  })
  it('reports the shortfall below the minimum', () => {
    expect(minOrderCheck(12000, 15000)).toEqual({
      min_order_value: 15000,
      current_value: 12000,
      met: false,
      shortfall: 3000,
    })
  })
})

describe('round2', () => {
  it('rounds to 2 decimals with an epsilon nudge', () => {
    expect(round2(24.975)).toBe(24.98)
    expect(round2(49.95)).toBe(49.95)
  })
})
