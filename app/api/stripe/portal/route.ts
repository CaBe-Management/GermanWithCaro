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
    // Verify JWT — don't trust userId from request body
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id
    const body = await request.json().catch(() => ({}))
    const sessionId: string = body.sessionId || userId

    // Try localStorage session_id first, fall back to auth.uid()
    let progress = null
    const { data: p1 } = await supabaseAdmin
      .from('gwc_user_progress')
      .select('stripe_customer_id')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (p1?.stripe_customer_id) {
      progress = p1
    } else {
      const { data: p2 } = await supabaseAdmin
        .from('gwc_user_progress')
        .select('stripe_customer_id')
        .eq('session_id', userId)
        .maybeSingle()
      progress = p2
    }

    if (!progress?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   progress.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://germanwithcaro.app'}/subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (e) {
    console.error('Stripe portal error:', e)
    return NextResponse.json({ error: 'Could not open billing portal' }, { status: 500 })
  }
}
