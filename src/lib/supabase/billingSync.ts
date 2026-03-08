import { createClient } from './client'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { isEntitlementActive } from '@/lib/billingServer'

const supabase = createClient()

interface EntitlementRow {
  status: string | null
  current_period_end: string | null
}

export async function syncBillingOnLogin(userId: string) {
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
