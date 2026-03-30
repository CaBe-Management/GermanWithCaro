// Conversations archive — all conversations from completed lessons
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConversationsArchiveView from '@/components/lesson/ConversationsArchiveView'

export default async function ConversationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get completed lesson IDs
  const { data: completedLessons } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)

  const completedIds = (completedLessons ?? []).map((c) => c.lesson_id)

  // Get conversation blocks for completed lessons
  const { data: conversations } = completedIds.length > 0
    ? await supabase
        .from('lesson_blocks')
        .select('id, lesson_id, content, lessons!inner(title, unit_name, order_index)')
        .eq('type', 'conversation')
        .in('lesson_id', completedIds)
        .order('lesson_id')
    : { data: [] }

  // Get all lessons for unit filter labels
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, unit_name, order_index')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  return (
    <ConversationsArchiveView
      conversations={(conversations ?? []).map((c: Record<string, unknown>) => ({
        ...c,
        lessons: Array.isArray(c.lessons) ? c.lessons[0] : c.lessons,
      })) as never[]}
      allLessons={allLessons ?? []}
    />
  )
}
