'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-[420px] rounded-[20px] bg-bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-8 text-center">
          <span className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-[16px] font-bold text-transparent">
            GermanWithCaro
          </span>
        </div>

        <h1 className="text-center text-[24px] font-extrabold text-text-1">
          Create your account
        </h1>
        <p className="mt-2 text-center text-[15px] text-text-2">
          Start your German learning journey.
        </p>

        {success ? (
          <div className="mt-8 rounded-xl bg-success-bg p-6 text-center">
            <p className="text-[15px] font-semibold text-success">Check your email!</p>
            <p className="mt-2 text-[14px] text-text-2">
              We sent a confirmation link to <strong>{email}</strong>.
            </p>
            <Link href="/login" className="mt-4 inline-block text-[14px] font-semibold text-primary">
              Go to login →
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="mt-8 flex flex-col gap-5">
              <Input id="name" label="Your name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Caroline" required />
              <Input id="email" label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
              <Input id="confirm" label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required error={error || undefined} />
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <p className="mt-4 text-center text-[12px] text-text-3">
              By signing up you agree to our{' '}
              <Link href="/terms" className="text-primary">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
            </p>

            <p className="mt-6 text-center text-[15px] text-text-2">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary">Log in →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
