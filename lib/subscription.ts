import { supabase } from './supabase'

/** Returns the subscription_status for the current logged-in user, or null if not logged in. */
export async function getSubscriptionStatus(): Promise<'free' | 'active' | 'canceled' | 'past_due' | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // gwc_user_progress rows are keyed by localStorage session_id, not auth.uid().
  // We use a server-side API with service role to bypass RLS.
  const sessionId = typeof window !== 'undefined'
    ? (localStorage.getItem('gwc_session_id') ?? user.id)
    : user.id

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return 'free'

  try {
    const res = await fetch('/api/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ sessionId }),
    })
    const json = await res.json()
    return (json.status as 'free' | 'active' | 'canceled' | 'past_due') ?? 'free'
  } catch {
    return 'free'
  }
}

export function isPro(status: string | null): boolean {
  return status === 'active'
}
