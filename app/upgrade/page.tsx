'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'

function UpgradePageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const canceled = params.get('canceled')

  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null)
        setUserId(user.id)
      } else {
        router.push('/login')
      }
    })
  }, [router])

  async function handleCheckout() {
    if (!userId || !userEmail) return
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: userEmail }),
    })
    const { url, error } = await res.json()
    if (error || !url) {
      setLoading(false)
      return
    }
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 py-16 text-center">

        {canceled && (
          <div className="mb-8 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm">
            No worries — you can upgrade any time.
          </div>
        )}

        <p className="text-4xl mb-4">🇩🇪</p>
        <h1 className="text-3xl font-bold text-[#e8e6f0] mb-3">Go Pro</h1>
        <p className="text-[#9b98b0] mb-10">
          Get full access to spaced repetition reviews and track your progress.
        </p>

        <div className="bg-[#1a1830] border border-[#7c6df2]/40 rounded-2xl p-8 mb-6 text-left">
          <div className="flex items-end gap-2 mb-6">
            <span className="text-4xl font-bold text-[#e8e6f0]">€9.99</span>
            <span className="text-[#9b98b0] mb-1">/ month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              'Browse all videos',
              'Save sentences to your deck',
              'Daily SRS review sessions',
              'Progress tracking & streaks',
              'Cancel any time',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-[#9b98b0]">
                <span className="text-[#7c6df2] font-bold text-base">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleCheckout}
            disabled={loading || !userId}
            className="w-full py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold text-base hover:bg-[#9b8cf5] transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting…' : 'Start subscription →'}
          </button>
          <p className="text-xs text-[#4a4760] text-center mt-3">
            Secure payment via Stripe. Cancel any time from your profile.
          </p>
        </div>

        <Link href="/videos" className="text-sm text-[#9b98b0] hover:text-[#e8e6f0] transition-colors">
          ← Back to videos
        </Link>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0e17]" />}>
      <UpgradePageInner />
    </Suspense>
  )
}
