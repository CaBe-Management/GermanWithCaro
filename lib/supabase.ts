import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Word {
  id: string
  word: string
  typ: string
  artikel: string | null
  plural: string | null
  level: string
  frequenz_rang: number
  created_at: string
  erklaerung: string | null       // Grammar / usage explanation
  verwendung: string | null       // When to use: formal, casual, etc.
  genitiv: string | null          // Genitive form (nouns)
}

export interface WordSentence {
  id: string
  word_id: string
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  cloze_word_en: string | null   // English equivalent shown in purple
  sort_order: number
  created_at: string
}

export interface UserReview {
  id: string
  session_id: string
  word_sentence_id: string | null    // null for grammar reviews
  grammar_sentence_id: string | null // null for vocab reviews
  // Form key for grammar SRS — "topic_uuid:person" (e.g. "abc…:ich") or "topic_uuid:null".
  // NULL for old sentence-level rows (backwards compat) and for vocab rows.
  grammar_form_key: string | null
  item_type: 'vocab' | 'grammar'
  correct: boolean
  reviewed_at: string
  next_review_at: string | null
  ease_factor: number
  interval_days: number
  repetitions: number
}

// ─── Grammar Types ────────────────────────────────────────────────────────────

export interface GrammarTopic {
  id: string
  title: string              // "Präsens: sein"
  slug: string               // "prasens-sein"
  level: string              // A1, A2, B1, B2, C1
  category: string           // verb_conjugation, adjective_usage, etc.
  explanation_en: string
  explanation_de: string | null
  sort_order: number
  created_at: string
  // ── Detail page fields (added April 2026) ─────────────────────────────
  translation_en: string | null    // English translation shown under title
  structure: string | null         // Grammar formula, e.g. "[Verb] + wie + [Noun]?"
  register_formal: number | null   // 0–3 dots
  register_standard: number | null
  register_casual: number | null
  fun_fact: string | null          // Shown in purple info box
  resources: GrammarResource[] | null  // YouTube / TikTok / Website links
  synonyms: string | null          // Synonymous expressions
  related_forms: string | null     // Related grammar / question words
}

export interface GrammarResource {
  type: 'youtube' | 'tiktok' | 'website'
  url: string
  title: string
  description?: string
}

export interface GrammarSentence {
  id: string
  topic_id: string
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  person: string | null   // ich/du/er/wir/ihr/sie
  tense: string | null    // präsens/perfekt/präteritum
  sort_order: number
  created_at: string
}
