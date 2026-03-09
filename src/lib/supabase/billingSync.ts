import { createClient } from './client'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { isEntitlementActive } from '@/lib/billing'
import { isNative } from '@/lib/platform'

const supabase = createClient()

interface EntitlementRow {
  status: string | null
  current_period_end: string | null
}

export async function syncBillingOnLogin(userId: string) {
  // On native platforms, check RevenueCat first
  if (isNative()) {
    try {
      const { initRevenueCat, loginRevenueCat, checkNativePremiumStatus } = await import(
        '@/lib/nativeBilling'
      )
      await initRevenueCat(userId)
      await loginRevenueCat(userId)
      const isPremium = await checkNativePremiumStatus()
      usePremiumStore.getState().setPremiumEntitlement(isPremium)
      return
    } catch (error) {
      console.warn('[billing-sync] native billing check failed, falling back to DB:', error)
    }
  }

  // Web fallback: check Supabase entitlement table
  if (!supabase) return

  const { data, error } = await supabase
    .from('subscription_entitlements')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[billing-sync] entitlement pull failed:', error.message)
    usePremiumStore.getState().setPremiumEntitlement(false)
    return
  }

  const entitlement = (data as EntitlementRow | null) ?? null
  usePremiumStore
    .getState()
    .setPremiumEntitlement(
      Boolean(entitlement) &&
        isEntitlementActive(entitlement?.status ?? null, entitlement?.current_period_end ?? null),
    )
}
