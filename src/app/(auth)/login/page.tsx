'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-[420px] rounded-[20px] bg-bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-[16px] font-bold text-transparent">
            GermanWithCaro
          </span>
        </div>

        <h1 className="text-center text-[24px] font-extrabold text-text-1">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-[15px] text-text-2">
          Log in to continue learning.
        </p>

        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            error={error || undefined}
          />

          <div>
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
            <div className="mt-2 text-right">
              <Link href="#" className="text-[13px] font-medium text-primary">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[13px] text-text-3">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-[15px] text-text-2">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary">
            Sign up →
          </Link>
        </p>
      </div>
    </div>
  )
}
