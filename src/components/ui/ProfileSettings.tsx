'use client'

// Profile settings form — lets users adjust their learning preferences
// Each setting saves immediately when changed (no "Save" button needed)
import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Profile } from '@/types'

export default function ProfileSettings({ profile }: { profile: Profile }) {
  // Local state for each setting (initialised from the database)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [weeklyLimit, setWeeklyLimit] = useState(profile.weekly_lesson_limit)
  const [dailyLimit, setDailyLimit] = useState(profile.daily_review_limit)
  const [streakReminder, setStreakReminder] = useState(profile.streak_reminder)
  const [audioAutoplay, setAudioAutoplay] = useState(profile.audio_autoplay)
  const [saving, setSaving] = useState(false)

  // Save a single setting to the database
  async function updateSetting(field: string, value: number | boolean) {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setSaving(false)
  }

  // Helper: stepper control (+ / - buttons with a number in the middle)
  function Stepper({
    label,
    helperText,
    value,
    min,
    max,
    field,
    onChange,
  }: {
    label: string
    helperText: string
    value: number
    min: number
    max: number
    field: string
    onChange: (val: number) => void
  }) {
    function handleChange(newVal: number) {
      // Clamp to min/max range
      const clamped = Math.min(max, Math.max(min, newVal))
      onChange(clamped)
      updateSetting(field, clamped)
    }

    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-text">{label}</p>
          <p className="mt-0.5 text-xs text-text3">{helperText}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Minus button */}
          <button
            onClick={() => handleChange(value - 1)}
            disabled={value <= min}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text2 transition hover:bg-surface disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          {/* Current value */}
          <span className="w-8 text-center text-lg font-semibold text-text">
            {value}
          </span>
          {/* Plus button */}
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
    field,
    onChange,
  }: {
    label: string
    helperText: string
    value: boolean
    field: string
    onChange: (val: boolean) => void
  }) {
    function handleToggle() {
      const newVal = !value
      onChange(newVal)
      updateSetting(field, newVal)
    }

    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-text">{label}</p>
          <p className="mt-0.5 text-xs text-text3">{helperText}</p>
        </div>
        {/* Toggle switch */}
        <button
          onClick={handleToggle}
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
          {/* Editable name field */}
          <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-text3">
            Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => updateSetting('full_name', fullName)}
            onKeyDown={(e) => { if (e.key === 'Enter') updateSetting('full_name', fullName) }}
            placeholder="Your name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-bg"
          />
          {/* Email (read-only) */}
          <p className="mt-2 text-xs text-text3">{profile.email}</p>
          {/* Subscription badge */}
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
            field="weekly_lesson_limit"
            onChange={setWeeklyLimit}
          />

          <Stepper
            label="Max reviews per session"
            helperText="Reviews beyond this limit are carried to the next day."
            value={dailyLimit}
            min={5}
            max={100}
            field="daily_review_limit"
            onChange={setDailyLimit}
          />

          <Toggle
            label="Daily reminder"
            helperText="Email reminder if you haven't studied by 7 PM."
            value={streakReminder}
            field="streak_reminder"
            onChange={setStreakReminder}
          />

          <Toggle
            label="Auto-play audio"
            helperText="Plays sentence audio automatically on the review card."
            value={audioAutoplay}
            field="audio_autoplay"
            onChange={setAudioAutoplay}
          />
        </div>

        {/* Saving indicator */}
        {saving && (
          <p className="mt-3 text-center text-xs text-text3">Saving...</p>
        )}
      </div>
    </main>
  )
}
