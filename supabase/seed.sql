-- German With Caro v2 - Database Schema and Seed Data

-- Create tables
CREATE TABLE IF NOT EXISTS gwc_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,          -- clean word without article (e.g. "Familie")
  typ TEXT NOT NULL,           -- 'NOMEN', 'VERB', 'ADJEKTIV', 'ADVERB', 'GRAMMATIK', etc.
  artikel TEXT,                -- 'der', 'die', 'das', or null
  plural TEXT,                 -- plural form without article, or null
  level TEXT DEFAULT 'A1',     -- 'A1', 'A2', 'B1', etc. — for future expansion
  frequenz_rang INTEGER,       -- frequency rank (1 = most important)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gwc_word_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES gwc_words(id) ON DELETE CASCADE,
  sentence_de TEXT NOT NULL,      -- full German sentence
  sentence_en TEXT,               -- English translation
  cloze_word TEXT NOT NULL,       -- German word to blank out (e.g. "Familie")
  cloze_word_en TEXT,             -- English equivalent shown in purple (e.g. "family")
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gwc_user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,    -- anonymous session ID (stored in localStorage)
  word_sentence_id UUID NOT NULL REFERENCES gwc_word_sentences(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_at TIMESTAMPTZ,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_gwc_word_sentences_word_id ON gwc_word_sentences(word_id);
CREATE INDEX IF NOT EXISTS idx_gwc_user_reviews_session ON gwc_user_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_gwc_user_reviews_next ON gwc_user_reviews(next_review_at);

-- Seed: First 20 A1 words
INSERT INTO gwc_words (word, typ, artikel, plural, level, frequenz_rang) VALUES
('ich', 'PRONOMEN', NULL, NULL, 'A1', 1),
('du', 'PRONOMEN', NULL, NULL, 'A1', 2),
('er', 'PRONOMEN', NULL, NULL, 'A1', 3),
('sie', 'PRONOMEN', NULL, NULL, 'A1', 4),
('wir', 'PRONOMEN', NULL, NULL, 'A1', 5),
('sein', 'VERB', NULL, NULL, 'A1', 6),
('haben', 'VERB', NULL, NULL, 'A1', 7),
('nicht', 'ADVERB', NULL, NULL, 'A1', 8),
('und', 'KONJUNKTION', NULL, NULL, 'A1', 9),
('gut', 'ADJEKTIV', NULL, NULL, 'A1', 10),
('Familie', 'NOMEN', 'die', 'Familien', 'A1', 11),
('Haus', 'NOMEN', 'das', 'Häuser', 'A1', 12),
('Schule', 'NOMEN', 'die', 'Schulen', 'A1', 13),
('Kind', 'NOMEN', 'das', 'Kinder', 'A1', 14),
('Mann', 'NOMEN', 'der', 'Männer', 'A1', 15),
('Frau', 'NOMEN', 'die', 'Frauen', 'A1', 16),
('Tag', 'NOMEN', 'der', 'Tage', 'A1', 17),
('kommen', 'VERB', NULL, NULL, 'A1', 18),
('gehen', 'VERB', NULL, NULL, 'A1', 19),
('machen', 'VERB', NULL, NULL, 'A1', 20);

-- Sentences for 'ich'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'ich' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich bin Student.', 'I am a student.', 'Ich', 1 FROM w
UNION ALL SELECT w.id, 'Ich heiße Maria.', 'My name is Maria.', 'Ich', 2 FROM w
UNION ALL SELECT w.id, 'Ich komme aus Deutschland.', 'I come from Germany.', 'Ich', 3 FROM w;

-- Sentences for 'du'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'du' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Du bist mein Freund.', 'You are my friend.', 'Du', 1 FROM w
UNION ALL SELECT w.id, 'Du kommst aus England.', 'You come from England.', 'Du', 2 FROM w
UNION ALL SELECT w.id, 'Wie geht es dir?', 'How are you?', 'dir', 3 FROM w;

-- Sentences for 'er'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'er' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Er ist Lehrer.', 'He is a teacher.', 'Er', 1 FROM w
UNION ALL SELECT w.id, 'Er hat eine Katze.', 'He has a cat.', 'Er', 2 FROM w
UNION ALL SELECT w.id, 'Er geht zur Schule.', 'He goes to school.', 'Er', 3 FROM w;

-- Sentences for 'sie'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'sie' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Sie ist Ärztin.', 'She is a doctor.', 'Sie', 1 FROM w
UNION ALL SELECT w.id, 'Sie arbeitet im Büro.', 'She works in the office.', 'Sie', 2 FROM w
UNION ALL SELECT w.id, 'Sie liest gerne Bücher.', 'She likes to read books.', 'Sie', 3 FROM w;

-- Sentences for 'wir'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'wir' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Wir sind Freunde.', 'We are friends.', 'Wir', 1 FROM w
UNION ALL SELECT w.id, 'Wir spielen Fußball.', 'We play football.', 'Wir', 2 FROM w
UNION ALL SELECT w.id, 'Wir wohnen in Berlin.', 'We live in Berlin.', 'Wir', 3 FROM w;

-- Sentences for 'sein'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'sein' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich bin glücklich.', 'I am happy.', 'bin', 1 FROM w
UNION ALL SELECT w.id, 'Du bist klug.', 'You are smart.', 'bist', 2 FROM w
UNION ALL SELECT w.id, 'Er ist nett.', 'He is nice.', 'ist', 3 FROM w;

-- Sentences for 'haben'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'haben' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich habe einen Hund.', 'I have a dog.', 'habe', 1 FROM w
UNION ALL SELECT w.id, 'Du hast ein Buch.', 'You have a book.', 'hast', 2 FROM w
UNION ALL SELECT w.id, 'Sie haben Zeit.', 'They have time.', 'haben', 3 FROM w;

-- Sentences for 'nicht'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'nicht' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich bin nicht müde.', 'I am not tired.', 'nicht', 1 FROM w
UNION ALL SELECT w.id, 'Das ist nicht schwer.', 'That is not difficult.', 'nicht', 2 FROM w
UNION ALL SELECT w.id, 'Er kommt nicht heute.', 'He is not coming today.', 'nicht', 3 FROM w;

-- Sentences for 'und'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'und' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich trinke Kaffee und Tee.', 'I drink coffee and tea.', 'und', 1 FROM w
UNION ALL SELECT w.id, 'Peter und Maria sind Geschwister.', 'Peter and Maria are siblings.', 'und', 2 FROM w
UNION ALL SELECT w.id, 'Das Buch ist interessant und nützlich.', 'The book is interesting and useful.', 'und', 3 FROM w;

-- Sentences for 'gut'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'gut' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Das ist eine gute Idee.', 'That is a good idea.', 'gute', 1 FROM w
UNION ALL SELECT w.id, 'Mir geht es gut.', 'I am doing well.', 'gut', 2 FROM w
UNION ALL SELECT w.id, 'Dein Deutsch ist sehr gut.', 'Your German is very good.', 'gut', 3 FROM w;

-- Sentences for 'Familie'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Familie' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Meine Familie ist groß.', 'My family is big.', 'Familie', 1 FROM w
UNION ALL SELECT w.id, 'Wir treffen die Familie am Wochenende.', 'We meet the family on weekends.', 'Familie', 2 FROM w
UNION ALL SELECT w.id, 'Deine Familie ist sehr nett.', 'Your family is very nice.', 'Familie', 3 FROM w;

-- Sentences for 'Haus'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Haus' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Das Haus ist rot.', 'The house is red.', 'Haus', 1 FROM w
UNION ALL SELECT w.id, 'Wir wohnen in einem großen Haus.', 'We live in a big house.', 'Haus', 2 FROM w
UNION ALL SELECT w.id, 'Das Haus hat einen Garten.', 'The house has a garden.', 'Haus', 3 FROM w;

-- Sentences for 'Schule'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Schule' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich gehe zur Schule.', 'I go to school.', 'Schule', 1 FROM w
UNION ALL SELECT w.id, 'Die Schule ist sehr gut.', 'The school is very good.', 'Schule', 2 FROM w
UNION ALL SELECT w.id, 'Meine Schule hat eine Bibliothek.', 'My school has a library.', 'Schule', 3 FROM w;

-- Sentences for 'Kind'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Kind' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Das Kind ist vier Jahre alt.', 'The child is four years old.', 'Kind', 1 FROM w
UNION ALL SELECT w.id, 'Das Kind spielt im Park.', 'The child plays in the park.', 'Kind', 2 FROM w
UNION ALL SELECT w.id, 'Ein glückliches Kind lacht viel.', 'A happy child laughs a lot.', 'Kind', 3 FROM w;

-- Sentences for 'Mann'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Mann' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Der Mann ist alt.', 'The man is old.', 'Mann', 1 FROM w
UNION ALL SELECT w.id, 'Ein Mann sitzt im Restaurant.', 'A man sits in the restaurant.', 'Mann', 2 FROM w
UNION ALL SELECT w.id, 'Der Mann ist mein Vater.', 'The man is my father.', 'Mann', 3 FROM w;

-- Sentences for 'Frau'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Frau' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Die Frau ist jung.', 'The woman is young.', 'Frau', 1 FROM w
UNION ALL SELECT w.id, 'Eine Frau wartet am Bahnhof.', 'A woman waits at the train station.', 'Frau', 2 FROM w
UNION ALL SELECT w.id, 'Die Frau ist meine Mutter.', 'The woman is my mother.', 'Frau', 3 FROM w;

-- Sentences for 'Tag'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Tag' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Heute ist ein schöner Tag.', 'Today is a beautiful day.', 'Tag', 1 FROM w
UNION ALL SELECT w.id, 'Der Tag hat 24 Stunden.', 'The day has 24 hours.', 'Tag', 2 FROM w
UNION ALL SELECT w.id, 'Wir treffen uns jeden Tag.', 'We meet every day.', 'Tag', 3 FROM w;

-- Sentences for 'kommen'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'kommen' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich komme aus Österreich.', 'I come from Austria.', 'komme', 1 FROM w
UNION ALL SELECT w.id, 'Du kommst morgen.', 'You come tomorrow.', 'kommst', 2 FROM w
UNION ALL SELECT w.id, 'Sie kommen am Freitag.', 'They come on Friday.', 'kommen', 3 FROM w;

-- Sentences for 'gehen'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'gehen' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich gehe nach Hause.', 'I go home.', 'gehe', 1 FROM w
UNION ALL SELECT w.id, 'Du gehst zur Arbeit.', 'You go to work.', 'gehst', 2 FROM w
UNION ALL SELECT w.id, 'Wir gehen spazieren.', 'We go for a walk.', 'gehen', 3 FROM w;

-- Sentences for 'machen'
WITH w AS (SELECT id FROM gwc_words WHERE word = 'machen' AND level = 'A1')
INSERT INTO gwc_word_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ich mache meine Hausaufgaben.', 'I do my homework.', 'mache', 1 FROM w
UNION ALL SELECT w.id, 'Du machst Musik.', 'You make music.', 'machst', 2 FROM w
UNION ALL SELECT w.id, 'Sie machen einen Plan.', 'They make a plan.', 'machen', 3 FROM w;
