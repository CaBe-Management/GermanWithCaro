'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { awardXPAndUpdateStreak, XP_CORRECT_REVIEW, XP_WRONG_REVIEW } from '@/lib/gamification'
import { getSubscriptionStatus, isPro } from '@/lib/subscription'
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
          ? <span key={i}>{part}<mark className="bg-transparent text-gwc-accent-soft font-bold not-italic">{highlight}</mark></span>
          : part
      )}
    </>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({ total, correct }: { total: number; correct: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="min-h-screen bg-gwc-base flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-gwc-text mb-2">All done!</h2>
        <p className="text-gwc-muted mb-2">{correct}/{total} correct — {pct}%</p>
        <p className="text-gwc-muted text-sm mb-8">Your SRS queue has been updated.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-gwc-accent text-white font-bold hover:bg-gwc-accent-soft transition-colors">Dashboard</Link>
          <Link href="/videos" className="px-6 py-3 rounded-xl bg-gwc-text/8 text-gwc-text font-bold hover:bg-gwc-text/12 transition-colors">Browse Videos</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="min-h-screen bg-gwc-base flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gwc-text mb-2">No reviews due!</h2>
        <p className="text-gwc-muted mb-8">All caught up. Browse videos to add more sentences.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-gwc-accent text-white font-bold">Dashboard</Link>
          <Link href="/videos" className="px-6 py-3 rounded-xl bg-gwc-text/8 text-gwc-text font-bold hover:bg-gwc-text/12 transition-colors">Videos</Link>
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
  const [flipped, setFlipped]       = useState(false)
  const [answered, setAnswered]     = useState(false)
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null)
  const [saving, setSaving]         = useState(false)

  const progress  = (cardNumber - 1) / total
  const srsLabel  = SRS_LABELS[Math.min(card.srsLevel, 11)] ?? 'Novice I' /* SRS stage labels */

  // Reset on card change
  useEffect(() => {
    setFlipped(false)
    setAnswered(false)
    setWasCorrect(null)
    setSaving(false)
  }, [card.reviewId])

  // Keyboard shortcuts:
  //   Space (not flipped) → reveal
  //   1     (flipped)     → "I didn't know"
  //   2     (flipped)     → "I knew it"
  //   Space (answered)    → next
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault()
        if (!flipped) {
          setFlipped(true)
        } else if (answered) {
          onNext()
        }
      }
      if (flipped && !answered && !saving) {
        if (e.key === '1') handleMark(false)
        if (e.key === '2') handleMark(true)
      }
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
    <div className="min-h-screen bg-gwc-base flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gwc-text/6">
        <Link href="/dashboard" className="text-gwc-muted hover:text-gwc-text transition-colors text-sm">
          ← Dashboard {/* Navigation link */}
        </Link>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md text-xs text-[#6b6880] bg-gwc-text/5 border border-gwc-text/8">
            {srsLabel}
          </span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gwc-muted">□ <span className="font-bold text-gwc-text">{total - (cardNumber - 1)}</span></span>
            <span className="text-gwc-success">✓ <span className="font-bold">{correct}</span></span>
            <span className="text-gwc-error">✗ <span className={`font-bold ${mistakes > 0 ? '' : 'text-gwc-muted'}`}>{mistakes}</span></span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gwc-text/5">
        <div className="h-full bg-gwc-accent transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-xl w-full">
          <div
            className={`bg-gwc-panel rounded-2xl border p-8 sm:p-12 text-center cursor-pointer select-none transition-all duration-200 ${
              answered
                ? wasCorrect ? 'border-gwc-success/40' : 'border-gwc-error/40'
                : flipped   ? 'border-gwc-accent/40'  : 'border-gwc-text/8 hover:border-gwc-accent/30'
            }`}
            onClick={() => !flipped && setFlipped(true)}
          >
            {/* Front */}
            {!flipped && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gwc-muted mb-6 font-medium">🇩🇪 German (to reveal)</p>
                <p className="text-2xl sm:text-3xl font-light text-gwc-text leading-relaxed">
                  <HighlightText text={card.sentence.sentence_de} highlight={card.sentence.highlight_de} />
                </p>
                <p className="text-xs text-gwc-dim mt-8">Click or press <kbd className="px-1.5 py-0.5 rounded bg-gwc-text/8 text-[#6b6880] font-mono text-xs">Space</kbd> to reveal</p>
              </div>
            )}

            {/* Back */}
            {flipped && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gwc-muted mb-4 font-medium">🇩🇪 German</p>
                <p className="text-xl sm:text-2xl font-light text-gwc-text leading-relaxed mb-6">
                  <HighlightText text={card.sentence.sentence_de} highlight={card.sentence.highlight_de} />
                </p>
                <div className="h-px bg-gwc-text/8 mb-6" />
                <p className="text-xs uppercase tracking-widest text-gwc-muted mb-4 font-medium">🇬🇧 English</p>
                <p className="text-xl sm:text-2xl text-gwc-muted leading-relaxed italic">
                  <HighlightText text={card.sentence.sentence_en} highlight={card.sentence.highlight_en} />
                </p>
                <div className="mt-6">
                  <Link
                    href={`/videos/${card.sentence.video_id}`}
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs text-[#6b6880] hover:text-gwc-accent-soft transition-colors"
                  >
                    ▶ Go to video page
                  </Link>
                </div>
              </div>
            )}
          </div>

          {answered && (
            <p className={`mt-4 text-center text-sm font-semibold ${wasCorrect ? 'text-gwc-success' : 'text-gwc-error'}`}>
              {wasCorrect ? '✓ Nice!' : '✗ Keep going!'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-gwc-base border-t border-gwc-text/6 px-5 py-4">
        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="w-full max-w-xl mx-auto flex justify-center py-3.5 rounded-xl bg-gwc-accent text-white font-bold hover:bg-gwc-accent-soft transition-colors"
          >
            Reveal Translation
          </button>
        ) : !answered ? (
          <div className="flex gap-3 max-w-xl mx-auto">
            <button
              onClick={() => handleMark(false)}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl border-2 border-gwc-error/40 text-gwc-error font-bold hover:bg-gwc-error/10 transition-colors disabled:opacity-50"
            >
              ✗ Didn't know <span className="text-xs opacity-60">[1]</span>
            </button>
            <button
              onClick={() => handleMark(true)}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl border-2 border-gwc-success/40 text-gwc-success font-bold hover:bg-gwc-success/10 transition-colors disabled:opacity-50"
            >
              ✓ Knew it <span className="text-xs opacity-60">[2]</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onNext}
            className={`w-full max-w-xl mx-auto flex justify-center gap-2 py-3.5 rounded-xl border-2 font-bold transition-colors ${
              wasCorrect
                ? 'border-gwc-success/40 text-gwc-success hover:bg-gwc-success/10'
                : 'border-gwc-error/40 text-gwc-error hover:bg-gwc-error/10'
            }`}
          >
            Next → <span className="text-xs opacity-60">[Space]</span>
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
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Check subscription first
        const status = await getSubscriptionStatus()
        if (!isPro(status)) {
          setIsSubscribed(false)
          setLoading(false)
          return
        }
        setIsSubscribed(true)
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
      <div className="min-h-screen bg-gwc-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gwc-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gwc-muted">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gwc-base flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-gwc-text font-bold mb-2">Could not load reviews</p>
          <p className="text-gwc-muted text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-gwc-accent text-white font-bold hover:bg-gwc-accent-deep">Back</Link>
        </div>
      </div>
    )
  }

  if (isSubscribed === false) return (
    <div className="min-h-screen bg-gwc-base flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-5">🔒</div>
        <h2 className="text-2xl font-bold text-gwc-text mb-3">Pro feature</h2>
        <p className="text-gwc-muted mb-8">SRS reviews are part of the Pro plan. Upgrade to start reviewing your saved sentences.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/upgrade" className="px-6 py-3 rounded-xl bg-gwc-accent text-white font-bold hover:bg-gwc-accent-soft transition-colors">
            Upgrade → €4.99/mo
          </Link>
          <Link href="/videos" className="px-6 py-3 rounded-xl bg-gwc-text/8 text-gwc-text font-bold hover:bg-gwc-text/12 transition-colors">
            Browse videos
          </Link>
        </div>
      </div>
    </div>
  )

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
      <div className="min-h-screen bg-gwc-base flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gwc-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReviewPageInner />
    </Suspense>
  )
}
