import { describe, it, expect } from 'vitest'
import { parseINR, parseSaleRange, parsePercent, pidFromUrl, slugify, parseCsv, deriveFabric } from '@/lib/import-parse'

describe('parseINR', () => {
  it('strips ₹ and commas', () => {
    expect(parseINR('₹1,902')).toBe(1902)
    expect(parseINR('₹3,590')).toBe(3590)
  })
  it('returns null for blank', () => {
    expect(parseINR('')).toBeNull()
    expect(parseINR('—')).toBeNull()
  })
})

describe('parseSaleRange', () => {
  it('parses a min–max range', () => {
    expect(parseSaleRange('₹2499 - ₹4299')).toEqual({ min: 2499, max: 4299 })
  })
  it('parses a single price as equal min/max', () => {
    expect(parseSaleRange('₹1,902')).toEqual({ min: 1902, max: 1902 })
  })
  it('returns nulls for blank', () => {
    expect(parseSaleRange('')).toEqual({ min: null, max: null })
  })
})

describe('parsePercent', () => {
  it('reads a discount percent', () => {
    expect(parsePercent('47% OFF')).toBe(47)
    expect(parsePercent('')).toBeNull()
  })
})

describe('pidFromUrl', () => {
  it('extracts the trailing id for both sources', () => {
    expect(pidFromUrl('https://www.jaypore.com/p/men-beige-cotton-linen-kurta-39829697.html')).toBe('39829697')
    expect(pidFromUrl('https://www.fabindia.com/blue-bed-sheet-with-2-pillow-covers-20290202')).toBe('20290202')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Men Beige Cotton Linen Kurta')).toBe('men-beige-cotton-linen-kurta')
    expect(slugify("Men's  Kurtas")).toBe('men-s-kurtas')
  })
})

describe('deriveFabric', () => {
  it('picks known fabric words, falls back to Cotton', () => {
    expect(deriveFabric('Men Beige Cotton Linen Mandarin Kurta')).toBe('Cotton Linen')
    expect(deriveFabric('Plain Tee')).toBe('Cotton')
  })
})

describe('parseCsv', () => {
  it('parses quoted fields with commas and "" escapes', () => {
    const csv = 'name,price\n"A, B","₹1,902"\n"She said ""hi""","₹10"'
    expect(parseCsv(csv)).toEqual([
      { name: 'A, B', price: '₹1,902' },
      { name: 'She said "hi"', price: '₹10' },
    ])
  })
})
