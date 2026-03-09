import { NextResponse } from 'next/server'
import {
  getBillingServerConfig,
  getEntitlementSnapshot,
  getPaymentMethodSummary,
} from '@/lib/billingServer'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const billingConfig = getBillingServerConfig()
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.json({
      enabled: billingConfig.enabled,
      isPremium: false,
      entitlement: null,
    })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      enabled: billingConfig.enabled,
      isPremium: false,
      entitlement: null,
    })
  }

  const entitlement = await getEntitlementSnapshot(user.id)
  const paymentMethod = entitlement
    ? await getPaymentMethodSummary(
        entitlement.stripeCustomerId,
        entitlement.stripeSubscriptionId,
      )
    : null

  return NextResponse.json({
    enabled: billingConfig.enabled,
    isPremium: entitlement?.isPremium ?? false,
    entitlement,
    paymentMethod,
  })
}
