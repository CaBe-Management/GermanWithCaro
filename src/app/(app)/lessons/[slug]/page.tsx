// Lesson viewer — fetches blocks and renders via paginated LessonShell
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonShell from '@/components/lesson/LessonShell'
import type { LessonBlock } from '@/types'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch lesson
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, title, slug, unit_name, order_index, level')
    .eq('slug', slug)
    .single()

  if (error || !lesson) notFound()

  // Fetch blocks
  const { data: blocks } = await supabase
    .from('lesson_blocks')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('order_index', { ascending: true })

  // Check completion
  const { data: progress } = await supabase
    .from('user_lesson_progress')
    .select('completed_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .single()

  // Find next lesson slug
  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('slug')
    .eq('is_published', true)
    .gt('order_index', lesson.order_index)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  return (
    <div className="-mx-4 -mt-8">
      <LessonShell
        lesson={lesson}
        blocks={(blocks as LessonBlock[]) ?? []}
        isCompleted={!!progress?.completed_at}
        nextLessonSlug={nextLesson?.slug ?? null}
      />
    </div>
  )
}
