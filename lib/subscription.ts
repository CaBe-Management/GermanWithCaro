import { supabase } from './supabase'

/** Returns the subscription_status for the current logged-in user, or null if not logged in. */
export async function getSubscriptionStatus(): Promise<'free' | 'active' | 'canceled' | 'past_due' | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('gwc_user_progress')
    .select('subscription_status')
    .eq('session_id', user.id)
    .single()

  return (data?.subscription_status as 'free' | 'active' | 'canceled' | 'past_due') ?? 'free'
}

export function isPro(status: string | null): boolean {
  return status === 'active'
}
