const PLACEHOLDER_PREFIXES = ['your_', 'YOUR_']
const ACTIVE_ENTITLEMENT_STATUSES = new Set(['active', 'trialing'])

export type BillingPlan = 'monthly' | 'yearly'
export type PremiumPlanKey = 'premium_monthly' | 'premium_yearly'

export function hasPlaceholderValue(value: string | undefined) {
  if (!value) return true

  const trimmed = value.trim()
  if (!trimmed) return true

  return PLACEHOLDER_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
}

export function isValidHttpUrl(value: string | undefined) {
  if (!value || hasPlaceholderValue(value)) return false

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function getBillingConfig() {
  const enabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true'
  const devPremiumOverrideEnabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_PREMIUM_OVERRIDE === 'true'

  return {
    enabled,
    devPremiumOverrideEnabled,
  }
}

export function isBillingEnabled() {
  return getBillingConfig().enabled
}

export function isPremiumEnforcementEnabled() {
  return isBillingEnabled()
}

export function canUseDevPremiumOverride() {
  return getBillingConfig().devPremiumOverrideEnabled
}

export function isEntitlementActive(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
) {
  if (!status || !ACTIVE_ENTITLEMENT_STATUSES.has(status)) {
    return false
  }

  if (!currentPeriodEnd) {
    return true
  }

  return new Date(currentPeriodEnd).getTime() > Date.now()
}
