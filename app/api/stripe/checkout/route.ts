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
    // Verify the caller's JWT — don't trust userId from the request body
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id
    const email  = user.email!

    // Get or create Stripe customer
    const { data: progress } = await supabaseAdmin
      .from('gwc_user_progress')
      .select('stripe_customer_id')
      .eq('session_id', userId)
      .single()

    let customerId = progress?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } })
      customerId = customer.id
      await supabaseAdmin
        .from('gwc_user_progress')
        .update({ stripe_customer_id: customerId })
        .eq('session_id', userId)
    }

    // Strip accidental whitespace/newlines from env var, fall back to request origin
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '')
      || (request.headers.get('origin') ?? '').trim()
      || 'https://germanwithcaro.app'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?subscribed=1`,
      cancel_url:  `${baseUrl}/upgrade?canceled=1`,
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 })
  }
}
