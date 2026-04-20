import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const sub = event.data.object as Stripe.Subscription
  const session = event.data.object as Stripe.Checkout.Session

  switch (event.type) {

    case 'checkout.session.completed': {
      // sessionId is the localStorage progress key; fall back to auth userId
      const sessionId = session.metadata?.sessionId || session.metadata?.userId
      if (!sessionId) break
      await supabaseAdmin
        .from('gwc_user_progress')
        .update({
          stripe_subscription_id: session.subscription as string,
          subscription_status:    'active',
        })
        .eq('session_id', sessionId)
      break
    }

    case 'customer.subscription.updated': {
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled'
      await supabaseAdmin
        .from('gwc_user_progress')
        .update({ subscription_status: status })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      await supabaseAdmin
        .from('gwc_user_progress')
        .update({ subscription_status: 'canceled', stripe_subscription_id: null })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      if (invoice.subscription) {
        await supabaseAdmin
          .from('gwc_user_progress')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
