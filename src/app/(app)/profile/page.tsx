// Profile settings page — server component that fetches data, then renders the client form
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileSettings from '@/components/ui/ProfileSettings'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Pass the profile data to the client component for interactivity
  return <ProfileSettings profile={profile} />
}
