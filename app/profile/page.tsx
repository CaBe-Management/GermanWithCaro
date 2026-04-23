'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import Navbar from '@/components/Navbar'
import { getSubscriptionStatus, isPro } from '@/lib/subscription'
import {
  getOrCreateProgress,
  getXPProgress,
  checkAndAwardBadges,
  saveDailyGoal,
  BADGE_DEFS,
  getBadgeStat,
  todayStr,
  type UserProgress,
} from '@/lib/gamification'
import { validateDisplayName } from '@/lib/profanity'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileStats {
  totalReviews: number
  correctRate: number     // 0-100
  learnedWords: number    // distinct words with at least 1 review
  daysStudied: number
}

interface SRSStages {
  beginner: number   // interval_days = 1
  seasoned: number   // interval_days 2-3
  adept: number      // interval_days 4-7
  expert: number     // interval_days 8-14
  master: number     // interval_days >= 15
}

interface UnlockedBadge {
  badge_id: string
  unlocked_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD strings for Mon–Sun of the current week. */
function SubscriptionSection() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSubscriptionStatus().then(s => setStatus(s))
  }, [])

  async function openPortal() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div className="bg-gwc-panel rounded-2xl p-6 border border-gwc-text/6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gwc-text mb-1">Subscription</h2>
          <p className="text-sm text-gwc-muted">
            {isPro(status) ? '✓ Pro — €4.99/month' : status === 'past_due' ? '⚠️ Payment failed' : 'Free plan'}
          </p>
        </div>
        {isPro(status) || status === 'past_due' ? (
          <button
            onClick={openPortal}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gwc-text/5 text-sm text-gwc-muted hover:bg-gwc-text/8 hover:text-gwc-text transition-colors disabled:opacity-50"
          >
            {loading ? '…' : 'Manage'}
          </button>
        ) : (
          <Link
            href="/upgrade"
            className="px-4 py-2 rounded-lg bg-gwc-accent text-sm text-white font-bold hover:bg-gwc-accent-soft transition-colors"
          >
            Upgrade →
          </Link>
        )}
      </div>
    </div>
  )
}

function getCurrentWeekDays(): string[] {
  const today = new Date()
  const dow   = today.getDay()               // 0 = Sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))  // rewind to Monday
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** XP progress bar with level numbers. */
function XPBar({ xp }: { xp: number }) {
  const { level, xpInLevel, xpNeeded, pct } = getXPProgress(xp)
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gwc-muted">Level {level}</span>
        <span className="text-xs text-gwc-muted">{xpInLevel} / {xpNeeded} XP</span>
        <span className="text-xs text-gwc-muted">Level {level + 1}</span>
      </div>
      <div className="h-2.5 bg-gwc-text/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gwc-accent to-[#9b8cf5] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-gwc-muted mt-1">{pct}% to level {level + 1}</p>
    </div>
  )
}

/** Weekly day dots (Mo–So). Filled = had reviews that day. */
function WeekView({ activeDays, weekDays }: { activeDays: Set<string>; weekDays: string[] }) {
  const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const today  = todayStr()

  return (
    <div className="flex items-center justify-between gap-1">
      {labels.map((label, i) => {
        const date    = weekDays[i]
        const active  = activeDays.has(date)
        const isToday = date === today
        return (
          <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              active
                ? 'bg-gwc-accent text-white shadow-md shadow-gwc-accent/30'
                : isToday
                  ? 'bg-gwc-text/5 text-gwc-accent-soft border-2 border-gwc-accent/40'
                  : 'bg-gwc-text/5 text-gwc-muted'
            }`}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** One bar in the SRS stage overview. */
function SRSBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="text-gwc-text font-medium">{label}</span>
        <span className="text-gwc-muted">{count}</span>
      </div>
      <div className="h-2 bg-gwc-text/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Single badge card — locked or unlocked. */
function BadgeCard({
  badge,
  unlocked,
  unlockedAt,
  progress,
}: {
  badge: typeof BADGE_DEFS[0]
  unlocked: boolean
  unlockedAt?: string
  progress?: number  // current stat value (for showing remaining)
}) {
  const pct = progress !== undefined
    ? Math.min(100, Math.round((progress / badge.threshold) * 100))
    : 0

  return (
    <div className={`rounded-xl p-4 border transition-all ${
      unlocked
        ? 'bg-gwc-panel border-gwc-accent/30 shadow-sm shadow-gwc-accent/10'
        : 'bg-gwc-base border-gwc-text/6 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
          unlocked ? 'bg-gwc-accent/20' : 'bg-gwc-text/5'
        }`}>
          {unlocked ? badge.icon : '🔒'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${unlocked ? 'text-gwc-text' : 'text-gwc-muted'}`}>
            {badge.name}
          </p>
          <p className="text-xs text-gwc-muted mt-0.5 leading-tight">{badge.description}</p>
          {/* Progress bar for locked badges */}
          {!unlocked && progress !== undefined && (
            <div className="mt-2">
              <div className="h-1 bg-gwc-text/8 rounded-full overflow-hidden">
                <div className="h-full bg-gwc-accent/50 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gwc-muted mt-0.5">{progress} / {badge.threshold}</p>
            </div>
          )}
          {/* Unlock date for unlocked badges */}
          {unlocked && unlockedAt && (
            <p className="text-xs text-gwc-accent mt-1">
              ✓ {new Date(unlockedAt).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Inline +/− control for changing the daily goal. */
function DailyGoalControl({ initialGoal }: { initialGoal: number }) {
  const [goal, setGoal] = useState(initialGoal)
  const [saving, setSaving] = useState(false)

  async function update(next: number) {
    const clamped = Math.max(1, Math.min(50, next))
    setGoal(clamped)
    setSaving(true)
    const sessionId = getOrCreateSessionId()
    await saveDailyGoal(sessionId, clamped)
    setSaving(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-gwc-text">Daily goal</p>
        <p className="text-xs text-gwc-muted">New cards per day</p>
      </div>
      <div className="flex items-center gap-3">
        {/* min-w/h = 44px satisfies Apple HIG touch target requirement */}
        <button
          onClick={() => update(goal - 1)}
          className="w-11 h-11 rounded-full bg-gwc-text/5 text-gwc-muted hover:bg-gwc-accent/20 hover:text-gwc-accent-soft transition-colors font-bold text-lg flex items-center justify-center"
        >
          −
        </button>
        <span className={`text-xl font-bold w-10 text-center ${saving ? 'text-gwc-muted' : 'text-gwc-accent-soft'}`}>
          {goal}
        </span>
        <button
          onClick={() => update(goal + 1)}
          className="w-11 h-11 rounded-full bg-gwc-text/5 text-gwc-muted hover:bg-gwc-accent/20 hover:text-gwc-accent-soft transition-colors font-bold text-lg flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [loading, setLoading]             = useState(true)
  const [progress, setProgress]           = useState<UserProgress | null>(null)
  const [stats, setStats]                 = useState<ProfileStats | null>(null)
  const [srsStages, setSrsStages]         = useState<SRSStages | null>(null)
  const [weekDays, setWeekDays]           = useState<string[]>([])
  const [activeDays, setActiveDays]       = useState<Set<string>>(new Set())
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([])
  const [userEmail, setUserEmail]         = useState<string | null>(null)
  const [displayName, setDisplayName]     = useState<string>('')
  const [editingName, setEditingName]     = useState(false)
  const [nameInput, setNameInput]         = useState('')
  const [nameError, setNameError]         = useState<string | null>(null)
  const [nameSaving, setNameSaving]       = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()

        // ── Run all queries in parallel ──────────────────────────────────────
        const [
          { data: { user } },
          { data: allReviews },
          { data: weekReviewData },
        ] = await Promise.all([
          supabase.auth.getUser(),

          // All review rows for SRS breakdown, total count, correct rate, mastered count
          supabase
            .from('gwc_video_reviews')
            .select('interval_days, updated_at, correct_reviews, total_reviews, repetitions, sentence_id')
            .eq('session_id', sessionId),

          // Reviews from this week (Mon–Sun) for the weekly dot view
          (() => {
            const days = getCurrentWeekDays()
            return supabase
              .from('gwc_video_reviews')
              .select('updated_at')
              .eq('session_id', sessionId)
              .gte('updated_at', days[0] + 'T00:00:00')
              .lte('updated_at', days[6] + 'T23:59:59')
          })(),
        ])

        if (user?.email) setUserEmail(user.email)

        // Load display name from progress row
        if (user) {
          const { data: progRow } = await supabase
            .from('gwc_user_progress')
            .select('display_name')
            .eq('session_id', user.id)
            .single()
          const name = progRow?.display_name ?? ''
          setDisplayName(name)
          setNameInput(name)
        }

        const reviews = allReviews || []

        // ── Stats ────────────────────────────────────────────────────────────
        const totalReviews = reviews.reduce((sum, r) => sum + (r.total_reviews || 0), 0)
        const correctCount = reviews.reduce((sum, r) => sum + (r.correct_reviews || 0), 0)
        const correctRate  = totalReviews > 0 ? Math.round((correctCount / totalReviews) * 100) : 0

        // Total sentences in the SRS deck
        const learnedWords = (allReviews || []).length

        // ── User progress (XP, streak, daily goal, german level) ────────────
        const prog = await getOrCreateProgress(sessionId)
        setProgress(prog)
        const daysStudied = prog?.days_studied ?? 0

        setStats({ totalReviews, correctRate, learnedWords, daysStudied })

        // ── SRS stage breakdown (by interval_days) ───────────────────────────
        const stages: SRSStages = { beginner: 0, seasoned: 0, adept: 0, expert: 0, master: 0 }
        reviews.forEach(r => {
          const d = r.interval_days ?? 1
          if (d <= 1)       stages.beginner++
          else if (d <= 3)  stages.seasoned++
          else if (d <= 7)  stages.adept++
          else if (d <= 14) stages.expert++
          else              stages.master++
        })
        setSrsStages(stages)

        // ── Weekly activity ───────────────────────────────────────────────────
        const days = getCurrentWeekDays()
        setWeekDays(days)
        const daySet = new Set(
          (weekReviewData || []).map(r => (r.updated_at as string).slice(0, 10))
        )
        setActiveDays(daySet)

        // ── Mastered sentences (repetitions >= 11) ──────────────────────────
        const masteredSentences = reviews.filter(r => (r.repetitions ?? 0) >= 11).length

        // ── Distinct videos with saved sentences ─────────────────────────────
        let distinctVideos = 0
        if (reviews.length > 0) {
          const sentenceIds = reviews.map(r => r.sentence_id).filter(Boolean)
          if (sentenceIds.length > 0) {
            const { data: sentRows } = await supabase
              .from('gwc_video_sentences')
              .select('video_id')
              .in('id', sentenceIds)
            const uniqueVids = new Set((sentRows ?? []).map(s => s.video_id))
            distinctVideos = uniqueVids.size
          }
        }

        // ── Check + award any new badges ─────────────────────────────────────
        await checkAndAwardBadges(sessionId, {
          streakCurrent: prog?.streak_current ?? 0,
          totalReviews,
          learnedWords,
          daysStudied,
          distinctVideos,
          masteredSentences,
        })

        // ── Load unlocked badges (after potentially awarding new ones) ────────
        const { data: badgeRows } = await supabase
          .from('gwc_user_badges')
          .select('badge_id, unlocked_at')
          .eq('session_id', sessionId)
          .order('unlocked_at', { ascending: false })

        setUnlockedBadges((badgeRows || []) as UnlockedBadge[])

      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveName() {
    setNameError(null)
    const error = validateDisplayName(nameInput)
    if (error) { setNameError(error); return }
    setNameSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('gwc_user_progress')
        .update({ display_name: nameInput.trim() })
        .eq('session_id', user.id)
      setDisplayName(nameInput.trim())
    }
    setEditingName(false)
    setNameSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gwc-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gwc-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const xp            = progress?.xp_total ?? 0
  const streak        = progress?.streak_current ?? 0
  const dailyGoal     = progress?.daily_goal ?? 10
  const totalCards    = srsStages
    ? srsStages.beginner + srsStages.seasoned + srsStages.adept + srsStages.expert + srsStages.master
    : 0
  const unlockedSet   = new Set(unlockedBadges.map(b => b.badge_id))
  const unlockedMap   = new Map(unlockedBadges.map(b => [b.badge_id, b.unlocked_at]))

  // Group badges by category for display
  const badgeCategories = [
    { label: 'Videos',          ids: ['videos_1', 'videos_3', 'videos_10', 'videos_25', 'videos_50'] },
    { label: 'Sentences',       ids: ['sentences_10', 'sentences_25', 'sentences_50', 'sentences_100', 'sentences_250', 'sentences_500', 'sentences_1000'] },
    { label: 'Mastered ⭐',     ids: ['mastered_1', 'mastered_5', 'mastered_25', 'mastered_100'] },
    { label: 'Streak',          ids: ['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90', 'streak_180', 'streak_365'] },
    { label: 'Reviews',         ids: ['reviews_50', 'reviews_100', 'reviews_250', 'reviews_500', 'reviews_1k', 'reviews_2500', 'reviews_5k', 'reviews_10k'] },
    { label: 'Days Studied',    ids: ['days_7', 'days_30', 'days_50', 'days_100', 'days_200', 'days_365'] },
  ]

  const statValues = {
    streakCurrent:     streak,
    totalReviews:      stats?.totalReviews ?? 0,
    learnedWords:      stats?.learnedWords ?? 0,
    daysStudied:       stats?.daysStudied ?? 0,
    distinctVideos:    0,   // loaded async above, reflected in unlockedBadges
    masteredSentences: 0,
  }

  return (
    <div className="min-h-screen bg-gwc-base">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* ── Header: Avatar + Level + XP bar ──────────────────────────────── */}
        <div className="bg-gwc-panel rounded-2xl p-6 border border-gwc-text/6">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-gwc-accent/20 border border-gwc-accent/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-gwc-accent-soft">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gwc-accent flex items-center justify-center text-white text-xs font-bold border-2 border-gwc-base">
                {getXPProgress(xp).level}
              </div>
            </div>
            {/* Name + XP total */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={e => { setNameInput(e.target.value); setNameError(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      maxLength={30}
                      autoFocus
                      placeholder="Your name"
                      className="flex-1 bg-gwc-text/5 border border-gwc-accent/40 rounded-lg px-3 py-1.5 text-sm text-gwc-text placeholder-[#4a4760] focus:outline-none focus:border-gwc-accent"
                    />
                    <button
                      onClick={saveName}
                      disabled={nameSaving}
                      className="px-3 py-1.5 rounded-lg bg-gwc-accent text-white text-xs font-bold hover:bg-gwc-accent-soft transition-colors disabled:opacity-50"
                    >
                      {nameSaving ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setNameInput(displayName); setNameError(null) }}
                      className="px-2 py-1.5 rounded-lg bg-gwc-text/5 text-gwc-muted text-xs hover:bg-gwc-text/8 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  {nameError && <p className="text-xs text-red-400">{nameError}</p>}
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="group flex items-center gap-1.5 text-left"
                >
                  <p className="text-gwc-text font-bold text-lg truncate">
                    {displayName || (userEmail ? userEmail.split('@')[0] : 'Set your name')}
                  </p>
                  <span className="text-xs text-gwc-dim group-hover:text-gwc-accent transition-colors">✏</span>
                </button>
              )}
              <p className="text-gwc-muted text-sm mt-0.5">{xp.toLocaleString('en')} XP total</p>
            </div>
            <Link href="/forecast" className="text-xs text-gwc-accent hover:text-gwc-accent-soft transition-colors shrink-0">
              Forecast→
            </Link>
          </div>
          {/* XP progress bar */}
          <XPBar xp={xp} />
        </div>

        {/* ── Streak + Week view ────────────────────────────────────────────── */}
        <div className="bg-gwc-panel rounded-2xl p-6 border border-gwc-text/6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gwc-text">Streak</h2>
              <p className="text-gwc-muted text-sm">{stats?.daysStudied ?? 0} days studied</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-400">🔥 {streak}</p>
              <p className="text-xs text-gwc-muted">
                {streak === 1 ? 'day' : 'days'} in a row
              </p>
            </div>
          </div>
          {/* Weekly dots */}
          {weekDays.length === 7 && (
            <WeekView activeDays={activeDays} weekDays={weekDays} />
          )}
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Reviews',    value: stats?.totalReviews ?? 0,  color: 'text-gwc-accent-soft' },
            { label: 'Correct',    value: `${stats?.correctRate ?? 0}%`, color: 'text-gwc-success' },
            { label: 'Sentences',  value: stats?.learnedWords ?? 0,  color: 'text-gwc-text' },
            { label: 'Days studied', value: stats?.daysStudied ?? 0,   color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gwc-panel rounded-2xl p-4 border border-gwc-text/6 text-center">
              <p className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</p>
              <p className="text-xs text-gwc-muted uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* ── SRS Stage Overview ────────────────────────────────────────────── */}
        <div className="bg-gwc-panel rounded-2xl p-6 border border-gwc-text/6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gwc-text">SRS progress</h2>
            <span className="text-sm text-gwc-muted">{totalCards} cards</span>
          </div>
          {srsStages && (
            <div className="space-y-4">
              <SRSBar label="Beginner (new)"      count={srsStages.beginner} total={totalCards} color="bg-red-400/80" />
              <SRSBar label="Seasoned (2-3 days)" count={srsStages.seasoned} total={totalCards} color="bg-orange-400/80" />
              <SRSBar label="Adept (4-7 days)"    count={srsStages.adept}   total={totalCards} color="bg-yellow-400/80" />
              <SRSBar label="Expert (8-14 days)"  count={srsStages.expert}  total={totalCards} color="bg-gwc-accent/80" />
              <SRSBar label="Master (15+ days)"   count={srsStages.master}  total={totalCards} color="bg-gwc-success/80" />
            </div>
          )}
        </div>

        {/* ── Badges ───────────────────────────────────────────────────────── */}
        <div className="bg-gwc-panel rounded-2xl p-6 border border-gwc-text/6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gwc-text">Achievements</h2>
            <span className="text-sm text-gwc-muted">
              {unlockedSet.size} / {BADGE_DEFS.length} unlocked
            </span>
          </div>

          {badgeCategories.map(({ label, ids }) => (
            <div key={label} className="mb-6 last:mb-0">
              <p className="text-xs text-gwc-muted uppercase tracking-wider font-bold mb-3">{label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ids.map(id => {
                  const def = BADGE_DEFS.find(b => b.id === id)
                  if (!def) return null
                  const unlocked = unlockedSet.has(id)
                  return (
                    <BadgeCard
                      key={id}
                      badge={def}
                      unlocked={unlocked}
                      unlockedAt={unlockedMap.get(id)}
                      progress={!unlocked ? getBadgeStat(def, statValues) : undefined}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Subscription ───────────────────────────────────────────────────── */}
        <SubscriptionSection />

        {/* ── Quick nav ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 py-3 rounded-xl bg-gwc-accent text-white font-bold text-center hover:bg-gwc-accent-soft transition-colors">
            Dashboard
          </Link>
          <Link href="/forecast" className="flex-1 py-3 rounded-xl bg-gwc-text/5 text-gwc-text font-bold text-center hover:bg-gwc-text/8 transition-colors border border-gwc-text/6">
            Forecast →
          </Link>
        </div>

      </div>
    </div>
  )
}
