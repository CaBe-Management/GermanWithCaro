import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Verify auth
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ status: 'free' })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ status: 'free' })

  // Get sessionId from body (localStorage key used in gwc_user_progress)
  const { sessionId } = await request.json().catch(() => ({}))
  if (!sessionId) return NextResponse.json({ status: 'free' })

  // Service role bypasses RLS — works regardless of session_id format
  const { data } = await supabaseAdmin
    .from('gwc_user_progress')
    .select('subscription_status')
    .eq('session_id', sessionId)
    .single()

  const status = (data?.subscription_status as string) ?? 'free'
  return NextResponse.json({ status })
}
