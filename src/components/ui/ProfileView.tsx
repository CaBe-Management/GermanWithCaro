'use client'

// ProfileView — settings form matching design system
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PageCard, { PageCardHeader, PageCardContent } from '@/components/layout/PageCard'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types'

export default function ProfileView({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [weeklyLimit, setWeeklyLimit] = useState(profile.weekly_lesson_limit)
  const [dailyLimit, setDailyLimit] = useState(profile.daily_review_limit)
  const [audioAutoplay, setAudioAutoplay] = useState(profile.audio_autoplay)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasChanges =
    weeklyLimit !== profile.weekly_lesson_limit ||
    dailyLimit !== profile.daily_review_limit ||
    audioAutoplay !== profile.audio_autoplay

  async function saveAll() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekly_lesson_limit: weeklyLimit,
        daily_review_limit: dailyLimit,
        audio_autoplay: audioAutoplay,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = profile.full_name || profile.email

  return (
    <PageCard>
      <PageCardHeader>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-text-2"><ArrowLeft size={20} /></Link>
          <h1 className="text-[17px] font-bold text-text-1">Profile &amp; Settings</h1>
        </div>
      </PageCardHeader>

      <PageCardContent className="flex flex-col gap-6">
        {/* Profile info */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-[28px] font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-[17px] font-bold text-text-1">{displayName}</p>
            <p className="text-[13px] text-text-3">{profile.email}</p>
          </div>
          {profile.subscription_status === 'active' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-3 py-1 text-[12px] font-semibold text-success">
              <Check size={12} /> Active
            </span>
          )}
        </div>

        {/* Learning pace */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
            Learning pace
          </p>
          <div className="space-y-3">
            {/* Lessons per week */}
            <div className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-3">
              <p className="text-[14px] text-text-1">Lessons per week</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setWeeklyLimit(Math.max(1, weeklyLimit - 1))} className="flex h-7 w-7 items-center justify-center rounded-md bg-border text-text-2"><Minus size={14} /></button>
                <span className="w-6 text-center text-[15px] font-bold text-text-1">{weeklyLimit}</span>
                <button onClick={() => setWeeklyLimit(Math.min(7, weeklyLimit + 1))} className="flex h-7 w-7 items-center justify-center rounded-md bg-border text-text-2"><Plus size={14} /></button>
              </div>
            </div>

            {/* Cards per day */}
            <div className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-3">
              <p className="text-[14px] text-text-1">Cards per day (review)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setDailyLimit(Math.max(5, dailyLimit - 5))} className="flex h-7 w-7 items-center justify-center rounded-md bg-border text-text-2"><Minus size={14} /></button>
                <span className="w-8 text-center text-[15px] font-bold text-text-1">{dailyLimit}</span>
                <button onClick={() => setDailyLimit(Math.min(100, dailyLimit + 5))} className="flex h-7 w-7 items-center justify-center rounded-md bg-border text-text-2"><Plus size={14} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Audio */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">Audio</p>
          <div className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-3">
            <p className="text-[14px] text-text-1">Auto-play audio</p>
            <button
              onClick={() => setAudioAutoplay(!audioAutoplay)}
              className={`relative h-7 w-12 rounded-full transition ${audioAutoplay ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${audioAutoplay ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Save */}
        {hasChanges && (
          <Button onClick={saveAll} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        )}
        {saved && (
          <p className="text-center text-[13px] font-semibold text-success">
            <Check size={14} className="mr-1 inline" />Saved!
          </p>
        )}

        {/* Account */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">Account</p>
          <div className="space-y-1">
            {[
              { label: 'Manage subscription', detail: `€9.99/month` },
              { label: 'Change email' },
              { label: 'Change password' },
            ].map((item) => (
              <div key={item.label} className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 hover:bg-bg-subtle">
                <div>
                  <p className="text-[14px] text-text-1">{item.label}</p>
                  {item.detail && <p className="text-[12px] text-text-3">{item.detail}</p>}
                </div>
                <ChevronRight size={16} className="text-text-3" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl bg-error-bg px-4 py-3">
          <button className="text-[14px] font-semibold text-error">Delete account</button>
        </div>

        {/* Logout */}
        <Button variant="secondary" onClick={handleLogout}>
          Log out
        </Button>
      </PageCardContent>
    </PageCard>
  )
}
