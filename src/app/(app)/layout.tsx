// App layout — wraps all protected pages with bottom navigation
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Page content — padded bottom for bottom nav */}
      <div className="mx-auto max-w-[520px] px-4 pb-20 pt-8">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
