'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { getOrCreateProgress, getLevelFromXP, todayStr } from '@/lib/gamification'

function getInitials(email: string) {
  return email.charAt(0).toUpperCase()
}

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return { open, setOpen, ref }
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<number | null>(null)

  const profileDropdown = useDropdown()
  const mobileMenu = useDropdown()

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
          supabase.from('gwc_video_reviews').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).lte('next_review_at', now),
          getOrCreateProgress(sessionId),
        ])

        const dueCount = (videoCount ?? 0)
        if (user?.email) setUserEmail(user.email)
        setReviewCount(dueCount)
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
    <nav className="bg-[#13122a] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link
          href={userEmail ? '/dashboard' : '/'}
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-xl">🇩🇪</span>
          <span className="font-bold text-gwc-text text-base hidden sm:inline">German With Caro</span>
        </Link>

        {/* Center nav */}
        <div className="flex items-center gap-1 flex-1 justify-center">

          {/* Videos pill */}
          <Link
            href="/videos"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              isActive('/videos')
                ? 'bg-gwc-accent text-white'
                : 'bg-white/5 text-gwc-muted hover:text-gwc-text hover:bg-white/10'
            }`}
          >
            <span>🎬</span>
            <span>Videos</span>
          </Link>

          {/* Review pill */}
          <Link
            href="/review"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-white font-semibold text-sm hover:opacity-90 transition-opacity ${
              reviewCount && reviewCount > 0 ? 'bg-orange-500' : 'bg-white/10'
            }`}
          >
            <span>Review</span>
            {reviewCount !== null && (
              <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">
                {reviewCount}
              </span>
            )}
          </Link>

        </div>

        {/* Right: avatar (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Not logged in — show Log in button */}
          {!userEmail && (
            <Link
              href="/login"
              className="hidden md:inline-flex px-4 py-1.5 rounded-lg bg-white/8 text-gwc-text text-sm font-semibold hover:bg-white/12 transition-colors"
            >
              Log in
            </Link>
          )}

          {/* Avatar dropdown — desktop (logged in only) */}
          {userEmail && <div className="relative hidden md:block" ref={profileDropdown.ref}>
            <button
              onClick={() => profileDropdown.setOpen(v => !v)}
              className="relative w-8 h-8 rounded-full bg-gwc-accent/30 border border-gwc-accent/40 flex items-center justify-center text-gwc-accent-soft font-bold text-sm hover:border-gwc-accent transition-colors"
            >
              {userEmail ? getInitials(userEmail) : '?'}
              {userLevel !== null && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gwc-accent text-white text-[9px] font-bold flex items-center justify-center border border-[#13122a]">
                  {userLevel}
                </span>
              )}
            </button>

            {profileDropdown.open && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-gwc-panel rounded-xl border border-white/8 shadow-xl shadow-black/40 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-gwc-muted mb-0.5">Signed in as</p>
                  <p className="text-sm text-gwc-text font-medium truncate">{userEmail || '—'}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => profileDropdown.setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-text hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                    {userLevel !== null && (
                      <span className="ml-auto text-xs bg-gwc-accent/20 text-gwc-accent-soft px-1.5 py-0.5 rounded font-bold">
                        Lv {userLevel}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/forecast"
                    onClick={() => profileDropdown.setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-text hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Forecast
                  </Link>
                </div>
                <div className="border-t border-white/5 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gwc-error hover:bg-gwc-error/10 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>}

          {/* Hamburger — mobile */}
          <div className="relative md:hidden" ref={mobileMenu.ref}>
            <button
              onClick={() => mobileMenu.setOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gwc-muted hover:text-gwc-text hover:bg-white/5 transition-colors"
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
              <div className="absolute top-full right-0 mt-1.5 w-64 bg-gwc-panel rounded-xl border border-white/8 shadow-xl shadow-black/40 overflow-hidden z-50">
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${isActive('/profile') ? 'text-gwc-accent-soft' : 'text-gwc-text'}`}
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                    {userLevel !== null && (
                      <span className="ml-auto text-xs bg-gwc-accent/20 text-gwc-accent-soft px-1.5 py-0.5 rounded font-bold">Lv {userLevel}</span>
                    )}
                  </Link>
                  <Link
                    href="/forecast"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${isActive('/forecast') ? 'text-gwc-accent-soft' : 'text-gwc-text'}`}
                  >
                    <svg className="w-4 h-4 text-gwc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Forecast</span>
                  </Link>
                </div>
                <div className="border-t border-white/5 px-4 py-3">
                  <p className="text-xs text-gwc-muted mb-0.5">Signed in as</p>
                  <p className="text-sm text-gwc-text font-medium truncate">{userEmail || '—'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gwc-error hover:bg-gwc-error/10 transition-colors text-left border-t border-white/5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
