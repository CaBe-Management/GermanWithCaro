// POST /api/lessons/[id]/complete
// Marks a lesson as completed for the current user, then adds all flashcard
// sentence blocks from that lesson into their SRS review queue
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params
    const supabase = await createClient()

    // Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. Mark the lesson as completed (upsert so re-completing doesn't error)
    const { error: progressError } = await supabase
      .from('user_lesson_progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )

    if (progressError) {
      console.error('Error marking lesson complete:', progressError)
      return NextResponse.json({ error: 'Failed to mark lesson complete' }, { status: 500 })
    }

    // 2. Get all flashcard blocks from this lesson (is_flashcard = true)
    const { data: flashcardBlocks, error: blocksError } = await supabase
      .from('lesson_blocks')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('is_flashcard', true)

    if (blocksError) {
      console.error('Error fetching flashcard blocks:', blocksError)
      return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 })
    }

    // 3. Add each flashcard block to the user's SRS queue with default SM-2 values
    //    Uses "on conflict do nothing" so re-completing a lesson doesn't create duplicates
    if (flashcardBlocks && flashcardBlocks.length > 0) {
      const srsRows = flashcardBlocks.map((block) => ({
        user_id: user.id,
        block_id: block.id,
        interval: 1,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_date: new Date().toISOString().split('T')[0], // today
      }))

      const { error: srsError } = await supabase
        .from('user_flashcard_srs')
        .upsert(srsRows, { onConflict: 'user_id,block_id', ignoreDuplicates: true })

      if (srsError) {
        console.error('Error adding flashcards to SRS queue:', srsError)
        return NextResponse.json({ error: 'Failed to add flashcards to review queue' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      flashcardsAdded: flashcardBlocks?.length ?? 0,
    })
  } catch (error) {
    console.error('Lesson complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
