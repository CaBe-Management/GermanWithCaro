-- ─────────────────────────────────────────────────────────────────────────────
-- Vocab entry: einfach (ADJEKTIV, A1)
-- 10 sentences: predicative A1 only
-- is_draft = true → visible to admin only until confirmed live
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

INSERT INTO gwc_vocab (
  slug, word, type, article, plural, level, frequency_rank,
  translation_en, explanation_en, usage_notes, fun_fact,
  synonyms, related_words,
  is_draft
) VALUES (
  'einfach',
  'einfach',
  'ADJEKTIV',
  NULL,
  NULL,
  'A1',
  100,
  'easy, simple',
  '"einfach" means easy or simple and is one of the most frequently used adjectives in everyday German. It describes tasks, questions, words, and situations. It also doubles as an adverb meaning "just" or "simply" (e.g. "Mach es einfach!"), though that usage is introduced at A2.',
  'As an adjective, einfach takes normal endings depending on gender and case (eine einfache Frage, ein einfaches Wort). As an adverb/particle it means "just" or "simply" and is extremely common in spoken German — don''t skip it.',
  'Germans use "einfach" as a constant sentence intensifier: "Das ist einfach toll!" (That is just great!) or "Mach es einfach!" (Just do it!). Once you notice it, you''ll hear it everywhere.',
  'leicht, simpel, unkompliziert',
  'die Einfachheit, vereinfachen, einfach so',
  true
) ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM gwc_vocab WHERE slug = 'einfach';

  INSERT INTO gwc_vocab_sentences
    (vocab_id, sentence_de, sentence_en, cloze_word, grammatical_case, min_level, sort_order, audio_file)
  VALUES
    (v_id, 'Das ist einfach.', 'That is easy.', 'einfach', NULL, 'A1', 1, NULL),
    (v_id, 'Die Aufgabe ist einfach.', 'The task is easy.', 'einfach', NULL, 'A1', 2, NULL),
    (v_id, 'Der Test ist einfach.', 'The test is easy.', 'einfach', NULL, 'A1', 3, NULL),
    (v_id, 'Das Wort ist einfach.', 'The word is easy.', 'einfach', NULL, 'A1', 4, NULL),
    (v_id, 'Das Spiel ist einfach.', 'The game is easy.', 'einfach', NULL, 'A1', 5, NULL),
    (v_id, 'Die Frage ist einfach.', 'The question is easy.', 'einfach', NULL, 'A1', 6, NULL),
    (v_id, 'Das ist nicht einfach.', 'That is not easy.', 'einfach', NULL, 'A1', 7, NULL),
    (v_id, 'Das Rezept ist einfach.', 'The recipe is easy.', 'einfach', NULL, 'A1', 8, NULL),
    (v_id, 'Die Übung ist einfach.', 'The exercise is easy.', 'einfach', NULL, 'A1', 9, NULL),
    (v_id, 'Das Leben ist nicht einfach.', 'Life is not easy.', 'einfach', NULL, 'A1', 10, NULL);
END $$;

COMMIT;
