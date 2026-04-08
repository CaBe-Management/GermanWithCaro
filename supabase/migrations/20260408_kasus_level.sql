-- ─────────────────────────────────────────────────────────────────────────────
-- Add kasus_level to gwc_user_progress
--
-- Controls which grammatical cases are shown in vocab reviews.
-- A1 → Nominativ + Akkusativ
-- A2 → + Dativ
-- B1+ → + Genitiv
--
-- Run in Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE gwc_user_progress
  ADD COLUMN IF NOT EXISTS kasus_level TEXT NOT NULL DEFAULT 'A1'
    CHECK (kasus_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
