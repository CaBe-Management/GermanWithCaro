-- ─────────────────────────────────────────────────────────────────────────────
-- Grammar SRS — proper review table
-- Replaces the per-sentence tracking in gwc_user_reviews (item_type='grammar')
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Card unit = grammar topic (one SRS card per concept, e.g. "W-Frage: wie?")
-- Sentences rotate within the topic for variety — same principle as vocab.
--
-- Why not per-sentence:
--   - You learn "W-Frage: wie?" as a concept, not 10 individual sentences
--   - Seeing a different sentence each review keeps practice fresh
--   - Getting it wrong → the topic comes back more often (with a different sentence)
--   - Consistent with the vocab case-group approach
--
-- Sentence selection per review:
--   1. Load: SELECT * FROM gwc_grammar_sentences WHERE topic_id=X ORDER BY sort_order
--   2. next_idx = (last_sentence_idx + 1) % count
--   3. Show sentences[next_idx] as the cloze exercise
--   4. Save: update interval_days, ease_factor, last_sentence_idx, next_review_at

CREATE TABLE IF NOT EXISTS gwc_grammar_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        text NOT NULL,
  topic_id          uuid NOT NULL REFERENCES gwc_grammar_topics(id) ON DELETE CASCADE,
  -- SM-2 fields
  interval_days     integer NOT NULL DEFAULT 1,
  ease_factor       float   NOT NULL DEFAULT 2.5,
  repetitions       integer NOT NULL DEFAULT 0,
  next_review_at    timestamptz NOT NULL DEFAULT now(),
  -- Sentence rotation (index into ORDER BY sort_order list)
  last_sentence_idx integer NOT NULL DEFAULT -1,  -- -1 = never shown yet
  -- Stats
  correct_streak    integer NOT NULL DEFAULT 0,
  total_reviews     integer NOT NULL DEFAULT 0,
  correct_reviews   integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (session_id, topic_id)
);

CREATE INDEX IF NOT EXISTS gwc_grammar_reviews_due
  ON gwc_grammar_reviews (session_id, next_review_at);

-- ── Learn queue logic ─────────────────────────────────────────────────────────
-- A topic is "learned" as soon as a gwc_grammar_reviews row exists for it.
--
-- LEARN queue (new grammar points):
--   SELECT t.* FROM gwc_grammar_topics t
--   WHERE t.level <= [german_level]
--   AND NOT EXISTS (
--     SELECT 1 FROM gwc_grammar_reviews gr
--     WHERE gr.topic_id = t.id AND gr.session_id = [session_id]
--   )
--   ORDER BY t.sort_order ASC LIMIT [daily_goal]
--
-- REVIEW queue (due cards):
--   SELECT * FROM gwc_grammar_reviews
--   WHERE session_id = [session_id] AND next_review_at <= now()
--   ORDER BY next_review_at ASC
--
-- On first learn: show explanation slide + one cloze sentence (idx 0).
-- On completion: insert gwc_grammar_reviews row (next_review_at = now(), last_sentence_idx = 0).
-- Topic disappears from learn queue permanently after that.
