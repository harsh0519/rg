import { describe, it, expect } from 'vitest'
import { validateGSTIN, validatePincode, validatePhone, validateEmail, runSchema, required } from '@/lib/validation'

describe('validateGSTIN', () => {
  it('accepts a valid 15-char GSTIN', () => {
    expect(validateGSTIN('27ABCDE1234F1Z5')).toBeNull()
  })
  it('rejects malformed / empty', () => {
    expect(validateGSTIN('27ABCDE1234F1Z')).toBeTruthy() // too short
    expect(validateGSTIN('abc')).toBeTruthy()
    expect(validateGSTIN('')).toBe('GSTIN is required')
  })
})

describe('validatePincode', () => {
  it('accepts a 6-digit, non-zero-leading pincode', () => {
    expect(validatePincode('400001')).toBeNull()
  })
  it('rejects leading zero / too short', () => {
    expect(validatePincode('012345')).toBeTruthy()
    expect(validatePincode('12345')).toBeTruthy()
  })
})

describe('validatePhone', () => {
  it('accepts an Indian mobile starting 6–9', () => {
    expect(validatePhone('9820012345')).toBeNull()
  })
  it('rejects non-6–9 start / too short', () => {
    expect(validatePhone('1234567890')).toBeTruthy()
    expect(validatePhone('98200')).toBeTruthy()
  })
})

describe('validateEmail', () => {
  it('accepts a basic address, rejects garbage', () => {
    expect(validateEmail('a@b.co')).toBeNull()
    expect(validateEmail('not-an-email')).toBeTruthy()
  })
})

describe('runSchema', () => {
  it('collects only the failing fields', () => {
    const errs = runSchema(
      { name: '', gstin: '27ABCDE1234F1Z5' },
      { name: required('Name'), gstin: validateGSTIN },
    )
    expect(Object.keys(errs)).toEqual(['name'])
  })
})
