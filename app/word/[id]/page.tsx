'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Word {
  id: string
  word: string
  typ: string
  artikel: string | null
  plural: string | null
  level: string
  frequenz_rang: number | null
  erklaerung: string | null
  verwendung: string | null
  genitiv: string | null
}

interface Sentence {
  id: string
  word_id: string
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  cloze_word_en: string | null
  sort_order: number
}

interface ReviewData {
  id: string
  correct: boolean
  reviewed_at: string
  next_review_at: string
  repetitions: number
  ease_factor: number
  interval_days: number
  word_sentence_id: string
}

// ─── TTS Hook ─────────────────────────────────────────────────────────────────

function useTTS() {
  const [activeTTS, setActiveTTS] = useState<string | null>(null)

  const speak = useCallback((text: string, id: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 0.85
    u.onstart = () => setActiveTTS(id)
    u.onend = () => setActiveTTS(null)
    u.onerror = () => setActiveTTS(null)
    window.speechSynthesis.speak(u)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setActiveTTS(null)
  }, [])

  return { speak, stop, activeTTS }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typColor(typ: string) {
  switch (typ) {
    case 'NOMEN':     return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'VERB':      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'ADJEKTIV':  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'ADVERB':    return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'GRAMMATIK': return 'bg-[#7c6df2]/20 text-[#9b8cf5] border-[#7c6df2]/30'
    default:          return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

function srsStage(repetitions: number): { name: string; color: string } {
  if (repetitions === 0) return { name: 'Not started',  color: 'text-[#9b98b0]' }
  if (repetitions === 1) return { name: 'Beginner',     color: 'text-pink-400' }
  if (repetitions === 2) return { name: 'Novice',       color: 'text-purple-400' }
  if (repetitions === 3) return { name: 'Adept',        color: 'text-[#9b8cf5]' }
  if (repetitions === 4) return { name: 'Expert',       color: 'text-[#7c6df2]' }
  return                         { name: 'Master',      color: 'text-emerald-400' }
}

// SRS progress blocks (like Bunpro's pink→purple gradient)
const SRS_BLOCK_COLORS = [
  'bg-pink-400',
  'bg-pink-500',
  'bg-purple-400',
  'bg-[#9b8cf5]',
  'bg-[#7c6df2]',
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return 'Due now'
  if (diff === 1) return 'In 1 day'
  return `In ${diff} days`
}

function getDeclension(artikel: string, word: string, genitiv: string | null) {
  const art = artikel.toLowerCase()
  let akkArt = artikel, datArt = artikel, genArt = artikel
  let genForm = genitiv || `${word}s`

  if (art === 'der') { akkArt = 'den'; datArt = 'dem'; genArt = 'des' }
  else if (art === 'die') { akkArt = 'die'; datArt = 'der'; genArt = 'der'; genForm = genitiv || word }
  else if (art === 'das') { akkArt = 'das'; datArt = 'dem'; genArt = 'des' }

  return [
    { case: 'Nominativ', art: artikel,  noun: word },
    { case: 'Akkusativ', art: akkArt,   noun: word },
    { case: 'Dativ',     art: datArt,   noun: word },
    { case: 'Genitiv',   art: genArt,   noun: genForm },
  ]
}

function highlightCloze(sentence: string, word: string): React.ReactNode {
  const parts = sentence.split(new RegExp(`(${word})`, 'i'))
  return parts.map((p, i) =>
    new RegExp(`^${word}$`, 'i').test(p)
      ? <span key={i} className="text-[#9b8cf5] font-bold underline decoration-[#7c6df2]/50">{p}</span>
      : <span key={i}>{p}</span>
  )
}

function highlightEnglish(sentence: string, enWord?: string | null): React.ReactNode {
  if (!enWord) return <>{sentence}</>
  const regex = new RegExp(`(${enWord})`, 'gi')
  return sentence.split(regex).map((p, i) =>
    regex.test(p) ? <span key={i} className="text-[#9b8cf5] font-bold">{p}</span> : <span key={i}>{p}</span>
  )
}

// ─── Gear Dropdown ────────────────────────────────────────────────────────────

function GearDropdown({ onRemove, onReset }: { onRemove: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5 transition-colors text-base"
        title="Settings"
      >
        ⚙
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-[#13122a] rounded-xl border border-white/10 shadow-xl shadow-black/40 overflow-hidden z-50">
          <button
            onClick={() => { onRemove(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#e8e6f0] hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-lg">⊖</span> Remove from Reviews
          </button>
          <div className="h-px bg-white/5" />
          <button
            onClick={() => { onReset(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#e8e6f0] hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-lg">↺</span> Reset Progress
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sentence Card ────────────────────────────────────────────────────────────

function SentenceCard({ sentence, index, tts }: {
  sentence: Sentence
  index: number
  tts: ReturnType<typeof useTTS>
}) {
  const id = `s-${sentence.id}`
  const isPlaying = tts.activeTTS === id

  return (
    <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex gap-3">
          <span className="text-xs text-[#9b98b0] shrink-0 mt-1 font-medium">{index + 1}.</span>
          <p className="text-[#e8e6f0] leading-relaxed">
            {highlightCloze(sentence.sentence_de, sentence.cloze_word)}
          </p>
        </div>
        <button
          onClick={() => isPlaying ? tts.stop() : tts.speak(sentence.sentence_de, id)}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm ${
            isPlaying ? 'bg-[#7c6df2] text-white' : 'bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5]'
          }`}
        >
          {isPlaying ? '⏸' : '🔊'}
        </button>
      </div>
      {sentence.sentence_en && (
        <p className="text-[#9b98b0] text-sm leading-relaxed ml-5">
          {highlightEnglish(sentence.sentence_en, sentence.cloze_word_en)}
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WordDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [word, setWord] = useState<Word | null>(null)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const tts = useTTS()

  async function loadData() {
    try {
      const sessionId = getOrCreateSessionId()

      const [{ data: wordData }, { data: sentencesData }] = await Promise.all([
        supabase.from('gwc_words').select('*').eq('id', id).single(),
        supabase.from('gwc_word_sentences').select('*').eq('word_id', id).order('sort_order', { ascending: true }),
      ])

      if (!wordData) { setLoading(false); return }
      setWord(wordData)
      setSentences(sentencesData || [])

      if (sentencesData && sentencesData.length > 0) {
        const sentenceIds = sentencesData.map((s: Sentence) => s.id)
        const { data: reviewData } = await supabase
          .from('gwc_user_reviews')
          .select('*')
          .eq('session_id', sessionId)
          .in('word_sentence_id', sentenceIds)
          .order('reviewed_at', { ascending: true })

        setReviews(reviewData || [])
      }
    } catch (e) {
      console.error('Word detail load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id]) // eslint-disable-line

  // ── Actions ──
  async function handleAddToQueue() {
    if (!sentences[0]) return
    const sessionId = getOrCreateSessionId()
    await supabase.from('gwc_user_reviews').insert({
      session_id: sessionId,
      word_sentence_id: sentences[0].id,
      correct: true,
      reviewed_at: new Date().toISOString(),
      next_review_at: new Date().toISOString(),
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
    })
    showMsg('Added to review queue!')
    await loadData()
  }

  async function handleRemove() {
    const sessionId = getOrCreateSessionId()
    const sentenceIds = sentences.map(s => s.id)
    await supabase.from('gwc_user_reviews')
      .delete()
      .eq('session_id', sessionId)
      .in('word_sentence_id', sentenceIds)
    showMsg('Removed from reviews.')
    setReviews([])
  }

  async function handleReset() {
    const sessionId = getOrCreateSessionId()
    const now = new Date().toISOString()
    for (const r of reviews) {
      await supabase.from('gwc_user_reviews').update({
        repetitions: 0,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_at: now,
      }).eq('id', r.id).eq('session_id', sessionId)
    }
    showMsg('Progress reset.')
    await loadData()
  }

  function showMsg(msg: string) {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(null), 2500)
  }

  // ── Derived stats ──
  const inQueue = reviews.length > 0
  const latestReview = reviews[reviews.length - 1]
  const firstStudied = reviews[0]?.reviewed_at
  const timesStudied = reviews.length
  const correctCount = reviews.filter(r => r.correct).length
  const accuracy = timesStudied > 0 ? Math.round((correctCount / timesStudied) * 100) : null
  const currentReps = latestReview?.repetitions ?? 0
  const stage = srsStage(currentReps)
  const nextReview = latestReview?.next_review_at

  const isNoun = word?.typ === 'NOMEN' && word?.artikel
  const declension = isNoun ? getDeclension(word!.artikel!, word!.word, word!.genitiv) : null

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!word) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-[#e8e6f0] font-bold mb-2">Word not found</p>
          <Link href="/dashboard" className="text-[#9b8cf5] hover:underline text-sm">← Dashboard</Link>
        </div>
      </div>
    )
  }

  const ttsWordId = `word-${word.id}`

  return (
    <div className="min-h-screen bg-[#0f0e17]">

      {/* ── Breadcrumb ── */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-sm text-[#9b98b0]">
            <Link href="/dashboard" className="hover:text-[#e8e6f0] transition-colors">Vocab Info</Link>
            <span className="mx-2">/</span>
            <span>{word.level} {word.typ.charAt(0) + word.typ.slice(1).toLowerCase()}</span>
          </div>
          {actionMsg && (
            <span className="text-xs text-[#4ade80] bg-[#4ade80]/10 px-3 py-1 rounded-full border border-[#4ade80]/20">
              {actionMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="border-b border-white/5 py-8 sm:py-16 text-center px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold text-[#9b8cf5] tracking-tight">
            {word.artikel ? `${word.artikel} ${word.word}` : word.word}
          </h1>
          <button
            onClick={() => tts.activeTTS === ttsWordId ? tts.stop() : tts.speak(word.word, ttsWordId)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors text-xl ${
              tts.activeTTS === ttsWordId
                ? 'bg-[#7c6df2] text-white'
                : 'bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5]'
            }`}
          >
            {tts.activeTTS === ttsWordId ? '⏸' : '🔊'}
          </button>
        </div>

        {word.erklaerung && (
          <p className="text-[#9b98b0] text-lg max-w-lg mx-auto leading-relaxed">
            {word.erklaerung}
          </p>
        )}

        {/* Add to queue button (if not yet in queue) */}
        {!inQueue && sentences.length > 0 && (
          <button
            onClick={handleAddToQueue}
            className="mt-6 px-6 py-2.5 rounded-xl bg-[#7c6df2] text-white font-bold text-sm hover:bg-[#9b8cf5] transition-colors shadow-lg shadow-[#7c6df2]/20"
          >
            + Add to Review Queue
          </button>
        )}
      </div>

      {/* ── 3 panels ── */}
      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Panel 1: Dictionary Definition */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <h2 className="text-sm font-bold text-[#e8e6f0] mb-4">Dictionary Definition</h2>

          {/* Type + usage badges */}
          <div className="flex gap-2 flex-wrap mb-4">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${typColor(word.typ)}`}>
              {word.typ.charAt(0) + word.typ.slice(1).toLowerCase()}
            </span>
            {word.verwendung && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {word.verwendung}
              </span>
            )}
          </div>

          {/* Meanings / explanation */}
          {word.erklaerung && (
            <p className="text-[#9b98b0] text-sm leading-relaxed mb-4">{word.erklaerung}</p>
          )}

          {/* All Forms (nouns only) */}
          {declension && (
            <div className="mt-2">
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider font-bold mb-2">All Forms</p>
              <div className="bg-[#13122a] rounded-xl overflow-hidden border border-white/5">
                {declension.map(({ case: c, art, noun }) => (
                  <div key={c} className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-[#9b98b0] w-20 shrink-0">{c}</span>
                    <span className="text-[#7c6df2] text-sm font-medium">{art}</span>
                    <span className="text-[#e8e6f0] text-sm">{noun}</span>
                  </div>
                ))}
                {word.plural && (
                  <div className="flex items-center gap-3 px-3 py-2 border-t border-white/5">
                    <span className="text-xs text-[#9b98b0] w-20 shrink-0">Plural</span>
                    <span className="text-[#e8e6f0] text-sm">{word.plural}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plural for non-nouns */}
          {!declension && word.plural && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-[#9b98b0]">Plural:</span>
              <span className="text-[#e8e6f0] font-medium">{word.plural}</span>
            </div>
          )}
        </div>

        {/* Panel 2: Details */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <h2 className="text-sm font-bold text-[#e8e6f0] mb-4">Details</h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1">Level</p>
              <span className="px-2.5 py-1 rounded-lg text-sm font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
                {word.level}
              </span>
            </div>

            {word.frequenz_rang && (
              <div>
                <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1">Frequency</p>
                <p className="text-[#e8e6f0] font-bold">Top #{word.frequenz_rang}</p>
                <p className="text-xs text-[#9b98b0]">most common German words</p>
              </div>
            )}

            {word.artikel && (
              <div>
                <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1">Article (Nominativ)</p>
                <p className="text-[#e8e6f0] font-bold">{word.artikel}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1">Example sentences</p>
              <p className="text-[#e8e6f0] font-bold">{sentences.length}</p>
            </div>
          </div>
        </div>

        {/* Panel 3: Your Progress */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#e8e6f0]">Your Progress</h2>
            {inQueue && (
              <GearDropdown onRemove={handleRemove} onReset={handleReset} />
            )}
          </div>

          {inQueue ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-5">
                <div>
                  <p className="text-xs text-[#9b98b0] mb-0.5">Current Stage</p>
                  <p className={`font-bold text-base ${stage.color}`}>{stage.name}</p>
                </div>
                {firstStudied && (
                  <div>
                    <p className="text-xs text-[#9b98b0] mb-0.5">First Studied</p>
                    <p className="text-[#e8e6f0] font-bold text-sm">{formatDate(firstStudied)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#9b98b0] mb-0.5">Times Studied</p>
                  <p className="text-[#e8e6f0] font-bold text-base">{timesStudied}</p>
                </div>
                {accuracy !== null && (
                  <div>
                    <p className="text-xs text-[#9b98b0] mb-0.5">Accuracy</p>
                    <p className={`font-bold text-base ${accuracy >= 70 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      {accuracy}%
                    </p>
                  </div>
                )}
                {nextReview && (
                  <div className="col-span-2">
                    <p className="text-xs text-[#9b98b0] mb-0.5">Next Review</p>
                    <p className="text-[#e8e6f0] font-bold text-sm">{daysUntil(nextReview)}</p>
                  </div>
                )}
              </div>

              {/* SRS progress blocks */}
              <div>
                <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-2">SRS Progress</p>
                <div className="flex gap-1">
                  {SRS_BLOCK_COLORS.map((color, i) => (
                    <div
                      key={i}
                      className={`h-3 flex-1 rounded-md transition-all ${
                        i < currentReps ? color : 'bg-white/8'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#9b98b0] mt-1.5">{currentReps} / 5 stages completed</p>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-[#9b98b0] text-sm mb-1">Not in your review queue yet.</p>
              <p className="text-xs text-[#9b98b0]/60">Use the Learn flow or add it above.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Examples ── */}
      <div className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-sm font-bold text-[#9b98b0] uppercase tracking-widest mb-4">
          Examples ({sentences.length})
        </h2>

        {sentences.length > 0 ? (
          <div className="space-y-3">
            {sentences.map((s, i) => (
              <SentenceCard key={s.id} sentence={s} index={i} tts={tts} />
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1830] rounded-2xl p-8 border border-white/5 text-center">
            <p className="text-[#e8e6f0] font-bold mb-1">No sentences available yet</p>
            <p className="text-[#9b98b0] text-sm">Example sentences are coming soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
