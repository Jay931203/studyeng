import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

interface PremiumCodeRow {
  id: string
  code: string
  plan_key: string
  duration_days: number
  redeemed_by: string | null
  redeemed_at: string | null
  expires_at: string | null
  memo: string | null
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

  const body = (await request.json().catch(() => null)) as { code?: string } | null
  const code = body?.code?.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ error: 'missing-code' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }

  // Look up the code
  const { data: codeRow, error: lookupError } = (await admin
    .from('premium_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()) as { data: PremiumCodeRow | null; error: { message: string } | null }

  if (lookupError || !codeRow) {
    return NextResponse.json({ error: 'invalid-code' }, { status: 404 })
  }

  if (codeRow.redeemed_by) {
    return NextResponse.json({ error: 'already-redeemed' }, { status: 409 })
  }

  if (codeRow.expires_at && new Date(codeRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'code-expired' }, { status: 410 })
  }

  // Calculate subscription period
  const now = new Date()
  const periodEnd = new Date(now.getTime() + codeRow.duration_days * 24 * 60 * 60 * 1000)

  // Mark code as redeemed
  const { error: redeemError } = await admin
    .from('premium_codes')
    .update({
      redeemed_by: user.id,
      redeemed_at: now.toISOString(),
    } as never)
    .eq('id', codeRow.id)

  if (redeemError) {
    console.warn('[billing] code redeem update failed:', redeemError.message)
    return NextResponse.json({ error: 'redeem-failed' }, { status: 500 })
  }

  // Upsert entitlement
  const { error: entitlementError } = await admin
    .from('subscription_entitlements')
    .upsert(
      {
        user_id: user.id,
        plan_key: codeRow.plan_key,
        status: 'active',
        source: 'code',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: true,
        updated_at: now.toISOString(),
      } as never,
      { onConflict: 'user_id' },
    )

  if (entitlementError) {
    console.warn('[billing] entitlement upsert failed:', entitlementError.message)
    return NextResponse.json({ error: 'entitlement-failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    planKey: codeRow.plan_key,
    durationDays: codeRow.duration_days,
    periodEnd: periodEnd.toISOString(),
  })
}
