// Library page — "Meine Lektionen" — shows all lessons grouped by unit
// Server component: fetches all data, passes to client components
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LibraryView from '@/components/library/LibraryView'

export default async function LibraryPage() {
  const supabase = await createClient()

  // Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all published lessons, ordered by position
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, slug, unit_name, order_index, level')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  // Fetch user's completed lessons
  const { data: completedLessons } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', user.id)

  // Fetch all flashcard blocks (is_flashcard = true) — we group them client-side
  const { data: flashcardBlocks } = await supabase
    .from('lesson_blocks')
    .select('id, lesson_id, order_index, german_sentence, translation, audio_url, content')
    .eq('is_flashcard', true)
    .order('order_index', { ascending: true })

  return (
    <LibraryView
      lessons={lessons ?? []}
      completedLessons={completedLessons ?? []}
      flashcardBlocks={flashcardBlocks ?? []}
    />
  )
}
