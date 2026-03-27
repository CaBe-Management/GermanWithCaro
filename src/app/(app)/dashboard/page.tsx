// Dashboard page — "Today's studies" hub
// Fetches all the data server-side, then passes it to client components
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StreakBar from '@/components/dashboard/StreakBar'
import ActionGrid from '@/components/dashboard/ActionGrid'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the user's profile (for name + weekly lesson limit)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, weekly_lesson_limit')
    .eq('id', user.id)
    .single()

  // --- Count due flashcard reviews today ---
  const today = new Date().toISOString().split('T')[0]

  const { count: dueReviews } = await supabase
    .from('user_flashcard_srs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_date', today)

  // --- Count reviews due tomorrow (for the "coming up" strip) ---
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { count: tomorrowReviews } = await supabase
    .from('user_flashcard_srs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('next_review_date', tomorrowStr)

  // --- Get all completed lessons for this user ---
  const { data: completedLessons } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', user.id)

  const completedIds = new Set((completedLessons ?? []).map((l) => l.lesson_id))
  const totalLessonsCompleted = completedIds.size

  // --- Count lessons completed this week (for weekly gating) ---
  // Week starts Monday 00:00 UTC
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - mondayOffset)
  monday.setUTCHours(0, 0, 0, 0)

  const lessonsThisWeek = (completedLessons ?? []).filter((l) => {
    if (!l.completed_at) return false
    return new Date(l.completed_at) >= monday
  }).length

  const weeklyLimit = profile?.weekly_lesson_limit ?? 3
  const weeklyLimitReached = lessonsThisWeek >= weeklyLimit

  // --- Find the next lesson to unlock (first uncompleted published lesson in order) ---
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, slug, unit_name, order_index')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  const nextLesson = (allLessons ?? []).find((l) => !completedIds.has(l.id)) ?? null

  // Also find the lesson after next (for the "coming up" strip)
  const nextLessonIndex = nextLesson
    ? (allLessons ?? []).findIndex((l) => l.id === nextLesson.id)
    : -1
  const upcomingLesson =
    nextLessonIndex >= 0 && nextLessonIndex + 1 < (allLessons ?? []).length
      ? (allLessons ?? [])[nextLessonIndex + 1]
      : null

  // --- Calculate streak (consecutive days with at least one review) ---
  const { data: recentReviews } = await supabase
    .from('user_flashcard_srs')
    .select('last_reviewed_at')
    .eq('user_id', user.id)
    .not('last_reviewed_at', 'is', null)
    .order('last_reviewed_at', { ascending: false })

  let streak = 0
  if (recentReviews && recentReviews.length > 0) {
    // Get unique dates reviewed
    const reviewDates = new Set(
      recentReviews.map((r) =>
        new Date(r.last_reviewed_at!).toISOString().split('T')[0]
      )
    )
    // Count consecutive days backwards from today
    const checkDate = new Date()
    // If user hasn't reviewed today, start checking from yesterday
    if (!reviewDates.has(checkDate.toISOString().split('T')[0])) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
    while (reviewDates.has(checkDate.toISOString().split('T')[0])) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  // --- Total cards reviewed (all time) ---
  const { count: totalReviewed } = await supabase
    .from('user_flashcard_srs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('last_reviewed_at', 'is', null)

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'learner'

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Greeting */}
        <h1 className="text-xl font-bold text-text">
          {greeting}, {displayName}!
        </h1>
        <p className="mt-1 text-sm text-text3">Here&apos;s your study plan for today.</p>

        {/* Streak stats bar */}
        <StreakBar
          streak={streak}
          cardsReviewed={totalReviewed ?? 0}
          lessonsCompleted={totalLessonsCompleted}
        />

        {/* Two action cards: Reviews + Next Lesson */}
        <ActionGrid
          dueReviews={dueReviews ?? 0}
          nextLesson={nextLesson}
          weeklyLimitReached={weeklyLimitReached}
          lessonsThisWeek={lessonsThisWeek}
          weeklyLimit={weeklyLimit}
        />

        {/* Coming up strip */}
        <div className="mt-6 space-y-3">
          {/* Tomorrow's reviews */}
          {(tomorrowReviews ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-white px-4 py-3">
              <p className="text-xs font-medium text-text3">
                Tomorrow: {tomorrowReviews} review{tomorrowReviews === 1 ? '' : 's'} due
              </p>
            </div>
          )}

          {/* Upcoming lesson (greyed out) */}
          {upcomingLesson && (
            <div className="rounded-lg border border-border bg-white px-4 py-3 opacity-50">
              <p className="text-xs font-medium text-text3">Coming up</p>
              <p className="mt-0.5 text-sm text-text2">
                {upcomingLesson.title}
              </p>
              <p className="text-xs text-text3">{upcomingLesson.unit_name}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
