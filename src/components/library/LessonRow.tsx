'use client'

// LessonRow — a single lesson inside a unit section
// Completed: click to expand flashcard details, "View full lesson" link
// Not completed: "Start lesson" link, greyed out
import Link from 'next/link'
import { Check, Circle, ChevronDown, ChevronRight } from 'lucide-react'
import FlashcardList from '@/components/library/FlashcardList'

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

type Lesson = {
  id: string
  title: string
  slug: string
  unit_name: string
  order_index: number
  level: string
}

export default function LessonRow({
  lesson,
  completedAt,
  flashcards,
  isExpanded,
  onToggleExpand,
}: {
  lesson: Lesson
  completedAt: string | null
  flashcards: FlashcardBlock[]
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const isCompleted = !!completedAt

  // Format the completion date
  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  // Not completed — locked, not clickable (respects dashboard gating)
  if (!isCompleted) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-3 opacity-50">
        {/* Grey circle outline */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border2">
          <Circle size={8} className="text-border2" />
        </div>

        {/* Lesson info */}
        <div className="flex-1">
          <p className="text-[14px] font-medium text-text3">{lesson.title}</p>
          <p className="mt-0.5 text-[11px] text-text3">
            Complete your reviews to unlock new lessons
          </p>
        </div>

        {/* Right side — card count only, no link */}
        <span className="shrink-0 text-xs text-text3">{flashcards.length} cards</span>
      </div>
    )
  }

  // Completed — expandable to show flashcard details
  return (
    <div>
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-surface"
      >
        {/* Sage green checkmark */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-light">
          <Check size={12} className="text-sage" />
        </div>

        {/* Lesson info */}
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-text">{lesson.title}</p>
          {formattedDate && (
            <p className="mt-0.5 text-[11px] text-text3">
              Completed on {formattedDate}
            </p>
          )}
        </div>

        {/* Right side: view lesson link + card count + chevron */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={`/lessons/${lesson.slug}`}
            className="text-sm font-medium text-primary transition hover:text-primary-dark"
            onClick={(e) => e.stopPropagation()}
          >
            View full lesson
          </Link>
          <span className="text-xs text-text3">{flashcards.length} cards</span>
          {isExpanded ? (
            <ChevronDown size={14} className="text-text3" />
          ) : (
            <ChevronRight size={14} className="text-text3" />
          )}
        </div>
      </button>

      {/* Flashcard detail list (expanded) */}
      {isExpanded && flashcards.length > 0 && (
        <div className="ml-8 mr-3 mb-2">
          <FlashcardList flashcards={flashcards} />
        </div>
      )}
    </div>
  )
}
