// App layout — wraps all protected pages (dashboard, lessons, review, profile)
// Adds a top navigation bar with links and a logout button
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/ui/AppNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify the user is logged in (middleware handles the redirect,
  // but this is a safety net)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Logo — links back to dashboard */}
          <Link href="/dashboard" className="text-lg font-bold text-gold">
            GermanWithCaro
          </Link>

          {/* Navigation links + logout (client component for interactivity) */}
          <AppNav />
        </div>
      </header>

      {/* Page content */}
      {children}
    </div>
  )
}
