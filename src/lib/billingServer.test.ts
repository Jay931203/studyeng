import { afterEach, describe, expect, it } from 'vitest'
import { isEntitlementActive } from '@/lib/billing'
import { getBillingServerConfig, getPlanKeyForPriceId } from '@/lib/billingServer'

const originalBillingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY
const originalStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const originalMonthlyPriceId = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
const originalYearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID

afterEach(() => {
  process.env.NEXT_PUBLIC_BILLING_ENABLED = originalBillingEnabled
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey
  process.env.STRIPE_SECRET_KEY = originalStripeSecretKey
  process.env.STRIPE_WEBHOOK_SECRET = originalStripeWebhookSecret
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

  it('requires Stripe, webhook, and Supabase admin config before enabling checkout', () => {
    process.env.NEXT_PUBLIC_BILLING_ENABLED = 'true'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID = 'price_monthly'
    process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID = 'price_yearly'

    expect(getBillingServerConfig().enabled).toBe(true)

    delete process.env.STRIPE_WEBHOOK_SECRET
    expect(getBillingServerConfig().enabled).toBe(false)

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(getBillingServerConfig().enabled).toBe(false)
  })
})
