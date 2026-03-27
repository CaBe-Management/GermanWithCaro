// POST /api/stripe/checkout
// Creates a Stripe Checkout Session so the user can subscribe
// Returns { url } — the frontend redirects the user to this Stripe-hosted page
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    // Get the logged-in user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch the user's profile to check if they already have a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // If no Stripe customer exists yet, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Save the Stripe customer ID to the profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create the Checkout Session — this generates the payment page
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      // Where to send the user after payment
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe?cancelled=true`,
      metadata: { supabase_user_id: user.id },
    })

    // Return the Stripe checkout URL
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
