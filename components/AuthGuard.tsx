'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Pages that do NOT require login — exact-match only
// Grammar/vocab DETAIL pages (/grammar/[slug], /vocab/[slug]) are intentionally NOT listed here
const PUBLIC_PATHS = ['/', '/login', '/grammar', '/vocab', '/videos', '/reset-password', '/impressum', '/privacy', '/terms', '/cookies']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Sync the real user ID into localStorage so all pages work without changes
        localStorage.setItem('gwc_session_id', session.user.id)
        setAuthed(true)
      } else if (!isPublic) {
        router.replace('/login')
      } else {
        setAuthed(false)
      }
      setChecking(false)
    })

    // React to sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        localStorage.setItem('gwc_session_id', session.user.id)
        setAuthed(true)
      } else {
        localStorage.removeItem('gwc_session_id')
        setAuthed(false)
        if (!isPublic) router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [isPublic, router])

  // While checking auth state — show spinner on protected pages, nothing on public
  if (checking && !isPublic) {
    return (
      <div className="min-h-screen bg-gwc-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gwc-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Protected page but not authed yet (redirect in progress)
  if (!authed && !isPublic) return null

  return <>{children}</>
}
