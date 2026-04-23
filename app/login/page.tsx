'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        })
        if (error) throw error
        // Supabase may require email confirmation — handle both cases
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      // Friendlier error messages
      if (msg.includes('Invalid login credentials')) setError('Incorrect email or password.')
      else if (msg.includes('already registered')) setError('This email is already registered. Try logging in.')
      else if (msg.includes('Password should be')) setError('Password must be at least 6 characters.')
      else setError(msg)
    } finally {
      setLoading(false)
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
            {mode === 'login' ? 'Welcome back!' : 'Start learning German today.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-gwc-panel rounded-2xl border border-white/5 p-7">
          <h2 className="text-lg font-bold text-gwc-text mb-6">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
                className="w-full bg-gwc-raised border border-white/8 rounded-xl px-4 py-3 text-gwc-text placeholder-[#9b98b0]/50 focus:outline-none focus:border-gwc-accent transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gwc-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required
                minLength={6}
                className="w-full bg-gwc-raised border border-white/8 rounded-xl px-4 py-3 text-gwc-text placeholder-[#9b98b0]/50 focus:outline-none focus:border-gwc-accent transition-colors"
              />
            </div>

            {/* Forgot password — only visible in login mode */}
            {mode === 'login' && (
              <div className="text-right -mt-1">
                <a
                  href="/reset-password"
                  className="text-xs text-gwc-muted hover:text-gwc-accent-soft transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-gwc-error/10 border border-gwc-error/20 text-gwc-error text-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-gwc-success/10 border border-gwc-success/20 text-gwc-success text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gwc-accent text-white font-bold text-base hover:bg-gwc-accent-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-gwc-muted mt-6">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
                  className="text-gwc-accent-soft hover:underline font-medium"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
                  className="text-gwc-accent-soft hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  )
}
