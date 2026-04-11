-- ─────────────────────────────────────────────────────────────────────────────
-- Add highlight_en column to gwc_grammar_sentences
-- Used by the learn/review cards to highlight the matching English word in purple.
-- Also backfills highlight_en for existing W-Frage: wie? sentences.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE gwc_grammar_sentences
  ADD COLUMN IF NOT EXISTS highlight_en TEXT;

-- Backfill highlight_en for existing W-Frage: wie? sentences
DO $$
DECLARE t_id UUID;
BEGIN
  SELECT id INTO t_id FROM gwc_grammar_topics WHERE slug = 'w-frage-wie';

  UPDATE gwc_grammar_sentences SET highlight_en = 'What'    WHERE topic_id = t_id AND sentence_de = 'Wie heißt du?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How'     WHERE topic_id = t_id AND sentence_de = 'Wie geht es dir?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How old' WHERE topic_id = t_id AND sentence_de = 'Wie alt bist du?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'What'    WHERE topic_id = t_id AND sentence_de = 'Wie spät ist es?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'What'    WHERE topic_id = t_id AND sentence_de = 'Wie ist das Wetter heute?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How much' WHERE topic_id = t_id AND sentence_de = 'Wie viel kostet das?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How'     WHERE topic_id = t_id AND sentence_de = 'Wie kommst du zur Arbeit?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How long' WHERE topic_id = t_id AND sentence_de = 'Wie lange dauert das?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How'     WHERE topic_id = t_id AND sentence_de = 'Wie findest du Berlin?';
  UPDATE gwc_grammar_sentences SET highlight_en = 'How'     WHERE topic_id = t_id AND sentence_de = 'Wie schreibt man das?';
END $$;
