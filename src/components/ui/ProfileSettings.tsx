'use client'

// Profile settings form — users adjust preferences and click Save to apply
import { useState } from 'react'
import { Minus, Plus, Check } from 'lucide-react'
import type { Profile } from '@/types'

export default function ProfileSettings({ profile }: { profile: Profile }) {
  // Local state for each setting (initialised from the database)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [weeklyLimit, setWeeklyLimit] = useState(profile.weekly_lesson_limit)
  const [dailyLimit, setDailyLimit] = useState(profile.daily_review_limit)
  const [streakReminder, setStreakReminder] = useState(profile.streak_reminder)
  const [audioAutoplay, setAudioAutoplay] = useState(profile.audio_autoplay)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Check if anything changed from the original profile
  const hasChanges =
    fullName !== (profile.full_name ?? '') ||
    weeklyLimit !== profile.weekly_lesson_limit ||
    dailyLimit !== profile.daily_review_limit ||
    streakReminder !== profile.streak_reminder ||
    audioAutoplay !== profile.audio_autoplay

  // Save all settings at once
  async function saveAll() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        weekly_lesson_limit: weeklyLimit,
        daily_review_limit: dailyLimit,
        streak_reminder: streakReminder,
        audio_autoplay: audioAutoplay,
      }),
    })
    setSaving(false)
    setSaved(true)
    // Update the profile reference so hasChanges resets
    profile.full_name = fullName
    profile.weekly_lesson_limit = weeklyLimit
    profile.daily_review_limit = dailyLimit
    profile.streak_reminder = streakReminder
    profile.audio_autoplay = audioAutoplay
    // Hide "Saved!" after 2 seconds
    setTimeout(() => setSaved(false), 2000)
  }

  // Helper: stepper control (+ / - buttons with a number in the middle)
  function Stepper({
    label,
    helperText,
    value,
    min,
    max,
    onChange,
  }: {
    label: string
    helperText: string
    value: number
    min: number
    max: number
    onChange: (val: number) => void
  }) {
    function handleChange(newVal: number) {
      const clamped = Math.min(max, Math.max(min, newVal))
      onChange(clamped)
    }

    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-text">{label}</p>
          <p className="mt-0.5 text-xs text-text3">{helperText}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleChange(value - 1)}
            disabled={value <= min}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text2 transition hover:bg-surface disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-lg font-semibold text-text">
            {value}
          </span>
          <button
            onClick={() => handleChange(value + 1)}
            disabled={value >= max}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text2 transition hover:bg-surface disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Helper: toggle switch
  function Toggle({
    label,
    helperText,
    value,
    onChange,
  }: {
    label: string
    helperText: string
    value: boolean
    onChange: (val: boolean) => void
  }) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-text">{label}</p>
          <p className="mt-0.5 text-xs text-text3">{helperText}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`relative h-6 w-11 rounded-full transition ${
            value ? 'bg-primary' : 'bg-border2'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  // Subscription status badge colour
  const statusColor = {
    active: 'bg-success/10 text-success',
    trialing: 'bg-primary-bg text-primary-dark',
    inactive: 'bg-error-bg text-error',
  }[profile.subscription_status] ?? 'bg-error-bg text-error'

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Page header */}
        <h1 className="text-2xl font-bold text-text">Profile</h1>
        <p className="mt-1 text-sm text-text3">Manage your learning preferences</p>

        {/* Account info */}
        <div className="mt-6 rounded-lg border border-border bg-white p-4">
          <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-text3">
            Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-bg"
          />
          <p className="mt-2 text-xs text-text3">{profile.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
              {profile.subscription_status.charAt(0).toUpperCase() + profile.subscription_status.slice(1)}
            </span>
          </div>
        </div>

        {/* Settings section */}
        <h2 className="mt-8 mb-3 text-sm font-semibold text-text2">Learning Settings</h2>
        <div className="space-y-3">
          <Stepper
            label="Lessons per week"
            helperText="We recommend 2–4. Fewer lessons = fewer reviews to manage."
            value={weeklyLimit}
            min={1}
            max={7}
            onChange={setWeeklyLimit}
          />

          <Stepper
            label="Max reviews per session"
            helperText="Reviews beyond this limit are carried to the next day."
            value={dailyLimit}
            min={5}
            max={100}
            onChange={setDailyLimit}
          />

          <Toggle
            label="Daily reminder"
            helperText="Email reminder if you haven't studied by 7 PM."
            value={streakReminder}
            onChange={setStreakReminder}
          />

          <Toggle
            label="Auto-play audio"
            helperText="Plays sentence audio automatically on the review card."
            value={audioAutoplay}
            onChange={setAudioAutoplay}
          />
        </div>

        {/* Save button */}
        <div className="mt-8">
          <button
            onClick={saveAll}
            disabled={!hasChanges || saving}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-sage">
              <Check size={14} />
              Saved!
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
