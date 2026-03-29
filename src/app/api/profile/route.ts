// PATCH /api/profile
// Updates the current user's profile settings (review limit, lesson limit, etc.)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    // Only allow updating these specific fields (not things like is_admin!)
    const allowedFields = ['full_name', 'daily_review_limit', 'weekly_lesson_limit', 'streak_reminder', 'audio_autoplay']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Validate ranges
    if ('daily_review_limit' in updates) {
      const val = updates.daily_review_limit as number
      if (val < 5 || val > 100) {
        return NextResponse.json({ error: 'daily_review_limit must be between 5 and 100' }, { status: 400 })
      }
    }
    if ('weekly_lesson_limit' in updates) {
      const val = updates.weekly_lesson_limit as number
      if (val < 1 || val > 7) {
        return NextResponse.json({ error: 'weekly_lesson_limit must be between 1 and 7' }, { status: 400 })
      }
    }

    // Update the profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
