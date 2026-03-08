import { NextResponse } from 'next/server'
import { getBillingServerConfig, syncCheckoutSession } from '@/lib/billingServer'
import { createClient } from '@/lib/supabase/server'

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

  const body = (await request.json().catch(() => null)) as { sessionId?: string } | null
  const sessionId = body?.sessionId?.trim()

  if (!sessionId) {
    return NextResponse.json({ error: 'missing-session-id' }, { status: 400 })
  }

  try {
    const result = await syncCheckoutSession(sessionId)
    if (result.userId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      isPremium: result.entitlement.isPremium,
      entitlement: result.entitlement,
    })
  } catch (error) {
    console.warn('[billing] checkout session sync failed:', error)
    return NextResponse.json({ error: 'session-sync-failed' }, { status: 500 })
  }
}
