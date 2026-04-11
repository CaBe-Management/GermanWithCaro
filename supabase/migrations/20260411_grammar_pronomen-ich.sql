-- ─────────────────────────────────────────────────────────────────────────────
-- Grammar entry: Pronomen: ich
-- Level: A1 | Category: pronouns
-- sort_order: 20 (after wie? at 1, wo? at 10)
-- path_a1_grammar: 3 | path_caros_path: 3
-- 13 sentences: 10 standalone + 3 dialogue-style
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

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
  'Pronomen: ich',
  'pronomen-ich',
  'A1',
  'pronouns',
  'Personal pronoun: I',

  E'„Ich" is the first-person singular subject pronoun in German — it means "I" and refers to the person speaking. It is always the subject of the sentence, the one doing the action.\n\nUnlike English "I", German "ich" is written in lowercase. It always pairs with the first-person singular verb form: ich bin (I am), ich habe (I have), ich mache (I do).\n\nYou will use „ich" in almost every sentence you ever say in German.',

  E'ich + [Verb (1. Person Singular)]',

  3, -- register_formal
  3, -- register_standard
  3, -- register_casual

  E'Unlike English "I", German "ich" is always written in lowercase — unless it is the very first word of a sentence. This trips up English speakers constantly!',

  NULL,

  'du (you), er (he), sie (she), es (it), wir (we), ihr (you all), sie/Sie (they/you formal)',

  NULL,

  20,  -- sort_order
  3,   -- path_a1_grammar
  3    -- path_caros_path
)
RETURNING id INTO g_id;

-- ── 13 sentences ──────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_sentences
  (id, topic_id, sentence_de, sentence_en, cloze_word, highlight_en, sort_order, audio_file)
VALUES
  -- Standalone sentences
  (gen_random_uuid(), g_id, 'Ich bin müde.',                       'I am tired.',                          'Ich', 'I',  1, 'pronomen-ich_1.mp3'),
  (gen_random_uuid(), g_id, 'Ich heiße Max.',                      'I am called Max.',                     'Ich', 'I',  2, 'pronomen-ich_2.mp3'),
  (gen_random_uuid(), g_id, 'Ich komme aus Deutschland.',          'I come from Germany.',                 'Ich', 'I',  3, 'pronomen-ich_3.mp3'),
  (gen_random_uuid(), g_id, 'Ich spreche Deutsch.',                'I speak German.',                      'Ich', 'I',  4, 'pronomen-ich_4.mp3'),
  (gen_random_uuid(), g_id, 'Ich bin 25 Jahre alt.',               'I am 25 years old.',                   'Ich', 'I',  5, 'pronomen-ich_5.mp3'),
  (gen_random_uuid(), g_id, 'Ich wohne in Wien.',                  'I live in Vienna.',                    'Ich', 'I',  6, 'pronomen-ich_6.mp3'),
  (gen_random_uuid(), g_id, 'Ich habe einen Hund.',                'I have a dog.',                        'Ich', 'I',  7, 'pronomen-ich_7.mp3'),
  (gen_random_uuid(), g_id, 'Ich lerne Deutsch.',                  'I am learning German.',                'Ich', 'I',  8, 'pronomen-ich_8.mp3'),
  (gen_random_uuid(), g_id, 'Ich trinke Kaffee.',                  'I drink coffee.',                      'Ich', 'I',  9, 'pronomen-ich_9.mp3'),
  (gen_random_uuid(), g_id, 'Ich mag Musik.',                      'I like music.',                        'Ich', 'I', 10, 'pronomen-ich_10.mp3'),
  -- Dialogue sentences
  (gen_random_uuid(), g_id, E'Freund: Wo studierst du?\nMaria: ___ studiere in Rom.',        E'Friend: Where do you study?\nMaria: I study in Rome.',            'Ich', 'I', 11, 'pronomen-ich_11.mp3'),
  (gen_random_uuid(), g_id, E'Lehrerin: Wie heißt du?\nSchüler: ___ heiße Jonas.',           E'Teacher: What is your name?\nStudent: I am called Jonas.',         'Ich', 'I', 12, 'pronomen-ich_12.mp3'),
  (gen_random_uuid(), g_id, E'Kollegin: Sprichst du Deutsch?\nAnna: Ja, ___ spreche ein bisschen.', E'Colleague: Do you speak German?\nAnna: Yes, I speak a little.', 'Ich', 'I', 13, 'pronomen-ich_13.mp3');

END $$;

COMMIT;
