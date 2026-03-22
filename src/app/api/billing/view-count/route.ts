import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { createViewToken, verifyViewToken, VIEW_LIMIT } from '@/lib/viewCountToken'

export const runtime = 'nodejs'

/**
 * POST /api/billing/view-count
 *
 * Server-side daily view counter for free users.
 * Uses a signed token to track count without needing a DB table.
 *
 * Body: { token?: string }
 * Returns: { canView, count, limit, token, serverEnforced, premium? }
 */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  if (!supabase) {
    // Supabase not configured — fall back to client-side enforcement
    return NextResponse.json({ canView: true, count: 0, serverEnforced: false })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Anonymous users: no server enforcement (client-side only)
    return NextResponse.json({ canView: true, count: 0, serverEnforced: false })
  }

  // Check premium status via entitlement
  const { data: ent } = await supabase
    .from('subscription_entitlements')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPremium =
    ent &&
    ent.status &&
    ['active', 'trialing'].includes(ent.status) &&
    (!ent.current_period_end || new Date(ent.current_period_end).getTime() > Date.now())

  if (isPremium) {
    return NextResponse.json({
      canView: true,
      count: 0,
      limit: VIEW_LIMIT,
      serverEnforced: true,
      premium: true,
    })
  }

  // Free user: verify and increment the signed token
  const today = new Date().toISOString().slice(0, 10)

  let body: { token?: string } = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }

  let count = 0
  if (body.token) {
    const verified = verifyViewToken(body.token, user.id, today)
    if (verified !== null) {
      count = verified
    }
    // If token is invalid (e.g. tampered or from different day), count stays 0
  }

  count++
  const canView = count <= VIEW_LIMIT
  const newToken = createViewToken(user.id, today, count)

  return NextResponse.json({
    canView,
    count,
    limit: VIEW_LIMIT,
    token: newToken,
    serverEnforced: true,
  })
}

/**
 * GET /api/billing/view-count
 *
 * Returns current view count status without incrementing.
 * Body param `token` is passed as query param.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ canView: true, count: 0, serverEnforced: false })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ canView: true, count: 0, serverEnforced: false })
  }

  const { data: ent } = await supabase
    .from('subscription_entitlements')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPremium =
    ent &&
    ent.status &&
    ['active', 'trialing'].includes(ent.status) &&
    (!ent.current_period_end || new Date(ent.current_period_end).getTime() > Date.now())

  if (isPremium) {
    return NextResponse.json({
      canView: true,
      count: 0,
      limit: VIEW_LIMIT,
      serverEnforced: true,
      premium: true,
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  let count = 0
  if (token) {
    const verified = verifyViewToken(token, user.id, today)
    if (verified !== null) {
      count = verified
    }
  }

  return NextResponse.json({
    canView: count < VIEW_LIMIT,
    count,
    limit: VIEW_LIMIT,
    serverEnforced: true,
  })
}
