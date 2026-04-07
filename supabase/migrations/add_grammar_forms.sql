-- ─────────────────────────────────────────────────────────────────────────────
-- Grammar Form-Level SRS Migration
--
-- Architecture decision: use grammar_form_key (no extra tables needed).
--
-- The SRS unit is a FORM, not an individual sentence.
-- A "form" = one (topic_id, person) pair, e.g. "sein / ich" or "W-Questions / null".
-- Key format: "topic_uuid:person"  →  "3a7b…:ich"
--             "topic_uuid:null"    →  "3a7b…:null"  (for topics without person split)
--
-- Topics with person set (verb conjugation, 8 topics × 6 forms = 48 forms):
--   Each form has ~10 sentence pool. Review picks ONE random sentence each time.
--
-- Topics without person (50 other A1 topics, 8 sentences each):
--   The whole topic is one form (key = "topic_uuid:null"), pool = all 8 sentences.
--
-- Backwards compat: old rows have grammar_form_key = NULL. They still work in
-- review exactly as before (sentence-level). Only new learn sessions create
-- form-level rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add grammar_form_key to identify which form this review row tracks
ALTER TABLE gwc_user_reviews
  ADD COLUMN IF NOT EXISTS grammar_form_key TEXT;

-- Index for efficiently fetching due grammar reviews by form
CREATE INDEX IF NOT EXISTS idx_user_reviews_grammar_form
  ON gwc_user_reviews (session_id, item_type, grammar_form_key)
  WHERE grammar_form_key IS NOT NULL;
