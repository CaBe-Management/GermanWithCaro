-- ============================================================
-- STEP 1: Clean all grammar content (keep table structure)
-- ============================================================

TRUNCATE TABLE gwc_grammar_sentences CASCADE;
TRUNCATE TABLE gwc_grammar_topics CASCADE;

-- ============================================================
-- STEP 2: Add missing columns to gwc_grammar_topics
-- ============================================================

-- Synonyms: synonymous expressions / related words
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS synonyms TEXT;

-- Related forms: other W-questions, similar grammar points, etc.
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS related_forms TEXT;

-- Add audio_file to sentences if not already there
ALTER TABLE gwc_grammar_sentences
  ADD COLUMN IF NOT EXISTS audio_file TEXT;

-- ============================================================
-- STEP 3: Insert W-Frage: wie?
-- ============================================================

DO $$
DECLARE
  g_id UUID;
BEGIN

INSERT INTO gwc_grammar_topics (
  id,
  title,
  translation_en,
  slug,
  level,
  category,
  explanation_en,
  structure,
  register_formal,
  register_standard,
  register_casual,
  fun_fact,
  synonyms,
  related_forms,
  resources,
  sort_order
) VALUES (
  gen_random_uuid(),
  'W-Frage: wie?',
  'W-Question: how?',
  'w-frage-wie',
  'A1',
  'question',

  -- explanation_en (About section)
  E'„Wie?" is one of the most important question words in German. It asks about the manner, condition, or quality of something — and translates to "how?" or "what … like?" in English.\n\nThe key rule: in a W-question, the question word always comes first, and the verb comes immediately after. So **Wie geht es dir?** — wie first, then the verb (geht), then the subject (es), then the rest.\n\nYou will use „wie" from day one: to ask someone\'s name, how they\'re doing, what time it is, and much more. It is one of the most flexible and frequently used question words in German.',

  -- structure
  E'wie + [Verb] + [Subjekt] + [Rest]?\nwie + [Adjektiv/Adverb]?\nwie + [viel/lange/oft/weit] + [Verb] + [Subjekt]?',

  -- register
  3, -- formal
  3, -- standard
  2, -- casual

  -- fun_fact
  '„Wie" also works as a conjunction for comparisons: „so groß wie ich" (as tall as me). That makes it one of the only W-words that doubles as both a question word and a linking word in the same language!',

  -- synonyms
  'auf welche Weise (more formal: "in what way"), auf welche Art und Weise',

  -- related_forms
  'Other W-questions: was? (what), wer? (who), wo? (where), wann? (when), warum? (why), wohin? (where to), woher? (where from). Also related: Wie bitte? (Could you repeat that? / Excuse me?)',

  -- resources (NULL until real links are added)
  NULL,

  -- sort_order
  1
)
RETURNING id INTO g_id;

-- ============================================================
-- 10 Example sentences
-- ============================================================

INSERT INTO gwc_grammar_sentences
  (id, topic_id, sentence_de, sentence_en, cloze_word, sort_order, audio_file)
VALUES
  (gen_random_uuid(), g_id,
   'Wie heißt du?',
   'What is your name?',
   'Wie', 1, 'gwc_grammar_w-frage-wie_01.mp3'),

  (gen_random_uuid(), g_id,
   'Wie geht es dir?',
   'How are you?',
   'Wie', 2, 'gwc_grammar_w-frage-wie_02.mp3'),

  (gen_random_uuid(), g_id,
   'Wie alt bist du?',
   'How old are you?',
   'Wie', 3, 'gwc_grammar_w-frage-wie_03.mp3'),

  (gen_random_uuid(), g_id,
   'Wie spät ist es?',
   'What time is it?',
   'Wie', 4, 'gwc_grammar_w-frage-wie_04.mp3'),

  (gen_random_uuid(), g_id,
   'Wie ist das Wetter heute?',
   'What is the weather like today?',
   'Wie', 5, 'gwc_grammar_w-frage-wie_05.mp3'),

  (gen_random_uuid(), g_id,
   'Wie viel kostet das?',
   'How much does that cost?',
   'Wie', 6, 'gwc_grammar_w-frage-wie_06.mp3'),

  (gen_random_uuid(), g_id,
   'Wie kommst du zur Arbeit?',
   'How do you get to work?',
   'Wie', 7, 'gwc_grammar_w-frage-wie_07.mp3'),

  (gen_random_uuid(), g_id,
   'Wie lange dauert das?',
   'How long does that take?',
   'Wie', 8, 'gwc_grammar_w-frage-wie_08.mp3'),

  (gen_random_uuid(), g_id,
   'Wie findest du Berlin?',
   'How do you like Berlin?',
   'Wie', 9, 'gwc_grammar_w-frage-wie_09.mp3'),

  (gen_random_uuid(), g_id,
   'Wie schreibt man das?',
   'How do you write that?',
   'Wie', 10, 'gwc_grammar_w-frage-wie_10.mp3');

END $$;
