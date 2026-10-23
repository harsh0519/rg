import { describe, it, expect } from 'vitest'
import { formatINR, formatQty } from '@/lib/format'

describe('formatINR (en-IN, 0 decimals)', () => {
  it('formats whole rupees with Indian grouping', () => {
    expect(formatINR(1902)).toContain('1,902')
    expect(formatINR(1234567)).toContain('12,34,567') // lakh grouping
  })
  it('renders an em dash for null/undefined', () => {
    expect(formatINR(null)).toBe('—')
    expect(formatINR(undefined)).toBe('—')
  })
})

describe('formatQty', () => {
  it('groups with Indian digits, no currency', () => {
    expect(formatQty(12345)).toBe('12,345')
  })
})
