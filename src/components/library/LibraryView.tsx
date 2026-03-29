'use client'

// LibraryView — main client component for the library page
// Groups lessons by unit, manages expand/collapse state
import { useMemo } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import UnitSection from '@/components/library/UnitSection'

type Lesson = {
  id: string
  title: string
  slug: string
  unit_name: string
  order_index: number
  level: string
}

type CompletedLesson = {
  lesson_id: string
  completed_at: string | null
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

export default function LibraryView({
  lessons,
  completedLessons,
  flashcardBlocks,
}: {
  lessons: Lesson[]
  completedLessons: CompletedLesson[]
  flashcardBlocks: FlashcardBlock[]
}) {
  // Build a set of completed lesson IDs for quick lookup
  const completedMap = useMemo(() => {
    const map = new Map<string, string>() // lesson_id -> completed_at
    completedLessons.forEach((cl) => {
      if (cl.completed_at) map.set(cl.lesson_id, cl.completed_at)
    })
    return map
  }, [completedLessons])

  // Group flashcard blocks by lesson_id
  const flashcardsByLesson = useMemo(() => {
    const map = new Map<string, FlashcardBlock[]>()
    flashcardBlocks.forEach((fb) => {
      const existing = map.get(fb.lesson_id) ?? []
      existing.push(fb)
      map.set(fb.lesson_id, existing)
    })
    return map
  }, [flashcardBlocks])

  // Group lessons by unit_name (preserving order)
  const units = useMemo(() => {
    const unitMap = new Map<string, Lesson[]>()
    lessons.forEach((lesson) => {
      const existing = unitMap.get(lesson.unit_name) ?? []
      existing.push(lesson)
      unitMap.set(lesson.unit_name, existing)
    })
    return Array.from(unitMap.entries()).map(([unitName, unitLessons]) => ({
      unitName,
      lessons: unitLessons,
    }))
  }, [lessons])

  // Find the first incomplete unit (for default expand)
  const firstIncompleteUnitIndex = units.findIndex((unit) =>
    unit.lessons.some((l) => !completedMap.has(l.id))
  )

  const totalCompleted = completedMap.size
  const totalLessons = lessons.length

  // Empty state: no lessons completed
  if (totalLessons === 0) return null

  // Find first lesson slug for empty CTA
  const firstLessonSlug = lessons[0]?.slug

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Page header */}
        <h1 className="font-display text-[28px] font-semibold text-text">
          My Lessons
        </h1>
        <p className="mt-1 text-[15px] text-text2">
          Your journey through the A1 course
        </p>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-text3">
            <span>{totalCompleted} of {totalLessons} lessons completed</span>
            <span>{Math.round((totalCompleted / totalLessons) * 100)}%</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-sage transition-all duration-500"
              style={{ width: `${(totalCompleted / totalLessons) * 100}%` }}
            />
          </div>
        </div>

        {/* Empty state */}
        {totalCompleted === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <BookOpen size={64} className="text-text3" />
            <h2 className="mt-4 text-lg font-semibold text-text">
              No lessons completed yet
            </h2>
            <p className="mt-1 text-sm text-text2">
              Start your first lesson and your progress will appear here.
            </p>
            {firstLessonSlug && (
              <Link
                href={`/lessons/${firstLessonSlug}`}
                className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
              >
                Go to first lesson
              </Link>
            )}
          </div>
        )}

        {/* Unit sections */}
        <div className="mt-8 space-y-4">
          {units.map((unit, i) => (
            <UnitSection
              key={unit.unitName}
              unitName={unit.unitName}
              lessons={unit.lessons}
              completedMap={completedMap}
              flashcardsByLesson={flashcardsByLesson}
              defaultExpanded={i === firstIncompleteUnitIndex}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
