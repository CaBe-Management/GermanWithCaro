// Dashboard — "Today's studies" hub
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight } from 'lucide-react'
import PageCard, { PageCardHeader, PageCardContent } from '@/components/layout/PageCard'
import ProgressBar from '@/components/ui/ProgressBar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, weekly_lesson_limit')
    .eq('id', user.id)
    .single()

  // Due reviews today
  const today = new Date().toISOString().split('T')[0]
  const { count: dueReviews } = await supabase
    .from('user_flashcard_srs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_date', today)

  // Completed lessons
  const { data: completedLessons } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  const completedIds = new Set((completedLessons ?? []).map((l) => l.lesson_id))

  // All published lessons
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, slug, unit_name, order_index')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  // Next lesson
  const nextLesson = (allLessons ?? []).find((l) => !completedIds.has(l.id)) ?? null

  // Total reviewed cards (all time)
  const { count: totalReviewed } = await supabase
    .from('user_flashcard_srs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('last_reviewed_at', 'is', null)

  // Streak calculation
  const { data: recentReviews } = await supabase
    .from('user_flashcard_srs')
    .select('last_reviewed_at')
    .eq('user_id', user.id)
    .not('last_reviewed_at', 'is', null)
    .order('last_reviewed_at', { ascending: false })

  let streak = 0
  if (recentReviews && recentReviews.length > 0) {
    const reviewDates = new Set(
      recentReviews.map((r) => new Date(r.last_reviewed_at!).toISOString().split('T')[0])
    )
    const checkDate = new Date()
    if (!reviewDates.has(checkDate.toISOString().split('T')[0])) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
    while (reviewDates.has(checkDate.toISOString().split('T')[0])) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'learner'

  const totalLessons = allLessons?.length ?? 0
  const completedCount = completedIds.size
  const lessonProgress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0

  return (
    <PageCard>
      <PageCardHeader>
        <div className="flex items-center justify-between">
          <span className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-[16px] font-bold text-transparent">
            GermanWithCaro
          </span>
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-[14px] font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </PageCardHeader>

      <PageCardContent className="flex flex-col gap-5">
        {/* Greeting */}
        <div>
          <h1 className="text-[24px] font-bold text-text-1">
            {greeting}, {displayName}!
          </h1>
          <p className="mt-1 text-[14px] font-medium text-text-2">
            {(dueReviews ?? 0) > 0
              ? `You have ${dueReviews} cards to review today.`
              : 'All caught up! No reviews due.'}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-bg-subtle p-4 text-center">
            <p className="text-[20px] font-bold text-text-1">🔥 {streak}</p>
            <p className="mt-1 text-[11px] font-semibold text-text-3">Days</p>
          </div>
          <div className="rounded-xl bg-bg-subtle p-4 text-center">
            <p className="text-[20px] font-bold text-text-1">📚 {totalReviewed ?? 0}</p>
            <p className="mt-1 text-[11px] font-semibold text-text-3">Cards today</p>
          </div>
          <div className="rounded-xl bg-bg-subtle p-4 text-center">
            <p className="text-[20px] font-bold text-text-1">✅ {completedCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-text-3">Lessons</p>
          </div>
        </div>

        {/* Review action card */}
        <div className="rounded-2xl border-[1.5px] border-border bg-bg-subtle p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">Review</p>
              <p className="mt-1 text-[17px] font-bold text-text-1">
                {(dueReviews ?? 0) > 0 ? `${dueReviews} cards due` : 'All done! 🎉'}
              </p>
            </div>
            {(dueReviews ?? 0) > 0 && (
              <Link
                href="/review"
                className="flex items-center gap-1 rounded-[14px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,0.30)]"
              >
                Start review <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Next lesson card */}
        {nextLesson ? (
          <div className="rounded-2xl border-[1.5px] border-border bg-bg-subtle p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
              {nextLesson.unit_name}
            </p>
            <p className="mt-1 text-[17px] font-bold text-text-1">
              {nextLesson.title}
            </p>
            <div className="mt-3">
              <ProgressBar value={lessonProgress} />
              <p className="mt-2 text-[12px] text-text-3">
                {completedCount} of {totalLessons} lessons in this unit
              </p>
            </div>
            <Link
              href={`/lessons/${nextLesson.slug}`}
              className="mt-4 flex items-center gap-1 text-[14px] font-bold text-primary"
            >
              Start lesson <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border-[1.5px] border-border bg-bg-subtle p-5 text-center">
            <p className="text-[17px] font-bold text-text-1">Course complete! 🎉</p>
            <p className="mt-1 text-[14px] text-text-2">You finished all {totalLessons} lessons.</p>
          </div>
        )}

        {/* Recent activity */}
        {completedLessons && completedLessons.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
              Recently studied
            </p>
            <div className="space-y-2">
              {completedLessons.slice(0, 3).map((cl) => {
                const lesson = (allLessons ?? []).find((l) => l.id === cl.lesson_id)
                if (!lesson) return null
                const date = new Date(cl.completed_at!)
                const isToday = date.toDateString() === new Date().toDateString()
                const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={cl.lesson_id} className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-3">
                    <p className="text-[14px] font-medium text-text-1">{lesson.title}</p>
                    <p className="text-[12px] text-text-3">
                      {isToday ? `Today at ${timeStr}` : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${timeStr}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </PageCardContent>
    </PageCard>
  )
}
