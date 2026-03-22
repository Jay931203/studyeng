import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000

interface TrialEntitlementRow {
  status: string | null
  source: string | null
  current_period_end: string | null
}

function normalizeTrialEntitlement(row: unknown): TrialEntitlementRow | null {
  if (!row || typeof row !== 'object') return null

  const value = row as Record<string, unknown>
  return {
    status: typeof value.status === 'string' ? value.status : null,
    source: typeof value.source === 'string' ? value.source : null,
    current_period_end:
      typeof value.current_period_end === 'string' ? value.current_period_end : null,
  }
}

function unavailable(error: string, status = 503) {
  return NextResponse.json({ error }, { status })
}

/**
 * POST /api/billing/init-trial
 *
 * Server-side trial initialization for authenticated users.
 * Prevents trial reset by storing the trial start in subscription_entitlements.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  if (!supabase) {
    return unavailable('billing-unavailable')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return unavailable('auth-unavailable')
  }

  if (!user) {
    return unavailable('unauthorized', 401)
  }

  const admin = createAdminClient()
  if (!admin) {
    return unavailable('billing-unavailable')
  }

  const { data: existingRaw, error: lookupError } = await admin
    .from('subscription_entitlements')
    .select('status, source, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupError) {
    console.warn('[billing] init-trial lookup failed:', lookupError.message)
    return unavailable('billing-unavailable')
  }

  const existing = normalizeTrialEntitlement(existingRaw)

  if (existing) {
    const periodEnd = existing.current_period_end
      ? new Date(existing.current_period_end).getTime()
      : null

    return NextResponse.json({
      trialEndsAt: periodEnd,
      alreadyExists: true,
      status: existing.status,
      source: existing.source,
      serverEnforced: true,
    })
  }

  const trialEnd = new Date(Date.now() + TRIAL_DURATION_MS)

  const { error: upsertError } = await admin
    .from('subscription_entitlements')
    .upsert(
      {
        user_id: user.id,
        plan_key: 'free',
        status: 'trialing',
        source: 'trial',
        current_period_end: trialEnd.toISOString(),
        cancel_at_period_end: false,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'user_id' },
    )

  if (upsertError) {
    console.warn('[billing] init-trial upsert failed:', upsertError.message)
    return unavailable('billing-unavailable')
  }

  return NextResponse.json({
    trialEndsAt: trialEnd.getTime(),
    alreadyExists: false,
    status: 'trialing',
    source: 'trial',
    serverEnforced: true,
  })
}

/**
 * GET /api/billing/init-trial
 *
 * Check trial status without creating one.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  if (!supabase) {
    return unavailable('billing-unavailable')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return unavailable('auth-unavailable')
  }

  if (!user) {
    return unavailable('unauthorized', 401)
  }

  const { data: existingRaw, error: lookupError } = await supabase
    .from('subscription_entitlements')
    .select('status, source, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupError) {
    return unavailable('billing-unavailable')
  }

  const existing = normalizeTrialEntitlement(existingRaw)

  if (!existing) {
    return NextResponse.json({ trialEndsAt: null, serverEnforced: true })
  }

  const periodEnd = existing.current_period_end
    ? new Date(existing.current_period_end).getTime()
    : null

  return NextResponse.json({
    trialEndsAt: periodEnd,
    status: existing.status,
    source: existing.source,
    serverEnforced: true,
  })
}
