'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { getOrCreateProgress, getXPProgress, BADGE_DEFS } from '@/lib/gamification'
import type { UserProgress } from '@/lib/gamification'
import { getPathById } from '@/lib/paths'
import type { GrammarTopic, GrammarSentence } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LevelProgress {
  level: string
  vocabTotal: number; vocabLearned: number
  grammarTotal: number; grammarLearned: number
}

interface ActivePath {
  id: string; path_id: string; queue_position: number
  daily_goal: number; batch_size: number
}

interface ForecastDay { date: string; label: string; vocab: number; grammar: number }
interface ActivityDay { date: string; vocab: number; grammar: number }
type SrsStage = 'Beginner' | 'Seasoned' | 'Adept' | 'Expert' | 'Master'
type SrsBreakdown = Record<SrsStage, { vocab: number; grammar: number }>

// ─── SRS config ───────────────────────────────────────────────────────────────

const SRS_STAGES: { name: SrsStage; emoji: string; color: string; textColor: string }[] = [
  { name: 'Beginner', emoji: '🌱', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { name: 'Seasoned', emoji: '📗', color: 'bg-blue-500',    textColor: 'text-blue-400'    },
  { name: 'Adept',    emoji: '⭐', color: 'bg-purple-500',  textColor: 'text-purple-400'  },
  { name: 'Expert',   emoji: '🎯', color: 'bg-orange-500',  textColor: 'text-orange-400'  },
  { name: 'Master',   emoji: '👑', color: 'bg-[#7c6df2]',   textColor: 'text-[#9b8cf5]'   },
]

function classifySrs(intervalDays: number): SrsStage {
  if (intervalDays <= 1)  return 'Beginner'
  if (intervalDays <= 7)  return 'Seasoned'
  if (intervalDays <= 21) return 'Adept'
  if (intervalDays <= 90) return 'Expert'
  return 'Master'
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function offsetDateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function dayLabel(offset: number, dateStr: string): string {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function pastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => offsetDateStr(-(n - 1 - i)))
}

// ─── Level Progress Bar ───────────────────────────────────────────────────────

function LevelBar({ data, view }: { data: LevelProgress; view: 'all' | 'vocab' | 'grammar' }) {
  const colors: Record<string, string> = {
    A1: 'bg-emerald-500', A2: 'bg-green-500', B1: 'bg-blue-500',
    B2: 'bg-purple-500',  C1: 'bg-red-500',
  }
  const bar = colors[data.level] ?? 'bg-[#7c6df2]'
  const learned = view === 'vocab'   ? data.vocabLearned
                : view === 'grammar' ? data.grammarLearned
                : data.vocabLearned + data.grammarLearned
  const total   = view === 'vocab'   ? data.vocabTotal
                : view === 'grammar' ? data.grammarTotal
                : data.vocabTotal + data.grammarTotal
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-[#9b98b0] w-5 shrink-0">{data.level}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${bar}/70 transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-[#9b98b0] w-16 text-right shrink-0">{learned}/{total}</span>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [loading, setLoading]             = useState(true)
  const [userProgress, setUserProgress]   = useState<UserProgress | null>(null)
  const [userEmail, setUserEmail]         = useState<string | null>(null)
  const [allDue, setAllDue]               = useState(0)
  const [vocabDue, setVocabDue]           = useState(0)
  const [grammarDue, setGrammarDue]       = useState(0)
  const [activePaths, setActivePaths]     = useState<ActivePath[]>([])
  const [recentBadges, setRecentBadges]   = useState<{ id: string; name: string; icon: string }[]>([])
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([])
  const [progressView, setProgressView]   = useState<'all' | 'vocab' | 'grammar'>('all')
  const [forecast, setForecast]           = useState<ForecastDay[]>([])
  const [activity, setActivity]           = useState<ActivityDay[]>([])
  const [srsBreakdown, setSrsBreakdown]   = useState<SrsBreakdown>({
    Beginner: { vocab: 0, grammar: 0 }, Seasoned: { vocab: 0, grammar: 0 },
    Adept: { vocab: 0, grammar: 0 },    Expert: { vocab: 0, grammar: 0 },
    Master: { vocab: 0, grammar: 0 },
  })
  const [srsView, setSrsView]             = useState<'all' | 'vocab' | 'grammar'>('all')
  const [totalItems, setTotalItems]       = useState(0)
  const [accuracy24h, setAccuracy24h]     = useState<number | null>(null)
  const [learnExpanded, setLearnExpanded]   = useState(true)
  const [reviewExpanded, setReviewExpanded] = useState(false)
  const [vocabDoneToday, setVocabDoneToday]     = useState(0)
  const [grammarDoneToday, setGrammarDoneToday] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now = new Date()
        const nowISO = now.toISOString()
        const sevenDaysLater = new Date(now.getTime() + 7 * 86400000)
        const past14Start = pastDays(14)[0]
        const yesterday = new Date(now.getTime() - 86400000)

        // ── All queries run in parallel ──────────────────────────────────────
        const [
          { data: { user } },
          { count: allDueCount },
          { count: vocabDueCount },
          { count: grammarDueCount },
          { data: pathRows },
          { data: badgeRows },
          { data: forecastRows },
          { data: activityRows },
          { data: srsRows },
          { data: accuracyRows },
          { data: vocab },
          { data: grammarSentences },
          { data: grammarTopics },
          { data: vocabReviewRows },
          { data: grammarReviewRows },
          progressData,
        ] = await Promise.all([
          supabase.auth.getUser(),
          // Total reviews due now (vocab + grammar)
          supabase.from('gwc_vocab_reviews').select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId).lte('next_review_at', nowISO),
          // Vocab reviews due now
          supabase.from('gwc_vocab_reviews').select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId).lte('next_review_at', nowISO),
          // Grammar reviews due now
          supabase.from('gwc_grammar_reviews').select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId).lte('next_review_at', nowISO),
          // Active paths
          supabase.from('gwc_user_paths').select('*')
            .eq('session_id', sessionId).eq('active', true).order('queue_position'),
          // Last 3 badges (most recently earned)
          supabase.from('gwc_user_badges').select('badge_id, created_at')
            .eq('session_id', sessionId).order('created_at', { ascending: false }).limit(3),
          // Upcoming reviews (next 7 days) for forecast chart
          supabase.from('gwc_vocab_reviews').select('next_review_at')
            .eq('session_id', sessionId)
            .gte('next_review_at', nowISO)
            .lte('next_review_at', sevenDaysLater.toISOString()),
          // Past 14 days reviews for activity chart
          supabase.from('gwc_vocab_reviews').select('reviewed_at')
            .eq('session_id', sessionId)
            .gte('reviewed_at', past14Start + 'T00:00:00')
            .lte('reviewed_at', nowISO),
          // All reviewed items for SRS breakdown (interval_days tells us the stage)
          supabase.from('gwc_vocab_reviews').select('interval_days')
            .eq('session_id', sessionId).not('next_review_at', 'is', null),
          // Last 24h reviews for accuracy stat
          supabase.from('gwc_user_reviews').select('correct')
            .eq('session_id', sessionId).gte('reviewed_at', yesterday.toISOString()),
          // All vocab with their CEFR level (for level progress bars)
          supabase.from('gwc_vocab').select('id, level'),
          // All grammar sentences (to count totals per level)
          supabase.from('gwc_grammar_sentences').select('id, topic_id'),
          // Grammar topics (maps topic_id → level)
          supabase.from('gwc_grammar_topics').select('id, level'),
          // Vocab review history (vocab_id → used to compute unique vocab learned per level)
          supabase.from('gwc_vocab_reviews').select('vocab_id, reviewed_at')
            .eq('session_id', sessionId),
          // Grammar review history
          supabase.from('gwc_grammar_reviews').select('topic_id, updated_at, interval_days')
            .eq('session_id', sessionId),
          // User XP, streak, daily goal
          getOrCreateProgress(sessionId),
        ])

        // ── User auth ────────────────────────────────────────────────────────
        if (user?.email) setUserEmail(user.email)

        // ── Due counts ──────────────────────────────────────────────────────
        setAllDue(allDueCount ?? 0)
        setVocabDue(vocabDueCount ?? 0)
        setGrammarDue(grammarDueCount ?? 0)

        // ── Done today per type (for per-path progress in Learn box) ─────────
        const todayStart = offsetDateStr(0) + 'T00:00:00'
        setVocabDoneToday(
          (vocabReviewRows || []).filter((r: { reviewed_at: string }) => r.reviewed_at && r.reviewed_at >= todayStart).length
        )
        setGrammarDoneToday(
          (grammarReviewRows || []).filter((r: { updated_at: string }) => r.updated_at && r.updated_at >= todayStart).length
        )

        // ── Active paths ─────────────────────────────────────────────────────
        setActivePaths((pathRows || []) as ActivePath[])

        // ── Badges: map badge_id → name + icon from BADGE_DEFS ───────────────
        const badges = (badgeRows || [])
          .map((b: { badge_id: string }) => {
            const def = BADGE_DEFS.find(d => d.id === b.badge_id)
            return def ? { id: def.id, name: def.name, icon: def.icon } : null
          })
          .filter(Boolean) as { id: string; name: string; icon: string }[]
        setRecentBadges(badges)

        // ── Forecast: group upcoming reviews by date (vocab + grammar) ──
        const fcMap: Record<string, { vocab: number; grammar: number }> = {}
        for (let i = 0; i < 7; i++) { const d = offsetDateStr(i); fcMap[d] = { vocab: 0, grammar: 0 } }
        ;(forecastRows || []).forEach((r: { next_review_at: string }) => {
          const d = r.next_review_at.slice(0, 10)
          if (d in fcMap) fcMap[d].vocab++
        })
        setForecast(
          Object.entries(fcMap).map(([date, counts], i) => ({
            date, label: dayLabel(i, date), ...counts,
          }))
        )

        // ── Activity: past 14 days (vocab + grammar) ──────────────────────────
        const past14 = pastDays(14)
        const actMap: Record<string, { vocab: number; grammar: number }> = {}
        past14.forEach(d => { actMap[d] = { vocab: 0, grammar: 0 } })
        ;(activityRows || []).forEach((r: { reviewed_at: string }) => {
          const d = r.reviewed_at.slice(0, 10)
          if (d in actMap) actMap[d].vocab++
        })
        ;(grammarReviewRows || []).forEach((r: { updated_at: string }) => {
          const d = r.updated_at.slice(0, 10)
          if (d in actMap) actMap[d].grammar++
        })
        setActivity(past14.map(date => ({ date, ...actMap[date] })))

        // ── SRS breakdown: vocab + grammar ────────────────────────────────────
        const srs: SrsBreakdown = {
          Beginner: { vocab: 0, grammar: 0 }, Seasoned: { vocab: 0, grammar: 0 },
          Adept: { vocab: 0, grammar: 0 },    Expert: { vocab: 0, grammar: 0 },
          Master: { vocab: 0, grammar: 0 },
        }
        ;(srsRows || []).forEach((r: { interval_days: number }) => {
          const stage = classifySrs(r.interval_days ?? 0)
          srs[stage].vocab++
        })
        ;(grammarReviewRows || []).forEach((r: { interval_days: number }) => {
          const stage = classifySrs(r.interval_days ?? 0)
          srs[stage].grammar++
        })
        setSrsBreakdown(srs)
        const vocabSrsCount = (srsRows || []).length
        const grammarSrsCount = (grammarReviewRows || []).length
        setTotalItems(vocabSrsCount + grammarSrsCount)

        // ── Accuracy: % correct in last 24h ──────────────────────────────────
        // Accuracy from gwc_user_reviews (vocab only, since grammar_reviews stores interval/repetitions not individual correct/incorrect)
        if (accuracyRows && accuracyRows.length > 0) {
          const correct = accuracyRows.filter((r: { correct: boolean }) => r.correct).length
          setAccuracy24h(Math.round((correct / accuracyRows.length) * 100))
        }

        // ── Vocab level progress ──────────────────────────────────────────────
        const vocabTotalByLevel: Record<string, number> = {}
        const vocabLevelMap: Record<string, string> = {}
        for (const v of (vocab || [])) {
          vocabTotalByLevel[v.level] = (vocabTotalByLevel[v.level] || 0) + 1
          vocabLevelMap[v.id] = v.level
        }

        // Compute learned: distinct vocab_id per level from gwc_vocab_reviews
        const vocabLearnedByLevel: Record<string, number> = {}
        const seenVocabIds = new Set<string>()
        for (const r of (vocabReviewRows || []) as { vocab_id: string }[]) {
          if (seenVocabIds.has(r.vocab_id)) continue
          seenVocabIds.add(r.vocab_id)
          const level = vocabLevelMap[r.vocab_id]
          if (level) vocabLearnedByLevel[level] = (vocabLearnedByLevel[level] || 0) + 1
        }

        // ── Grammar level progress ────────────────────────────────────────────
        const topicLevelMap: Record<string, string> = {}
        for (const t of (grammarTopics as GrammarTopic[] || [])) topicLevelMap[t.id] = t.level

        const grammarTotalByLevel: Record<string, number> = {}
        for (const t of (grammarTopics as GrammarTopic[] || [])) {
          if (t.level) grammarTotalByLevel[t.level] = (grammarTotalByLevel[t.level] || 0) + 1
        }

        const grammarLearnedByLevel: Record<string, number> = {}
        const seenTopicIds = new Set<string>()
        for (const r of (grammarReviewRows || []) as { topic_id: string }[]) {
          if (seenTopicIds.has(r.topic_id)) continue
          seenTopicIds.add(r.topic_id)
          const level = topicLevelMap[r.topic_id]
          if (level) grammarLearnedByLevel[level] = (grammarLearnedByLevel[level] || 0) + 1
        }

        // ── Merge into LevelProgress[] ────────────────────────────────────────
        const allLevels = [...new Set([
          ...Object.keys(vocabTotalByLevel),
          ...Object.keys(grammarTotalByLevel),
        ])].sort()
        setLevelProgress(allLevels.map(level => ({
          level,
          vocabTotal:     vocabTotalByLevel[level]     ?? 0,
          vocabLearned:   vocabLearnedByLevel[level]   ?? 0,
          grammarTotal:   grammarTotalByLevel[level]   ?? 0,
          grammarLearned: grammarLearnedByLevel[level] ?? 0,
        })))

        setUserProgress(progressData)

      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived values ────────────────────────────────────────────────────────────

  const todayDateStr = offsetDateStr(0)

  // Header "Learn X/Y": sum of per-path batch_size vs sum of per-path done today
  const pathsDailyGoal = activePaths.reduce((sum, p) => sum + (p.batch_size ?? 0), 0)
  const pathsDoneToday = activePaths.reduce((sum, p) => {
    const def = getPathById(p.path_id)
    if (!def) return sum
    const done = def.type === 'vocab'   ? vocabDoneToday
               : def.type === 'grammar' ? grammarDoneToday
               : vocabDoneToday + grammarDoneToday
    return sum + Math.min(done, p.batch_size ?? 0)
  }, 0)
  const dailyGoal  = pathsDailyGoal
  const doneCapped = pathsDoneToday

  const xpInfo   = userProgress ? getXPProgress(userProgress.xp_total) : null
  const username = userEmail ? userEmail.split('@')[0] : null

  // Weekly streak dot calculation (Mon=0 … Sun=6)
  const todayDate = new Date()
  const todayDow  = (todayDate.getDay() + 6) % 7
  const studiedDow = new Set<number>()
  if (userProgress?.streak_last_date) {
    const lastStudy = new Date(userProgress.streak_last_date)
    const weekMonday = new Date(todayDate)
    weekMonday.setDate(todayDate.getDate() - todayDow)
    weekMonday.setHours(0, 0, 0, 0)
    for (let i = 0; i < (userProgress.streak_current ?? 0) && i < 7; i++) {
      const d = new Date(lastStudy)
      d.setDate(lastStudy.getDate() - i)
      if (d >= weekMonday) studiedDow.add((d.getDay() + 6) % 7)
    }
  }

  // Max values for chart scaling
  const forecastMax  = Math.max(...forecast.map(d => d.vocab + d.grammar), 1)
  const activityMax  = Math.max(...activity.map(d => d.vocab + d.grammar), 1)
  const srsTotalMax  = Math.max(
    ...SRS_STAGES.map(s => {
      const c = srsBreakdown[s.name]
      if (srsView === 'vocab') return c.vocab
      if (srsView === 'grammar') return c.grammar
      return c.vocab + c.grammar
    }), 1
  )

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* ════════════════════════════════════════════════════════════════════
            TOP ROW — 2 columns on desktop, stacked on mobile
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ── Left Column: Learn + Review boxes ── */}
          <div className="space-y-3">

            {/* Learn box */}
            <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden">
              {/* Header — click to expand/collapse */}
              <button
                onClick={() => setLearnExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#7c6df2] rounded-full" />
                  <span className="font-bold text-[#e8e6f0]">Learn</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* X / Y progress */}
                  <span className="text-sm font-bold text-[#9b8cf5]">
                    {loading ? '…' : `${doneCapped} / ${dailyGoal}`}
                  </span>
                  {/* Dot indicators — only when goal is small enough */}
                  {!loading && dailyGoal > 0 && dailyGoal <= 20 && (
                    <div className="flex gap-1">
                      {Array.from({ length: dailyGoal }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${i < doneCapped ? 'bg-[#7c6df2]' : 'bg-white/15'}`}
                        />
                      ))}
                    </div>
                  )}
                  {/* Play button */}
                  <Link
                    href="/learn"
                    onClick={e => e.stopPropagation()}
                    className="w-8 h-8 rounded-full bg-[#7c6df2] flex items-center justify-center text-white hover:bg-[#9b8cf5] transition-colors shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </Link>
                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-[#9b98b0] transition-transform duration-200 ${learnExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded: active paths list */}
              {learnExpanded && (
                <div className="border-t border-white/5">
                  {loading ? (
                    <div className="flex items-center justify-center py-5">
                      <div className="w-5 h-5 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : activePaths.length === 0 ? (
                    <div className="text-center px-5 py-5">
                      <p className="text-[#9b98b0] text-sm mb-2">No decks active yet.</p>
                      <Link href="/learn-settings" className="text-sm text-[#7c6df2] hover:text-[#9b8cf5] transition-colors">
                        + Add a Deck
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {activePaths.map(path => {
                        const def = getPathById(path.path_id)
                        if (!def) return null
                        // Estimate done today based on path type
                        const pathDone = def.type === 'vocab'   ? vocabDoneToday
                                       : def.type === 'grammar' ? grammarDoneToday
                                       : vocabDoneToday + grammarDoneToday
                        const doneClamped = Math.min(pathDone, path.batch_size)
                        return (
                          <Link
                            key={path.id}
                            href={`/learn?path=${path.path_id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
                          >
                            <span className="text-lg shrink-0">{def.icon}</span>
                            <p className="flex-1 text-sm text-[#e8e6f0] font-medium truncate">{def.name}</p>
                            {/* Type badge */}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30 shrink-0">
                              {def.badge}
                            </span>
                            {/* done / batch_size */}
                            <span className="text-xs text-[#9b98b0] font-bold shrink-0 min-w-[36px] text-right">
                              {doneClamped}/{path.batch_size}
                            </span>
                          </Link>
                        )
                      })}
                      {/* Learn Queue Settings link */}
                      <div className="px-5 py-2.5">
                        <Link
                          href="/learn-settings"
                          className="text-xs text-[#7c6df2] hover:text-[#9b8cf5] transition-colors"
                        >
                          Learn Queue Settings →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Review box */}
            <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setReviewExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-6 rounded-full ${allDue > 0 ? 'bg-orange-500' : 'bg-white/15'}`} />
                  <span className="font-bold text-[#e8e6f0]">Review — All Reviews</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Count badge */}
                  {!loading && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      allDue > 0
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-white/5 text-[#9b98b0] border-white/10'
                    }`}>
                      {allDue}
                    </span>
                  )}
                  {/* Play button */}
                  <Link
                    href="/review"
                    onClick={e => e.stopPropagation()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors shrink-0 ${
                      allDue > 0 ? 'bg-orange-500 hover:bg-orange-400' : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </Link>
                  <svg
                    className={`w-4 h-4 text-[#9b98b0] transition-transform duration-200 ${reviewExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded: Grammar Only / Vocab Only breakdown */}
              {reviewExpanded && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  <Link
                    href="/review?type=grammar"
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-[#9b98b0]">Grammar Only</span>
                    <span className="text-sm font-bold text-[#9b98b0]">{loading ? '…' : grammarDue}</span>
                  </Link>
                  <Link
                    href="/review?type=vocab"
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-[#9b98b0]">Vocab Only</span>
                    <span className="text-sm font-bold text-[#9b98b0]">{loading ? '…' : vocabDue}</span>
                  </Link>
                </div>
              )}
            </div>

          </div>{/* end left column */}

          {/* ── Right Column: Profile Card ── */}
          <div className="bg-[#1a1830] rounded-2xl border border-white/5 p-5 space-y-5">

            {/* Username + Level + XP bar */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-[#e8e6f0] text-base leading-tight">{username ?? '…'}</p>
                <p className="text-sm text-[#9b98b0]">Lv. {xpInfo?.level ?? '—'}</p>
              </div>
              {xpInfo && (
                <div className="text-right min-w-0">
                  <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden mb-1 ml-auto">
                    <div
                      className="h-full rounded-full bg-[#7c6df2] transition-all duration-500"
                      style={{ width: `${xpInfo.pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#9b98b0]">{xpInfo.xpInLevel} / {xpInfo.xpNeeded} XP</p>
                </div>
              )}
            </div>

            {/* Streak + weekly day dots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-orange-400">
                  🔥 {userProgress?.streak_current ?? 0} day streak
                </span>
              </div>
              <div className="flex gap-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map((label, i) => {
                  const isStudied = studiedDow.has(i)
                  const isToday   = i === todayDow
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className={`text-[10px] font-medium ${isToday ? 'text-[#e8e6f0]' : 'text-[#9b98b0]'}`}>
                        {label}
                      </span>
                      <div className={`w-full aspect-square rounded-full border-2 flex items-center justify-center ${
                        isStudied
                          ? 'bg-orange-500 border-orange-500'
                          : isToday
                            ? 'border-white/30 bg-white/5'
                            : 'border-white/10'
                      }`}>
                        {isStudied && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Level Progress bars with Grammar & Vocab / Grammar / Vocab toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider">Level Progress</p>
                <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg">
                  {(['all','vocab','grammar'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setProgressView(v)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors min-h-[28px] ${
                        progressView === v ? 'bg-[#7c6df2] text-white' : 'text-[#9b98b0] hover:text-[#e8e6f0]'
                      }`}
                    >
                      {v === 'all' ? 'All' : v === 'vocab' ? 'Vocab' : 'Grammar'}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {['A1','A2','B1'].map(l => (
                    <div key={l} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#9b98b0] w-5">{l}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {levelProgress.map(data => (
                    <LevelBar key={data.level} data={data} view={progressView} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Badges — last 3 unlocked */}
            {!loading && recentBadges.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-2">Recent Badges</p>
                <div className="flex flex-wrap gap-2">
                  {recentBadges.map(badge => (
                    <div
                      key={badge.id}
                      title={badge.name}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span className="text-sm">{badge.icon}</span>
                      <span className="text-xs text-[#e8e6f0] font-medium">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats row: Days Studied / 24h Accuracy / Items in SRS */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <div className="text-center">
                <p className="text-lg font-bold text-[#9b8cf5]">{loading ? '…' : (userProgress?.days_studied ?? 0)}</p>
                <p className="text-[10px] text-[#9b98b0] uppercase tracking-wider">Days</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#e8e6f0]">
                  {loading ? '…' : accuracy24h !== null ? `${accuracy24h}%` : '—'}
                </p>
                <p className="text-[10px] text-[#9b98b0] uppercase tracking-wider">24h Acc.</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#e8e6f0]">{loading ? '…' : totalItems}</p>
                <p className="text-[10px] text-[#9b98b0] uppercase tracking-wider">Items</p>
              </div>
            </div>

          </div>{/* end right column */}

        </div>{/* end top row */}

        {/* ════════════════════════════════════════════════════════════════════
            MIDDLE — Forecast + Activity charts
        ════════════════════════════════════════════════════════════════════ */}

        {/* Forecast chart — upcoming reviews per day for next 7 days */}
        <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#e8e6f0]">Forecast</h2>
            <div className="flex items-center gap-3 text-[11px] text-[#9b98b0]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500/70 inline-block" />
                Vocab
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500/70 inline-block" />
                Grammar
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 h-3 bg-white/5 rounded animate-pulse" />
                  <div className="flex-1 h-5 bg-white/5 rounded animate-pulse" />
                  <div className="w-8 h-3 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {forecast.map((day, i) => {
                const total      = day.vocab + day.grammar
                const vocabPct   = forecastMax > 0 ? (day.vocab   / forecastMax) * 100 : 0
                const grammarPct = forecastMax > 0 ? (day.grammar / forecastMax) * 100 : 0
                const isToday    = i === 0
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className={`text-xs w-24 shrink-0 ${isToday ? 'text-[#9b8cf5] font-bold' : 'text-[#9b98b0]'}`}>
                      {day.label}
                    </div>
                    {/* Stacked vocab (green) + grammar (blue) bar */}
                    <div className="flex-1 h-5 bg-white/5 rounded-lg overflow-hidden flex">
                      {vocabPct > 0 && (
                        <div className="h-full bg-green-500/60 transition-all duration-700" style={{ width: `${vocabPct}%` }} />
                      )}
                      {grammarPct > 0 && (
                        <div className="h-full bg-blue-500/60 transition-all duration-700" style={{ width: `${grammarPct}%` }} />
                      )}
                    </div>
                    <div className={`text-xs font-bold w-8 text-right shrink-0 ${
                      total > 0 ? (isToday ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]') : 'text-[#9b98b0]'
                    }`}>
                      {total}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity chart — reviews done per day over past 14 days */}
        <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#e8e6f0]">Activity</h2>
            <div className="flex items-center gap-3 text-[11px] text-[#9b98b0]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500/70 inline-block" />
                Vocab
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500/70 inline-block" />
                Grammar
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-end gap-1 h-20">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="flex-1 bg-white/5 rounded-sm animate-pulse" style={{ height: `${30 + i * 4}%` }} />
              ))}
            </div>
          ) : (
            <>
              {/* Vertical bar chart, bars grow from bottom */}
              <div className="flex items-end gap-1 h-20 mb-2">
                {activity.map((day, i) => {
                  const total    = day.vocab + day.grammar
                  const isToday  = i === activity.length - 1
                  const heightPct = activityMax > 0
                    ? Math.max(total > 0 ? 6 : 0, Math.round((total / activityMax) * 100))
                    : 0
                  const vocabH   = total > 0 ? Math.round((day.vocab   / total) * heightPct) : 0
                  const grammarH = heightPct - vocabH
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col justify-end overflow-hidden rounded-sm"
                      style={{ height: `${heightPct}%` }}
                      title={`${day.date}: ${day.vocab} vocab, ${day.grammar} grammar`}
                    >
                      {vocabH > 0 && (
                        <div className={`w-full ${isToday ? 'bg-green-400' : 'bg-green-500/60'}`} style={{ height: `${vocabH}%` }} />
                      )}
                      {grammarH > 0 && (
                        <div className={`w-full ${isToday ? 'bg-blue-400' : 'bg-blue-500/60'}`} style={{ height: `${grammarH}%` }} />
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Date labels at start, middle, and end */}
              <div className="flex justify-between text-[10px] text-[#9b98b0]">
                <span>{activity[0]?.date.slice(5).replace('-', '/')}</span>
                <span>{activity[6]?.date.slice(5).replace('-', '/')}</span>
                <span className="text-[#9b8cf5] font-bold">Today</span>
              </div>
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            BOTTOM — SRS Level Breakdown
        ════════════════════════════════════════════════════════════════════ */}

        <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#e8e6f0]">SRS Level Breakdown</h2>
            <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg">
              {(['all','vocab','grammar'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setSrsView(v)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors min-h-[28px] ${
                    srsView === v ? 'bg-[#7c6df2] text-white' : 'text-[#9b98b0] hover:text-[#e8e6f0]'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'vocab' ? 'Vocab' : 'Grammar'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {SRS_STAGES.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-xs w-16 text-[#9b98b0]">{s.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 animate-pulse" />
                  <span className="text-xs text-[#9b98b0] w-8 text-right">—</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {SRS_STAGES.map(stage => {
                const counts = srsBreakdown[stage.name]
                const count  = srsView === 'vocab'   ? counts.vocab
                             : srsView === 'grammar' ? counts.grammar
                             : counts.vocab + counts.grammar
                const pct = srsTotalMax > 0 ? Math.round((count / srsTotalMax) * 100) : 0
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-base shrink-0">{stage.emoji}</span>
                    <span className={`text-xs font-bold w-16 shrink-0 ${stage.textColor}`}>{stage.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${stage.color}/70`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#9b98b0] w-10 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && totalItems > 0 && (
            <p className="text-[11px] text-[#9b98b0] mt-4 text-right">{totalItems} items in SRS</p>
          )}
        </div>

      </div>
    </div>
  )
}
