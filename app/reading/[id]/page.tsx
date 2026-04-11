'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  id: string
  title: string
  content?: string
  content_en?: string
  audio_url?: string | null
  level: string
  sort_order: number
  word_count: number | null
}

// ─── Level badge colour ───────────────────────────────────────────────────────

function levelColor(level: string) {
  switch (level) {
    case 'A1': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'A2': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'B1': return 'bg-[#7c6df2]/20 text-[#9b8cf5] border-[#7c6df2]/30'
    case 'B2': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default:   return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// ─── Audio Button ─────────────────────────────────────────────────────────────

function AudioButton({ url }: { url?: string | null }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => { audioRef.current?.pause() }, [])
  if (!url) return null
  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(url!)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) { audioRef.current.pause(); audioRef.current.currentTime = 0; setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }
  return (
    <button
      onClick={toggle}
      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
        playing
          ? 'bg-[#7c6df2]/20 border-[#7c6df2]/50 text-[#9b8cf5]'
          : 'bg-white/5 border-white/10 text-[#9b98b0] hover:border-[#7c6df2]/40 hover:text-[#e8e6f0]'
      }`}
    >
      <span>{playing ? '⏹' : '🔊'}</span>
      <span>{playing ? 'Stop' : 'Listen'}</span>
    </button>
  )
}

// ─── Native Audio Player ──────────────────────────────────────────────────────

function NativeAudioPlayer({ url }: { url: string }) {
  return (
    <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <span className="text-base">🎙</span>
        <div>
          <p className="text-sm font-bold text-[#e8e6f0]">Native pronunciation</p>
          <p className="text-xs text-[#9b98b0]">Recorded by Caro</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <audio
          src={url}
          controls
          className="w-full"
          style={{ colorScheme: 'dark', accentColor: '#7c6df2' }}
        />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StoryPage() {
  const params = useParams()
  const id = params.id as string

  const [story, setStory] = useState<Story | null>(null)
  const [prevNext, setPrevNext] = useState<{ prev: Story | null; next: Story | null }>({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('gwc_stories')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setStory(data)

        const { data: siblings } = await supabase
          .from('gwc_stories')
          .select('id, title, level, sort_order, word_count')
          .eq('level', data.level)
          .order('sort_order', { ascending: true })

        if (siblings) {
          const idx = siblings.findIndex((s: Story) => s.id === id)
          setPrevNext({
            prev: idx > 0 ? siblings[idx - 1] : null,
            next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
          })
        }
      } catch (e) {
        console.error('Story load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-[#e8e6f0] font-bold mb-2">Story not found</p>
          <Link href="/reading" className="text-[#7c6df2] hover:text-[#9b8cf5] text-sm transition-colors">
            ← Back to Reading Practice
          </Link>
        </div>
      </div>
    )
  }

  const deParagraphs = (story.content ?? '').split(/\n\n+/).filter(p => p.trim())
  const enParagraphs = (story.content_en ?? '').split(/\n\n+/).filter(p => p.trim())
  const hasTranslation = enParagraphs.length > 0

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-2xl mx-auto px-5 py-10">

        {/* Back link */}
        <Link
          href="/reading"
          className="inline-flex items-center gap-1.5 text-sm text-[#9b98b0] hover:text-[#e8e6f0] transition-colors mb-8"
        >
          ← Reading Practice
        </Link>

        {/* Story header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${levelColor(story.level)}`}>
              {story.level}
            </span>
            {story.word_count && (
              <span className="text-xs text-[#9b98b0]">{story.word_count} words</span>
            )}
          </div>

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-[#e8e6f0] leading-snug">
              {story.title}
            </h1>

            {/* Listen button — only shown if audio uploaded */}
            <AudioButton url={story.audio_url} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-8" />

        {/* Story content — German paragraphs side by side with English */}
        <article className="space-y-5">
          {deParagraphs.map((paragraph, i) => (
            <div key={i}>
              {/* German paragraph */}
              <p className="text-[#e8e6f0] text-lg leading-8">{paragraph}</p>

              {/* English translation for this paragraph */}
              {showTranslation && enParagraphs[i] && (
                <p className="text-[#9b98b0] text-base leading-7 mt-2 pl-0 border-l-2 border-[#7c6df2]/30 pl-4 italic">
                  {enParagraphs[i]}
                </p>
              )}
            </div>
          ))}
        </article>

        {/* Translation toggle */}
        {hasTranslation && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowTranslation(v => !v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                showTranslation
                  ? 'bg-[#7c6df2]/20 border-[#7c6df2]/40 text-[#9b8cf5]'
                  : 'bg-white/5 border-white/10 text-[#9b98b0] hover:border-white/20 hover:text-[#e8e6f0]'
              }`}
            >
              {showTranslation ? '🙈 Hide translation' : '🇬🇧 Show translation'}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 mt-10 mb-8" />

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevNext.prev ? (
            <Link
              href={`/reading/${prevNext.prev.id}`}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1a1830] border border-white/5 hover:border-[#7c6df2]/30 transition-all group max-w-[45%]"
            >
              <span className="text-[#9b98b0] group-hover:text-[#9b8cf5] transition-colors">←</span>
              <div className="min-w-0">
                <p className="text-xs text-[#9b98b0]">Previous</p>
                <p className="text-sm text-[#e8e6f0] font-medium truncate">{prevNext.prev.title}</p>
              </div>
            </Link>
          ) : <div />}

          {prevNext.next ? (
            <Link
              href={`/reading/${prevNext.next.id}`}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1a1830] border border-white/5 hover:border-[#7c6df2]/30 transition-all group max-w-[45%] text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-[#9b98b0]">Next</p>
                <p className="text-sm text-[#e8e6f0] font-medium truncate">{prevNext.next.title}</p>
              </div>
              <span className="text-[#9b98b0] group-hover:text-[#9b8cf5] transition-colors">→</span>
            </Link>
          ) : <div />}
        </div>

        {/* Back to overview */}
        <div className="text-center mt-8">
          <Link href="/reading" className="text-sm text-[#9b98b0] hover:text-[#e8e6f0] transition-colors">
            ← All stories
          </Link>
        </div>
      </div>
    </div>
  )
}
