'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { awardXPAndUpdateStreak, XP_CORRECT_REVIEW, XP_WRONG_REVIEW } from '@/lib/gamification'
import type { GrammarTopic, GrammarSentence } from '@/lib/supabase'

// ─── TTS Hook ─────────────────────────────────────────────────────────────────

function useTTS() {
  const [playing, setPlaying] = useState(false)
  function speak(text: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'; u.rate = 0.85
    u.onstart = () => setPlaying(true)
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(u)
  }
  function stop() { window.speechSynthesis?.cancel(); setPlaying(false) }
  return { speak, stop, playing }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface VocabWord {
  id: string; word: string; typ: string; artikel: string | null; plural: string | null; level: string; frequenz_rang: number | null
}
interface VocabSentence {
  id: string; word_id: string; sentence_de: string; sentence_en: string | null; cloze_word: string; cloze_word_en: string | null; sort_order: number
}

interface VocabCard {
  kind: 'vocab'
  reviewId: string
  word: VocabWord
  sentence: VocabSentence
  allSentences: VocabSentence[]
  easeFactor: number; intervalDays: number; repetitions: number
}

interface GrammarCard {
  kind: 'grammar'
  reviewId: string
  topic: GrammarTopic
  sentence: GrammarSentence
  easeFactor: number; intervalDays: number; repetitions: number
}

type ReviewCard = VocabCard | GrammarCard

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

function typColor(typ: string) {
  switch (typ) {
    case 'NOMEN':     return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'VERB':      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'ADJEKTIV':  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'ADVERB':    return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default:          return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// ─── Vocab Word Info Panel ─────────────────────────────────────────────────────

function VocabInfoPanel({ word }: { word: VocabWord }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-white/8">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-4 text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm font-medium"
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>↑</span>
        {open ? 'Hide word info' : 'Show word info'}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${typColor(word.typ)}`}>{word.typ}</span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">{word.level}</span>
            {word.frequenz_rang && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">#{word.frequenz_rang}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {word.artikel && (
              <div className="bg-[#252340] rounded-xl p-3 border border-white/5">
                <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-0.5">Article</p>
                <p className="text-[#e8e6f0] font-bold">{word.artikel}</p>
              </div>
            )}
            {word.plural && (
              <div className="bg-[#252340] rounded-xl p-3 border border-white/5">
                <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-0.5">Plural</p>
                <p className="text-[#e8e6f0] font-bold">{word.plural}</p>
              </div>
            )}
          </div>
          <Link
            href={`/word/${word.id}`}
            className="mt-3 block text-center text-xs text-[#7c6df2] hover:text-[#9b8cf5] transition-colors"
          >
            All sentences for „{word.word}" →
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Grammar Info Panel ───────────────────────────────────────────────────────

function GrammarInfoPanel({ topic, sentence }: { topic: GrammarTopic; sentence: GrammarSentence }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-white/8">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-4 text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm font-medium"
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>↑</span>
        {open ? 'Hide grammar info' : 'Show grammar info'}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">Grammar</span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">{topic.level}</span>
            {sentence.person && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">{sentence.person}</span>
            )}
          </div>
          <p className="text-sm font-bold text-[#e8e6f0] mb-2">{topic.title}</p>
          <div
            className="text-xs text-[#9b98b0] leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: topic.explanation_en
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#c5c3d4]">$1</strong>')
                .replace(/\n/g, '<br />')
            }}
          />
          <Link
            href={`/grammar/${topic.slug}`}
            className="mt-3 block text-center text-xs text-[#7c6df2] hover:text-[#9b8cf5] transition-colors"
          >
            View topic: {topic.title} →
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Review Card View ─────────────────────────────────────────────────────────

function ReviewCardView({
  card,
  cardNumber,
  total,
  mistakes,
  onResult,
}: {
  card: ReviewCard
  cardNumber: number
  total: number
  mistakes: number
  onResult: (wasCorrect: boolean) => void
}) {
  const [input, setInput]     = useState('')
  const [answered, setAnswered] = useState(false)
  const tts = useTTS()

  const sentence    = card.kind === 'vocab' ? card.sentence : card.sentence
  const clozeWord   = sentence.cloze_word
  const sentenceDE  = sentence.sentence_de
  const sentenceEN  = sentence.sentence_en

  // Build cloze parts: split sentence on the cloze word
  const clozeParts = sentenceDE.replace(new RegExp(clozeWord, 'i'), '___').split('___')

  const isCorrect =
    normalize(input) === normalize(clozeWord) ||
    input.trim().toLowerCase() === clozeWord.toLowerCase()

  const handleCheck = useCallback(() => {
    if (!input.trim() || answered) return
    setAnswered(true)
  }, [input, answered])

  const handleNext = useCallback(() => {
    tts.stop()
    onResult(isCorrect)
  }, [isCorrect, onResult, tts])

  useEffect(() => { if (answered) tts.speak(sentenceDE) }, [answered]) // eslint-disable-line
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') answered ? handleNext() : handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answered, handleCheck, handleNext])

  useEffect(() => { setInput(''); setAnswered(false); tts.stop() }, [card.reviewId]) // eslint-disable-line

  const wordsLeft = total - (cardNumber - 1)
  const progress  = (cardNumber - 1) / total

  // English hint with optional cloze_word_en highlight (vocab only)
  function renderEN() {
    if (!sentenceEN) return null
    if (card.kind === 'vocab' && card.sentence.cloze_word_en) {
      const regex = new RegExp(`(${card.sentence.cloze_word_en})`, 'gi')
      const parts = sentenceEN.split(regex)
      return (
        <p className="text-[#9b98b0] text-base sm:text-xl leading-relaxed">
          {parts.map((part, i) =>
            regex.test(part) ? <span key={i} className="text-[#9b8cf5] font-bold">{part}</span> : <span key={i}>{part}</span>
          )}
        </p>
      )
    }
    return <p className="text-[#9b98b0] text-base sm:text-xl leading-relaxed italic">{sentenceEN}</p>
  }

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {/* Grammar/person badges */}
          {card.kind === 'grammar' && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
              Grammar
            </span>
          )}
          {card.kind === 'grammar' && card.sentence.person && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {card.sentence.person}
            </span>
          )}
          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="text-[#9b98b0]">□</span>
              <span className="font-bold text-[#e8e6f0]">{wordsLeft}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#4ade80]">✓</span>
              <span className="font-bold text-[#4ade80]">{cardNumber - 1 - mistakes}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#f87171]">✗</span>
              <span className={`font-bold ${mistakes > 0 ? 'text-[#f87171]' : 'text-[#9b98b0]'}`}>{mistakes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 sm:py-12">
        <div className="max-w-2xl w-full text-center space-y-6">

          {/* Label */}
          <p className="text-[#9b8cf5] font-bold text-lg">
            {card.kind === 'vocab' ? card.word.word : card.topic.title}
          </p>

          {/* English translation shown first — the highlighted word (purple) is what maps to the blank */}
          {renderEN()}

          {/* German sentence with gap — user types the missing word */}
          <p className="text-[#e8e6f0] text-xl sm:text-3xl md:text-4xl leading-relaxed font-light">
            {clozeParts[0]}
            <span className={`inline-block min-w-[120px] border-b-2 px-2 font-bold text-center transition-colors ${
              !answered ? 'border-[#7c6df2] text-[#9b8cf5]'
              : isCorrect ? 'border-[#4ade80] text-[#4ade80]'
              : 'border-[#f87171] text-[#f87171]'
            }`}>
              {answered ? clozeWord : (input || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0')}
            </span>
            {clozeParts[1]}
          </p>

          {answered && !isCorrect && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm break-words max-w-full">
              You typed: <span className="font-bold">"{input}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: input or feedback */}
      <div className="bg-[#0f0e17] border-t border-white/5">
        {!answered ? (
          <div className="px-5 py-4 flex gap-3 max-w-xl mx-auto w-full">
            <input
              autoFocus type="text" value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type the missing word..."
              className="flex-1 bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors text-lg"
            />
            <button
              onClick={handleCheck} disabled={!input.trim()}
              className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg"
            >✓</button>
          </div>
        ) : (
          <div className="px-5 py-4 max-w-xl mx-auto w-full space-y-3">
            {/* TTS bar */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isCorrect ? 'bg-[#4ade80]/5 border-[#4ade80]/20' : 'bg-[#f87171]/5 border-[#f87171]/20'
            }`}>
              <button
                onClick={() => tts.playing ? tts.stop() : tts.speak(sentenceDE)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors font-bold ${
                  tts.playing ? 'bg-[#7c6df2] text-white' : 'bg-white/10 text-[#9b98b0] hover:bg-[#7c6df2]/30 hover:text-[#9b8cf5]'
                }`}
              >{tts.playing ? '⏸' : '▶'}</button>
              <div className="flex items-center gap-0.5 flex-1">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className={`rounded-full flex-1 transition-all ${tts.playing ? 'bg-[#7c6df2]' : 'bg-white/15'}`}
                    style={{ height: `${6 + Math.sin(i * 0.8) * 5}px` }} />
                ))}
              </div>
              <span className="text-xs text-[#9b98b0] font-medium shrink-0">
                {card.kind === 'vocab' ? card.word.word : card.topic.title}
              </span>
            </div>
            {/* Next button */}
            <button
              onClick={handleNext}
              className={`w-full py-3.5 rounded-xl border-2 font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                isCorrect ? 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10'
                          : 'border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10'
              }`}
            >
              Next → <span className="text-xs opacity-60">(Enter)</span>
            </button>
          </div>
        )}

        {/* Info panel — vocab or grammar */}
        {card.kind === 'vocab' && <VocabInfoPanel word={card.word} />}
        {card.kind === 'grammar' && <GrammarInfoPanel topic={card.topic} sentence={card.sentence} />}
      </div>
    </div>
  )
}

// ─── Completion / Empty screens ───────────────────────────────────────────────

function CompletionScreen({ total, correct }: { total: number; correct: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">All reviews done!</h2>
        <p className="text-[#9b98b0] mb-2">{correct}/{total} correct — {pct}%</p>
        <p className="text-[#9b98b0] text-sm mb-8">Your Review Queue has been updated.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">Dashboard</Link>
          <Link href="/learn" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">Learn More</Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-[#e8e6f0] mb-2">No reviews due!</h2>
        <p className="text-[#9b98b0] mb-8">All done. Learn new words or come back later.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">Dashboard</Link>
          <Link href="/learn" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">Learn</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page (inner, uses useSearchParams) ──────────────────────────────────

function ReviewPageInner() {
  const searchParams = useSearchParams()
  const typeFilter   = searchParams.get('type') as 'all' | 'vocab' | 'grammar' | null ?? 'all'

  const [loading, setLoading] = useState(true)
  const [cards, setCards]     = useState<ReviewCard[]>([])
  const [index, setIndex]     = useState(0)
  const [done, setDone]       = useState(false)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now = new Date().toISOString()

        // Build query for due reviews, filtered by type if requested
        let reviewQuery = supabase
          .from('gwc_user_reviews')
          .select('*')
          .eq('session_id', sessionId)
          .lte('next_review_at', now)
          .order('next_review_at', { ascending: true })
          .limit(50)

        if (typeFilter === 'vocab') {
          reviewQuery = reviewQuery.eq('item_type', 'vocab')
        } else if (typeFilter === 'grammar') {
          reviewQuery = reviewQuery.eq('item_type', 'grammar')
        }

        const { data: reviews, error: rErr } = await reviewQuery
        if (rErr) throw rErr
        if (!reviews || reviews.length === 0) { setCards([]); setLoading(false); return }

        // ── Build vocab cards ─────────────────────────────────────────────────
        const vocabReviews   = reviews.filter((r: { item_type: string }) => r.item_type === 'vocab')
        const grammarReviews = reviews.filter((r: { item_type: string }) => r.item_type === 'grammar')

        const built: ReviewCard[] = []

        if (vocabReviews.length > 0) {
          const sentIds = vocabReviews.map((r: { word_sentence_id: string }) => r.word_sentence_id).filter(Boolean)
          const { data: reviewSentences } = await supabase.from('gwc_word_sentences').select('*').in('id', sentIds)
          const wordIds = [...new Set((reviewSentences || []).map((s: VocabSentence) => s.word_id))]
          const [{ data: words }, { data: allSentences }] = await Promise.all([
            supabase.from('gwc_words').select('*').in('id', wordIds),
            supabase.from('gwc_word_sentences').select('*').in('word_id', wordIds).order('sort_order', { ascending: true }),
          ])

          const wordMap     = Object.fromEntries((words || []).map((w: VocabWord) => [w.id, w]))
          const sentenceMap = Object.fromEntries((reviewSentences || []).map((s: VocabSentence) => [s.id, s]))
          const allByWord: Record<string, VocabSentence[]> = {}
          for (const s of (allSentences || [])) {
            if (!allByWord[s.word_id]) allByWord[s.word_id] = []
            allByWord[s.word_id].push(s)
          }

          for (const r of vocabReviews) {
            const sentence = sentenceMap[r.word_sentence_id]
            if (!sentence) continue
            const word = wordMap[sentence.word_id]
            if (!word) continue
            built.push({
              kind: 'vocab', reviewId: r.id, word, sentence,
              allSentences: allByWord[sentence.word_id] || [sentence],
              easeFactor: r.ease_factor ?? 2.5, intervalDays: r.interval_days ?? 1, repetitions: r.repetitions ?? 0,
            })
          }
        }

        // ── Build grammar cards ───────────────────────────────────────────────
        // Supports both old-style (sentence-level) and new-style (form-level) review rows.
        // Old-style: grammar_form_key is null → one card per sentence (unchanged behaviour).
        // New-style: grammar_form_key is set → deduplicate by form, pick random sentence from pool.
        if (grammarReviews.length > 0) {
          // Split rows by style
          const oldStyle = grammarReviews.filter((r: { grammar_form_key?: string | null }) => !r.grammar_form_key)
          const newStyle = grammarReviews.filter((r: { grammar_form_key?: string | null }) => !!r.grammar_form_key)

          // ── Old-style: sentence-level (backwards compat) ──────────────────
          if (oldStyle.length > 0) {
            const sentIds = oldStyle.map((r: { grammar_sentence_id: string }) => r.grammar_sentence_id).filter(Boolean)
            const { data: grammarSentences } = await supabase.from('gwc_grammar_sentences').select('*').in('id', sentIds)
            const topicIds = [...new Set((grammarSentences || []).map((s: GrammarSentence) => s.topic_id))]
            const { data: topics } = await supabase.from('gwc_grammar_topics').select('*').in('id', topicIds)

            const sentenceMap = Object.fromEntries((grammarSentences || []).map((s: GrammarSentence) => [s.id, s]))
            const topicMap    = Object.fromEntries((topics || []).map((t: GrammarTopic) => [t.id, t]))

            for (const r of oldStyle) {
              const sentence = sentenceMap[r.grammar_sentence_id]
              if (!sentence) continue
              const topic = topicMap[sentence.topic_id]
              if (!topic) continue
              built.push({
                kind: 'grammar', reviewId: r.id, topic, sentence,
                easeFactor: r.ease_factor ?? 2.5, intervalDays: r.interval_days ?? 1, repetitions: r.repetitions ?? 0,
              })
            }
          }

          // ── New-style: form-level (one card per form, random sentence from pool) ──
          if (newStyle.length > 0) {
            // Deduplicate: keep only the first (earliest-due) row for each form key
            const seenFormKeys = new Set<string>()
            const dedupedForms: typeof newStyle = []
            for (const r of newStyle) {
              if (!seenFormKeys.has(r.grammar_form_key)) {
                seenFormKeys.add(r.grammar_form_key)
                dedupedForms.push(r)
              }
            }

            // Parse form keys → topicId + person
            // Format: "topic_uuid:person" or "topic_uuid:null"
            const formInfos = dedupedForms.map((r: { grammar_form_key: string; id: string; ease_factor: number; interval_days: number; repetitions: number }) => {
              const colonIdx = r.grammar_form_key.indexOf(':')
              const topicId  = r.grammar_form_key.slice(0, colonIdx)
              const personStr = r.grammar_form_key.slice(colonIdx + 1)
              return { review: r, topicId, person: personStr === 'null' ? null : personStr }
            })

            const formTopicIds = [...new Set(formInfos.map(f => f.topicId))]
            const [{ data: formTopics }, { data: formSentences }] = await Promise.all([
              supabase.from('gwc_grammar_topics').select('*').in('id', formTopicIds),
              supabase.from('gwc_grammar_sentences').select('*').in('topic_id', formTopicIds),
            ])

            const topicMap = Object.fromEntries((formTopics || []).map((t: GrammarTopic) => [t.id, t]))

            // Index sentences by form key for O(1) pool lookup
            const poolByFormKey: Record<string, GrammarSentence[]> = {}
            for (const s of (formSentences as GrammarSentence[] || [])) {
              const key = `${s.topic_id}:${s.person ?? 'null'}`
              if (!poolByFormKey[key]) poolByFormKey[key] = []
              poolByFormKey[key].push(s)
            }

            for (const { review, topicId } of formInfos) {
              const topic = topicMap[topicId]
              if (!topic) continue
              const pool = poolByFormKey[review.grammar_form_key] || []
              if (pool.length === 0) continue
              // Pick a random sentence from the pool so each review uses a different example
              const sentence = pool[Math.floor(Math.random() * pool.length)]
              built.push({
                kind: 'grammar', reviewId: review.id, topic, sentence,
                easeFactor: review.ease_factor ?? 2.5, intervalDays: review.interval_days ?? 1, repetitions: review.repetitions ?? 0,
              })
            }
          }
        }

        setCards(built)
      } catch (e) {
        setError('Could not load reviews.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [typeFilter])

  async function handleResult(wasCorrect: boolean) {
    const card = cards[index]
    const sessionId = getOrCreateSessionId()

    const newCorrect  = wasCorrect ? correct + 1 : correct
    const newMistakes = wasCorrect ? mistakes : mistakes + 1

    const srs = calculateNextReview(wasCorrect, card.easeFactor, card.intervalDays, card.repetitions)
    const nextAt = new Date(Date.now() + srs.nextInterval * 86400000).toISOString()
    const now = new Date().toISOString()

    if (card.kind === 'vocab') {
      // Rotate to next sentence for vocab (so each review uses a different example)
      const sentenceList = card.allSentences
      const currentIdx   = sentenceList.findIndex(s => s.id === card.sentence.id)
      const nextSentId   = sentenceList[(currentIdx + 1) % sentenceList.length].id

      await supabase.from('gwc_user_reviews').update({
        word_sentence_id: nextSentId,
        correct: wasCorrect, reviewed_at: now, next_review_at: nextAt,
        ease_factor: srs.newEaseFactor, interval_days: srs.nextInterval, repetitions: srs.newRepetitions,
      }).eq('id', card.reviewId).eq('session_id', sessionId)
    } else {
      // Grammar: no sentence rotation (each sentence IS its own card)
      await supabase.from('gwc_user_reviews').update({
        correct: wasCorrect, reviewed_at: now, next_review_at: nextAt,
        ease_factor: srs.newEaseFactor, interval_days: srs.nextInterval, repetitions: srs.newRepetitions,
      }).eq('id', card.reviewId).eq('session_id', sessionId)
    }

    if (wasCorrect) setCorrect(newCorrect); else setMistakes(newMistakes)

    if (index + 1 >= cards.length) {
      const xpGained = newCorrect * XP_CORRECT_REVIEW + newMistakes * XP_WRONG_REVIEW
      await awardXPAndUpdateStreak(sessionId, xpGained)
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9b98b0]">Loading reviews…</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-[#e8e6f0] font-bold mb-2">Could not load reviews</p>
          <p className="text-[#9b98b0] text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold">Back</Link>
        </div>
      </div>
    )
  }
  if (done)             return <CompletionScreen total={cards.length} correct={correct} />
  if (cards.length === 0) return <EmptyState />

  return (
    <ReviewCardView
      key={cards[index].reviewId}
      card={cards[index]}
      cardNumber={index + 1}
      total={cards.length}
      mistakes={mistakes}
      onResult={handleResult}
    />
  )
}

// ─── Exported Page (wraps inner in Suspense for useSearchParams) ──────────────

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReviewPageInner />
    </Suspense>
  )
}
