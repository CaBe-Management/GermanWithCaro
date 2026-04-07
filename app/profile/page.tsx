'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
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
        <span className="text-xs text-[#9b98b0]">Lv {level}</span>
        <span className="text-xs text-[#9b98b0]">{xpInLevel} / {xpNeeded} XP</span>
        <span className="text-xs text-[#9b98b0]">Lv {level + 1}</span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#7c6df2] to-[#9b8cf5] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-[#9b98b0] mt-1">{pct}% to Level {level + 1}</p>
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
                ? 'bg-[#7c6df2] text-white shadow-md shadow-[#7c6df2]/30'
                : isToday
                  ? 'bg-white/5 text-[#9b8cf5] border-2 border-[#7c6df2]/40'
                  : 'bg-white/5 text-[#9b98b0]'
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
        <span className="text-[#e8e6f0] font-medium">{label}</span>
        <span className="text-[#9b98b0]">{count}</span>
      </div>
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
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
        ? 'bg-[#1a1830] border-[#7c6df2]/30 shadow-sm shadow-[#7c6df2]/10'
        : 'bg-[#0f0e17] border-white/5 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
          unlocked ? 'bg-[#7c6df2]/20' : 'bg-white/5'
        }`}>
          {unlocked ? badge.icon : '🔒'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${unlocked ? 'text-[#e8e6f0]' : 'text-[#9b98b0]'}`}>
            {badge.name}
          </p>
          <p className="text-xs text-[#9b98b0] mt-0.5 leading-tight">{badge.description}</p>
          {/* Progress bar for locked badges */}
          {!unlocked && progress !== undefined && (
            <div className="mt-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#7c6df2]/50 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-[#9b98b0] mt-0.5">{progress} / {badge.threshold}</p>
            </div>
          )}
          {/* Unlock date for unlocked badges */}
          {unlocked && unlockedAt && (
            <p className="text-xs text-[#7c6df2] mt-1">
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
        <p className="text-sm font-bold text-[#e8e6f0]">Daily Goal</p>
        <p className="text-xs text-[#9b98b0]">New cards per day</p>
      </div>
      <div className="flex items-center gap-3">
        {/* min-w/h = 44px satisfies Apple HIG touch target requirement */}
        <button
          onClick={() => update(goal - 1)}
          className="w-11 h-11 rounded-full bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5] transition-colors font-bold text-lg flex items-center justify-center"
        >
          −
        </button>
        <span className={`text-xl font-bold w-10 text-center ${saving ? 'text-[#9b98b0]' : 'text-[#9b8cf5]'}`}>
          {goal}
        </span>
        <button
          onClick={() => update(goal + 1)}
          className="w-11 h-11 rounded-full bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5] transition-colors font-bold text-lg flex items-center justify-center"
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

          // All review rows for SRS breakdown, total count, and correct rate
          supabase
            .from('gwc_user_reviews')
            .select('word_sentence_id, correct, interval_days, reviewed_at')
            .eq('session_id', sessionId),

          // Reviews from this week (Mon–Sun) for the weekly dot view
          (() => {
            const days = getCurrentWeekDays()
            return supabase
              .from('gwc_user_reviews')
              .select('reviewed_at')
              .eq('session_id', sessionId)
              .gte('reviewed_at', days[0] + 'T00:00:00')
              .lte('reviewed_at', days[6] + 'T23:59:59')
          })(),
        ])

        if (user?.email) setUserEmail(user.email)

        const reviews = allReviews || []

        // ── Stats ────────────────────────────────────────────────────────────
        const totalReviews = reviews.length
        const correctCount = reviews.filter(r => r.correct).length
        const correctRate  = totalReviews > 0 ? Math.round((correctCount / totalReviews) * 100) : 0

        // Unique words learned (distinct word_sentence → word)
        const reviewedSentenceIds = reviews.map(r => r.word_sentence_id)
        let learnedWords = 0
        if (reviewedSentenceIds.length > 0) {
          const { data: sentWords } = await supabase
            .from('gwc_word_sentences')
            .select('word_id')
            .in('id', reviewedSentenceIds)
          learnedWords = new Set((sentWords || []).map((s: { word_id: string }) => s.word_id)).size
        }

        // ── User progress (XP, streak, daily goal) ──────────────────────────
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
          (weekReviewData || []).map(r => (r.reviewed_at as string).slice(0, 10))
        )
        setActiveDays(daySet)

        // ── Check + award any new badges ─────────────────────────────────────
        await checkAndAwardBadges(sessionId, {
          streakCurrent: prog?.streak_current ?? 0,
          totalReviews,
          learnedWords,
          daysStudied,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
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
    { label: 'Streak',          ids: ['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90', 'streak_180', 'streak_365'] },
    { label: 'Days Studied',    ids: ['days_7', 'days_30', 'days_50', 'days_100', 'days_200', 'days_365'] },
    { label: 'Reviews',         ids: ['reviews_50', 'reviews_100', 'reviews_250', 'reviews_500', 'reviews_1k', 'reviews_2500', 'reviews_5k', 'reviews_10k'] },
    { label: 'Words Learned',   ids: ['words_10', 'words_25', 'words_50', 'words_100', 'words_250', 'words_500', 'words_750', 'words_1000'] },
  ]

  const statValues = {
    streakCurrent: streak,
    totalReviews:  stats?.totalReviews ?? 0,
    learnedWords:  stats?.learnedWords ?? 0,
    daysStudied:   stats?.daysStudied ?? 0,
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* ── Header: Avatar + Level + XP bar ──────────────────────────────── */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#7c6df2]/20 border border-[#7c6df2]/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#9b8cf5]">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7c6df2] flex items-center justify-center text-white text-xs font-bold border-2 border-[#0f0e17]">
                {getXPProgress(xp).level}
              </div>
            </div>
            {/* Name + XP total */}
            <div className="flex-1 min-w-0">
              <p className="text-[#e8e6f0] font-bold text-lg truncate">
                {userEmail ?? 'Profile'}
              </p>
              <p className="text-[#9b98b0] text-sm">{xp.toLocaleString('en')} XP total</p>
            </div>
            <Link href="/forecast" className="text-xs text-[#7c6df2] hover:text-[#9b8cf5] transition-colors shrink-0">
              Forecast →
            </Link>
          </div>
          {/* XP progress bar */}
          <XPBar xp={xp} />
        </div>

        {/* ── Streak + Week view ────────────────────────────────────────────── */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#e8e6f0]">Streak</h2>
              <p className="text-[#9b98b0] text-sm">{stats?.daysStudied ?? 0} total days studied</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-400">🔥 {streak}</p>
              <p className="text-xs text-[#9b98b0]">
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
            { label: 'Reviews',    value: stats?.totalReviews ?? 0,  color: 'text-[#9b8cf5]' },
            { label: 'Correct',    value: `${stats?.correctRate ?? 0}%`, color: 'text-[#4ade80]' },
            { label: 'Words',      value: stats?.learnedWords ?? 0,  color: 'text-[#e8e6f0]' },
            { label: 'Days',       value: stats?.daysStudied ?? 0,   color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#1a1830] rounded-2xl p-4 border border-white/5 text-center">
              <p className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</p>
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* ── SRS Stage Overview ────────────────────────────────────────────── */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#e8e6f0]">SRS Progress</h2>
            <span className="text-sm text-[#9b98b0]">{totalCards} Cards</span>
          </div>
          {srsStages && (
            <div className="space-y-4">
              <SRSBar label="Beginner (new)"      count={srsStages.beginner} total={totalCards} color="bg-red-400/80" />
              <SRSBar label="Seasoned (2–3 days)" count={srsStages.seasoned} total={totalCards} color="bg-orange-400/80" />
              <SRSBar label="Adept (4–7 days)"    count={srsStages.adept}   total={totalCards} color="bg-yellow-400/80" />
              <SRSBar label="Expert (8–14 days)"  count={srsStages.expert}  total={totalCards} color="bg-[#7c6df2]/80" />
              <SRSBar label="Master (15+ days)"   count={srsStages.master}  total={totalCards} color="bg-[#4ade80]/80" />
            </div>
          )}
        </div>

        {/* ── Badges ───────────────────────────────────────────────────────── */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#e8e6f0]">Achievements</h2>
            <span className="text-sm text-[#9b98b0]">
              {unlockedSet.size} / {BADGE_DEFS.length} unlocked
            </span>
          </div>

          {badgeCategories.map(({ label, ids }) => (
            <div key={label} className="mb-6 last:mb-0">
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider font-bold mb-3">{label}</p>
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

        {/* ── Quick nav ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 py-3 rounded-xl bg-[#7c6df2] text-white font-bold text-center hover:bg-[#9b8cf5] transition-colors">
            Dashboard
          </Link>
          <Link href="/forecast" className="flex-1 py-3 rounded-xl bg-white/5 text-[#e8e6f0] font-bold text-center hover:bg-white/10 transition-colors border border-white/5">
            Forecast →
          </Link>
        </div>

      </div>
    </div>
  )
}
