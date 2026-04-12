-- Add comparative and superlative columns for adjectives
-- Also add verb_ich/du/er/wir/ihr/sie for verb conjugation display (future use)

ALTER TABLE gwc_vocab
  ADD COLUMN IF NOT EXISTS comparative  text,   -- e.g. "einfacher"
  ADD COLUMN IF NOT EXISTS superlative  text;   -- e.g. "am einfachsten" / "einfachste"
