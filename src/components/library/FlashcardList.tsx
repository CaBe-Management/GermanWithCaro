'use client'

// FlashcardList — shows full flashcard detail cards inside an expanded lesson
// Max 5 visible by default, "Show all X cards" button to reveal the rest
import { useState } from 'react'
import FlashcardDetail from '@/components/library/FlashcardDetail'

type WordBreakdownItem = {
  de: string
  en: string
  role: string
}

type FlashcardBlock = {
  id: string
  lesson_id: string
  order_index: number
  german_sentence: string | null
  translation: string | null
  register: string | null
  audio_url: string | null
  content: Record<string, unknown> | null
  word_breakdown: WordBreakdownItem[] | null
}

export default function FlashcardList({
  flashcards,
}: {
  flashcards: FlashcardBlock[]
}) {
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? flashcards : flashcards.slice(0, 5)
  const hasMore = flashcards.length > 5

  return (
    <div className="rounded-lg bg-sage-bg p-3">
      <div className="space-y-3">
        {visible.map((fc) => (
          <FlashcardDetail key={fc.id} flashcard={fc} />
        ))}
      </div>

      {/* Show all button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-md py-2 text-sm font-medium text-primary transition hover:bg-primary-light"
        >
          Show all {flashcards.length} cards
        </button>
      )}
    </div>
  )
}
