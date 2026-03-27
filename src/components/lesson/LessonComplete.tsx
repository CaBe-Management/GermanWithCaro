'use client'

// LessonComplete button — marks a lesson as done and adds flashcards to the review queue
// Shows at the bottom of every lesson page
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

export default function LessonComplete({
  lessonId,
  isCompleted,
}: {
  lessonId: string
  isCompleted: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)

  async function handleComplete() {
    setLoading(true)

    const response = await fetch(`/api/lessons/${lessonId}/complete`, {
      method: 'POST',
    })

    const data = await response.json()

    if (data.success) {
      setDone(true)
      // Short delay so the user sees the success state before navigating
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 800)
    } else {
      setLoading(false)
      alert('Something went wrong. Please try again.')
    }
  }

  // Already completed — show a green badge
  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <Check size={20} className="text-success" />
        </div>
        <p className="text-sm font-medium text-success">Lesson completed!</p>
        <p className="text-xs text-text3">Flashcards have been added to your review queue.</p>
      </div>
    )
  }

  // Not completed yet — show the button
  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-white transition hover:bg-gold-light disabled:opacity-50"
    >
      {loading ? 'Completing...' : 'Mark as Complete'}
    </button>
  )
}
