'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Two modes:
// 1. "request" — user enters email, we send the reset link
// 2. "set-new" — user arrived via the email link and sets a new password

type Mode = 'request' | 'set-new'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // When Supabase redirects back after clicking the email link,
  // the URL contains a type=recovery fragment. Detect that and switch mode.
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setMode('set-new')
    }
  }, [])

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Check your email — we sent you a reset link.')
    }
  }

  async function handleSetNew(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated! Redirecting to login…')
      setTimeout(() => router.push('/login'), 1800)
    }
  }

  return (
    <div className="min-h-screen bg-gwc-base flex items-center justify-center px-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🇩🇪</div>
          <h1 className="text-2xl font-bold text-gwc-text">German With Caro</h1>
          <p className="text-gwc-muted text-sm mt-1">
            {mode === 'request' ? 'Reset your password' : 'Set a new password'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-gwc-panel rounded-2xl border border-gwc-text/6 p-7">
          <h2 className="text-lg font-bold text-gwc-text mb-6">
            {mode === 'request' ? 'Forgot password?' : 'Choose a new password'}
          </h2>

          {mode === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gwc-muted uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full bg-gwc-raised border border-gwc-text/8 rounded-xl px-4 py-3 text-gwc-text placeholder-[#9b98b0]/50 focus:outline-none focus:border-gwc-accent transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-gwc-error/10 border border-gwc-error/20 text-gwc-error text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-3 rounded-xl bg-gwc-success/10 border border-gwc-success/20 text-gwc-success text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full py-3.5 rounded-xl bg-gwc-accent text-white font-bold text-base hover:bg-gwc-accent-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetNew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gwc-muted uppercase tracking-wider mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoFocus
                  className="w-full bg-gwc-raised border border-gwc-text/8 rounded-xl px-4 py-3 text-gwc-text placeholder-[#9b98b0]/50 focus:outline-none focus:border-gwc-accent transition-colors"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-gwc-error/10 border border-gwc-error/20 text-gwc-error text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-3 rounded-xl bg-gwc-success/10 border border-gwc-success/20 text-gwc-success text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full py-3.5 rounded-xl bg-gwc-accent text-white font-bold text-base hover:bg-gwc-accent-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gwc-muted mt-6">
            Remember it?{' '}
            <a href="/login" className="text-gwc-accent-soft hover:underline font-medium">
              Back to login
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
