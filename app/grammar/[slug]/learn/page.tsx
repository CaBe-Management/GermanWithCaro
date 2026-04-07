'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { GrammarTopic, GrammarSentence } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { awardXPAndUpdateStreak, updateDailyCards, XP_CORRECT_LEARN, XP_WRONG_LEARN } from '@/lib/gamification'

// ─── Types ────────────────────────────────────────────────────────────────────

// One question in the cloze session
interface ClozeItem {
  sentenceId: string
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  person: string | null
}

type Phase = 'loading' | 'error' | 'explanation' | 'cloze' | 'done'

interface CompletionData {
  total: number
  correct: number
  xpGained: number
  newStreak: number
  newSentences: number  // how many were new (added to SRS for first time)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

function levelColor(level: string): string {
  switch (level) {
    case 'A1': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'A2': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'B1': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'B2': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'C1': return 'bg-red-500/20 text-red-300 border-red-500/30'
    default:   return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// Render the markdown explanation as safe HTML (bold + newlines only)
function renderExplanation(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8e6f0]">$1</strong>')
    .replace(/\n/g, '<br />')
}

// ─── Explanation Slide ────────────────────────────────────────────────────────

function ExplanationSlide({
  topic,
  queueCount,
  onStart,
}: {
  topic: GrammarTopic
  queueCount: number
  onStart: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <Link href={`/grammar/${topic.slug}`} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← {topic.title}
        </Link>
        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelColor(topic.level)}`}>
          {topic.level}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-xs font-bold text-[#7c6df2] uppercase tracking-wider mb-2">Grammar Explanation</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e8e6f0] mb-6">{topic.title}</h1>

          {/* Explanation card */}
          <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
            <div
              className="text-[#c5c3d4] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderExplanation(topic.explanation_en) }}
            />
          </div>
        </div>

        {/* Info about session */}
        <div className="bg-[#7c6df2]/10 border border-[#7c6df2]/20 rounded-xl px-5 py-4 mb-6">
          <p className="text-[#9b8cf5] text-sm font-medium">
            {queueCount} sentence{queueCount !== 1 ? 's' : ''} to practice
          </p>
          <p className="text-[#9b98b0] text-xs mt-0.5">
            Each sentence you get right is added to your SRS review queue.
          </p>
        </div>
      </div>

      {/* Start button (sticky bottom) */}
      <div className="px-5 py-5 border-t border-white/5 max-w-2xl mx-auto w-full">
        <button
          onClick={onStart}
          className="w-full py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#7c6df2]/20"
        >
          Start Practice →
        </button>
      </div>
    </div>
  )
}

// ─── Single Cloze Card ────────────────────────────────────────────────────────

function ClozeCard({
  item,
  cardNumber,
  total,
  mistakes,
  topicTitle,
  onResult,
}: {
  item: ClozeItem
  cardNumber: number
  total: number
  mistakes: number
  topicTitle: string
  onResult: (correct: boolean) => void
}) {
  const [input, setInput]       = useState('')
  const [answered, setAnswered] = useState(false)

  const isCorrect =
    normalize(input) === normalize(item.cloze_word) ||
    input.trim().toLowerCase() === item.cloze_word.toLowerCase()

  const handleCheck = useCallback(() => {
    if (!input.trim() || answered) return
    setAnswered(true)
  }, [input, answered])

  const handleNext = useCallback(() => {
    onResult(isCorrect)
  }, [isCorrect, onResult])

  // Keyboard shortcut: Enter to check / next
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') answered ? handleNext() : handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answered, handleCheck, handleNext])

  // Reset on card change
  useEffect(() => {
    setInput('')
    setAnswered(false)
  }, [item.sentenceId])

  // Build cloze display (split sentence around the blank)
  const parts = item.sentence_de.replace(new RegExp(item.cloze_word, 'i'), '___').split('___')
  const progress = (cardNumber - 1) / total

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top stats bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#7c6df2]/20 text-[#9b8cf5] font-bold border border-[#7c6df2]/30">
            Grammar
          </span>
          <span className="text-xs text-[#9b98b0] hidden sm:inline truncate max-w-[140px]">{topicTitle}</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#9b98b0]">{cardNumber}/{total}</span>
          {mistakes > 0 && (
            <span className="text-[#f87171] font-bold">{mistakes} ✗</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Person badge (for conjugation topics) */}
      {item.person && (
        <div className="px-5 pt-5 flex justify-center">
          <span className="px-3 py-1 rounded-lg text-sm font-bold bg-[#252340] text-[#9b8cf5] border border-[#7c6df2]/20">
            {item.person}
          </span>
        </div>
      )}

      {/* Cloze sentence */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-2xl w-full text-center space-y-5">

          {/* English translation shown first — gives context before the user fills in the blank */}
          {item.sentence_en && (
            <p className="text-[#9b98b0] text-base sm:text-xl leading-relaxed italic">
              {item.sentence_en}
            </p>
          )}

          {/* German sentence with gap — user types the missing word */}
          <p className="text-[#e8e6f0] text-xl sm:text-3xl md:text-4xl leading-relaxed font-light">
            {parts[0]}
            <span className={`inline-block min-w-[120px] border-b-2 px-2 font-bold text-center transition-colors ${
              !answered
                ? 'border-[#7c6df2] text-[#9b8cf5]'
                : isCorrect
                  ? 'border-[#4ade80] text-[#4ade80]'
                  : 'border-[#f87171] text-[#f87171]'
            }`}>
              {answered ? item.cloze_word : (input || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0')}
            </span>
            {parts[1]}
          </p>

          {/* Wrong answer feedback */}
          {answered && !isCorrect && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm">
              You typed: <span className="font-bold">"{input}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom input / next */}
      <div className="bg-[#0f0e17] border-t border-white/5">
        {!answered ? (
          <div className="px-5 py-4 flex gap-3 max-w-xl mx-auto w-full">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type the missing word…"
              className="flex-1 bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors text-lg"
            />
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg"
            >
              ✓
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 max-w-xl mx-auto w-full">
            <button
              onClick={handleNext}
              className={`w-full py-3.5 rounded-xl border-2 font-bold text-base transition-colors ${
                isCorrect
                  ? 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10'
                  : 'border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10'
              }`}
            >
              {cardNumber >= total ? 'Finish ✓' : 'Next →'}{' '}
              <span className="text-xs opacity-60">(Enter)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({
  data,
  slug,
}: {
  data: CompletionData
  slug: string
}) {
  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">
          {pct >= 70 ? 'Well done!' : 'Keep practicing!'}
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">Correct</p>
            <p className="text-xl font-bold text-[#4ade80]">{pct}%</p>
          </div>
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">XP</p>
            <p className="text-xl font-bold text-[#9b8cf5]">+{data.xpGained}</p>
          </div>
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">Added</p>
            <p className="text-xl font-bold text-[#e8e6f0]">{data.newSentences}</p>
          </div>
        </div>

        {data.newSentences > 0 && (
          <p className="text-[#9b98b0] text-sm mb-6">
            <span className="text-[#9b8cf5] font-semibold">{data.newSentences}</span> new sentence{data.newSentences !== 1 ? 's' : ''} added to your Review Queue.
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Link
            href="/review"
            className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors"
          >
            Review Now
          </Link>
          <Link
            href={`/grammar/${slug}`}
            className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors"
          >
            Back to Topic
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GrammarLearnPage() {
  const params = useParams()
  const slug = params.slug as string

  const [phase, setPhase]         = useState<Phase>('loading')
  const [topic, setTopic]         = useState<GrammarTopic | null>(null)
  const [items, setItems]         = useState<ClozeItem[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [mistakes, setMistakes]   = useState(0)
  const [results, setResults]     = useState<{ sentenceId: string; correct: boolean }[]>([])
  const [completion, setCompletion] = useState<CompletionData | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    async function load() {
      setPhase('loading')
      try {
        const sessionId = getOrCreateSessionId()

        // Fetch topic
        const { data: topicData, error: tErr } = await supabase
          .from('gwc_grammar_topics')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (tErr) throw tErr
        if (!topicData) { setErrorMsg('Topic not found.'); setPhase('error'); return }
        setTopic(topicData)

        // Fetch all sentences in sort_order (forms grouped: ich first, then du, etc.)
        const { data: sentData, error: sErr } = await supabase
          .from('gwc_grammar_sentences')
          .select('*')
          .eq('topic_id', topicData.id)
          .order('sort_order', { ascending: true })

        if (sErr) throw sErr
        const sentences: GrammarSentence[] = sentData || []

        // Find which sentences the user hasn't reviewed yet
        if (sentences.length > 0) {
          const sentIds = sentences.map(s => s.id)
          const { data: reviewed } = await supabase
            .from('gwc_user_reviews')
            .select('grammar_sentence_id')
            .eq('session_id', sessionId)
            .eq('item_type', 'grammar')
            .in('grammar_sentence_id', sentIds)

          const reviewedSet = new Set((reviewed || []).map((r: { grammar_sentence_id: string }) => r.grammar_sentence_id))

          // For this session: all sentences (both new and already-reviewed)
          // so user can always practice even if everything is in queue
          // But prioritise new sentences first (unreviewed)
          const newSentences    = sentences.filter(s => !reviewedSet.has(s.id))
          const reviewedSents   = sentences.filter(s => reviewedSet.has(s.id))
          const orderedSentences = [...newSentences, ...reviewedSents]

          setItems(orderedSentences.map(s => ({
            sentenceId:  s.id,
            sentence_de: s.sentence_de,
            sentence_en: s.sentence_en,
            cloze_word:  s.cloze_word,
            person:      s.person,
          })))
        }

        setPhase('explanation')
      } catch (e) {
        console.error(e)
        setErrorMsg('Could not load this topic.')
        setPhase('error')
      }
    }
    load()
  }, [slug])

  // Called when user answers a card
  async function handleResult(correct: boolean) {
    const newResults = [...results, { sentenceId: items[cardIndex].sentenceId, correct }]
    setResults(newResults)
    if (!correct) setMistakes(m => m + 1)

    if (cardIndex + 1 >= items.length) {
      // Session complete — save to DB
      await saveResults(newResults)
    } else {
      setCardIndex(i => i + 1)
    }
  }

  async function saveResults(finalResults: { sentenceId: string; correct: boolean }[]) {
    const sessionId = getOrCreateSessionId()
    const correctCount = finalResults.filter(r => r.correct).length
    const wrongCount   = finalResults.length - correctCount

    // Find which sentence IDs are new (not yet in user's reviews)
    const sentIds = finalResults.map(r => r.sentenceId)
    const { data: existing } = await supabase
      .from('gwc_user_reviews')
      .select('grammar_sentence_id')
      .eq('session_id', sessionId)
      .eq('item_type', 'grammar')
      .in('grammar_sentence_id', sentIds)

    const existingSet  = new Set((existing || []).map((r: { grammar_sentence_id: string }) => r.grammar_sentence_id))
    const newResults   = finalResults.filter(r => !existingSet.has(r.sentenceId))
    const newSentCount = newResults.length

    // Insert review rows for NEW sentences
    if (newResults.length > 0) {
      await supabase.from('gwc_user_reviews').insert(
        newResults.map(r => {
          const srs = calculateNextReview(r.correct, 2.5, 1, 0)
          return {
            session_id:          sessionId,
            word_sentence_id:    null,
            grammar_sentence_id: r.sentenceId,
            item_type:           'grammar',
            correct:             r.correct,
            reviewed_at:         new Date().toISOString(),
            next_review_at:      new Date(Date.now() + srs.nextInterval * 86400000).toISOString(),
            ease_factor:         srs.newEaseFactor,
            interval_days:       srs.nextInterval,
            repetitions:         srs.newRepetitions,
          }
        })
      )
    }

    // Update existing review rows for already-known sentences (rescheduling)
    const reviewedResults = finalResults.filter(r => existingSet.has(r.sentenceId))
    for (const r of reviewedResults) {
      const srs = calculateNextReview(r.correct, 2.5, 1, 0)
      await supabase
        .from('gwc_user_reviews')
        .update({
          correct:       r.correct,
          reviewed_at:   new Date().toISOString(),
          next_review_at: new Date(Date.now() + srs.nextInterval * 86400000).toISOString(),
          ease_factor:   srs.newEaseFactor,
          interval_days: srs.nextInterval,
          repetitions:   srs.newRepetitions,
        })
        .eq('session_id', sessionId)
        .eq('grammar_sentence_id', r.sentenceId)
    }

    // Award XP + update streak + daily cards
    const xpGained = correctCount * XP_CORRECT_LEARN + wrongCount * XP_WRONG_LEARN
    const xpResult = await awardXPAndUpdateStreak(sessionId, xpGained)
    await updateDailyCards(sessionId, finalResults.length)

    setCompletion({
      total:       finalResults.length,
      correct:     correctCount,
      xpGained,
      newStreak:   xpResult?.newStreak ?? 0,
      newSentences: newSentCount,
    })
    setPhase('done')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-[#e8e6f0] font-bold mb-4">{errorMsg}</p>
          <Link href="/grammar" className="text-[#7c6df2] hover:text-[#9b8cf5] transition-colors">
            ← Grammar
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'done' && completion) {
    return <CompletionScreen data={completion} slug={slug} />
  }

  if (phase === 'explanation' && topic) {
    return (
      <ExplanationSlide
        topic={topic}
        queueCount={items.length}
        onStart={() => setPhase('cloze')}
      />
    )
  }

  if (phase === 'cloze' && items.length > 0) {
    return (
      <ClozeCard
        key={items[cardIndex].sentenceId}
        item={items[cardIndex]}
        cardNumber={cardIndex + 1}
        total={items.length}
        mistakes={mistakes}
        topicTitle={topic?.title ?? ''}
        onResult={handleResult}
      />
    )
  }

  // No items at all (shouldn't happen)
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-[#e8e6f0] font-bold mb-2">Nothing to practice here.</p>
        <Link href={`/grammar/${slug}`} className="text-[#7c6df2] hover:text-[#9b8cf5] transition-colors">
          ← Back to Topic
        </Link>
      </div>
    </div>
  )
}
