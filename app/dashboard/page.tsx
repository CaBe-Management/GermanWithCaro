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
  { label: 'Master',      color: 'text-[#9b8cf5]',   bgColor: 'bg-[#7c6df2]'   },
  { label: '⭐ Mastered', color: 'text-yellow-400',  bgColor: 'bg-yellow-500'  },
]

type SrsStageKey = 'Novice' | 'Apprentice' | 'Journeyman' | 'Expert' | 'Master'
const SRS_STAGE_ORDER: SrsStageKey[] = ['Novice', 'Apprentice', 'Journeyman', 'Expert', 'Master']
const SRS_STAGE_META: Record<SrsStageKey, { color: string; bg: string }> = {
  Novice:     { color: 'text-emerald-400', bg: 'bg-emerald-500' },
  Apprentice: { color: 'text-blue-400',    bg: 'bg-blue-500'    },
  Journeyman: { color: 'text-purple-400',  bg: 'bg-purple-500'  },
  Expert:     { color: 'text-orange-400',  bg: 'bg-orange-500'  },
  Master:     { color: 'text-[#9b8cf5]',   bg: 'bg-[#7c6df2]'  },
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
  const username = userEmail ? userEmail.split('@')[0] : null
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
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e8e6f0]">
              {loading ? '…' : `Hey, ${username ?? 'there'} 👋`}
            </h1>
            <p className="text-sm text-[#9b98b0] mt-0.5">
              {loading ? '' : userProgress?.streak_current
                ? `🔥 ${userProgress.streak_current} day streak`
                : 'Start learning today!'}
            </p>
          </div>
          {level !== null && (
            <div className="bg-[#7c6df2]/20 border border-[#7c6df2]/30 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-[#9b98b0]">Level</p>
              <p className="text-2xl font-bold text-[#9b8cf5]">{level}</p>
            </div>
          )}
        </div>

        {/* ── Review + Videos row ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Review */}
          <Link
            href="/review"
            className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all hover:scale-[1.01] ${
              reviewDue > 0
                ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50'
                : 'bg-[#1a1830] border-white/8 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📚</span>
              {!loading && (
                <span className={`text-2xl font-bold ${reviewDue > 0 ? 'text-orange-400' : 'text-[#9b98b0]'}`}>
                  {reviewDue}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e6f0]">Reviews due</p>
              <p className="text-xs text-[#9b98b0] mt-0.5">
                {reviewDue > 0 ? 'Time to review!' : 'All caught up ✓'}
              </p>
            </div>
          </Link>

          {/* Videos */}
          <Link
            href="/videos"
            className="p-5 rounded-2xl border bg-[#1a1830] border-white/8 hover:border-[#7c6df2]/40 flex flex-col gap-3 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🎬</span>
              {!loading && (
                <span className="text-2xl font-bold text-[#9b8cf5]">{totalSentences}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e6f0]">Sentences in SRS</p>
              <p className="text-xs text-[#9b98b0] mt-0.5">Browse videos to add more</p>
            </div>
          </Link>

        </div>

        {/* ── XP bar ── */}
        {xpInfo && (
          <div className="bg-[#1a1830] rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#e8e6f0]">Level {xpInfo.level} → {xpInfo.level + 1}</span>
              <span className="text-xs text-[#9b98b0]">{xpInfo.xpInLevel} / {xpInfo.xpNeeded} XP</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7c6df2] rounded-full transition-all duration-700"
                style={{ width: `${xpInfo.pct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Weekly streak ── */}
        {userProgress && (
          <div className="bg-[#1a1830] rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#e8e6f0]">This Week</h2>
              <span className="text-sm text-orange-400 font-bold">🔥 {userProgress.streak_current ?? 0} days</span>
            </div>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square max-w-[32px] rounded-md transition-colors ${
                    i === todayDow
                      ? studiedDow.has(i) ? 'bg-orange-500' : 'bg-orange-500/20 border border-orange-500/40'
                      : studiedDow.has(i) ? 'bg-[#7c6df2]' : 'bg-white/5'
                  }`} />
                  <span className="text-[10px] text-[#9b98b0]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SRS Breakdown ── */}
        {totalInSRS > 0 && (
          <div className="bg-[#1a1830] rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#e8e6f0]">SRS Progress</h2>
              <span className="text-xs text-[#9b98b0]">{totalInSRS} sentences</span>
            </div>
            <div className="space-y-2">
              {SRS_STAGE_ORDER.map(stage => {
                const count = srsBreakdown[stage]
                const pct = totalInSRS > 0 ? (count / totalInSRS) * 100 : 0
                const meta = SRS_STAGE_META[stage]
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-20 shrink-0 ${meta.color}`}>{stage}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.bg}/70 rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#9b98b0] w-6 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Recent Videos ── */}
        {recentVideos.length > 0 && (
          <div className="bg-[#1a1830] rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#e8e6f0]">Recent Videos</h2>
              <Link href="/videos" className="text-xs text-[#7c6df2] hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentVideos.map(v => (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors -mx-1"
                >
                  <span className="text-xl">🎬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8e6f0] font-medium truncate">{v.title}</p>
                    <p className="text-xs text-[#9b98b0]">{v.sentence_count} sentences · {v.level}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#4a4760] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Admin shortcut (Caroline only) ── */}
        {userEmail === ADMIN_EMAIL && (
          <div className="bg-[#1a1830] rounded-2xl border border-[#7c6df2]/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <div>
                <p className="text-sm font-semibold text-[#e8e6f0]">Video Management</p>
                <p className="text-xs text-[#9b98b0]">Add videos and sentences</p>
              </div>
            </div>
            <Link
              href="/admin/videos"
              className="px-3 py-1.5 bg-[#7c6df2]/20 text-[#9b8cf5] rounded-lg text-xs font-semibold hover:bg-[#7c6df2]/30 transition-colors"
            >
              Open →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
