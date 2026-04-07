-- ─────────────────────────────────────────────────────────────────────────────
-- GWC Vocab System — full table set
-- Run this BEFORE seeding any vocab entries
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. gwc_vocab ─────────────────────────────────────────────────────────────
-- One row per word/expression
CREATE TABLE IF NOT EXISTS gwc_vocab (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  word            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('NOMEN','VERB','ADJEKTIV','AUSDRUCK','ADVERB','PRÄPOSITION')),
  article         text CHECK (article IN ('der','die','das')),   -- nouns only
  plural          text,                                           -- nouns only
  level           text NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  frequency_rank  integer,           -- lower = more common in German
  translation_en  text NOT NULL,
  explanation_en  text NOT NULL,
  usage_notes     text,
  fun_fact        text,
  synonyms        text,              -- comma-separated
  related_words   text,              -- comma-separated
  audio_file      text,              -- filename in Supabase storage bucket
  -- Declension (nouns only)
  nom_sg          text, nom_pl text,
  akk_sg          text, akk_pl text,
  dat_sg          text, dat_pl text,
  gen_sg          text, gen_pl text,
  -- Path membership: false = not in path, integer = position in path
  path_a1_vocabulary  integer,       -- position in A1 Vocabulary path
  path_caros_path     integer,       -- position in Caro's Path
  created_at      timestamptz DEFAULT now()
);

-- ── 2. gwc_vocab_sentences ────────────────────────────────────────────────────
-- Multiple example sentences per word, tagged by grammatical case and min level
CREATE TABLE IF NOT EXISTS gwc_vocab_sentences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vocab_id          uuid NOT NULL REFERENCES gwc_vocab(id) ON DELETE CASCADE,
  sentence_de       text NOT NULL,
  sentence_en       text NOT NULL,
  cloze_word        text NOT NULL,   -- exact form as it appears in sentence
  grammatical_case  text CHECK (grammatical_case IN ('NOMINATIV','AKKUSATIV','DATIV','GENITIV')),
  min_level         text NOT NULL DEFAULT 'A1' CHECK (min_level IN ('A1','A2','B1','B2','C1','C2')),
  sort_order        integer NOT NULL DEFAULT 0,
  audio_file        text,            -- filename in Supabase storage bucket, NULL until recorded
  created_at        timestamptz DEFAULT now()
);

-- ── 3. gwc_vocab_reviews ─────────────────────────────────────────────────────
-- SRS state: ONE row per user per (word × case group)
--
-- Card unit = concept, not sentence:
--   - Nouns get up to 4 cards: NOMINATIV, AKKUSATIV, DATIV, GENITIV
--   - Verbs / adjectives / expressions get 1 card (grammatical_case = NULL)
--   - Dativ card created when user reaches A2; Genitiv card when B1
--   - last_sentence_idx rotates through sentences in that case group for variety
--
-- Example for "Hund" at A1:
--   row 1: vocab_id=Hund, case=NOMINATIV, last_sentence_idx=0, interval=7
--   row 2: vocab_id=Hund, case=AKKUSATIV, last_sentence_idx=2, interval=14
--   (Dativ + Genitiv rows created later when user levels up)
--
-- Sentence selection per review:
--   1. Load sentences: WHERE vocab_id=X AND grammatical_case=Y ORDER BY sort_order
--   2. next_idx = (last_sentence_idx + 1) % count
--   3. Show sentences[next_idx] as the cloze exercise
--   4. Save result → update interval, ease_factor, last_sentence_idx via SM-2
CREATE TABLE IF NOT EXISTS gwc_vocab_reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          text NOT NULL,
  vocab_id            uuid NOT NULL REFERENCES gwc_vocab(id) ON DELETE CASCADE,
  grammatical_case    text CHECK (grammatical_case IN ('NOMINATIV','AKKUSATIV','DATIV','GENITIV')),
  -- SM-2 fields
  interval_days       integer NOT NULL DEFAULT 1,
  ease_factor         float   NOT NULL DEFAULT 2.5,
  repetitions         integer NOT NULL DEFAULT 0,
  next_review_at      timestamptz NOT NULL DEFAULT now(),
  -- Sentence rotation
  last_sentence_idx   integer NOT NULL DEFAULT -1,  -- -1 = not yet shown
  -- Stats
  correct_streak      integer NOT NULL DEFAULT 0,
  total_reviews       integer NOT NULL DEFAULT 0,
  correct_reviews     integer NOT NULL DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (session_id, vocab_id, grammatical_case)
);

CREATE INDEX IF NOT EXISTS gwc_vocab_reviews_due
  ON gwc_vocab_reviews (session_id, next_review_at);

-- ── Learn queue logic ─────────────────────────────────────────────────────────
-- A word is "learned" (introduced) as soon as ANY gwc_vocab_reviews row exists for it.
--
-- LEARN queue (new words):
--   SELECT v.* FROM gwc_vocab v
--   WHERE v.level <= [german_level]
--   AND NOT EXISTS (
--     SELECT 1 FROM gwc_vocab_reviews vr
--     WHERE vr.vocab_id = v.id AND vr.session_id = [session_id]
--   )
--   ORDER BY v.frequency_rank ASC LIMIT [daily_goal]
--
-- REVIEW queue (due cards):
--   SELECT * FROM gwc_vocab_reviews
--   WHERE session_id = [session_id] AND next_review_at <= now()
--   ORDER BY next_review_at ASC
--
-- On first learn: insert case rows appropriate for user's current level.
--   A1 nouns  → NOMINATIV + AKKUSATIV
--   A2 nouns  → + DATIV
--   B1+ nouns → + GENITIV
--   Non-nouns → one row with grammatical_case = NULL
--
-- On level change (e.g. A1 → B1): do NOT bulk-insert new case rows.
-- Instead, lazily create them when the word next appears in a review session.
-- If user goes back down: filter by min_level, never delete rows.
