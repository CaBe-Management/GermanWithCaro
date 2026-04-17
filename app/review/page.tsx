'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { awardXPAndUpdateStreak, XP_CORRECT_REVIEW, XP_WRONG_REVIEW } from '@/lib/gamification'
import Navbar from '@/components/Navbar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoSentence {
  id: string
  video_id: string
  sentence_de: string
  sentence_en: string
  highlight_de: string | null
  highlight_en: string | null
}

interface VideoCard {
  reviewId: string
  sentence: VideoSentence
  srsLevel: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SRS_LABELS = [
  'Novice I','Novice II','Novice III',
  'Apprentice I','Apprentice II','Apprentice III',
  'Journeyman I','Journeyman II',
  'Expert I','Expert II',
  'Master','⭐ Mastered',
]

function HighlightText({ text, highlight }: { text: string; highlight: string | null }) {
  if (!highlight) return <>{text}</>
  const parts = text.split(highlight)
  return (
    <>
      {parts.map((part, i, arr) =>
        i < arr.length - 1
          ? <span key={i}>{part}<mark className="bg-transparent text-[#9b8cf5] font-bold not-italic">{highlight}</mark></span>
          : part
      )}
    </>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({ total, correct }: { total: number; correct: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">All done!</h2>
        <p className="text-[#9b98b0] mb-2">{correct}/{total} correct — {pct}%</p>
        <p className="text-[#9b98b0] text-sm mb-8">Your SRS queue has been updated.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">Dashboard</Link>
          <Link href="/videos" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">Browse Videos</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-[#e8e6f0] mb-2">No reviews due!</h2>
        <p className="text-[#9b98b0] mb-8">All caught up. Browse videos to add more sentences.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold">Dashboard</Link>
          <Link href="/videos" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">Videos</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Flip Card ────────────────────────────────────────────────────────────────

function FlipCard({
  card,
  cardNumber,
  total,
  correct,
  mistakes,
  onAnswer,
  onNext,
}: {
  card: VideoCard
  cardNumber: number
  total: number
  correct: number
  mistakes: number
  onAnswer: (wasCorrect: boolean) => Promise<void>
  onNext: () => void
}) {
  const [flipped, setFlipped]     = useState(false)
  const [answered, setAnswered]   = useState(false)
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null)
  const [saving, setSaving]       = useState(false)

  const progress  = (cardNumber - 1) / total
  const srsLabel  = SRS_LABELS[Math.min(card.srsLevel, 11)] ?? 'Novice I' /* SRS stage labels */

  // Reset on card change
  useEffect(() => {
    setFlipped(false)
    setAnswered(false)
    setWasCorrect(null)
    setSaving(false)
  }, [card.reviewId])

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!flipped && e.key === ' ') { e.preventDefault(); setFlipped(true) }
      if (flipped && !answered && !saving) {
        if (e.key === '1') handleMark(true)
        if (e.key === '2') handleMark(false)
      }
      if (answered && e.key === 'Enter') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flipped, answered, saving, onNext])

  async function handleMark(correct: boolean) {
    if (saving) return
    setSaving(true)
    setAnswered(true)
    setWasCorrect(correct)
    await onAnswer(correct)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard {/* Navigation link */}
        </Link>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md text-xs text-[#6b6880] bg-white/5 border border-white/8">
            {srsLabel}
          </span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#9b98b0]">□ <span className="font-bold text-[#e8e6f0]">{total - (cardNumber - 1)}</span></span>
            <span className="text-[#4ade80]">✓ <span className="font-bold">{correct}</span></span>
            <span className="text-[#f87171]">✗ <span className={`font-bold ${mistakes > 0 ? '' : 'text-[#9b98b0]'}`}>{mistakes}</span></span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-xl w-full">
          <div
            className={`bg-[#1a1830] rounded-2xl border p-8 sm:p-12 text-center cursor-pointer select-none transition-all duration-200 ${
              answered
                ? wasCorrect ? 'border-[#4ade80]/40' : 'border-[#f87171]/40'
                : flipped   ? 'border-[#7c6df2]/40'  : 'border-white/8 hover:border-[#7c6df2]/30'
            }`}
            onClick={() => !flipped && setFlipped(true)}
          >
            {/* Front */}
            {!flipped && (
              <div>
                <p className="text-xs uppercase tracking-widest text-[#9b98b0] mb-6 font-medium">🇩🇪 German (to reveal)</p>
                <p className="text-2xl sm:text-3xl font-light text-[#e8e6f0] leading-relaxed">
                  <HighlightText text={card.sentence.sentence_de} highlight={card.sentence.highlight_de} />
                </p>
                <p className="text-xs text-[#4a4760] mt-8">Click or press Space to reveal</p>
              </div>
            )}

            {/* Back */}
            {flipped && (
              <div>
                <p className="text-xs uppercase tracking-widest text-[#9b98b0] mb-4 font-medium">🇩🇪 German</p>
                <p className="text-xl sm:text-2xl font-light text-[#e8e6f0] leading-relaxed mb-6">
                  <HighlightText text={card.sentence.sentence_de} highlight={card.sentence.highlight_de} />
                </p>
                <div className="h-px bg-white/8 mb-6" />
                <p className="text-xs uppercase tracking-widest text-[#9b98b0] mb-4 font-medium">🇬🇧 English</p>
                <p className="text-xl sm:text-2xl text-[#9b98b0] leading-relaxed italic">
                  <HighlightText text={card.sentence.sentence_en} highlight={card.sentence.highlight_en} />
                </p>
                <div className="mt-6">
                  <Link
                    href={`/videos/${card.sentence.video_id}`}
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs text-[#6b6880] hover:text-[#9b8cf5] transition-colors"
                  >
                    ▶ Go to video page
                  </Link>
                </div>
              </div>
            )}
          </div>

          {answered && (
            <p className={`mt-4 text-center text-sm font-semibold ${wasCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {wasCorrect ? '✓ Nice!' : '✗ Keep going!'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-[#0f0e17] border-t border-white/5 px-5 py-4">
        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="w-full max-w-xl mx-auto flex justify-center py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors"
          >
            Reveal Translation
          </button>
        ) : !answered ? (
          <div className="flex gap-3 max-w-xl mx-auto">
            <button
              onClick={() => handleMark(false)}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl border-2 border-[#f87171]/40 text-[#f87171] font-bold hover:bg-[#f87171]/10 transition-colors disabled:opacity-50"
            >
              ✗ Didn't know <span className="text-xs opacity-60">[2]</span>
            </button>
            <button
              onClick={() => handleMark(true)}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl border-2 border-[#4ade80]/40 text-[#4ade80] font-bold hover:bg-[#4ade80]/10 transition-colors disabled:opacity-50"
            >
              ✓ Knew it <span className="text-xs opacity-60">[1]</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onNext}
            className={`w-full max-w-xl mx-auto flex justify-center gap-2 py-3.5 rounded-xl border-2 font-bold transition-colors ${
              wasCorrect
                ? 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10'
                : 'border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10'
            }`}
          >
            Next → <span className="text-xs opacity-60">(Enter)</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ReviewPageInner() {
  const [loading, setLoading]   = useState(true)
  const [cards, setCards]       = useState<VideoCard[]>([])
  const [index, setIndex]       = useState(0)
  const [done, setDone]         = useState(false)
  const [correct, setCorrect]   = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now = new Date().toISOString()

        const { data: reviews, error: reviewError } = await supabase
          .from('gwc_video_reviews')
          .select('id, sentence_id, repetitions')
          .eq('session_id', sessionId)
          .lte('next_review_at', now)
          .order('next_review_at', { ascending: true })
          .limit(50)

        if (reviewError) throw reviewError
        if (!reviews || reviews.length === 0) { setLoading(false); return }

        const sentenceIds = reviews.map((r: { sentence_id: string }) => r.sentence_id)
        const { data: sentences, error: sentError } = await supabase
          .from('gwc_video_sentences')
          .select('id, video_id, sentence_de, sentence_en, highlight_de, highlight_en')
          .in('id', sentenceIds)

        if (sentError) throw sentError

        const sentMap = Object.fromEntries((sentences ?? []).map((s: VideoSentence) => [s.id, s]))

        const built: VideoCard[] = reviews
          .map((r: { id: string; sentence_id: string; repetitions: number }) => {
            const sentence = sentMap[r.sentence_id]
            if (!sentence) return null
            return { reviewId: r.id, sentence, srsLevel: r.repetitions ?? 0 }
          })
          .filter(Boolean) as VideoCard[]

        setCards(built)
      } catch (e) {
        console.error(e)
        setError('Could not load reviews.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) /* Load reviews on mount */

  async function handleAnswer(wasCorrect: boolean) {
    const card = cards[index]
    const sessionId = getOrCreateSessionId()
    const srs = calculateNextReview(wasCorrect, card.srsLevel)
    const nextAt = new Date(Date.now() + srs.intervalHours * 3_600_000).toISOString()
    const now = new Date().toISOString()

    const { data: cur } = await supabase
      .from('gwc_video_reviews')
      .select('total_reviews, correct_reviews, correct_streak')
      .eq('id', card.reviewId)
      .single()

    await supabase.from('gwc_video_reviews').update({
      next_review_at:  nextAt,
      ease_factor:     2.5,
      interval_days:   Math.ceil(srs.intervalDays),
      repetitions:     srs.newSrsLevel,
      correct_streak:  wasCorrect ? ((cur?.correct_streak ?? 0) + 1) : 0,
      total_reviews:   (cur?.total_reviews   ?? 0) + 1,
      correct_reviews: (cur?.correct_reviews ?? 0) + (wasCorrect ? 1 : 0),
      updated_at:      now,
    }).eq('id', card.reviewId)

    if (wasCorrect) setCorrect(c => c + 1)
    else setMistakes(m => m + 1)
  }

  async function handleNext() {
    if (index + 1 >= cards.length) {
      const sessionId = getOrCreateSessionId()
      const xp = correct * XP_CORRECT_REVIEW + mistakes * XP_WRONG_REVIEW
      await awardXPAndUpdateStreak(sessionId, xp)
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
          <p className="text-[#9b98b0]">Loading reviews...</p>
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
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#6b5de0]">Back</Link>
        </div>
      </div>
    )
  }

  if (done)             return <CompletionScreen total={cards.length} correct={correct} />
  if (cards.length === 0) return <EmptyState />

  return (
    <FlipCard
      key={cards[index].reviewId}
      card={cards[index]}
      cardNumber={index + 1}
      total={cards.length}
      correct={correct}
      mistakes={mistakes}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  )
}

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
