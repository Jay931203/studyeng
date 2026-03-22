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
  let nativePremium: boolean | null = null

  if (isNative()) {
    try {
      const { initRevenueCat, loginRevenueCat, checkNativePremiumStatus } = await import(
        '@/lib/nativeBilling'
      )
      await initRevenueCat(userId)
      await loginRevenueCat(userId)
      nativePremium = await checkNativePremiumStatus()
    } catch (error) {
      console.warn('[billing-sync] native billing check failed, continuing with DB:', error)
    }
  }

  let entitlement: EntitlementRow | null = null

  if (supabase) {
    const { data, error } = await supabase
      .from('subscription_entitlements')
      .select('status, current_period_end, source')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[billing-sync] entitlement pull failed:', error.message)
    } else {
      entitlement = (data as EntitlementRow | null) ?? null
    }
  }

  const isActive =
    Boolean(entitlement) &&
    isEntitlementActive(entitlement?.status ?? null, entitlement?.current_period_end ?? null)
  const mergedPremium = Boolean(nativePremium) || isActive

  usePremiumStore.getState().setPremiumEntitlement(mergedPremium)

  const localTrialEnd = usePremiumStore.getState().trialEndsAt
  if (
    entitlement?.current_period_end &&
    (entitlement.source === 'trial' || entitlement.status === 'trialing')
  ) {
    const serverTrialEnd = new Date(entitlement.current_period_end).getTime()
    if (localTrialEnd === null || Math.abs(serverTrialEnd - localTrialEnd) > 60_000) {
      usePremiumStore.setState({ trialEndsAt: serverTrialEnd })
    }
  } else if (localTrialEnd !== 1) {
    usePremiumStore.setState({ trialEndsAt: 1 })
  }
}
