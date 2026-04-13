'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { getOrCreateProgress, getLevelFromXP, todayStr } from '@/lib/gamification'
// paths import removed — dropdown now links to /paths overview page

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(email: string) {
  return email.charAt(0).toUpperCase()
}

// ─── Dropdown Hook ────────────────────────────────────────────────────────────

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

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [learnCount, setLearnCount] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<number | null>(null)  // current XP level

  const contentDropdown = useDropdown()
  const profileDropdown = useDropdown()
  const mobileMenu = useDropdown()

  // ── Load counts + levels + user ──
  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now = new Date().toISOString()

        const todayStart = todayStr() + 'T00:00:00'

        const [
          { data: { user } },
          { count: grammarCount },
          { count: vocabCount },
          { data: activePaths },
          progressData,
        ] = await Promise.all([
          supabase.auth.getUser(),
          // Reviews due: grammar + vocab only (no verbs)
          supabase.from('gwc_grammar_reviews').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).lte('next_review_at', now),
          supabase.from('gwc_vocab_reviews').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).lte('next_review_at', now),
          // Active paths (for learn count)
          supabase.from('gwc_user_paths').select('path_id, batch_size').eq('session_id', sessionId).eq('active', true),
          getOrCreateProgress(sessionId),
        ])
        const dueCount = (grammarCount ?? 0) + (vocabCount ?? 0)

        if (user?.email) setUserEmail(user.email)

        // Learn count: sum of "new cards per day" across all active paths
        const totalBatch = (activePaths || []).reduce((s: number, p: { batch_size: number }) => s + (p.batch_size ?? 0), 0)
        setLearnCount(totalBatch)
        setReviewCount(dueCount || 0)

        // Load user's XP level for the level badge
        if (progressData) setUserLevel(getLevelFromXP(progressData.xp_total))
      } catch (e) {
        console.error('Navbar load error:', e)
      }
    }

    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [pathname])

  async function handleLogout() {
    profileDropdown.setOpen(false)
    mobileMenu.setOpen(false)
    await supabase.auth.signOut()
    localStorage.removeItem('gwc_session_id')
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-[#13122a] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">

        {/* ── Left: Logo ── */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-xl">🇩🇪</span>
          <span className="font-bold text-[#e8e6f0] text-base hidden sm:inline">German With Caro</span>
        </Link>

        {/* ── Center: Learn + Review pills + nav links (desktop) ── */}
        <div className="flex items-center gap-1 flex-1 justify-center">

          {/* Learn pill */}
          <Link
            href="/learn"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#7c6df2' }}
          >
            <span>Learn</span>
            {learnCount !== null && (
              <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">
                {learnCount}
              </span>
            )}
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

          {/* Divider — desktop only */}
          <div className="w-px h-5 bg-white/10 mx-1 hidden md:block" />

          {/* Content dropdown — desktop only */}
          <div className="relative hidden md:block" ref={contentDropdown.ref}>
            <button
              onClick={() => contentDropdown.setOpen(v => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/path') || pathname === '/paths' || pathname.startsWith('/grammar') || pathname === '/search'
                  ? 'text-[#e8e6f0] bg-white/8'
                  : 'text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5'
              }`}
            >
              Content
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${contentDropdown.open ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {contentDropdown.open && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#1a1830] rounded-xl border border-white/8 shadow-xl shadow-black/40 overflow-hidden z-50">
                <Link
                  href="/paths"
                  onClick={() => contentDropdown.setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/5 border-b border-white/5 ${
                    pathname.startsWith('/path') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                  }`}
                >
                  <span className="text-lg">🗂️</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Decks</p>
                    <p className="text-xs text-[#9b98b0]">A1 → C2 by type</p>
                  </div>
                </Link>
                <Link
                  href="/grammar"
                  onClick={() => contentDropdown.setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/5 border-b border-white/5 ${
                    pathname.startsWith('/grammar') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                  }`}
                >
                  <span className="text-lg">📚</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Grammar Library</p>
                    <p className="text-xs text-[#9b98b0]">Topics & rules</p>
                  </div>
                </Link>
                <Link
                  href="/search"
                  onClick={() => contentDropdown.setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/5 border-b border-white/5 ${
                    pathname === '/search' ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                  }`}
                >
                  <span className="text-lg">🔍</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Search</p>
                    <p className="text-xs text-[#9b98b0]">Find words & topics</p>
                  </div>
                </Link>
                <Link
                  href="/reading"
                  onClick={() => contentDropdown.setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/5 ${
                    pathname.startsWith('/reading') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                  }`}
                >
                  <span className="text-lg">📖</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Reading Practice</p>
                    <p className="text-xs text-[#9b98b0]">Stories by level</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* ── Right: Desktop (search + avatar) | Mobile (hamburger) ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* User avatar dropdown — desktop only */}
          <div className="relative hidden md:block" ref={profileDropdown.ref}>
            <button
              onClick={() => profileDropdown.setOpen(v => !v)}
              className="relative w-8 h-8 rounded-full bg-[#7c6df2]/30 border border-[#7c6df2]/40 flex items-center justify-center text-[#9b8cf5] font-bold text-sm hover:border-[#7c6df2] transition-colors"
            >
              {userEmail ? getInitials(userEmail) : '?'}
              {/* Level badge */}
              {userLevel !== null && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#7c6df2] text-white text-[9px] font-bold flex items-center justify-center border border-[#13122a]">
                  {userLevel}
                </span>
              )}
            </button>

            {profileDropdown.open && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-[#1a1830] rounded-xl border border-white/8 shadow-xl shadow-black/40 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-[#9b98b0] mb-0.5">Signed in as</p>
                  <p className="text-sm text-[#e8e6f0] font-medium truncate">{userEmail || '—'}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => profileDropdown.setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8e6f0] hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#9b98b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                    {userLevel !== null && (
                      <span className="ml-auto text-xs bg-[#7c6df2]/20 text-[#9b8cf5] px-1.5 py-0.5 rounded font-bold">
                        Lv {userLevel}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/forecast"
                    onClick={() => profileDropdown.setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8e6f0] hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#9b98b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Forecast
                    {userLevel !== null && (
                      <span className="ml-auto text-xs bg-[#7c6df2]/20 text-[#9b8cf5] px-1.5 py-0.5 rounded font-bold">
                        Lv {userLevel}
                      </span>
                    )}
                  </Link>
                </div>
                <div className="border-t border-white/5 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#f87171] hover:bg-[#f87171]/10 transition-colors text-left"
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

          {/* ── Hamburger — mobile only ── */}
          <div className="relative md:hidden" ref={mobileMenu.ref}>
            <button
              onClick={() => mobileMenu.setOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {mobileMenu.open ? (
                // X icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {mobileMenu.open && (
              <div className="absolute top-full right-0 mt-1.5 w-72 bg-[#1a1830] rounded-xl border border-white/8 shadow-xl shadow-black/40 overflow-hidden z-50">

                {/* Navigation */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      isActive('/profile') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                    }`}
                  >
                    <svg className="w-4 h-4 text-[#9b98b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                    {userLevel !== null && (
                      <span className="ml-auto text-xs bg-[#7c6df2]/20 text-[#9b8cf5] px-1.5 py-0.5 rounded font-bold">
                        Lv {userLevel}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/forecast"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      isActive('/forecast') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                    }`}
                  >
                    <svg className="w-4 h-4 text-[#9b98b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Forecast</span>
                    {userLevel !== null && (
                      <span className="ml-auto text-xs bg-[#7c6df2]/20 text-[#9b8cf5] px-1.5 py-0.5 rounded font-bold">
                        Lv {userLevel}
                      </span>
                    )}
                  </Link>
                </div>

                {/* Content section */}
                <div className="border-t border-white/5">
                  <p className="px-4 pt-3 pb-1 text-xs text-[#9b98b0] uppercase tracking-wider font-bold">Content</p>
                  <Link
                    href="/paths"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      pathname.startsWith('/path') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                    }`}
                  >
                    <span className="text-base">🗂️</span>
                    <div>
                      <p className="font-medium leading-tight">Decks</p>
                      <p className="text-xs text-[#9b98b0]">A1 → C2 by type</p>
                    </div>
                  </Link>
                  <Link
                    href="/grammar"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      pathname.startsWith('/grammar') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                    }`}
                  >
                    <span className="text-base">📚</span>
                    <div>
                      <p className="font-medium leading-tight">Grammar Library</p>
                      <p className="text-xs text-[#9b98b0]">Topics & rules</p>
                    </div>
                  </Link>
                  <Link
                    href="/search"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      pathname === '/search' ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                    }`}
                  >
                    <span className="text-base">🔍</span>
                    <div>
                      <p className="font-medium leading-tight">Search</p>
                      <p className="text-xs text-[#9b98b0]">Find words & topics</p>
                    </div>
                  </Link>
                  <Link
                    href="/reading"
                    onClick={() => mobileMenu.setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      pathname.startsWith('/reading') ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]'
                    }`}
                  >
                    <span className="text-base">📖</span>
                    <div>
                      <p className="font-medium leading-tight">Reading Practice</p>
                      <p className="text-xs text-[#9b98b0]">Stories by level</p>
                    </div>
                  </Link>
                </div>

                {/* User section */}
                <div className="border-t border-white/5">
                  <div className="px-4 py-3">
                    <p className="text-xs text-[#9b98b0] mb-0.5">Signed in as</p>
                    <p className="text-sm text-[#e8e6f0] font-medium truncate">{userEmail || '—'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f87171] hover:bg-[#f87171]/10 transition-colors text-left border-t border-white/5"
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

        </div>
      </div>
    </nav>
  )
}
