-- Add is_draft flag to vocabulary and grammar content tables.
-- Draft items are hidden from all users except the admin account.
-- To test new content: insert with is_draft = true, then flip to false when ready.

ALTER TABLE gwc_vocab
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

-- Index so the WHERE is_draft = false filter is fast
CREATE INDEX IF NOT EXISTS idx_gwc_vocab_is_draft        ON gwc_vocab (is_draft);
CREATE INDEX IF NOT EXISTS idx_gwc_grammar_topics_is_draft ON gwc_grammar_topics (is_draft);
