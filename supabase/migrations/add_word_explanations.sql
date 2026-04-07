-- Migration: add explanation fields to gwc_words
-- Run this in your Supabase SQL editor

ALTER TABLE gwc_words
  ADD COLUMN IF NOT EXISTS erklaerung TEXT,       -- Grammar / usage explanation
  ADD COLUMN IF NOT EXISTS verwendung TEXT,       -- When to use: formal, casual, etc.
  ADD COLUMN IF NOT EXISTS genitiv    TEXT;       -- Genitive singular form (nouns only)

-- Example update for a noun:
-- UPDATE gwc_words
-- SET erklaerung = 'Das Wort "Haus" ist ein sächliches Nomen und bezeichnet ein Gebäude.',
--     verwendung  = 'Neutral – wird in formellen und informellen Situationen verwendet.',
--     genitiv     = 'des Hauses'
-- WHERE word = 'Haus';
