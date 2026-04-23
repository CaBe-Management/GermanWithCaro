'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import Navbar from '@/components/Navbar'

interface Video {
  id: string
  platform: string
  video_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string
  sentence_count: number
  added_count: number   // sentences the user added to SRS
  learned: boolean      // user manually marked as gelernt
}

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
type StatusFilter = 'all' | 'open' | 'learned' | 'complete'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  A2: 'bg-green-500/20 text-green-400 border-green-500/30',
  B1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  B2: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  C1: 'bg-red-500/20 text-red-400 border-red-500/30',
  C2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

function TikTokPlaceholder() {
  return (
    <div className="w-full aspect-[9/16] bg-gradient-to-br from-gwc-panel to-gwc-base flex items-center justify-center relative overflow-hidden rounded-t-xl">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-6xl opacity-20">📱</span>
      </div>
      <div className="relative z-10 w-12 h-12 rounded-full bg-gwc-accent/20 border border-gwc-accent/40 flex items-center justify-center">
        <svg className="w-5 h-5 text-gwc-accent-soft ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}

function ProgressBadge({ video }: { video: Video }) {
  const { learned, added_count, sentence_count } = video

  if (sentence_count === 0) return null

  if (added_count >= sentence_count) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        ✓ All saved
      </span>
    )
  }

  if (learned) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
        ✓ Learned
      </span>
    )
  }

  if (added_count > 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-gwc-accent/10 text-gwc-accent-soft border border-gwc-accent/20">
        {added_count}/{sentence_count} saved
      </span>
    )
  }

  return null
}

function ProgressBar({ added, total }: { added: number; total: number }) {
  if (total === 0 || added === 0) return null
  const pct = Math.min(100, Math.round((added / total) * 100))
  const isComplete = added >= total
  return (
    <div className="mt-2 h-1 bg-gwc-text/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-gwc-accent'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState('All')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    const sessionId = getOrCreateSessionId()
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)

    const [
      { data: rawVideos },
      { data: learnedRows },
      { data: reviews },
    ] = await Promise.all([
      supabase
        .from('gwc_videos')
        .select('*, gwc_video_sentences(id)')
        .eq('is_draft', false)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('gwc_video_learned')
        .select('video_id')
        .eq('session_id', sessionId),
      supabase
        .from('gwc_video_reviews')
        .select('sentence_id, gwc_video_sentences(video_id)')
        .eq('session_id', sessionId),
    ])

    const learnedIds = new Set((learnedRows ?? []).map((w: { video_id: string }) => w.video_id))

    // Count added sentences per video
    const addedPerVideo: Record<string, number> = {}
    for (const r of reviews ?? []) {
      const row = r as { sentence_id: string; gwc_video_sentences: unknown }
      const sentences = row.gwc_video_sentences
      const vid = sentences && typeof sentences === 'object' && !Array.isArray(sentences)
        ? (sentences as { video_id: string }).video_id
        : Array.isArray(sentences) && sentences.length > 0
          ? (sentences[0] as { video_id: string }).video_id
          : null
      if (vid) addedPerVideo[vid] = (addedPerVideo[vid] ?? 0) + 1
    }

    const enriched = (rawVideos ?? []).map((v: Video & { gwc_video_sentences?: { id: string }[] }) => ({
      ...v,
      sentence_count: v.gwc_video_sentences?.length ?? 0,
      added_count: addedPerVideo[v.id] ?? 0,
      learned: learnedIds.has(v.id),
    }))

    setVideos(enriched)
    setLoading(false)
  }

  const byLevel = activeLevel === 'All'
    ? videos
    : videos.filter(v => v.level === activeLevel)

  const filtered = byLevel.filter(v => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'open') return !v.learned && v.added_count < v.sentence_count
    if (statusFilter === 'learned') return v.learned
    if (statusFilter === 'complete') return v.sentence_count > 0 && v.added_count >= v.sentence_count
    return true
  })

  const openCount = byLevel.filter(v => !v.learned && v.added_count < v.sentence_count).length
  const learnedCount = byLevel.filter(v => v.learned).length
  const completeCount = byLevel.filter(v => v.sentence_count > 0 && v.added_count >= v.sentence_count).length

  return (
    <div className="min-h-screen bg-gwc-base">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gwc-text mb-1">🎬 Learn from Videos</h1>
          <p className="text-gwc-muted text-sm">
            Real sentences from Caro's TikTok videos — click any sentence to add it to your SRS queue.
          </p>
        </div>

        {/* Level filter */}
        <div className="flex gap-2 flex-wrap mb-3">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setActiveLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeLevel === l
                  ? 'bg-gwc-accent text-white'
                  : 'bg-gwc-text/5 text-gwc-muted hover:bg-gwc-text/8 hover:text-gwc-text'
              }`}
            >
              {l}
            </button>
          ))}
        </div>


        {/* Status filter — only shown when logged in */}
        {isLoggedIn && <div className="flex gap-2 flex-wrap mb-8">
          {([
            { key: 'all',      label: 'All',              count: null,          activeClass: 'bg-gwc-text/12 text-gwc-text' },
            { key: 'open',     label: 'Not started',      count: openCount,     activeClass: 'bg-gwc-accent/30 text-gwc-accent-soft' },
            { key: 'learned',  label: 'Learned',          count: learnedCount,  activeClass: 'bg-emerald-500/20 text-emerald-400' },
            { key: 'complete', label: 'All saved',        count: completeCount, activeClass: 'bg-emerald-500/20 text-emerald-400' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f.key ? f.activeClass : 'bg-gwc-text/5 text-gwc-muted hover:bg-gwc-text/8'
              }`}
            >
              {f.label}
              {f.count !== null && f.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  statusFilter === f.key ? 'bg-gwc-text/15' : 'bg-gwc-text/8 text-gwc-muted'
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-gwc-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-gwc-muted text-lg">
              {videos.length === 0
                ? 'No videos published yet.'
                : 'No videos in this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(video => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group bg-gwc-panel rounded-xl border border-gwc-text/8 hover:border-gwc-accent/40 transition-all overflow-hidden hover:shadow-lg hover:shadow-gwc-accent/5"
              >
                {/* Thumbnail */}
                <div className="relative">
                  {video.thumbnail_url && !failedThumbs.has(video.id) ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className={`w-full object-cover ${
                        video.platform === 'tiktok' ? 'aspect-[9/16]' : 'aspect-video'
                      }`}
                      onError={() => setFailedThumbs(prev => new Set([...prev, video.id]))}
                    />
                  ) : (
                    // Fallback: no URL, or URL failed to load
                    video.platform === 'tiktok' ? <TikTokPlaceholder /> : (
                      <div className="w-full aspect-video bg-gradient-to-br from-gwc-panel to-gwc-base flex items-center justify-center rounded-t-xl">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )
                  )}
                  {/* Learned badge overlaid on thumbnail */}
                  {video.learned && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-emerald-500/90 text-white shadow-lg">
                        ✓ Learned
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${LEVEL_COLORS[video.level] ?? 'bg-gwc-text/8 text-gwc-muted border-gwc-text/10'}`}>
                      {video.level}
                    </span>
                    <span className="text-xs text-gwc-muted">
                      {video.platform === 'tiktok' ? '📱' : '▶️'}
                    </span>
                    <ProgressBadge video={video} />
                  </div>
                  <h3 className="text-sm font-semibold text-gwc-text leading-snug group-hover:text-gwc-accent-soft transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-xs text-gwc-muted mt-1 line-clamp-1">{video.description}</p>
                  )}

                  {/* Sentence count + progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gwc-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-xs text-gwc-muted">{video.sentence_count} sentences to learn</span>
                    </div>
                    <ProgressBar added={video.added_count} total={video.sentence_count} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
