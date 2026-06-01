import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type Stripe from 'stripe'

type DbStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete'

function mapStatus(stripeStatus: string): DbStatus {
  switch (stripeStatus) {
    case 'active':   return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'canceled': return 'cancelled'  // Stripe uses one 'l', our schema uses two
    default:         return 'incomplete'
  }
}

function periodDates(sub: Stripe.Subscription) {
  const item = sub.items.data[0]
  return {
    current_period_start: item ? new Date(item.current_period_start * 1000).toISOString() : null,
    current_period_end:   item ? new Date(item.current_period_end   * 1000).toISOString() : null,
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { err }, 'webhook')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        if (!userId) { logger.warn('checkout.session.completed missing userId metadata', {}, 'webhook'); break }

        const stripeCustomerId = session.customer as string
        const stripeSubId = session.subscription as string

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
          expand: ['items'],
        })
        const { current_period_start, current_period_end } = periodDates(stripeSub)

        await admin.from('subscriptions').upsert({
          user_id: userId,
          plan: 'pro',
          status: mapStatus(stripeSub.status),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubId,
          current_period_start,
          current_period_end,
        }, { onConflict: 'user_id' })

        logger.info('Subscription activated', { userId, stripeSubId }, 'webhook')
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) { logger.warn('subscription.updated missing userId metadata', {}, 'webhook'); break }

        const status = mapStatus(sub.status)
        const plan = status === 'active' || status === 'trialing' ? 'pro' : 'free'
        const { current_period_start, current_period_end } = periodDates(sub)

        await admin.from('subscriptions').upsert({
          user_id: userId,
          plan,
          status,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          current_period_start,
          current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        }, { onConflict: 'user_id' })

        logger.info('Subscription updated', { userId, status, plan }, 'webhook')
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) { logger.warn('subscription.deleted missing userId metadata', {}, 'webhook'); break }

        await admin.from('subscriptions').upsert({
          user_id: userId,
          plan: 'free',
          status: 'cancelled',
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          cancelled_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        logger.info('Subscription cancelled — downgraded to free', { userId }, 'webhook')
        break
      }

      default:
        logger.debug('Unhandled Stripe event', { type: event.type }, 'webhook')
    }
  } catch (err) {
    logger.error('Error handling Stripe webhook', err, 'webhook')
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
