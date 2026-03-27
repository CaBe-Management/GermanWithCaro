-- ========================================
-- GermanWithCaro — Seed Data
-- Run this in the Supabase SQL Editor to create a test lesson
-- ========================================

-- Insert a sample lesson: "Sein (to be)"
insert into lessons (id, title, slug, unit_name, order_index, level, is_published)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Sein — To Be',
  'sein-to-be',
  'Unit 1 · Erste Schritte',
  1,
  'A1',
  true
);

-- Insert lesson blocks (in order)

-- Block 1: Intro text
insert into lesson_blocks (lesson_id, order_index, type, content)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  1,
  'text',
  '{"text": "The verb [sein] is one of the most important verbs in German. It means \"to be\" and is used constantly in everyday conversation.\n\nJust like in English, [sein] is irregular — it changes form depending on who you''re talking about. Let''s look at some real examples."}'
);

-- Block 2: Example sentence (flashcard) — Formal
insert into lesson_blocks (lesson_id, order_index, type, german_sentence, translation, register, word_breakdown, is_flashcard)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  2,
  'example_sentence',
  'Ich bin Student.',
  'I am a student.',
  'Neutral',
  '[{"de": "Ich", "en": "I", "role": "pronoun"}, {"de": "bin", "en": "am", "role": "verb (sein)"}, {"de": "Student", "en": "student", "role": "noun"}]',
  true
);

-- Block 3: Example sentence (flashcard) — Casual
insert into lesson_blocks (lesson_id, order_index, type, german_sentence, translation, register, word_breakdown, is_flashcard)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  3,
  'example_sentence',
  'Du bist sehr nett.',
  'You are very nice.',
  'Casual',
  '[{"de": "Du", "en": "You", "role": "pronoun"}, {"de": "bist", "en": "are", "role": "verb (sein)"}, {"de": "sehr", "en": "very", "role": "adverb"}, {"de": "nett", "en": "nice", "role": "adjective"}]',
  true
);

-- Block 4: Text block — explanation
insert into lesson_blocks (lesson_id, order_index, type, content)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  4,
  'text',
  '{"text": "Notice how [sein] changes: [ich bin], [du bist], [er/sie ist]. This is called [Konjugation] (conjugation). Don''t worry about memorising the table — you''ll learn it naturally through the example sentences."}'
);

-- Block 5: Example sentence (flashcard) — Formal
insert into lesson_blocks (lesson_id, order_index, type, german_sentence, translation, register, word_breakdown, is_flashcard)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  5,
  'example_sentence',
  'Sie ist Ärztin.',
  'She is a doctor.',
  'Neutral',
  '[{"de": "Sie", "en": "She", "role": "pronoun"}, {"de": "ist", "en": "is", "role": "verb (sein)"}, {"de": "Ärztin", "en": "doctor (f.)", "role": "noun"}]',
  true
);

-- Block 6: Bad example
insert into lesson_blocks (lesson_id, order_index, type, german_sentence, translation, register, word_breakdown, is_flashcard)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  6,
  'bad_example',
  'Ich bist müde.',
  'I am tired. (WRONG — should be "Ich bin müde.")',
  'Neutral',
  '[{"de": "Ich", "en": "I", "role": "pronoun"}, {"de": "bist", "en": "are", "role": "WRONG form"}, {"de": "müde", "en": "tired", "role": "adjective"}]',
  false
);

-- Block 7: Closing text
insert into lesson_blocks (lesson_id, order_index, type, content)
values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  7,
  'text',
  '{"text": "Great work! You''ve now seen [sein] in action with three different [Personalpronomen] (personal pronouns): [ich], [du], and [sie].\n\nWhen you mark this lesson as complete, the example sentences above will be added to your flashcard review queue. You''ll review them tomorrow to make sure they stick!"}'
);

-- ========================================
-- Insert a second lesson (so "coming up" shows on dashboard)
-- ========================================

insert into lessons (id, title, slug, unit_name, order_index, level, is_published)
values (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Haben — To Have',
  'haben-to-have',
  'Unit 1 · Erste Schritte',
  2,
  'A1',
  true
);

-- Just one text block as a placeholder
insert into lesson_blocks (lesson_id, order_index, type, content)
values (
  'a1b2c3d4-0002-4000-8000-000000000002',
  1,
  'text',
  '{"text": "Coming soon! This lesson will cover the verb [haben] (to have) — another essential German verb."}'
);
