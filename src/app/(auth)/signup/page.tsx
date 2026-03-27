'use client'

// Signup page — email + password form
// On success, shows a "check your email" message
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Create the new account
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After email confirmation, send the user to the dashboard
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success — tell user to check their email
    setSuccess(true)
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-8 shadow-sm">
        {/* Logo */}
        <h1 className="mb-1 text-center text-2xl font-bold text-gold">
          GermanWithCaro
        </h1>
        <p className="mb-6 text-center text-sm text-text3">
          Create your account to start learning German.
        </p>

        {/* Success message — shown after signup */}
        {success ? (
          <div className="rounded-lg bg-gold-bg p-4 text-center">
            <p className="text-sm font-medium text-gold-dark">
              Check your email!
            </p>
            <p className="mt-1 text-sm text-text2">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-gold hover:underline"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg bg-error-bg p-3 text-sm text-error">
                {error}
              </div>
            )}

            {/* Signup form */}
            <form onSubmit={handleSignup} className="space-y-4">
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
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-bg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-white transition hover:bg-gold-light disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            {/* Link to login */}
            <p className="mt-6 text-center text-sm text-text3">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-gold hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
