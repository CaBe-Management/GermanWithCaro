'use client'

// LessonRow — a single lesson inside a unit section
// Completed: expandable to show flashcard preview
// Not completed: links to the lesson page
import { useState } from 'react'
import Link from 'next/link'
import { Check, Circle, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlashcardList from '@/components/library/FlashcardList'

type Lesson = {
  id: string
  title: string
  slug: string
  unit_name: string
  order_index: number
  level: string
}

type FlashcardBlock = {
  id: string
  lesson_id: string
  order_index: number
  german_sentence: string | null
  translation: string | null
  audio_url: string | null
  content: Record<string, unknown> | null
}

export default function LessonRow({
  lesson,
  completedAt,
  flashcards,
}: {
  lesson: Lesson
  completedAt: string | null
  flashcards: FlashcardBlock[]
}) {
  const [expanded, setExpanded] = useState(false)
  const isCompleted = !!completedAt

  // Format the completion date
  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  // Not completed — link to lesson page
  if (!isCompleted) {
    return (
      <Link
        href={`/lessons/${lesson.slug}`}
        className="group flex items-center gap-3 rounded-lg px-3 py-3 opacity-50 transition hover:bg-surface hover:opacity-70"
      >
        {/* Grey circle outline */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border2">
          <Circle size={8} className="text-border2" />
        </div>

        {/* Lesson info */}
        <div className="flex-1">
          <p className="text-[14px] font-medium text-text3">{lesson.title}</p>
          <p className="mt-0.5 text-[11px] text-text3">
            Starte diese Lektion um die Karten freizuschalten
          </p>
        </div>

        {/* Flashcard count */}
        <span className="shrink-0 text-xs text-text3">
          {flashcards.length} Karten
        </span>
      </Link>
    )
  }

  // Completed — expandable to show flashcards
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
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
              Abgeschlossen am {formattedDate}
            </p>
          )}
        </div>

        {/* Flashcard count + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-text3">{flashcards.length} Karten</span>
          {expanded ? (
            <ChevronDown size={14} className="text-text3" />
          ) : (
            <ChevronRight size={14} className="text-text3" />
          )}
        </div>
      </button>

      {/* Flashcard preview (expanded) */}
      {expanded && flashcards.length > 0 && (
        <div className="ml-8 mr-3 mb-2">
          <FlashcardList flashcards={flashcards} lessonSlug={lesson.slug} />
        </div>
      )}
    </div>
  )
}
