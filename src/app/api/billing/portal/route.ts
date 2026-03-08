import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession, getBillingServerConfig } from '@/lib/billingServer'

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

  try {
    const origin = new URL(request.url).origin
    const url = await createPortalSession(user.id, origin)
    return NextResponse.json({ url })
  } catch (error) {
    console.warn('[billing] portal session create failed:', error)
    return NextResponse.json({ error: 'portal-failed' }, { status: 500 })
  }
}
