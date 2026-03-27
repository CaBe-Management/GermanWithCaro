// Auth layout — wraps login and signup pages
// If the user is already logged in, redirect them to the dashboard
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in — send them to the dashboard instead
  if (user) redirect('/dashboard')

  return <>{children}</>
}
