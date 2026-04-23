'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'
import { getSubscriptionStatus, isPro } from '@/lib/subscription'

function UpgradePageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const canceled = params.get('canceled')

  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [alreadyPro, setAlreadyPro] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? null)
      setUserId(user.id)
      const status = await getSubscriptionStatus()
      if (isPro(status)) setAlreadyPro(true)
    }
    init()
  }, [router])

  async function handleCheckout() {
    if (!userId || !userEmail) return
    setLoading(true)
    setCheckoutError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
        sessionId: typeof window !== 'undefined' ? localStorage.getItem('gwc_session_id') : null,
      }),
      })
      const json = await res.json()
      if (!res.ok || json.error || !json.url) {
        setCheckoutError('Could not start checkout. Please try again or contact support.')
        setLoading(false)
        return
      }
      window.location.href = json.url
    } catch {
      setCheckoutError('Something went wrong. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gwc-base">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 py-16 text-center">

        {canceled && (
          <div className="mb-8 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm">
            No worries — you can upgrade any time.
          </div>
        )}

        <div className="w-12 h-12 rounded-xl bg-gwc-text flex items-center justify-center mx-auto mb-5">
          <span className="font-display text-gwc-base text-2xl font-bold italic">C</span>
        </div>
        <h1 className="font-display text-4xl text-gwc-text mb-3">Go Pro.</h1>
        <p className="text-gwc-muted mb-10">
          Full access to spaced repetition reviews and progress tracking.
        </p>

        <div className="bg-gwc-panel border-2 border-gwc-accent/30 rounded-2xl p-8 mb-6 text-left">
          <div className="mb-1">
            <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">Pro plan</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl text-gwc-text">€4.99</span>
              <span className="text-gwc-muted">/ month</span>
            </div>
          </div>
          <div className="h-px bg-gwc-text/8 my-6" />
          <ul className="space-y-3 mb-8">
            {[
              'Browse all videos',
              'Save sentences to your deck',
              'Daily SRS review sessions',
              'Progress tracking & streaks',
              'Cancel any time',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-gwc-muted">
                <span className="text-gwc-accent font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {alreadyPro ? (
            <div className="text-center">
              <p className="font-display text-gwc-success text-lg mb-3">✓ You're already on Pro.</p>
              <Link
                href="/profile"
                className="inline-block w-full py-3.5 rounded-xl bg-gwc-text/8 text-gwc-text font-semibold hover:bg-gwc-text/12 transition-colors text-center"
              >
                Manage subscription →
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={handleCheckout}
                disabled={loading || !userId}
                className="w-full py-3.5 rounded-xl bg-gwc-text text-gwc-base font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Redirecting…' : 'Start subscription →'}
              </button>
              {checkoutError && (
                <p className="text-xs text-gwc-error text-center mt-3">{checkoutError}</p>
              )}
              {!checkoutError && (
                <p className="font-mono text-[10px] text-gwc-dim text-center mt-3 tracking-wide">
                  Secure payment via Stripe · Cancel any time
                </p>
              )}
            </>
          )}
        </div>

        <Link href="/videos" className="text-sm text-gwc-muted hover:text-gwc-text transition-colors">
          ← Back to videos
        </Link>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gwc-base" />}>
      <UpgradePageInner />
    </Suspense>
  )
}
