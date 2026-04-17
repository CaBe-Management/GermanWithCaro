import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: progress } = await supabaseAdmin
      .from('gwc_progress')
      .select('stripe_customer_id')
      .eq('session_id', userId)
      .single()

    let customerId = progress?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } })
      customerId = customer.id
      await supabaseAdmin
        .from('gwc_progress')
        .update({ stripe_customer_id: customerId })
        .eq('session_id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscribed=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?canceled=1`,
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 })
  }
}
