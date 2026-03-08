import { describe, expect, it } from 'vitest'
import { buildPathWithNext, getGuestContinuePath, sanitizeAppPath } from '@/lib/navigation'

describe('navigation helpers', () => {
  it('sanitizes unsafe next paths back to the app default', () => {
    expect(sanitizeAppPath(null)).toBe('/explore')
    expect(sanitizeAppPath('https://example.com')).toBe('/explore')
    expect(sanitizeAppPath('//evil.com')).toBe('/explore')
    expect(sanitizeAppPath('/auth/callback?next=/profile')).toBe('/explore')
    expect(sanitizeAppPath('/shorts?v=abc')).toBe('/shorts?v=abc')
  })

  it('builds encoded next-path URLs safely', () => {
    expect(buildPathWithNext('/login', '/shorts?v=abc')).toBe(
      '/login?next=%2Fshorts%3Fv%3Dabc',
    )
  })

  it('falls back to explore for guest-only invalid destinations', () => {
    expect(getGuestContinuePath('/onboarding')).toBe('/explore')
    expect(getGuestContinuePath('/billing/success')).toBe('/explore')
    expect(getGuestContinuePath('/shorts?v=abc')).toBe('/shorts?v=abc')
  })
})
