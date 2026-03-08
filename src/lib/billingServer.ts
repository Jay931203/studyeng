import Stripe from 'stripe'
import { hasPlaceholderValue, isBillingEnabled } from '@/lib/billing'
import { sanitizeAppPath } from '@/lib/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const ACTIVE_ENTITLEMENT_STATUSES = new Set(['active', 'trialing'])

export type BillingPlan = 'monthly' | 'yearly'
export type PremiumPlanKey = 'premium_monthly' | 'premium_yearly'

interface BillingCustomerRow {
  user_id: string
  stripe_customer_id: string
  email: string | null
}

interface BillingSubscriptionRow {
  stripe_subscription_id: string
  user_id: string
  stripe_customer_id: string
  status: string
  plan_key: PremiumPlanKey
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

interface EntitlementSnapshot {
  isPremium: boolean
  planKey: PremiumPlanKey | 'free'
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

let stripeClient: Stripe | null = null

export function getBillingServerConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  const monthlyPriceId = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID?.trim()
  const yearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID?.trim()

  return {
    secretKey,
    webhookSecret,
    monthlyPriceId,
    yearlyPriceId,
    enabled:
      isBillingEnabled() &&
      !hasPlaceholderValue(secretKey) &&
      !hasPlaceholderValue(monthlyPriceId) &&
      !hasPlaceholderValue(yearlyPriceId),
  }
}

export function getStripeClient() {
  const { secretKey, enabled } = getBillingServerConfig()

  if (!enabled || !secretKey) {
    return null
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}

export function isEntitlementActive(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
) {
  if (!status || !ACTIVE_ENTITLEMENT_STATUSES.has(status)) {
    return false
  }

  if (!currentPeriodEnd) {
    return true
  }

  return new Date(currentPeriodEnd).getTime() > Date.now()
}

export function getPriceIdForPlan(plan: BillingPlan) {
  const config = getBillingServerConfig()
  return plan === 'monthly' ? config.monthlyPriceId ?? null : config.yearlyPriceId ?? null
}

export function getPlanKeyForPriceId(priceId: string): PremiumPlanKey | null {
  const config = getBillingServerConfig()

  if (config.monthlyPriceId === priceId) return 'premium_monthly'
  if (config.yearlyPriceId === priceId) return 'premium_yearly'

  return null
}

function toIsoDate(epochSeconds: number | null | undefined) {
  if (!epochSeconds) return null
  return new Date(epochSeconds * 1000).toISOString()
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number')

  if (itemPeriodEnds.length === 0) {
    return null
  }

  return Math.max(...itemPeriodEnds)
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
) {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

function getCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
) {
  if (!customer || typeof customer === 'string' || ('deleted' in customer && customer.deleted)) {
    return null
  }

  return customer.email ?? null
}

async function getBillingCustomerByUserId(userId: string) {
  const admin = createAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('billing_customers')
    .select('user_id, stripe_customer_id, email')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[billing] billing_customers lookup by user failed:', error.message)
    return null
  }

  return (data as BillingCustomerRow | null) ?? null
}

async function getBillingCustomerByStripeCustomerId(stripeCustomerId: string) {
  const admin = createAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('billing_customers')
    .select('user_id, stripe_customer_id, email')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  if (error) {
    console.warn('[billing] billing_customers lookup by customer failed:', error.message)
    return null
  }

  return (data as BillingCustomerRow | null) ?? null
}

async function upsertBillingCustomer(userId: string, stripeCustomerId: string, email?: string | null) {
  const admin = createAdminClient()
  if (!admin) return

  const row = {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      email: email ?? null,
      updated_at: new Date().toISOString(),
    } as never

  const { error } = await admin.from('billing_customers').upsert(row, {
    onConflict: 'user_id',
  })

  if (error) {
    console.warn('[billing] billing_customers upsert failed:', error.message)
  }
}

async function ensureStripeCustomer(userId: string, email?: string | null) {
  const existing = await getBillingCustomerByUserId(userId)
  if (existing) {
    return existing
  }

  const stripe = getStripeClient()
  if (!stripe) return null

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: {
      user_id: userId,
    },
  })

  await upsertBillingCustomer(userId, customer.id, customer.email ?? email ?? null)

  return {
    user_id: userId,
    stripe_customer_id: customer.id,
    email: customer.email ?? email ?? null,
  } satisfies BillingCustomerRow
}

function getUserIdFromSubscription(subscription: Stripe.Subscription) {
  return subscription.metadata.user_id || null
}

async function resolveUserIdForSubscription(subscription: Stripe.Subscription) {
  const metadataUserId = getUserIdFromSubscription(subscription)
  if (metadataUserId) {
    return metadataUserId
  }

  const customerId = getCustomerId(subscription.customer)
  if (!customerId) return null

  const customer = await getBillingCustomerByStripeCustomerId(customerId)
  return customer?.user_id ?? null
}

async function upsertBillingSubscription(userId: string, subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  if (!admin) return

  const customerId = getCustomerId(subscription.customer)
  const priceId = subscription.items.data[0]?.price.id
  const planKey = priceId ? getPlanKeyForPriceId(priceId) : null

  if (!customerId || !priceId || !planKey) {
    console.warn('[billing] subscription is missing customer or price mapping:', subscription.id)
    return
  }

  const row = {
      stripe_subscription_id: subscription.id,
      user_id: userId,
      stripe_customer_id: customerId,
      status: subscription.status,
      plan_key: planKey,
      price_id: priceId,
      current_period_end: toIsoDate(getSubscriptionCurrentPeriodEnd(subscription)),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: toIsoDate(subscription.canceled_at),
      raw_subscription: subscription,
      updated_at: new Date().toISOString(),
    } as never

  const { error } = await admin.from('billing_subscriptions').upsert(row, {
    onConflict: 'stripe_subscription_id',
  })

  if (error) {
    console.warn('[billing] billing_subscriptions upsert failed:', error.message)
  }
}

async function reconcileEntitlement(userId: string) {
  const admin = createAdminClient()
  if (!admin) {
    return {
      isPremium: false,
      planKey: 'free',
      status: 'inactive',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    } satisfies EntitlementSnapshot
  }

  const { data, error } = await admin
    .from('billing_subscriptions')
    .select(
      'stripe_subscription_id, user_id, stripe_customer_id, status, plan_key, current_period_end, cancel_at_period_end',
    )
    .eq('user_id', userId)
    .order('current_period_end', { ascending: false })

  if (error) {
    console.warn('[billing] billing_subscriptions entitlement reconciliation failed:', error.message)
  }

  const activeSubscription =
    ((data ?? []) as BillingSubscriptionRow[]).find((row) =>
      isEntitlementActive(row.status, row.current_period_end),
    ) ?? null

  const entitlement: EntitlementSnapshot = activeSubscription
    ? {
        isPremium: true,
        planKey: activeSubscription.plan_key,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.current_period_end,
        cancelAtPeriodEnd: Boolean(activeSubscription.cancel_at_period_end),
        stripeCustomerId: activeSubscription.stripe_customer_id,
        stripeSubscriptionId: activeSubscription.stripe_subscription_id,
      }
    : {
        isPremium: false,
        planKey: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      }

  const row = {
      user_id: userId,
      plan_key: entitlement.planKey,
      status: entitlement.status,
      source: 'stripe',
      stripe_customer_id: entitlement.stripeCustomerId,
      stripe_subscription_id: entitlement.stripeSubscriptionId,
      current_period_end: entitlement.currentPeriodEnd,
      cancel_at_period_end: entitlement.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    } as never

  const { error: entitlementError } = await admin
    .from('subscription_entitlements')
    .upsert(row, { onConflict: 'user_id' })

  if (entitlementError) {
    console.warn('[billing] subscription_entitlements upsert failed:', entitlementError.message)
  }

  return entitlement
}

export async function getEntitlementSnapshot(userId: string) {
  const admin = createAdminClient()
  if (!admin) return null

  const { data: rawData, error } = await admin
    .from('subscription_entitlements')
    .select(
      'plan_key, status, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[billing] subscription_entitlements lookup failed:', error.message)
    return null
  }

  const data = (rawData as {
    plan_key: string | null
    status: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
  } | null) ?? null

  if (!data) {
    return {
      isPremium: false,
      planKey: 'free',
      status: 'inactive',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    } satisfies EntitlementSnapshot
  }

  return {
    isPremium: isEntitlementActive(data.status, data.current_period_end),
    planKey: (data.plan_key as PremiumPlanKey | 'free') ?? 'free',
    status: data.status ?? 'inactive',
    currentPeriodEnd: data.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
  } satisfies EntitlementSnapshot
}

export async function createCheckoutSession(
  userId: string,
  email: string | null | undefined,
  plan: BillingPlan,
  origin: string,
  returnPath?: string | null,
) {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('billing-disabled')
  }

  const priceId = getPriceIdForPlan(plan)
  if (!priceId) {
    throw new Error('billing-plan-missing')
  }

  const customer = await ensureStripeCustomer(userId, email)
  if (!customer) {
    throw new Error('billing-customer-failed')
  }

  const safeReturnPath = sanitizeAppPath(returnPath, '/profile')
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.stripe_customer_id,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&next=${encodeURIComponent(safeReturnPath)}`,
    cancel_url: `${origin}/billing/cancel?next=${encodeURIComponent(safeReturnPath)}`,
    metadata: {
      user_id: userId,
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan,
      },
    },
  })

  if (!session.url) {
    throw new Error('billing-session-url-missing')
  }

  return session.url
}

export async function createPortalSession(userId: string, origin: string) {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('billing-disabled')
  }

  const customer = await getBillingCustomerByUserId(userId)
  if (!customer) {
    throw new Error('billing-customer-missing')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${origin}/profile`,
  })

  return session.url
}

export async function syncCheckoutSession(sessionId: string) {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('billing-disabled')
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['customer', 'subscription'],
  })

  const subscription = session.subscription
  if (!subscription || typeof subscription === 'string') {
    throw new Error('billing-subscription-missing')
  }

  const userId =
    session.client_reference_id ??
    session.metadata?.user_id ??
    getUserIdFromSubscription(subscription)

  if (!userId) {
    throw new Error('billing-user-missing')
  }

  const customerId = getCustomerId(session.customer)
  if (!customerId) {
    throw new Error('billing-customer-missing')
  }

  await upsertBillingCustomer(userId, customerId, getCustomerEmail(session.customer))
  await upsertBillingSubscription(userId, subscription)

  return {
    userId,
    entitlement: await reconcileEntitlement(userId),
  }
}

export async function syncSubscriptionFromWebhook(subscription: Stripe.Subscription) {
  const userId = await resolveUserIdForSubscription(subscription)
  if (!userId) {
    throw new Error(`billing-user-missing:${subscription.id}`)
  }

  const customerId = getCustomerId(subscription.customer)
  if (customerId) {
    await upsertBillingCustomer(userId, customerId)
  }

  await upsertBillingSubscription(userId, subscription)

  return {
    userId,
    entitlement: await reconcileEntitlement(userId),
  }
}

export async function wasBillingEventProcessed(eventId: string) {
  const admin = createAdminClient()
  if (!admin) return false

  const { data, error } = await admin
    .from('billing_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', eventId)
    .maybeSingle()

  if (error) {
    console.warn('[billing] billing_events lookup failed:', error.message)
    return false
  }

  return Boolean(data)
}

export async function recordProcessedBillingEvent(event: Stripe.Event) {
  const admin = createAdminClient()
  if (!admin) return

  const row = {
      stripe_event_id: event.id,
      event_type: event.type,
      livemode: event.livemode,
      payload: event,
    } as never

  const { error } = await admin.from('billing_events').upsert(row, {
    onConflict: 'stripe_event_id',
  })

  if (error) {
    console.warn('[billing] billing_events upsert failed:', error.message)
  }
}
