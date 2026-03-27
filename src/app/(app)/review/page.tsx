// Review page — server component wrapper that renders the client-side flashcard viewer
// The actual card logic happens in FlashcardViewer (client component)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FlashcardViewer from '@/components/flashcard/FlashcardViewer'

export default async function ReviewPage() {
  // Make sure user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the user's audio autoplay preference
  const { data: profile } = await supabase
    .from('profiles')
    .select('audio_autoplay')
    .eq('id', user.id)
    .single()

  return <FlashcardViewer autoplayAudio={profile?.audio_autoplay ?? false} />
}
