'use client'

// ActionGrid — two side-by-side cards: Reviews and Next Lesson
// The lesson card is locked if the user has unfinished reviews or hit their weekly limit
import Link from 'next/link'
import { Check, Lock, ArrowRight } from 'lucide-react'

type NextLesson = {
  id: string
  title: string
  slug: string
  unit_name: string
} | null

export default function ActionGrid({
  dueReviews,
  nextLesson,
  weeklyLimitReached,
  lessonsThisWeek,
  weeklyLimit,
}: {
  dueReviews: number
  nextLesson: NextLesson
  weeklyLimitReached: boolean
  lessonsThisWeek: number
  weeklyLimit: number
}) {
  const hasReviews = dueReviews > 0
  const lessonLocked = hasReviews || weeklyLimitReached

  // Figure out next Monday for the weekly limit message
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  const mondayStr = nextMonday.toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/* === Reviews card === */}
      {hasReviews ? (
        // Has reviews due — gold card with link to review page
        <Link
          href="/review"
          className="flex flex-col items-center rounded-xl border-2 border-gold bg-gold-bg p-5 transition hover:shadow-md"
        >
          <span className="text-3xl font-bold text-gold">{dueReviews}</span>
          <span className="mt-1 text-xs font-medium text-gold-dark">
            review{dueReviews === 1 ? '' : 's'} due
          </span>
          <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-gold">
            Start <ArrowRight size={12} />
          </span>
        </Link>
      ) : (
        // All reviews done — green "all done" card
        <div className="flex flex-col items-center rounded-xl border border-success/30 bg-success/5 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
            <Check size={20} className="text-success" />
          </div>
          <span className="mt-2 text-xs font-medium text-success">All done!</span>
          <span className="mt-0.5 text-[10px] text-text3">No reviews due</span>
        </div>
      )}

      {/* === Next lesson card === */}
      {nextLesson ? (
        lessonLocked ? (
          // Locked state — reviews still due or weekly limit reached
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-border bg-white p-5">
            {/* Frosted overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
              <Lock size={20} className="text-text3" />
              <p className="mt-2 px-3 text-center text-[10px] text-text3">
                {weeklyLimitReached
                  ? `You've done ${lessonsThisWeek} lessons this week. Come back ${mondayStr}!`
                  : `Complete your ${dueReviews} review${dueReviews === 1 ? '' : 's'} to unlock`}
              </p>
            </div>
            {/* Background content (blurred behind overlay) */}
            <p className="text-sm font-medium text-text">{nextLesson.title}</p>
            <p className="text-[10px] text-text3">{nextLesson.unit_name}</p>
          </div>
        ) : (
          // Unlocked state — reviews done, lesson available
          <Link
            href={`/lessons/${nextLesson.slug}`}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-success bg-success/5 p-5 transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-text">{nextLesson.title}</p>
            <p className="text-[10px] text-text3">{nextLesson.unit_name}</p>
            <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-success">
              Start lesson <ArrowRight size={12} />
            </span>
          </Link>
        )
      ) : (
        // No more lessons available
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-5">
          <p className="text-sm font-medium text-text3">No more lessons yet</p>
          <p className="mt-1 text-[10px] text-text3">New lessons coming soon!</p>
        </div>
      )}
    </div>
  )
}
