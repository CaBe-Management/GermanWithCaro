'use client'

// FlashcardViewer — the main review experience
// Fetches due cards, shows them one at a time, handles reveal + rating
import { useState, useEffect, useCallback } from 'react'
import FlashcardCard from '@/components/flashcard/FlashcardCard'
import ReviewComplete from '@/components/flashcard/ReviewComplete'

// Shape of a due card from the API
export type DueCard = {
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
    lessons: {
      title: string
      unit_name: string
    }
  }
}

export default function FlashcardViewer({ autoplayAudio }: { autoplayAudio: boolean }) {
  const [cards, setCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalCards, setTotalCards] = useState(0)

  // Fetch all due cards when the page loads
  const fetchCards = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/review/due')
      const data = await response.json()

      if (data.cards) {
        setCards(data.cards)
        setTotalCards(data.cards.length)
      } else {
        setError('Failed to load review cards.')
      }
    } catch {
      setError('Failed to load review cards.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  // Called when user rates a card (0 = didn't know, 1 = knew it)
  async function handleRate(quality: 0 | 1) {
    const card = cards[currentIndex]
    if (!card) return

    // Submit the review result to the API
    await fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: card.block_id,
        quality,
      }),
    })

    // Move to the next card
    setCurrentIndex((prev) => prev + 1)
  }

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text3">Loading your reviews...</p>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-error">{error}</p>
      </main>
    )
  }

  // No cards due today
  if (totalCards === 0) {
    return <ReviewComplete reviewed={0} />
  }

  // All cards reviewed — show completion screen
  if (currentIndex >= totalCards) {
    return <ReviewComplete reviewed={totalCards} />
  }

  // Show the current card
  const currentCard = cards[currentIndex]

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Progress bar at top */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-text3">
            <span>Card {currentIndex + 1} of {totalCards}</span>
            <span>{Math.round(((currentIndex) / totalCards) * 100)}% done</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{ width: `${(currentIndex / totalCards) * 100}%` }}
            />
          </div>
        </div>

        {/* The flashcard */}
        <FlashcardCard
          card={currentCard}
          autoplayAudio={autoplayAudio}
          onRate={handleRate}
        />
      </div>
    </main>
  )
}
