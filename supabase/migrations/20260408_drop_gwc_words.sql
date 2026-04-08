-- Drop the old vocab system (gwc_words + gwc_word_sentences).
-- gwc_vocab / gwc_vocab_sentences / gwc_vocab_reviews is the replacement.

-- Remove old vocab review rows only if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gwc_user_reviews') THEN
    DELETE FROM gwc_user_reviews WHERE item_type = 'vocab';
  END IF;
END $$;

-- Drop old tables (IF EXISTS = safe to run even if already gone)
DROP TABLE IF EXISTS gwc_word_sentences CASCADE;
DROP TABLE IF EXISTS gwc_words CASCADE;
