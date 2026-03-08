const PLACEHOLDER_PREFIXES = ['your_', 'YOUR_']

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
