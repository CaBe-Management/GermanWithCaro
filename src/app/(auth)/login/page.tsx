'use client'

// Login page — email + password form
// On success, redirects to /dashboard
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Try to sign in with the email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success — go to the dashboard
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      {/* Login card */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-8 shadow-sm">
        {/* Logo */}
        <h1 className="mb-1 text-center text-2xl font-bold text-gold">
          GermanWithCaro
        </h1>
        <p className="mb-6 text-center text-sm text-text3">
          Welcome back! Log in to continue learning.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-error-bg p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-bg"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-bg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-white transition hover:bg-gold-light disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Link to sign up */}
        <p className="mt-6 text-center text-sm text-text3">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-gold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
