-- Add reviewed_at column to gwc_verb_reviews for per-day progress tracking
ALTER TABLE gwc_verb_reviews
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz DEFAULT now();
