import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { VIEW_LIMIT } from '@/lib/viewCountToken'

export const runtime = 'nodejs'

function unavailable(error: string, status = 503) {
  return NextResponse.json({ error }, { status })
}

function isPremiumEntitlement(
  ent:
    | {
        status: string | null
        current_period_end: string | null
      }
    | null,
) {
  return (
    ent !== null &&
    ent.status !== null &&
    ['active', 'trialing'].includes(ent.status) &&
    (!ent.current_period_end || new Date(ent.current_period_end).getTime() > Date.now())
  )
}

/**
 * POST /api/billing/view-count
 *
 * Server-side daily view counter for free users.
 * Uses the profiles table + an atomic RPC, so free limits are authoritative.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 30, 60_000)) {
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

  const { data: ent, error: entError } = await supabase
    .from('subscription_entitlements')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (entError) {
    return unavailable('billing-unavailable')
  }

  if (isPremiumEntitlement(ent)) {
    return NextResponse.json({
      canView: true,
      count: 0,
      limit: VIEW_LIMIT,
      serverEnforced: true,
      premium: true,
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data: claim, error: claimError } = await supabase.rpc('claim_daily_view', {
    p_user_id: user.id,
    p_today: today,
    p_limit: VIEW_LIMIT,
  })

  if (claimError) {
    return unavailable('view-count-unavailable')
  }

  const result = Array.isArray(claim) ? claim[0] : claim
  const count = typeof result?.count === 'number' ? result.count : VIEW_LIMIT
  const canView = result?.can_view === true

  return NextResponse.json({
    canView,
    count,
    limit: VIEW_LIMIT,
    serverEnforced: true,
  })
}

/**
 * GET /api/billing/view-count
 *
 * Returns current view count status without incrementing.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 30, 60_000)) {
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

  const { data: ent, error: entError } = await supabase
    .from('subscription_entitlements')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (entError) {
    return unavailable('billing-unavailable')
  }

  if (isPremiumEntitlement(ent)) {
    return NextResponse.json({
      canView: true,
      count: 0,
      limit: VIEW_LIMIT,
      serverEnforced: true,
      premium: true,
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('daily_view_count, daily_view_date')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return unavailable('billing-unavailable')
  }

  const currentCount =
    profile && (profile as { daily_view_count?: number | null; daily_view_date?: string | null })
      .daily_view_date === today
      ? Math.max(
          0,
          (profile as { daily_view_count?: number | null }).daily_view_count ?? 0,
        )
      : 0

  return NextResponse.json({
    canView: currentCount < VIEW_LIMIT,
    count: currentCount,
    limit: VIEW_LIMIT,
    serverEnforced: true,
  })
}
