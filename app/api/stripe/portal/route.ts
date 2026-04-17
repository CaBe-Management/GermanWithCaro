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
    const { userId } = await request.json()

    const { data: progress } = await supabaseAdmin
      .from('gwc_progress')
      .select('stripe_customer_id')
      .eq('session_id', userId)
      .single()

    if (!progress?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   progress.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (e) {
    console.error('Stripe portal error:', e)
    return NextResponse.json({ error: 'Could not open billing portal' }, { status: 500 })
  }
}
