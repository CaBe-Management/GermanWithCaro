'use client'

// Subscribe page — shown to logged-in users who don't have an active subscription yet
// Has a "Subscribe" button that redirects to Stripe Checkout
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'

// Inner component that uses useSearchParams (needs Suspense wrapper)
function SubscribeContent() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled')

  async function handleSubscribe() {
    setLoading(true)

    // Call our checkout API to get a Stripe Checkout URL
    const response = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await response.json()

    if (data.url) {
      // Redirect the user to Stripe's checkout page
      window.location.href = data.url
    } else {
      setLoading(false)
      alert('Something went wrong. Please try again.')
    }
  }

  // Features included in the subscription
  const features = [
    'All structured A1 lessons',
    'Native audio recordings',
    'Spaced repetition flashcards',
    'Progress tracking & streaks',
    'New lessons added regularly',
  ]

  return (
    <div className="w-full max-w-sm">
      {/* Show a message if user cancelled checkout */}
      {cancelled && (
        <div className="mb-4 rounded-lg bg-primary-bg p-3 text-center text-sm text-primary-dark">
          No worries — you can subscribe whenever you&apos;re ready!
        </div>
      )}

      {/* Pricing card */}
      <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-primary">
          GermanWithCaro
        </h1>
        <p className="mt-1 text-center text-sm text-text3">
          Start learning German the right way
        </p>

        {/* Price */}
        <div className="mt-6 text-center">
          <span className="text-4xl font-bold text-text">€4.99</span>
          <span className="text-text3">/month</span>
        </div>

        {/* Features list */}
        <ul className="mt-6 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-text2">
              <Check size={16} className="shrink-0 text-success" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-8 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
        >
          {loading ? 'Redirecting to checkout...' : 'Subscribe now'}
        </button>

        <p className="mt-3 text-center text-xs text-text3">
          Cancel anytime. Powered by Stripe.
        </p>
      </div>
    </div>
  )
}

// Main page component — wraps content in Suspense (required by Next.js for useSearchParams)
export default function SubscribePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Suspense>
        <SubscribeContent />
      </Suspense>
    </main>
  )
}
