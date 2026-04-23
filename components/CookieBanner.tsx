'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Pages where the banner is suppressed (legal pages don't need a cookie banner)
const LEGAL_PATHS = ['/cookies', '/privacy', '/terms', '/impressum']

const STORAGE_KEY = 'gwc_cookie_dismissed'

export default function CookieBanner() {
  // Start hidden; show only after we've checked localStorage (avoids SSR flash)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Don't show on legal pages
    if (LEGAL_PATHS.includes(pathname)) return

    // Don't show if user already dismissed it
    if (localStorage.getItem(STORAGE_KEY) === 'true') return

    // Small delay so the page renders first before the banner fades in
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [pathname])

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
    // Fade out: remove `visible` after a short delay so CSS transition plays
    setTimeout(() => setVisible(false), 300)
  }

  // Not visible (or legal page): render nothing
  if (!visible) return null

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        transition-all duration-300 ease-in-out
        ${dismissed ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
      role="dialog"
      aria-label="Cookie information"
    >
      <div className="m-3 sm:m-4 md:mx-auto md:max-w-2xl">
        <div className="bg-gwc-panel border border-white/15 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Text */}
          <p className="flex-1 text-sm text-[#c5c3d4] leading-relaxed">
            This site uses essential cookies for authentication.{' '}
            <Link
              href="/cookies"
              className="text-gwc-accent-soft hover:text-gwc-accent underline underline-offset-2 transition-colors"
            >
              See our Cookie Policy
            </Link>{' '}
            for details.
          </p>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gwc-accent text-white text-sm font-bold hover:bg-gwc-accent-soft active:scale-95 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
