'use client'

// Review page — daily flashcard review with SM-2
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PageCard, { PageCardHeader, PageCardContent, PageCardFooter } from '@/components/layout/PageCard'
import ProgressBar from '@/components/ui/ProgressBar'
import ReviewCard from '@/components/review/ReviewCard'
import RatingButtons from '@/components/review/RatingButtons'
import Button from '@/components/ui/Button'

type DueCard = {
  id: string
  block_id: string
  lesson_blocks: {
    id: string
    content: { grammar_note?: string } | null
    german_sentence: string
    translation: string
    register: string | null
    word_breakdown: { de: string; en: string; role: string }[] | null
    audio_url: string | null
    lessons: { title: string; unit_name: string }
  }
}

export default function ReviewPage() {
  const router = useRouter()
  const [cards, setCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gotItCount, setGotItCount] = useState(0)
  const [againCount, setAgainCount] = useState(0)

  // Fetch due cards
  useEffect(() => {
    fetch('/api/review/due')
      .then((r) => r.json())
      .then((data) => {
        setCards(data.cards ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalCards = cards.length
  const isDone = currentIndex >= totalCards
  const progress = totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0

  const showAnswer = useCallback(() => setRevealed(true), [])

  const rate = useCallback(async (quality: 0 | 1) => {
    const card = cards[currentIndex]
    if (!card) return

    if (quality === 0) setAgainCount((c) => c + 1)
    else setGotItCount((c) => c + 1)

    await fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockId: card.block_id, quality }),
    })

    setRevealed(false)
    setCurrentIndex((prev) => prev + 1)
  }, [cards, currentIndex])

  // Keyboard: Space = show answer, A = again, G = got it
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === ' ' && !revealed && !isDone) {
        e.preventDefault()
        showAnswer()
      }
      if (e.key === 'a' && revealed && !isDone) rate(0)
      if (e.key === 'g' && revealed && !isDone) rate(1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [revealed, isDone, showAnswer, rate])

  if (loading) {
    return (
      <PageCard>
        <PageCardContent className="flex min-h-[400px] items-center justify-center">
          <p className="text-[14px] text-text-3">Loading...</p>
        </PageCardContent>
      </PageCard>
    )
  }

  return (
    <PageCard>
      <PageCardHeader>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[20px] text-text-2">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[17px] font-bold text-text-1">Daily Review</h1>
        </div>
        <div className="mt-4">
          <ProgressBar value={progress} />
          <p className="mt-2 text-[12px] text-text-3">
            {isDone
              ? `${totalCards} cards · ${gotItCount} got it · ${againCount} again`
              : `Card ${currentIndex + 1} of ${totalCards} · ${totalCards - currentIndex} remaining`}
          </p>
        </div>
      </PageCardHeader>

      <PageCardContent className="flex min-h-[400px] flex-col justify-center">
        {totalCards === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-[64px]">🎉</span>
            <h2 className="text-[24px] font-extrabold text-text-1">All done!</h2>
            <p className="text-[14px] text-text-2">No cards to review today.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        ) : isDone ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="text-[64px]">🎉</span>
            <h2 className="text-[24px] font-extrabold text-text-1">Review complete!</h2>
            <p className="text-[14px] text-text-2">
              {totalCards} cards · {gotItCount} got it · {againCount} again
            </p>
            <div className="flex w-full flex-col gap-3">
              <Button onClick={() => router.push('/dashboard')}>
                Back to dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setCurrentIndex(0)
                  setRevealed(false)
                  setGotItCount(0)
                  setAgainCount(0)
                }}
              >
                Go again
              </Button>
            </div>
          </div>
        ) : (
          <ReviewCard card={cards[currentIndex]} revealed={revealed} />
        )}
      </PageCardContent>

      {!isDone && totalCards > 0 && (
        <PageCardFooter>
          {!revealed ? (
            <Button onClick={showAnswer} fullWidth>
              Show answer
            </Button>
          ) : (
            <RatingButtons onAgain={() => rate(0)} onGotIt={() => rate(1)} />
          )}
        </PageCardFooter>
      )}
    </PageCard>
  )
}
