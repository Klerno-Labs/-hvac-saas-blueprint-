import { describe, it, expect } from 'vitest'
import { generateTokenString, defaultTokenExpiry } from '@/lib/portal'

describe('generateTokenString', () => {
  it('returns a 64-character hex string', () => {
    const token = generateTokenString()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateTokenString()))
    expect(tokens.size).toBe(100)
  })
})

describe('defaultTokenExpiry', () => {
  it('returns a date 30 days in the future', () => {
    const now = Date.now()
    const expiry = defaultTokenExpiry()
    const diffDays = (expiry.getTime() - now) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThan(29.9)
    expect(diffDays).toBeLessThan(30.1)
  })
})
