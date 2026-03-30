// Lessons archive — all lessons grouped by unit
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonsArchiveView from '@/components/lesson/LessonsArchiveView'

export default async function LessonsArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, slug, unit_name, order_index, level')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  const { data: completedLessons } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', user.id)

  const { data: flashcardBlocks } = await supabase
    .from('lesson_blocks')
    .select('id, lesson_id, german_sentence, translation')
    .eq('is_flashcard', true)
    .order('order_index', { ascending: true })

  return (
    <LessonsArchiveView
      lessons={lessons ?? []}
      completedLessons={completedLessons ?? []}
      flashcardBlocks={flashcardBlocks ?? []}
    />
  )
}
