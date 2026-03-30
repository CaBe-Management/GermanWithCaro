'use client'

// LessonShell — paginated lesson viewer with ← Back / Next → navigation
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Map } from 'lucide-react'
import Link from 'next/link'
import type { LessonBlock } from '@/types'
import TextBlock from '@/components/lesson/TextBlock'
import FlashCard from '@/components/lesson/FlashCard'
import ConversationBlock from '@/components/lesson/ConversationBlock'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'

type Lesson = {
  id: string
  title: string
  slug: string
  unit_name: string
  order_index: number
}

export default function LessonShell({
  lesson,
  blocks,
  isCompleted,
  nextLessonSlug,
}: {
  lesson: Lesson
  blocks: LessonBlock[]
  isCompleted: boolean
  nextLessonSlug: string | null
}) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState(isCompleted)
  const [flashcardsAdded, setFlashcardsAdded] = useState(0)

  const totalBlocks = blocks.length
  const isLastBlock = currentIndex >= totalBlocks
  const progress = totalBlocks > 0 ? Math.round(((isLastBlock ? totalBlocks : currentIndex) / totalBlocks) * 100) : 0

  const goNext = useCallback(() => {
    if (currentIndex < totalBlocks) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, totalBlocks])

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goBack()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goBack])

  // Complete lesson when reaching the end
  useEffect(() => {
    if (isLastBlock && !completed) {
      fetch(`/api/lessons/${lesson.id}/complete`, { method: 'POST' })
        .then((r) => r.json())
        .then((data) => {
          setCompleted(true)
          setFlashcardsAdded(data.flashcardsAdded ?? 0)
        })
        .catch(() => {})
    }
  }, [isLastBlock, completed, lesson.id])

  const currentBlock = !isLastBlock ? blocks[currentIndex] : null

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="rounded-t-[20px] bg-bg-card px-[22px] pb-4 pt-5">
        <div className="flex items-center justify-between">
          <Link
            href="/lessons"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-page text-text-2"
          >
            <ArrowLeft size={18} />
          </Link>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-page text-text-2" title="Lesson overview">
            <Map size={16} />
          </button>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
            {lesson.unit_name}
          </p>
          <h1 className="mt-1 text-[18px] font-bold text-text-1">{lesson.title}</h1>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
          <p className="mt-2 text-[12px] text-text-3">
            {isLastBlock ? 'Done! · 100%' : `Block ${currentIndex + 1} of ${totalBlocks} · ${progress}%`}
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="min-h-[400px] bg-bg-card px-[22px] py-6" key={currentIndex}>
        {isLastBlock ? (
          /* Completion screen */
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
            <span className="text-[64px]">🎉</span>
            <h2 className="text-[24px] font-extrabold text-text-1">Lesson complete!</h2>
            <p className="text-[15px] text-text-2">
              {flashcardsAdded > 0
                ? `Added to review: ${flashcardsAdded} new cards`
                : 'Great work!'}
            </p>
            <div className="flex w-full flex-col gap-3">
              <Button onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              {nextLessonSlug && (
                <Button variant="secondary" onClick={() => router.push(`/lessons/${nextLessonSlug}`)}>
                  Next: Lesson {lesson.order_index + 1} →
                </Button>
              )}
            </div>
          </div>
        ) : currentBlock ? (
          <div className="animate-[fadeIn_0.15s_ease]">
            {currentBlock.type === 'text' && <TextBlock block={currentBlock} />}
            {currentBlock.type === 'example_sentence' && <FlashCard block={currentBlock} />}
            {currentBlock.type === 'bad_example' && <FlashCard block={currentBlock} />}
            {currentBlock.type === 'conversation' && (
              <ConversationBlock
                content={currentBlock.content as { title: string; context: string; lines: { speaker: string; german: string; english: string; audio_url: string | null; word_breakdown: { de: string; en: string; role: string }[] }[] }}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Footer navigation */}
      {!isLastBlock && (
        <div className="flex gap-3 rounded-b-[20px] border-t border-border-light bg-bg-card px-[22px] py-[18px]">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={currentIndex === 0}
            fullWidth
          >
            ← Back
          </Button>
          <Button onClick={goNext} fullWidth>
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}
