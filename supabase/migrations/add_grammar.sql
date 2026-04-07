-- ─────────────────────────────────────────────────────────────────────────────
-- Grammar System Migration
-- Run this in the Supabase SQL editor BEFORE seed_grammar.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Grammar Topics ────────────────────────────────────────────────────────
-- Each row is one grammar concept (e.g. "Präsens: sein")

CREATE TABLE IF NOT EXISTS gwc_grammar_topics (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,          -- "Präsens: sein"
  slug           TEXT        UNIQUE NOT NULL,   -- "prasens-sein"
  level          TEXT        NOT NULL,          -- A1, A2, B1, B2, C1
  category       TEXT        NOT NULL,          -- verb_conjugation, adjective_usage, etc.
  explanation_en TEXT        NOT NULL,          -- Markdown English explanation
  explanation_de TEXT,                          -- Optional German explanation
  sort_order     INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anyone can read grammar topics (public content, like gwc_words)
ALTER TABLE gwc_grammar_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grammar_topics_select_all"
  ON gwc_grammar_topics FOR SELECT USING (true);

-- ─── 2. Grammar Sentences ─────────────────────────────────────────────────────
-- Each row is one cloze exercise sentence for a topic

CREATE TABLE IF NOT EXISTS gwc_grammar_sentences (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID        NOT NULL REFERENCES gwc_grammar_topics(id) ON DELETE CASCADE,
  sentence_de TEXT        NOT NULL,   -- full German sentence
  sentence_en TEXT,                   -- English translation
  cloze_word  TEXT        NOT NULL,   -- word to blank out (matched case-insensitively)
  person      TEXT,                   -- ich / du / er / wir / ihr / sie
  tense       TEXT,                   -- präsens / perfekt / präteritum
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gwc_grammar_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grammar_sentences_select_all"
  ON gwc_grammar_sentences FOR SELECT USING (true);

-- ─── 3. Extend gwc_user_reviews ───────────────────────────────────────────────
-- Add grammar support to the existing SRS review table

-- Make word_sentence_id nullable so grammar reviews don't need it
ALTER TABLE gwc_user_reviews
  ALTER COLUMN word_sentence_id DROP NOT NULL;

-- 'vocab' for existing rows, 'grammar' for new grammar reviews
ALTER TABLE gwc_user_reviews
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'vocab';

-- FK to the specific grammar sentence being reviewed (null for vocab reviews)
ALTER TABLE gwc_user_reviews
  ADD COLUMN IF NOT EXISTS grammar_sentence_id UUID
    REFERENCES gwc_grammar_sentences(id) ON DELETE SET NULL;

-- ─── 4. User Path Settings ────────────────────────────────────────────────────
-- Stores each user's active learn paths (max 2) with per-path settings.
-- path_id references one of the predefined paths in lib/paths.ts:
--   'caros-path-a1', 'a1-grammar', 'a1-vocabulary'

CREATE TABLE IF NOT EXISTS gwc_user_paths (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT        NOT NULL,
  path_id         TEXT        NOT NULL,               -- predefined path identifier
  queue_position  INT         NOT NULL DEFAULT 1,     -- 1 or 2 (display order in queue)
  daily_goal      INT         NOT NULL DEFAULT 10,    -- max new items per day from this path
  batch_size      INT         NOT NULL DEFAULT 5,     -- items per learn session from this path
  lesson_order    TEXT        NOT NULL DEFAULT 'default', -- 'default' | 'alphabetical' | 'frequency'
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, path_id)  -- can't add the same path twice
);

ALTER TABLE gwc_user_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_paths_all"
  ON gwc_user_paths USING (true) WITH CHECK (true);
