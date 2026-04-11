-- ─────────────────────────────────────────────────────────────────────────────
-- Verb reviews: one SRS card per (session × verb × tense)
--
-- BEFORE: UNIQUE(session_id, verb_id) — one card per verb
-- AFTER:  UNIQUE(session_id, verb_id, tense) — one card per verb×tense
--
-- Sentence pool for a review = gwc_verb_sentences WHERE verb_id=X AND tense=Y
--   AND min_level <= german_level. Rotation via last_sentence_idx % pool_size.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS gwc_verb_reviews CASCADE;

CREATE TABLE gwc_verb_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text NOT NULL,
  verb_id         uuid NOT NULL REFERENCES gwc_verbs(id) ON DELETE CASCADE,
  tense           varchar NOT NULL,
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
  UNIQUE (session_id, verb_id, tense)
);

CREATE INDEX IF NOT EXISTS gwc_verb_reviews_due
  ON gwc_verb_reviews (session_id, next_review_at);
