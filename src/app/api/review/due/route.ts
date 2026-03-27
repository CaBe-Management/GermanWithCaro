// GET /api/review/due
// Returns all flashcard reviews that are due today for the current user
// Respects the user's daily_review_limit setting (default 25)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the user's daily review limit from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_review_limit')
      .eq('id', user.id)
      .single()

    const limit = profile?.daily_review_limit ?? 25

    // Fetch due cards: join SRS data → lesson blocks → lessons
    // Only returns cards where next_review_date is today or earlier
    const today = new Date().toISOString().split('T')[0]

    const { data: dueCards, error: cardsError } = await supabase
      .from('user_flashcard_srs')
      .select(`
        id,
        block_id,
        interval,
        ease_factor,
        repetitions,
        next_review_date,
        lesson_blocks!inner (
          id,
          content,
          german_sentence,
          translation,
          register,
          word_breakdown,
          audio_url,
          lesson_id,
          lessons!inner (
            title,
            unit_name
          )
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })
      .limit(limit)

    if (cardsError) {
      console.error('Error fetching due cards:', cardsError)
      return NextResponse.json({ error: 'Failed to fetch due reviews' }, { status: 500 })
    }

    return NextResponse.json({ cards: dueCards ?? [], limit })
  } catch (error) {
    console.error('Review due error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
