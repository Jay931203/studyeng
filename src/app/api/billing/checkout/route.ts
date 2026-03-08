import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createCheckoutSession,
  getBillingServerConfig,
  type BillingPlan,
} from '@/lib/billingServer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const config = getBillingServerConfig()
  if (!config.enabled) {
    return NextResponse.json({ error: 'billing-disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'auth-unavailable' }, { status: 503 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | { plan?: BillingPlan; returnPath?: string | null }
    | null
  const plan = body?.plan

  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'invalid-plan' }, { status: 400 })
  }

  try {
    const origin = new URL(request.url).origin
    const url = await createCheckoutSession(
      user.id,
      user.email,
      plan,
      origin,
      body?.returnPath ?? null,
    )
    return NextResponse.json({ url })
  } catch (error) {
    console.warn('[billing] checkout session create failed:', error)
    return NextResponse.json({ error: 'checkout-failed' }, { status: 500 })
  }
}
