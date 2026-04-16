'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import Navbar from '@/components/Navbar'

interface Video {
  id: string
  platform: string
  video_id: string
  video_url: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string
  is_draft: boolean
}

interface Sentence {
  id: string
  sentence_de: string
  sentence_en: string
  highlight_de: string | null
  highlight_en: string | null
  sort_order: number
}

// SRS level label helpers
const SRS_STAGE_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Novice',      color: 'text-emerald-400' },
  1: { label: 'Novice',      color: 'text-emerald-400' },
  2: { label: 'Novice',      color: 'text-emerald-400' },
  3: { label: 'Apprentice',  color: 'text-blue-400' },
  4: { label: 'Apprentice',  color: 'text-blue-400' },
  5: { label: 'Apprentice',  color: 'text-blue-400' },
  6: { label: 'Journeyman',  color: 'text-purple-400' },
  7: { label: 'Journeyman',  color: 'text-purple-400' },
  8: { label: 'Expert',      color: 'text-orange-400' },
  9: { label: 'Expert',      color: 'text-orange-400' },
  10: { label: 'Master',     color: 'text-[#9b8cf5]' },
  11: { label: '⭐ Mastered', color: 'text-yellow-400' },
}

// Highlight a phrase within a sentence
function HighlightedText({ text, highlight, className }: { text: string; highlight: string | null; className?: string }) {
  if (!highlight) return <span className={className}>{text}</span>
  const parts = text.split(highlight)
  return (
    <span className={className}>
      {parts.map((part, i, arr) =>
        i < arr.length - 1 ? (
          <span key={i}>{part}<mark className="bg-transparent text-[#9b8cf5] font-bold not-italic">{highlight}</mark></span>
        ) : part
      )}
    </span>
  )
}

export default function VideoDetailPage() {
  const params = useParams()
  const videoId = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  // SRS state per sentence: sentenceId → { inQueue: boolean, srsLevel: number } | 'loading'
  const [srsState, setSrsState] = useState<Record<string, { inQueue: boolean; srsLevel: number } | 'loading'>>({})
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    loadPage()
  }, [videoId])

  async function loadPage() {
    setLoading(true)

    const [{ data: vid }, { data: sents }, { data: { user } }] = await Promise.all([
      supabase.from('gwc_videos').select('*').eq('id', videoId).single(),
      supabase.from('gwc_video_sentences').select('*').eq('video_id', videoId).order('sort_order'),
      supabase.auth.getUser(),
    ])

    if (!vid) { setNotFound(true); setLoading(false); return }

    setVideo(vid)
    setSentences(sents ?? [])
    setIsAuthed(!!user)

    if (user && sents && sents.length > 0) {
      const sessionId = getOrCreateSessionId()
      const sentenceIds = sents.map((s: Sentence) => s.id)

      const { data: reviews } = await supabase
        .from('gwc_video_reviews')
        .select('sentence_id, repetitions')
        .eq('session_id', sessionId)
        .in('sentence_id', sentenceIds)

      const stateMap: Record<string, { inQueue: boolean; srsLevel: number }> = {}
      for (const s of sents) {
        const review = reviews?.find((r: { sentence_id: string; repetitions: number }) => r.sentence_id === s.id)
        stateMap[s.id] = review
          ? { inQueue: true, srsLevel: review.repetitions ?? 0 }
          : { inQueue: false, srsLevel: 0 }
      }
      setSrsState(stateMap)
    }

    setLoading(false)
  }

  async function addToSRS(sentenceId: string) {
    if (!isAuthed || addingId) return
    setAddingId(sentenceId)
    setSrsState(prev => ({ ...prev, [sentenceId]: 'loading' }))

    const sessionId = getOrCreateSessionId()

    const { error } = await supabase
      .from('gwc_video_reviews')
      .upsert({
        session_id: sessionId,
        sentence_id: sentenceId,
        repetitions: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_at: new Date().toISOString(),
      }, { onConflict: 'session_id,sentence_id' })

    if (!error) {
      setSrsState(prev => ({ ...prev, [sentenceId]: { inQueue: true, srsLevel: 0 } }))
    } else {
      setSrsState(prev => ({ ...prev, [sentenceId]: { inQueue: false, srsLevel: 0 } }))
    }
    setAddingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (notFound || !video) {
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-[#9b98b0]">Video nicht gefunden.</p>
          <Link href="/videos" className="text-[#7c6df2] mt-4 inline-block hover:underline">← Zurück zu Videos</Link>
        </div>
      </div>
    )
  }

  const addedCount = Object.values(srsState).filter(s => s !== 'loading' && s !== null && (s as { inQueue: boolean }).inQueue).length
  const totalCount = sentences.length

  const embedUrl = video.platform === 'tiktok'
    ? `https://www.tiktok.com/embed/v2/${video.video_id}`
    : `https://www.youtube.com/embed/${video.video_id}`

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#9b98b0] mb-6">
          <Link href="/videos" className="hover:text-[#e8e6f0] transition-colors">Videos</Link>
          <span>/</span>
          <span className="text-[#e8e6f0] truncate">{video.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Video embed (sticky on desktop) */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              {/* Video */}
              <div className="bg-[#1a1830] rounded-xl border border-white/8 overflow-hidden mb-4">
                <div className={`relative w-full ${video.platform === 'tiktok' ? '' : 'aspect-video'}`}
                  style={video.platform === 'tiktok' ? { paddingBottom: '177.78%' } : undefined}
                >
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  />
                </div>
              </div>

              {/* Video meta */}
              <div className="bg-[#1a1830] rounded-xl border border-white/8 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#7c6df2]/20 text-[#9b8cf5]">
                    {video.level}
                  </span>
                  <span className="text-xs text-[#9b98b0]">
                    {video.platform === 'tiktok' ? '📱 TikTok' : '▶️ YouTube'}
                  </span>
                </div>
                <h1 className="text-base font-bold text-[#e8e6f0] leading-snug">{video.title}</h1>
                {video.description && (
                  <p className="text-sm text-[#9b98b0] mt-2 leading-relaxed">{video.description}</p>
                )}

                {/* SRS progress */}
                {isAuthed && totalCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-[#9b98b0] mb-1.5">
                      <span>Added to SRS</span>
                      <span className="font-semibold text-[#e8e6f0]">{addedCount} / {totalCount}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7c6df2] rounded-full transition-all duration-500"
                        style={{ width: totalCount > 0 ? `${(addedCount / totalCount) * 100}%` : '0%' }}
                      />
                    </div>
                    {addedCount === totalCount && totalCount > 0 && (
                      <p className="text-xs text-emerald-400 mt-2">✓ All sentences added!</p>
                    )}
                  </div>
                )}

                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-xs text-[#9b98b0] hover:text-[#7c6df2] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open on {video.platform === 'tiktok' ? 'TikTok' : 'YouTube'}
                </a>
              </div>
            </div>
          </div>

          {/* Right: Sentences */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#e8e6f0]">
                Sentences ({totalCount})
              </h2>
              {!isAuthed && (
                <Link href="/login" className="text-xs text-[#7c6df2] hover:underline">
                  Log in to add to SRS →
                </Link>
              )}
            </div>

            {sentences.length === 0 ? (
              <div className="bg-[#1a1830] rounded-xl border border-white/8 p-12 text-center">
                <p className="text-3xl mb-3">📝</p>
                <p className="text-[#9b98b0]">No sentences yet for this video.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sentences.map((s, i) => {
                  const state = srsState[s.id]
                  const inQueue = state !== 'loading' && state !== undefined && (state as { inQueue: boolean }).inQueue
                  const isLoading = state === 'loading'
                  const srsLevel = (state !== 'loading' && state !== undefined) ? (state as { srsLevel: number }).srsLevel : 0
                  const srsInfo = SRS_STAGE_LABELS[srsLevel] ?? SRS_STAGE_LABELS[0]

                  return (
                    <div
                      key={s.id}
                      className={`bg-[#1a1830] rounded-xl border p-4 transition-all ${
                        inQueue ? 'border-[#7c6df2]/30' : 'border-white/8'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Number */}
                        <span className="text-xs text-[#4a4760] font-mono mt-1 w-5 shrink-0 text-right">{i + 1}</span>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#e8e6f0] leading-relaxed">
                            <HighlightedText text={s.sentence_de} highlight={s.highlight_de} />
                          </p>
                          <p className="text-sm text-[#9b98b0] mt-1 leading-relaxed">
                            <HighlightedText text={s.sentence_en} highlight={s.highlight_en} />
                          </p>

                          {/* SRS badge if in queue */}
                          {inQueue && (
                            <span className={`text-xs font-medium mt-1.5 inline-block ${srsInfo.color}`}>
                              {srsInfo.label}
                            </span>
                          )}
                        </div>

                        {/* SRS Button */}
                        {isAuthed && (
                          <button
                            onClick={() => !inQueue && addToSRS(s.id)}
                            disabled={isLoading || inQueue}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isLoading
                                ? 'bg-white/5 text-[#9b98b0] cursor-wait'
                                : inQueue
                                ? 'bg-[#7c6df2]/15 text-[#9b8cf5] cursor-default'
                                : 'bg-[#7c6df2]/20 text-[#9b8cf5] hover:bg-[#7c6df2]/40 hover:text-white cursor-pointer'
                            }`}
                          >
                            {isLoading ? (
                              <span className="w-3 h-3 border border-[#9b98b0] border-t-transparent rounded-full animate-spin inline-block" />
                            ) : inQueue ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Added
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add to SRS
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Review CTA if sentences are added */}
                {isAuthed && addedCount > 0 && (
                  <div className="pt-4">
                    <Link
                      href="/review"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#7c6df2] text-white rounded-xl font-semibold text-sm hover:bg-[#6b5de0] transition-colors"
                    >
                      Start reviewing ({addedCount} sentence{addedCount !== 1 ? 's' : ''} in queue)
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
