'use client'

// UnitSection — a collapsible unit header with progress bar and lesson rows
import { ChevronDown, ChevronRight } from 'lucide-react'
import LessonRow from '@/components/library/LessonRow'

type WordBreakdownItem = {
  de: string
  en: string
  role: string
}

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
  register: string | null
  audio_url: string | null
  content: Record<string, unknown> | null
  word_breakdown: WordBreakdownItem[] | null
}

export default function UnitSection({
  unitName,
  lessons,
  completedMap,
  flashcardsByLesson,
  isExpanded,
  onToggleUnit,
  expandedLessons,
  onToggleLesson,
  activeAudioId,
  onSetActiveAudio,
}: {
  unitName: string
  lessons: Lesson[]
  completedMap: Map<string, string>
  flashcardsByLesson: Map<string, FlashcardBlock[]>
  isExpanded: boolean
  onToggleUnit: () => void
  expandedLessons: Set<string>
  onToggleLesson: (id: string) => void
  activeAudioId: string | null
  onSetActiveAudio: (id: string) => void
}) {
  // Count completed lessons in this unit
  const completedCount = lessons.filter((l) => completedMap.has(l.id)).length
  const totalCount = lessons.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      {/* Unit header — click to expand/collapse */}
      <button
        onClick={onToggleUnit}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown size={16} className="text-text3" />
            ) : (
              <ChevronRight size={16} className="text-text3" />
            )}
            <h2 className="text-[16px] font-semibold text-text">{unitName}</h2>
          </div>
          {/* Small sage progress bar */}
          <div className="ml-6 mt-2 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-sage transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-text2">
          {completedCount}/{totalCount} lessons
        </span>
      </button>

      {/* Lesson rows — shown when expanded */}
      {isExpanded && (
        <div className="border-t border-border px-3 pb-3 pt-1">
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              completedAt={completedMap.get(lesson.id) ?? null}
              flashcards={flashcardsByLesson.get(lesson.id) ?? []}
              isExpanded={expandedLessons.has(lesson.id)}
              onToggleExpand={() => onToggleLesson(lesson.id)}
              activeAudioId={activeAudioId}
              onSetActiveAudio={onSetActiveAudio}
            />
          ))}
        </div>
      )}
    </div>
  )
}
