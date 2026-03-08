import { afterEach, describe, expect, it } from 'vitest'
import { isEntitlementActive } from '@/lib/billing'
import { getPlanKeyForPriceId } from '@/lib/billingServer'

const originalBillingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED
const originalMonthlyPriceId = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
const originalYearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID

afterEach(() => {
  process.env.NEXT_PUBLIC_BILLING_ENABLED = originalBillingEnabled
  process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID = originalMonthlyPriceId
  process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID = originalYearlyPriceId
})

describe('billingServer', () => {
  it('maps Stripe price ids to premium plan keys', () => {
    process.env.NEXT_PUBLIC_BILLING_ENABLED = 'true'
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID = 'price_monthly'
    process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID = 'price_yearly'

    expect(getPlanKeyForPriceId('price_monthly')).toBe('premium_monthly')
    expect(getPlanKeyForPriceId('price_yearly')).toBe('premium_yearly')
    expect(getPlanKeyForPriceId('price_unknown')).toBeNull()
  })

  it('treats only active future entitlements as premium access', () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const past = new Date(Date.now() - 60_000).toISOString()

    expect(isEntitlementActive('active', future)).toBe(true)
    expect(isEntitlementActive('trialing', future)).toBe(true)
    expect(isEntitlementActive('active', past)).toBe(false)
    expect(isEntitlementActive('canceled', future)).toBe(false)
    expect(isEntitlementActive(null, future)).toBe(false)
  })
})
