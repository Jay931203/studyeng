import { createClient } from './client'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { isEntitlementActive } from '@/lib/billing'
import { isNative } from '@/lib/platform'

const supabase = createClient()

interface EntitlementRow {
  status: string | null
  current_period_end: string | null
  source: string | null
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
    .select('status, current_period_end, source')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[billing-sync] entitlement pull failed:', error.message)
    usePremiumStore.getState().setPremiumEntitlement(false)
    return
  }

  const entitlement = (data as EntitlementRow | null) ?? null
  const isActive =
    Boolean(entitlement) &&
    isEntitlementActive(entitlement?.status ?? null, entitlement?.current_period_end ?? null)

  usePremiumStore.getState().setPremiumEntitlement(isActive)

  // Restore server-side trial state to prevent trial reset via localStorage clear.
  // If the server has a trial record, use its end date instead of allowing a new local trial.
  if (entitlement?.current_period_end) {
    const serverTrialEnd = new Date(entitlement.current_period_end).getTime()
    const localTrialEnd = usePremiumStore.getState().trialEndsAt

    if (entitlement.source === 'trial' || entitlement.status === 'trialing') {
      // Server has a trial record — always use server truth
      if (localTrialEnd === null || Math.abs(serverTrialEnd - localTrialEnd) > 60_000) {
        usePremiumStore.setState({ trialEndsAt: serverTrialEnd })
      }
    } else if (!localTrialEnd) {
      // User had a paid subscription that expired — they already used their trial
      // Set trialEndsAt to a past date to prevent re-trial
      usePremiumStore.setState({ trialEndsAt: 1 })
    }
  }
}
