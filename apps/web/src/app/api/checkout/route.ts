import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getSubscription } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await getSubscription(user.id)
  if (existing?.stripe_customer_id) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: existing.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })
    return NextResponse.json({ url: portal.url })
  }

  const body = await request.json().catch(() => ({}))
  const interval: 'monthly' | 'annual' = body.interval === 'annual' ? 'annual' : 'monthly'

  const priceId = interval === 'annual'
    ? process.env.STRIPE_PRO_PRICE_ID_ANNUAL!
    : process.env.STRIPE_PRO_PRICE_ID_MONTHLY!

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
  })

  return NextResponse.json({ url: session.url })
}
