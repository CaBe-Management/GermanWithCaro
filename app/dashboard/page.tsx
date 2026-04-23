'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { getOrCreateProgress, getXPProgress, getLevelFromXP } from '@/lib/gamification'
import type { UserProgress } from '@/lib/gamification'
import Navbar from '@/components/Navbar'
import { ADMIN_EMAIL } from '@/lib/config'

const SRS_LABELS: { label: string; color: string; bgColor: string }[] = [
  { label: 'Novice',      color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  { label: 'Novice',      color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  { label: 'Novice',      color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  { label: 'Apprentice',  color: 'text-blue-400',    bgColor: 'bg-blue-500'    },
  { label: 'Apprentice',  color: 'text-blue-400',    bgColor: 'bg-blue-500'    },
  { label: 'Apprentice',  color: 'text-blue-400',    bgColor: 'bg-blue-500'    },
  { label: 'Journeyman',  color: 'text-purple-400',  bgColor: 'bg-purple-500'  },
  { label: 'Journeyman',  color: 'text-purple-400',  bgColor: 'bg-purple-500'  },
  { label: 'Expert',      color: 'text-orange-400',  bgColor: 'bg-orange-500'  },
  { label: 'Expert',      color: 'text-orange-400',  bgColor: 'bg-orange-500'  },
  { label: 'Master',      color: 'text-gwc-accent-soft',   bgColor: 'bg-gwc-accent'   },
  { label: '⭐ Mastered', color: 'text-yellow-400',  bgColor: 'bg-yellow-500'  },
]

type SrsStageKey = 'Novice' | 'Apprentice' | 'Journeyman' | 'Expert' | 'Master'
const SRS_STAGE_ORDER: SrsStageKey[] = ['Novice', 'Apprentice', 'Journeyman', 'Expert', 'Master']
const SRS_STAGE_META: Record<SrsStageKey, { color: string; bg: string }> = {
  Novice:     { color: 'text-emerald-400', bg: 'bg-emerald-500' },
  Apprentice: { color: 'text-blue-400',    bg: 'bg-blue-500'    },
  Journeyman: { color: 'text-purple-400',  bg: 'bg-purple-500'  },
  Expert:     { color: 'text-orange-400',  bg: 'bg-orange-500'  },
  Master:     { color: 'text-gwc-accent-soft',   bg: 'bg-gwc-accent'  },
}

function classifyStage(srsLevel: number): SrsStageKey {
  if (srsLevel <= 2) return 'Novice'
  if (srsLevel <= 5) return 'Apprentice'
  if (srsLevel <= 7) return 'Journeyman'
  if (srsLevel <= 9) return 'Expert'
  return 'Master'
}

// Past N day strings
function pastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
}

export default function Dashboard() {
  const [loading, setLoading]           = useState(true)
  const [userEmail, setUserEmail]       = useState<string | null>(null)
  const [displayName, setDisplayName]   = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [reviewDue, setReviewDue]       = useState(0)
  const [totalSentences, setTotalSentences] = useState(0)     // all video sentences in SRS
  const [learnedToday, setLearnedToday] = useState(0)
  const [srsBreakdown, setSrsBreakdown] = useState<Record<SrsStageKey, number>>({
    Novice: 0, Apprentice: 0, Journeyman: 0, Expert: 0, Master: 0,
  })
  const [recentVideos, setRecentVideos] = useState<{ id: string; title: string; level: string; sentence_count: number }[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const sessionId = getOrCreateSessionId()
      const now = new Date().toISOString()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayISO = todayStart.toISOString()

      const [
        { data: { user } },
        { count: videoDue },
        { data: allVideoReviews },
        { data: videos },
        progressData,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('gwc_video_reviews').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).lte('next_review_at', now),
        // All video reviews for SRS breakdown
        supabase.from('gwc_video_reviews').select('repetitions, updated_at').eq('session_id', sessionId),
        // 3 most recent published videos
        supabase.from('gwc_videos').select('id, title, level, gwc_video_sentences(id)').eq('is_draft', false).order('sort_order').order('created_at', { ascending: false }).limit(3),
        getOrCreateProgress(sessionId),
      ])

      if (user?.email) setUserEmail(user.email)
      // Load display name
      if (user) {
        const { data: progRow } = await supabase
          .from('gwc_user_progress')
          .select('display_name')
          .eq('session_id', user.id)
          .single()
        if (progRow?.display_name) setDisplayName(progRow.display_name)
      }
      setReviewDue(videoDue ?? 0)
      setTotalSentences(allVideoReviews?.length ?? 0)

      // Learned today: video reviews updated today
      const todayUpdated = (allVideoReviews ?? []).filter((r: { updated_at: string }) =>
        r.updated_at && r.updated_at >= todayISO
      )
      setLearnedToday(todayUpdated.length)

      // SRS breakdown
      const breakdown: Record<SrsStageKey, number> = { Novice: 0, Apprentice: 0, Journeyman: 0, Expert: 0, Master: 0 }
      for (const r of (allVideoReviews ?? [])) {
        const stage = classifyStage(r.repetitions ?? 0)
        breakdown[stage]++
      }
      setSrsBreakdown(breakdown)

      // Recent videos
      if (videos) {
        setRecentVideos(videos.map((v: { id: string; title: string; level: string; gwc_video_sentences?: { id: string }[] }) => ({
          id: v.id,
          title: v.title,
          level: v.level,
          sentence_count: v.gwc_video_sentences?.length ?? 0,
        })))
      }

      setUserProgress(progressData)
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }

  const xpInfo   = userProgress ? getXPProgress(userProgress.xp_total) : null
  const username = displayName || (userEmail ? userEmail.split('@')[0] : null)
  const level    = xpInfo ? getLevelFromXP(userProgress?.xp_total ?? 0) : null

  // Weekly streak dots (Mon → Sun)
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

  const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const totalInSRS = Object.values(srsBreakdown).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gwc-base">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-end justify-between pb-2 border-b border-gwc-text/8">
          <div>
            <h1 className="font-display text-3xl text-gwc-text leading-tight">
              {loading ? '…' : `Hey, ${username ?? 'there'}.`}
            </h1>
            {!loading && userProgress?.streak_current ? (
              <p className="font-mono text-[10px] text-gwc-muted tracking-widest uppercase mt-1">
                🔥 {userProgress.streak_current} day streak
              </p>
            ) : null}
          </div>
          {level !== null && (
            <div className="text-right">
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">Level</p>
              <p className="font-display text-3xl text-gwc-accent leading-none">{level}</p>
            </div>
          )}
        </div>

        {/* ── Review + Sentences row ── */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/review"
            className={`p-5 rounded-xl border flex flex-col gap-4 transition-all hover:shadow-sm ${
              reviewDue > 0
                ? 'bg-orange-500/8 border-orange-500/25 hover:border-orange-500/40'
                : 'bg-gwc-panel border-gwc-text/8 hover:border-gwc-text/20'
            }`}
          >
            <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">
              {reviewDue > 0 ? 'Due now' : 'Reviews'}
            </p>
            <div>
              <p className={`font-display text-4xl leading-none ${reviewDue > 0 ? 'text-orange-500' : 'text-gwc-muted'}`}>
                {loading ? '—' : reviewDue}
              </p>
              <p className="text-xs text-gwc-muted mt-1.5">
                {reviewDue > 0 ? 'Tap to start →' : 'All caught up ✓'}
              </p>
            </div>
          </Link>

          <Link
            href="/videos"
            className="p-5 rounded-xl border bg-gwc-panel border-gwc-text/8 hover:border-gwc-text/20 flex flex-col gap-4 transition-all hover:shadow-sm"
          >
            <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">In SRS</p>
            <div>
              <p className="font-display text-4xl text-gwc-accent leading-none">
                {loading ? '—' : totalSentences}
              </p>
              <p className="text-xs text-gwc-muted mt-1.5">sentences saved</p>
            </div>
          </Link>
        </div>

        {/* ── XP bar ── */}
        {xpInfo && (
          <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">XP Progress</p>
              <p className="font-mono text-[10px] text-gwc-muted">{xpInfo.xpInLevel} / {xpInfo.xpNeeded}</p>
            </div>
            <div className="h-1.5 bg-gwc-text/8 rounded-full overflow-hidden">
              <div className="h-full bg-gwc-accent rounded-full transition-all duration-700" style={{ width: `${xpInfo.pct}%` }} />
            </div>
            <p className="font-mono text-[9px] text-gwc-muted mt-2 tracking-wide">
              Level {xpInfo.level} → {xpInfo.level + 1}
            </p>
          </div>
        )}

        {/* ── Weekly streak ── */}
        {userProgress && (
          <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">This Week</p>
              <p className="font-mono text-[10px] text-gwc-muted">{userProgress.streak_current ?? 0} day streak</p>
            </div>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`w-full aspect-square rounded-md transition-all ${
                    studiedDow.has(i)
                      ? i === todayDow ? 'bg-gwc-accent' : 'bg-gwc-accent/60'
                      : i === todayDow ? 'border-2 border-gwc-accent/30 bg-gwc-accent/8' : 'bg-gwc-text/8'
                  }`} />
                  <span className="font-mono text-[9px] text-gwc-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SRS Breakdown ── */}
        {totalInSRS > 0 && (
          <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">SRS Breakdown</p>
              <p className="font-mono text-[10px] text-gwc-muted">{totalInSRS} total</p>
            </div>
            <div className="space-y-3">
              {SRS_STAGE_ORDER.map(stage => {
                const count = srsBreakdown[stage]
                const pct = totalInSRS > 0 ? (count / totalInSRS) * 100 : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-gwc-muted w-20 shrink-0 tracking-widest uppercase">{stage}</span>
                    <div className="flex-1 h-1 bg-gwc-text/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gwc-accent/70 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-gwc-muted w-5 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Recent Videos ── */}
        {recentVideos.length > 0 && (
          <div className="bg-gwc-panel rounded-xl border border-gwc-text/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase">Recent Videos</p>
              <Link href="/videos" className="font-mono text-[9px] text-gwc-accent tracking-widest uppercase hover:opacity-70 transition-opacity">View all →</Link>
            </div>
            <div className="space-y-1">
              {recentVideos.map(v => (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="flex items-center gap-3 py-2.5 border-b border-gwc-text/6 last:border-0 hover:opacity-70 transition-opacity"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-gwc-text truncate leading-snug">{v.title}</p>
                    <p className="font-mono text-[9px] text-gwc-muted mt-0.5 tracking-wide">{v.sentence_count} sentences · {v.level}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gwc-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Admin shortcut ── */}
        {userEmail === ADMIN_EMAIL && (
          <div className="border border-gwc-text/8 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase mb-1">Admin</p>
              <p className="font-display text-sm text-gwc-text">Video Management</p>
            </div>
            <Link
              href="/admin/videos"
              className="px-3 py-1.5 border border-gwc-text/10 text-gwc-muted rounded-lg font-mono text-[9px] tracking-widest uppercase hover:border-gwc-accent/30 hover:text-gwc-accent transition-colors"
            >
              Open →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
