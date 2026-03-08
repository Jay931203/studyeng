import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getBillingServerConfig,
  getStripeClient,
  recordProcessedBillingEvent,
  syncCheckoutSession,
  syncSubscriptionFromWebhook,
  wasBillingEventProcessed,
} from '@/lib/billingServer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripe = getStripeClient()
  const config = getBillingServerConfig()

  if (!stripe || !config.webhookSecret) {
    return NextResponse.json({ error: 'billing-disabled' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing-signature' }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret)
  } catch (error) {
    console.warn('[billing] webhook signature verification failed:', error)
    return NextResponse.json({ error: 'invalid-signature' }, { status: 400 })
  }

  if (await wasBillingEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await syncCheckoutSession(session.id)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await syncSubscriptionFromWebhook(subscription)
        break
      }
      default:
        break
    }

    await recordProcessedBillingEvent(event)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.warn('[billing] webhook processing failed:', error)
    return NextResponse.json({ error: 'webhook-processing-failed' }, { status: 500 })
  }
}
