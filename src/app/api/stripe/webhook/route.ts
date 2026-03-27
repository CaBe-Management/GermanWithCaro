// POST /api/stripe/webhook
// Stripe sends events here when a subscription changes (created, updated, cancelled)
// We use these events to update the user's subscription_status in the profiles table
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use the service role key to bypass RLS — this is a server-to-server call
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  // Read the raw body (Stripe needs this for signature verification)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  // Verify the webhook signature to make sure it really came from Stripe
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Handle the different event types
  switch (event.type) {
    // User just completed checkout and subscribed
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id

      if (userId && session.subscription) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId)
      }
      break
    }

    // Subscription was updated (e.g. renewed, payment method changed)
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Map Stripe status to our simpler status
      let status: 'active' | 'inactive' | 'trialing' = 'inactive'
      if (subscription.status === 'active') status = 'active'
      else if (subscription.status === 'trialing') status = 'trialing'

      await supabase
        .from('profiles')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', customerId)
      break
    }

    // Subscription was cancelled
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'inactive',
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  // Always return 200 so Stripe knows we received the event
  return NextResponse.json({ received: true })
}
