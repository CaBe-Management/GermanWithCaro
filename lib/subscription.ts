import { supabase } from './supabase'

/** Returns the subscription_status for the current logged-in user, or null if not logged in. */
export async function getSubscriptionStatus(): Promise<'free' | 'active' | 'canceled' | 'past_due' | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // gwc_user_progress rows are keyed by the localStorage session_id, not auth.uid()
  const sessionId = typeof window !== 'undefined'
    ? (localStorage.getItem('gwc_session_id') ?? user.id)
    : user.id

  const { data } = await supabase
    .from('gwc_user_progress')
    .select('subscription_status')
    .eq('session_id', sessionId)
    .single()

  return (data?.subscription_status as 'free' | 'active' | 'canceled' | 'past_due') ?? 'free'
}

export function isPro(status: string | null): boolean {
  return status === 'active'
}
