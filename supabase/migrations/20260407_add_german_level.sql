-- Migration: add german_level to gwc_user_progress
-- Stores the user's self-selected German level (A1–C2)
-- Controls which vocab sentences are shown in drills and detail pages

ALTER TABLE gwc_user_progress
  ADD COLUMN IF NOT EXISTS german_level TEXT NOT NULL DEFAULT 'A1'
    CHECK (german_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
