-- Fix cloze_word for W-Frage: wie? — every sentence should test "wie"

UPDATE gwc_grammar_sentences
SET cloze_word = 'Wie'
WHERE topic_id = (
  SELECT id FROM gwc_grammar_topics WHERE slug = 'w-frage-wie'
);
