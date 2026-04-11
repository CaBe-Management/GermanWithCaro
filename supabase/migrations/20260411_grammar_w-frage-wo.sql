-- ─────────────────────────────────────────────────────────────────────────────
-- Grammar entry: W-Frage: wo?
-- Level: A1 | Category: question_words
-- sort_order: 10 (after wie? at 1)
-- path_a1_grammar: 2 | path_caros_path: 2
-- Also sets path positions for existing wie? topic (was NULL)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Fix path positions for wie? (was never set)
UPDATE gwc_grammar_topics
SET path_a1_grammar = 1,
    path_caros_path = 1
WHERE slug = 'w-frage-wie';

-- Insert wo? topic
DO $$
DECLARE g_id UUID;
BEGIN

INSERT INTO gwc_grammar_topics (
  id,
  title,
  slug,
  level,
  category,
  translation_en,
  explanation_en,
  structure,
  register_formal,
  register_standard,
  register_casual,
  fun_fact,
  synonyms,
  related_forms,
  resources,
  sort_order,
  path_a1_grammar,
  path_caros_path
) VALUES (
  gen_random_uuid(),
  'W-Frage: wo?',
  'w-frage-wo',
  'A1',
  'question_words',
  'W-Question: where?',

  E'„Wo?" asks about location — it means "where?" in English and is one of the first question words beginners learn. Like all W-questions, the question word comes first and the verb follows immediately after.\n\nImportant: „wo?" only asks about static position — where something or someone IS. If something is moving toward a place, you need „wohin?" instead: Wo bist du? (Where are you?) vs. Wohin gehst du? (Where are you going?)\n\nYou will use „wo?" constantly from day one: to ask where people live, where places are, and where things happen.',

  E'Wo + [Verb] + [Subjekt] + [Rest]?\nWo + [ist/sind] + [Ort]?',

  3, -- register_formal
  3, -- register_standard
  3, -- register_casual

  E'„Wo?" only asks about static location — where something IS. For direction, Germans use „wohin?" (where to?) and „woher?" (where from?). Using „wo" for movement is one of the most common beginner mistakes!',

  'wo genau? (exactly where?)',

  'wohin? (where to), woher? (where from), wie? (how), was? (what), wer? (who), wann? (when), warum? (why)',

  NULL,

  10,  -- sort_order
  2,   -- path_a1_grammar
  2    -- path_caros_path
)
RETURNING id INTO g_id;

-- ── 10 sentences ──────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_sentences
  (id, topic_id, sentence_de, sentence_en, cloze_word, highlight_en, sort_order, audio_file)
VALUES
  (gen_random_uuid(), g_id, 'Wo wohnst du?',                    'Where do you live?',             'Wo', 'Where',  1, 'w-frage-wo_1.mp3'),
  (gen_random_uuid(), g_id, 'Wo ist die Toilette?',             'Where is the toilet?',           'Wo', 'Where',  2, 'w-frage-wo_2.mp3'),
  (gen_random_uuid(), g_id, 'Wo kaufst du ein?',                'Where do you go shopping?',      'Wo', 'Where',  3, 'w-frage-wo_3.mp3'),
  (gen_random_uuid(), g_id, 'Wo bist du?',                      'Where are you?',                 'Wo', 'Where',  4, 'w-frage-wo_4.mp3'),
  (gen_random_uuid(), g_id, 'Wo liegt Berlin?',                 'Where is Berlin?',               'Wo', 'Where',  5, 'w-frage-wo_5.mp3'),
  (gen_random_uuid(), g_id, 'Wo arbeitest du?',                 'Where do you work?',             'Wo', 'Where',  6, 'w-frage-wo_6.mp3'),
  (gen_random_uuid(), g_id, 'Wo ist mein Schlüssel?',           'Where is my key?',               'Wo', 'Where',  7, 'w-frage-wo_7.mp3'),
  (gen_random_uuid(), g_id, 'Wo treffen wir uns?',              'Where are we meeting?',          'Wo', 'Where',  8, 'w-frage-wo_8.mp3'),
  (gen_random_uuid(), g_id, 'Wo ist der nächste Supermarkt?',   'Where is the nearest supermarket?', 'Wo', 'Where', 9, 'w-frage-wo_9.mp3'),
  (gen_random_uuid(), g_id, 'Wo lernst du Deutsch?',            'Where do you learn German?',     'Wo', 'Where', 10, 'w-frage-wo_10.mp3');

END $$;

COMMIT;
