// POST /api/review/submit
// Receives a flashcard review result and updates the SRS data using SM-2 algorithm
// Body: { blockId: string, quality: 0 | 1 }
//   quality 0 = didn't know it, quality 1 = knew it
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateNextReview } from '@/lib/srs/sm2'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse the request body
    const { blockId, quality } = await request.json()

    if (!blockId || (quality !== 0 && quality !== 1)) {
      return NextResponse.json({ error: 'Invalid request: need blockId and quality (0 or 1)' }, { status: 400 })
    }

    // Fetch the current SRS data for this card
    const { data: currentCard, error: fetchError } = await supabase
      .from('user_flashcard_srs')
      .select('interval, ease_factor, repetitions')
      .eq('user_id', user.id)
      .eq('block_id', blockId)
      .single()

    if (fetchError || !currentCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Run the SM-2 algorithm to calculate the next review date
    const result = calculateNextReview(
      {
        interval: currentCard.interval,
        easeFactor: currentCard.ease_factor,
        repetitions: currentCard.repetitions,
      },
      quality as 0 | 1
    )

    // Update the SRS data in the database
    const { error: updateError } = await supabase
      .from('user_flashcard_srs')
      .update({
        interval: result.interval,
        ease_factor: result.easeFactor,
        repetitions: result.repetitions,
        next_review_date: result.nextReviewDate.toISOString().split('T')[0],
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('block_id', blockId)

    if (updateError) {
      console.error('Error updating SRS data:', updateError)
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    return NextResponse.json({ success: true, nextReview: result })
  } catch (error) {
    console.error('Review submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
