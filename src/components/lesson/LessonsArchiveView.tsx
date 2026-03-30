'use client'

// LessonsArchiveView — grouped lessons with expand/collapse and flashcard chips
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import PageCard, { PageCardHeader, PageCardContent } from '@/components/layout/PageCard'
import { cn } from '@/lib/utils'

type Lesson = { id: string; title: string; slug: string; unit_name: string; order_index: number }
type Completed = { lesson_id: string; completed_at: string | null }
type Flashcard = { id: string; lesson_id: string; german_sentence: string | null; translation: string | null }

export default function LessonsArchiveView({
  lessons,
  completedLessons,
  flashcardBlocks,
}: {
  lessons: Lesson[]
  completedLessons: Completed[]
  flashcardBlocks: Flashcard[]
}) {
  const completedSet = useMemo(() => new Set(completedLessons.map((c) => c.lesson_id)), [completedLessons])

  const flashcardsByLesson = useMemo(() => {
    const map = new Map<string, Flashcard[]>()
    flashcardBlocks.forEach((f) => {
      const arr = map.get(f.lesson_id) ?? []
      arr.push(f)
      map.set(f.lesson_id, arr)
    })
    return map
  }, [flashcardBlocks])

  const units = useMemo(() => {
    const map = new Map<string, Lesson[]>()
    lessons.forEach((l) => {
      const arr = map.get(l.unit_name) ?? []
      arr.push(l)
      map.set(l.unit_name, arr)
    })
    return Array.from(map.entries())
  }, [lessons])

  const [filter, setFilter] = useState('All')
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const unitNames = ['All', ...units.map(([name]) => name)]

  const filteredUnits = filter === 'All' ? units : units.filter(([name]) => name === filter)

  return (
    <PageCard>
      <PageCardHeader>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[20px] text-text-2">←</Link>
          <h1 className="text-[17px] font-bold text-text-1">My Lessons</h1>
        </div>
      </PageCardHeader>

      <PageCardContent className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]">🔍</span>
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-[1.5px] border-border bg-bg-subtle py-2.5 pl-10 pr-4 text-[14px] text-text-1 outline-none focus:border-primary"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <span className="rounded-full bg-bg-subtle px-3 py-1 text-[12px] font-semibold text-text-2">
            📚 {flashcardBlocks.length} cards learned
          </span>
          <span className="rounded-full bg-bg-subtle px-3 py-1 text-[12px] font-semibold text-text-2">
            ✅ {completedSet.size} lessons completed
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {unitNames.map((name) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition',
                filter === name
                  ? 'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white'
                  : 'bg-bg-subtle text-text-2 hover:bg-border'
              )}
            >
              {name === 'All' ? 'All' : name.split(' · ')[0]}
            </button>
          ))}
        </div>

        {/* Units */}
        {filteredUnits.map(([unitName, unitLessons]) => {
          const isUnitExpanded = expandedUnits.has(unitName)
          const searchLower = search.toLowerCase()
          const visibleLessons = search
            ? unitLessons.filter((l) => l.title.toLowerCase().includes(searchLower))
            : unitLessons

          if (visibleLessons.length === 0) return null

          return (
            <div key={unitName}>
              <button
                onClick={() => {
                  setExpandedUnits((prev) => {
                    const next = new Set(prev)
                    if (next.has(unitName)) next.delete(unitName)
                    else next.add(unitName)
                    return next
                  })
                }}
                className="flex w-full items-center justify-between py-2"
              >
                <span className="text-[14px] font-bold text-text-1">{unitName}</span>
                {isUnitExpanded ? <ChevronDown size={16} className="text-text-3" /> : <ChevronRight size={16} className="text-text-3" />}
              </button>

              {isUnitExpanded && (
                <div className="space-y-1">
                  {visibleLessons.map((lesson) => {
                    const isCompleted = completedSet.has(lesson.id)
                    const isLessonExpanded = expandedLessons.has(lesson.id)
                    const flashcards = flashcardsByLesson.get(lesson.id) ?? []

                    return (
                      <div key={lesson.id}>
                        <div
                          onClick={() => {
                            if (!isCompleted) return
                            setExpandedLessons((prev) => {
                              const next = new Set(prev)
                              if (next.has(lesson.id)) next.delete(lesson.id)
                              else next.add(lesson.id)
                              return next
                            })
                          }}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-3',
                            isCompleted ? 'cursor-pointer hover:bg-bg-subtle' : 'cursor-not-allowed opacity-50'
                          )}
                        >
                          {/* Status */}
                          {isCompleted ? (
                            <div className="h-2 w-2 shrink-0 rounded-full bg-success" />
                          ) : (
                            <Lock size={12} className="shrink-0 text-text-3" />
                          )}

                          <div className="flex-1">
                            <p className={cn('text-[14px] font-medium', isCompleted ? 'text-text-1' : 'text-text-3')}>
                              {lesson.title}
                            </p>
                            {!isCompleted && (
                              <p className="text-[11px] text-text-3">not started</p>
                            )}
                          </div>

                          {isCompleted && (
                            isLessonExpanded
                              ? <ChevronDown size={14} className="text-primary" />
                              : <ChevronRight size={14} className="text-text-3" />
                          )}
                        </div>

                        {/* Expanded flashcard chips */}
                        {isCompleted && isLessonExpanded && (
                          <div className="ml-5 mb-2 flex flex-col gap-2 rounded-xl bg-bg-subtle p-3">
                            {flashcards.slice(0, 8).map((fc) => (
                              <div key={fc.id} className="rounded-xl border-[1.5px] border-border bg-bg-card px-3 py-2">
                                <p className="text-[13px] font-bold text-text-1">{fc.german_sentence}</p>
                                <p className="text-[11px] text-text-3">{fc.translation}</p>
                              </div>
                            ))}
                            <Link
                              href={`/lessons/${lesson.slug}`}
                              className="mt-1 text-[13px] font-semibold text-primary"
                            >
                              View lesson again →
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </PageCardContent>
    </PageCard>
  )
}
