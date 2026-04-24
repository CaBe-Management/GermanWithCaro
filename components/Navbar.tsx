'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { getOrCreateProgress, getLevelFromXP } from '@/lib/gamification'

function getInitials(email: string) {
  return email.charAt(0).toUpperCase()
}

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return { open, setOpen, ref }
}

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()

  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [userEmail, setUserEmail]     = useState<string | null>(null)
  const [userLevel, setUserLevel]     = useState<number | null>(null)

  const profileDropdown = useDropdown()
  const mobileMenu      = useDropdown()

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now = new Date().toISOString()
        const [
          { data: { user } },
          { count: videoCount },
          progressData,
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('gwc_video_reviews').select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId).lte('next_review_at', now),
          getOrCreateProgress(sessionId),
        ])
        if (user?.email) setUserEmail(user.email)
        setReviewCount(videoCount ?? 0)
        if (progressData) setUserLevel(getLevelFromXP(progressData.xp_total))
      } catch (e) {
        console.error('Navbar load error:', e)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function handleLogout() {
    profileDropdown.setOpen(false)
    mobileMenu.setOpen(false)
    await supabase.auth.signOut()
    localStorage.removeItem('gwc_session_id')
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="bg-gwc-base border-b border-gwc-text/8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link
          href={userEmail ? '/dashboard' : '/'}
          className="flex items-center gap-2 shrink-0 hover:opacity-75 transition-opacity"
        >
          <div className="w-7 h-7 rounded-md bg-gwc-text flex items-center justify-center shrink-0">
            <span className="font-display text-gwc-base text-sm font-bold italic">C</span>
          </div>
          <span className="font-display font-semibold text-gwc-text text-base hidden sm:inline">German with Caro</span>
        </Link>

        {/* Center nav */}
        <div className="flex items-center gap-1 flex-1 justify-center">

          {/* Videos */}
          <Link
            href="/videos"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/videos')
                ? 'bg-gwc-accent text-gwc-base font-semibold'
                : 'text-gwc-muted hover:text-gwc-text hover:bg-gwc-text/6'
            }`}
          >
            <span className="text-sm">🎬</span>
            <span>Videos</span>
          </Link>

          {/* Review */}
          <Link
            href="/review"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/review')
                ? 'bg-gwc-text text-gwc-base font-semibold'
                : reviewCount && reviewCount > 0
                  ? 'bg-orange-500 text-white font-semibold hover:opacity-90'
                  : 'text-gwc-muted hover:text-gwc-text hover:bg-gwc-text/6'
            }`}
          >
            <span>Review</span>
            {reviewCount !== null && reviewCount > 0 && (
              <span className="bg-gwc-base/20 text-current text-xs font-bold px-1.5 py-0.5 rounded min-w-[20px] text-center">
                {reviewCount}
              </span>
            )}
          </Link>

        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Not logged in */}
          {!userEmail && (
            <Link
              href="/login"
              className="hidden md:inline-flex px-4 py-1.5 rounded-lg border border-gwc-text/12 text-gwc-muted text-sm hover:text-gwc-text hover:border-gwc-text/20 transition-colors"
            >
              Log in
            </Link>
          )}

          {/* Avatar dropdown — desktop */}
          {userEmail && (
            <div className="relative hidden md:block" ref={profileDropdown.ref}>
              <button
                onClick={() => profileDropdown.setOpen(v => !v)}
                className="relative w-8 h-8 rounded-full bg-gwc-accent/15 border border-gwc-accent/30 flex items-center justify-center text-gwc-accent font-bold text-sm hover:border-gwc-accent/50 transition-colors"
              >
                {getInitials(userEmail)}
                {userLevel !== null && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gwc-accent text-gwc-base text-[9px] font-bold flex items-center justify-center border-2 border-gwc-base">
                    {userLevel}
                  </span>
                )}
              </button>

              {profileDropdown.open && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-gwc-panel rounded-xl border border-gwc-text/8 shadow-lg shadow-gwc-text/8 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gwc-text/6">
                    <p className="font-mono text-[10px] text-gwc-muted tracking-widest uppercase mb-0.5">Signed in as</p>
                    <p className="text-sm text-gwc-text font-medium truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => profileDropdown.setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-text hover:bg-gwc-text/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                      {userLevel !== null && (
                        <span className="ml-auto font-mono text-[10px] bg-gwc-accent/12 text-gwc-accent px-1.5 py-0.5 rounded tracking-wider">
                          Lv {userLevel}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/forecast"
                      onClick={() => profileDropdown.setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-text hover:bg-gwc-text/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Forecast
                    </Link>
                    <Link
                      href="/subscription"
                      onClick={() => profileDropdown.setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-text hover:bg-gwc-text/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Subscription
                    </Link>
                  </div>
                  <div className="border-t border-gwc-text/6 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-error hover:bg-gwc-error/8 transition-colors text-left"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — mobile */}
          <div className="relative md:hidden" ref={mobileMenu.ref}>
            <button
              onClick={() => mobileMenu.setOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gwc-muted hover:text-gwc-text hover:bg-gwc-text/6 transition-colors"
              aria-label="Menu"
            >
              {mobileMenu.open ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {mobileMenu.open && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-gwc-panel rounded-xl border border-gwc-text/8 shadow-lg shadow-gwc-text/8 overflow-hidden z-50">
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gwc-text/5 ${isActive('/profile') ? 'text-gwc-accent' : 'text-gwc-text'}`}
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                    {userLevel !== null && (
                      <span className="ml-auto font-mono text-[10px] bg-gwc-accent/12 text-gwc-accent px-1.5 py-0.5 rounded tracking-wider">Lv {userLevel}</span>
                    )}
                  </Link>
                  <Link
                    href="/subscription"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gwc-text/5 ${isActive('/subscription') ? 'text-gwc-accent' : 'text-gwc-text'}`}
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium">Subscription</span>
                  </Link>
                  <Link
                    href="/forecast"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gwc-text/5 ${isActive('/forecast') ? 'text-gwc-accent' : 'text-gwc-text'}`}
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Forecast</span>
                  </Link>
                </div>
                {userEmail && (
                  <div className="border-t border-gwc-text/6 px-4 py-3">
                    <p className="font-mono text-[10px] text-gwc-muted tracking-widest uppercase mb-0.5">Signed in as</p>
                    <p className="text-sm text-gwc-text font-medium truncate">{userEmail}</p>
                  </div>
                )}
                {!userEmail && (
                  <div className="border-t border-gwc-text/6 px-4 py-3">
                    <Link href="/login" onClick={() => mobileMenu.setOpen(false)} className="block text-center py-2 rounded-lg bg-gwc-text text-gwc-base text-sm font-semibold">
                      Log in
                    </Link>
                  </div>
                )}
                {userEmail && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gwc-error hover:bg-gwc-error/8 transition-colors text-left border-t border-gwc-text/6"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
