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

        <p className="text-4xl mb-4">🇩🇪</p>
        <h1 className="text-3xl font-bold text-gwc-text mb-3">Go Pro</h1>
        <p className="text-gwc-muted mb-10">
          Get full access to spaced repetition reviews and track your progress.
        </p>

        <div className="bg-gwc-panel border border-gwc-accent/40 rounded-2xl p-8 mb-6 text-left">
          <div className="flex items-end gap-2 mb-6">
            <span className="text-4xl font-bold text-gwc-text">€4.99</span>
            <span className="text-gwc-muted mb-1">/ month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              'Browse all videos',
              'Save sentences to your deck',
              'Daily SRS review sessions',
              'Progress tracking & streaks',
              'Cancel any time',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-gwc-muted">
                <span className="text-gwc-accent font-bold text-base">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {alreadyPro ? (
            <div className="text-center">
              <p className="text-gwc-success font-semibold mb-3">✓ You're already on Pro!</p>
              <Link
                href="/profile"
                className="inline-block w-full py-3.5 rounded-xl bg-gwc-text/8 text-gwc-text font-bold text-base hover:bg-gwc-text/12 transition-colors text-center"
              >
                Manage subscription →
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={handleCheckout}
                disabled={loading || !userId}
                className="w-full py-3.5 rounded-xl bg-gwc-accent text-white font-bold text-base hover:bg-gwc-accent-soft transition-colors disabled:opacity-50"
              >
                {loading ? 'Redirecting…' : 'Start subscription →'}
              </button>
              {checkoutError && (
                <p className="text-xs text-red-400 text-center mt-3">{checkoutError}</p>
              )}
              {!checkoutError && (
                <p className="text-xs text-gwc-dim text-center mt-3">
                  Secure payment via Stripe. Cancel any time from your profile.
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
