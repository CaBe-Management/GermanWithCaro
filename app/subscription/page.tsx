'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { getSubscriptionStatus, isPro } from '@/lib/subscription'
import Navbar from '@/components/Navbar'

function SubscriptionPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const fromPortal = params.get('from') === 'portal'

  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const s = await getSubscriptionStatus()
      setStatus(s)
      setLoading(false)
    }
    init()
  }, [router])

  async function openPortal() {
    setPortalLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const sessionId = typeof window !== 'undefined'
        ? (localStorage.getItem('gwc_session_id') ?? session.user.id)
        : session.user.id
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setError(json.error ?? 'Could not open billing portal.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setPortalLoading(false)
  }

  const pro     = isPro(status)
  const pastDue = status === 'past_due'
  const canceled = status === 'canceled'

  return (
    <div className="min-h-screen bg-gwc-base">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 py-14">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[10px] text-gwc-muted tracking-widest uppercase mb-3">Account</p>
          <h1 className="font-display text-4xl text-gwc-text">Subscription</h1>
        </div>

        {/* Return from portal message */}
        {fromPortal && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-gwc-success/10 border border-gwc-success/20 text-gwc-success text-sm">
            Your subscription has been updated.
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-gwc-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">

            {/* Current plan card */}
            <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-6">
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase mb-4">Current plan</p>

              {pro && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display text-2xl text-gwc-text">Pro</p>
                      <span className="font-mono text-[9px] bg-gwc-accent/12 text-gwc-accent px-2 py-0.5 rounded tracking-widest uppercase">Active</span>
                    </div>
                    <p className="text-sm text-gwc-muted">€4.99 / month · renews automatically</p>
                  </div>
                </div>
              )}

              {pastDue && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display text-2xl text-gwc-text">Pro</p>
                      <span className="font-mono text-[9px] bg-gwc-error/12 text-gwc-error px-2 py-0.5 rounded tracking-widest uppercase">Payment failed</span>
                    </div>
                    <p className="text-sm text-gwc-muted">Please update your payment method.</p>
                  </div>
                </div>
              )}

              {canceled && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display text-2xl text-gwc-text">Pro</p>
                    <span className="font-mono text-[9px] bg-gwc-text/8 text-gwc-muted px-2 py-0.5 rounded tracking-widest uppercase">Canceled</span>
                  </div>
                  <p className="text-sm text-gwc-muted">Access until end of billing period.</p>
                </div>
              )}

              {!pro && !pastDue && !canceled && (
                <div>
                  <p className="font-display text-2xl text-gwc-text mb-1">Free</p>
                  <p className="text-sm text-gwc-muted">Browse videos and see sentences.</p>
                </div>
              )}
            </div>

            {/* What's included */}
            {(pro || pastDue || canceled) && (
              <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-6">
                <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase mb-4">Included in Pro</p>
                <ul className="space-y-2.5">
                  {[
                    'Browse all videos',
                    'Save sentences to your deck',
                    'Daily SRS reviews',
                    'Progress tracking',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gwc-muted">
                      <span className="text-gwc-accent text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {(pro || pastDue) && (
              <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-6">
                <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase mb-4">Manage</p>
                <p className="text-sm text-gwc-muted mb-4">
                  Update your payment method, view invoices, or cancel your subscription via the Stripe billing portal.
                </p>
                {error && (
                  <p className="text-sm text-gwc-error mb-3">{error}</p>
                )}
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="w-full py-3 rounded-xl bg-gwc-text text-gwc-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {portalLoading ? 'Opening…' : 'Open billing portal →'}
                </button>
              </div>
            )}

            {!pro && !pastDue && (
              <div className="bg-gwc-panel rounded-xl border-2 border-gwc-accent/30 p-6">
                <p className="font-mono text-[9px] text-gwc-accent tracking-widest uppercase mb-3">Upgrade to Pro</p>
                <p className="font-display text-3xl text-gwc-text mb-1">€4.99 <span className="text-base text-gwc-muted font-normal">/ month</span></p>
                <p className="text-sm text-gwc-muted mb-5">Save sentences, review daily, track your progress.</p>
                <Link
                  href="/upgrade"
                  className="block w-full py-3 rounded-xl bg-gwc-text text-gwc-base font-semibold text-center hover:opacity-90 transition-opacity"
                >
                  Get started →
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link href="/dashboard" className="font-mono text-[10px] text-gwc-muted tracking-widest uppercase hover:text-gwc-accent transition-colors">
                ← Back to dashboard
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gwc-base" />}>
      <SubscriptionPageInner />
    </Suspense>
  )
}
