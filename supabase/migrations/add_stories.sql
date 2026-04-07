-- Migration: create gwc_stories table for Reading Practice
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS gwc_stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,         -- Full story text (paragraphs separated by \n\n)
  level        TEXT NOT NULL,         -- A1, A2, B1, B2 etc.
  sort_order   INT  NOT NULL DEFAULT 0,
  word_count   INT  GENERATED ALWAYS AS (array_length(regexp_split_to_array(trim(content), '\s+'), 1)) STORED,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gwc_stories_level_idx ON gwc_stories (level, sort_order);

-- Example story:
-- INSERT INTO gwc_stories (title, content, level, sort_order) VALUES (
--   'Ein Tag in Berlin',
--   'Es ist Montag. Anna wohnt in Berlin. Sie trinkt Kaffee und liest die Zeitung.\n\nDann geht sie zur Arbeit. Sie arbeitet in einem Büro. Ihr Kollege heißt Tom.\n\nAm Abend kocht Anna Nudeln. Sie isst allein. Es schmeckt gut.',
--   'A1',
--   1
-- );
