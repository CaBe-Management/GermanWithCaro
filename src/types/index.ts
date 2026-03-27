// === Shared TypeScript types for GermanWithCaro ===
// These types match the Supabase database tables defined in Chunk 2.

// A user's profile (extends Supabase auth.users)
export type Profile = {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'active' | 'inactive' | 'trialing'
  daily_review_limit: number
  weekly_lesson_limit: number
  streak_reminder: boolean
  audio_autoplay: boolean
  created_at: string
}

// A lesson (e.g. "Lesson 1: Sein")
export type Lesson = {
  id: string
  title: string
  slug: string
  unit_name: string
  order_index: number
  level: string
  is_published: boolean
  created_at: string
}

// A block inside a lesson — can be text, an example sentence, or a bad example
export type LessonBlock = {
  id: string
  lesson_id: string
  order_index: number
  type: 'text' | 'example_sentence' | 'bad_example'
  content: Record<string, unknown> | null    // rich text content (for type = 'text')
  german_sentence: string | null             // the German sentence (for example/bad_example)
  translation: string | null                 // English translation
  register: string | null                    // e.g. 'Formal', 'Casual'
  word_breakdown: WordBreakdown[] | null     // array of word parts
  audio_url: string | null                   // URL to the audio file
  is_flashcard: boolean                      // true = this block becomes a flashcard
  created_at: string
}

// A single word in a sentence breakdown
export type WordBreakdown = {
  de: string   // German word
  en: string   // English meaning
  role: string // grammatical role (e.g. 'verb', 'noun', 'article')
}

// Tracks whether a user has completed a lesson
export type UserLessonProgress = {
  id: string
  user_id: string
  lesson_id: string
  completed_at: string | null
}

// SRS (spaced repetition) data for one flashcard per user
export type UserFlashcardSRS = {
  id: string
  user_id: string
  block_id: string
  interval: number
  ease_factor: number
  repetitions: number
  next_review_date: string
  last_reviewed_at: string | null
}
