-- Add path membership fields to gwc_grammar_topics
-- false = not in path, integer = position in that path

ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS path_a1_grammar  integer,  -- position in A1 Grammar path (50 topics)
  ADD COLUMN IF NOT EXISTS path_caros_path  integer;  -- position in Caro's Path (mixed)
