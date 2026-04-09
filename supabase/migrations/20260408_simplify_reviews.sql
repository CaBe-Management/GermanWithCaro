-- ─────────────────────────────────────────────────────────────────────────────
-- Simplify SRS architecture
--
-- BEFORE: one row per (verb × tense) and one row per (vocab × case)
-- AFTER:  one row per verb, one row per vocab
--
-- Sentences rotate via last_sentence_idx % pool_size.
-- The pool for a verb = all gwc_verb_sentences where min_level <= german_level.
-- The pool for a vocab = all gwc_vocab_sentences where min_level <= german_level.
-- When the user levels up, the pool grows automatically — no backfill needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old tables (all data gone — clean slate)
DROP TABLE IF EXISTS gwc_verb_reviews CASCADE;
DROP TABLE IF EXISTS gwc_vocab_reviews CASCADE;

-- ── gwc_verb_reviews: one SRS card per (session × verb) ──────────────────────
CREATE TABLE gwc_verb_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text NOT NULL,
  verb_id         uuid NOT NULL REFERENCES gwc_verbs(id) ON DELETE CASCADE,
  -- SM-2 / Bunpro-ladder fields
  interval_days   integer  NOT NULL DEFAULT 1,
  ease_factor     numeric  NOT NULL DEFAULT 2.5,
  repetitions     integer  NOT NULL DEFAULT 0,
  next_review_at  timestamptz NOT NULL DEFAULT now(),
  -- Sentence rotation: increments each review, used as idx % pool_size
  last_sentence_idx integer NOT NULL DEFAULT 0,
  -- Stats
  total_reviews   integer  NOT NULL DEFAULT 0,
  correct_reviews integer  NOT NULL DEFAULT 0,
  reviewed_at     timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  UNIQUE (session_id, verb_id)
);

CREATE INDEX IF NOT EXISTS gwc_verb_reviews_due
  ON gwc_verb_reviews (session_id, next_review_at);

-- ── gwc_vocab_reviews: one SRS card per (session × vocab) ────────────────────
CREATE TABLE gwc_vocab_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text NOT NULL,
  vocab_id        uuid NOT NULL REFERENCES gwc_vocab(id) ON DELETE CASCADE,
  -- SM-2 / Bunpro-ladder fields
  interval_days   integer  NOT NULL DEFAULT 1,
  ease_factor     numeric  NOT NULL DEFAULT 2.5,
  repetitions     integer  NOT NULL DEFAULT 0,
  next_review_at  timestamptz NOT NULL DEFAULT now(),
  -- Sentence rotation: increments each review, used as idx % pool_size
  last_sentence_idx integer NOT NULL DEFAULT 0,
  -- Stats
  correct_streak  integer  NOT NULL DEFAULT 0,
  total_reviews   integer  NOT NULL DEFAULT 0,
  correct_reviews integer  NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (session_id, vocab_id)
);

CREATE INDEX IF NOT EXISTS gwc_vocab_reviews_due
  ON gwc_vocab_reviews (session_id, next_review_at);
