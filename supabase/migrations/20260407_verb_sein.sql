-- ─────────────────────────────────────────────────────────────────────────────
-- Verb: sein (to be)
-- Level: A1 | Category: irregular | frequency_rank: 1
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_id uuid;
BEGIN

INSERT INTO gwc_verbs (
  slug, word, translation_en, level, frequency_rank, category,
  explanation_en, usage_notes, fun_fact, synonyms, related_words,
  auxiliary, partizip_ii,
  praes_ich, praes_du, praes_er, praes_wir, praes_ihr, praes_sie,
  praet_ich, praet_du, praet_er, praet_wir, praet_ihr, praet_sie,
  konj2_ich, konj2_du, konj2_er, konj2_wir, konj2_ihr, konj2_sie,
  path_a1_verbs, path_caros_path
)
VALUES (
  'sein',
  'sein',
  'to be',
  'A1',
  1,
  'irregular',
  'Sein is the most fundamental verb in German — it means "to be" and links a subject to a description, identity, or state. It is also the auxiliary verb used to form the Perfekt of many motion and change-of-state verbs.',
  'Sein is used as an auxiliary for verbs of motion and change of state (fahren, gehen, kommen, werden, etc.). As a linking verb it connects a subject to an adjective or noun. Do not confuse with "sein" (his/its) as a possessive pronoun.',
  'Sein is so irregular that its Präsens forms (bin, bist, ist, sind, seid, sind) and Präteritum forms (war, warst, war, waren, wart, waren) look almost nothing like the infinitive "sein" — they come from three entirely different ancient Proto-Germanic roots.',
  NULL,
  'werden, existieren, bleiben',
  'sein',    -- auxiliary for Perfekt: ich bin gewesen
  'gewesen',
  -- Präsens
  'bin', 'bist', 'ist', 'sind', 'seid', 'sind',
  -- Präteritum
  'war', 'warst', 'war', 'waren', 'wart', 'waren',
  -- Konjunktiv II (highly irregular — not "würde + sein")
  'wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären',
  1,   -- path_a1_verbs position 1
  1    -- path_caros_path position 1
)
RETURNING id INTO v_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRÄSENS — min_level A1
-- cloze: conjugated form of sein
-- audio: sein_praes_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Ich bin müde.',                    'I am tired.',                'bin',  'PRÄSENS', 'ich',      'A1', 1, 'sein_praes_ich.mp3'),
  (v_id, 'Du bist mein Freund.',             'You are my friend.',         'bist', 'PRÄSENS', 'du',       'A1', 2, 'sein_praes_du.mp3'),
  (v_id, 'Das Wetter ist schön heute.',      'The weather is nice today.', 'ist',  'PRÄSENS', 'er/sie/es','A1', 3, 'sein_praes_er.mp3'),
  (v_id, 'Wir sind in der Schule.',          'We are at school.',          'sind', 'PRÄSENS', 'wir',      'A1', 4, 'sein_praes_wir.mp3'),
  (v_id, 'Ihr seid zu spät!',               'You (all) are too late!',    'seid', 'PRÄSENS', 'ihr',      'A1', 5, 'sein_praes_ihr.mp3'),
  (v_id, 'Sie sind sehr nett.',              'They are very kind.',        'sind', 'PRÄSENS', 'sie/Sie',  'A1', 6, 'sein_praes_sie.mp3');

-- ─────────────────────────────────────────────────────────────────────────────
-- PERFEKT — min_level A2
-- Formation: sein (conjugated) + gewesen
-- cloze: conjugated "bin/bist/ist/sind/seid/sind"
-- audio: sein_perf_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Ich bin den ganzen Tag zu Hause gewesen.',    'I have been at home all day.',        'bin',  'PERFEKT', 'ich',      'A2', 1, 'sein_perf_ich.mp3'),
  (v_id, 'Bist du schon in Berlin gewesen?',            'Have you ever been to Berlin?',       'Bist', 'PERFEKT', 'du',       'A2', 2, 'sein_perf_du.mp3'),
  (v_id, 'Sie ist sehr krank gewesen.',                 'She has been very ill.',              'ist',  'PERFEKT', 'er/sie/es','A2', 3, 'sein_perf_er.mp3'),
  (v_id, 'Wir sind schon lange Freunde gewesen.',       'We have been friends for a long time.','sind','PERFEKT', 'wir',      'A2', 4, 'sein_perf_wir.mp3'),
  (v_id, 'Ihr seid sehr ruhig gewesen.',                'You (all) have been very quiet.',     'seid', 'PERFEKT', 'ihr',      'A2', 5, 'sein_perf_ihr.mp3'),
  (v_id, 'Sie sind gestern im Kino gewesen.',           'They were at the cinema yesterday.',  'sind', 'PERFEKT', 'sie/Sie',  'A2', 6, 'sein_perf_sie.mp3');

-- ─────────────────────────────────────────────────────────────────────────────
-- PRÄTERITUM — min_level B1
-- sein is one of the few verbs where Präteritum is used even in spoken German
-- cloze: conjugated Präteritum form
-- audio: sein_praet_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Ich war gestern sehr glücklich.',   'I was very happy yesterday.',       'war',   'PRÄTERITUM', 'ich',      'B1', 1, 'sein_praet_ich.mp3'),
  (v_id, 'Warst du schon mal in Wien?',       'Have you ever been to Vienna?',     'Warst', 'PRÄTERITUM', 'du',       'B1', 2, 'sein_praet_du.mp3'),
  (v_id, 'Es war ein langer Tag.',            'It was a long day.',                'war',   'PRÄTERITUM', 'er/sie/es','B1', 3, 'sein_praet_er.mp3'),
  (v_id, 'Wir waren früher Nachbarn.',        'We were neighbours before.',        'waren', 'PRÄTERITUM', 'wir',      'B1', 4, 'sein_praet_wir.mp3'),
  (v_id, 'Ihr wart alle so laut!',            'You (all) were so loud!',           'wart',  'PRÄTERITUM', 'ihr',      'B1', 5, 'sein_praet_ihr.mp3'),
  (v_id, 'Sie waren nicht zu Hause.',         'They were not at home.',            'waren', 'PRÄTERITUM', 'sie/Sie',  'B1', 6, 'sein_praet_sie.mp3');

-- ─────────────────────────────────────────────────────────────────────────────
-- FUTUR I — min_level B1
-- Formation: werden (conjugated) + sein (Infinitiv)
-- cloze: conjugated form of "werden"
-- audio: sein_fut1_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Ich werde morgen sehr müde sein.',         'I will be very tired tomorrow.',         'werde',  'FUTUR I', 'ich',      'B1', 1, 'sein_fut1_ich.mp3'),
  (v_id, 'Du wirst sicher pünktlich sein.',          'You will surely be on time.',            'wirst',  'FUTUR I', 'du',       'B1', 2, 'sein_fut1_du.mp3'),
  (v_id, 'Das wird nicht einfach sein.',             'That will not be easy.',                 'wird',   'FUTUR I', 'er/sie/es','B1', 3, 'sein_fut1_er.mp3'),
  (v_id, 'Wir werden bald fertig sein.',             'We will be done soon.',                  'werden', 'FUTUR I', 'wir',      'B1', 4, 'sein_fut1_wir.mp3'),
  (v_id, 'Ihr werdet die Besten sein!',              'You (all) will be the best!',            'werdet', 'FUTUR I', 'ihr',      'B1', 5, 'sein_fut1_ihr.mp3'),
  (v_id, 'Sie werden sehr glücklich sein.',          'They will be very happy.',               'werden', 'FUTUR I', 'sie/Sie',  'B1', 6, 'sein_fut1_sie.mp3');

-- ─────────────────────────────────────────────────────────────────────────────
-- KONJUNKTIV II — min_level B2
-- Forms: wäre, wärst, wäre, wären, wärt, wären (highly irregular)
-- cloze: conjugated Konjunktiv II form
-- audio: sein_konj2_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Ich wäre gern Ärztin.',                   'I would like to be a doctor.',           'wäre',  'KONJUNKTIV II', 'ich',      'B2', 1, 'sein_konj2_ich.mp3'),
  (v_id, 'Wärst du gern in Paris?',                 'Would you like to be in Paris?',         'Wärst', 'KONJUNKTIV II', 'du',       'B2', 2, 'sein_konj2_du.mp3'),
  (v_id, 'Das wäre wirklich toll!',                 'That would really be great!',            'wäre',  'KONJUNKTIV II', 'er/sie/es','B2', 3, 'sein_konj2_er.mp3'),
  (v_id, 'Wir wären froh darüber.',                 'We would be glad about it.',             'wären', 'KONJUNKTIV II', 'wir',      'B2', 4, 'sein_konj2_wir.mp3'),
  (v_id, 'Ihr wärt dann viel ruhiger.',             'You (all) would then be much calmer.',   'wärt',  'KONJUNKTIV II', 'ihr',      'B2', 5, 'sein_konj2_ihr.mp3'),
  (v_id, 'Sie wären sehr dankbar.',                 'They would be very grateful.',           'wären', 'KONJUNKTIV II', 'sie/Sie',  'B2', 6, 'sein_konj2_sie.mp3');

-- ─────────────────────────────────────────────────────────────────────────────
-- PLUSQUAMPERFEKT — min_level B2
-- Formation: war/warst/... (Präteritum of sein) + gewesen
-- cloze: conjugated Präteritum form of auxiliary "sein" (war/warst/...)
-- audio: sein_plusq_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Ich war schon sehr müde gewesen, als sie ankamen.',  'I had already been very tired when they arrived.',    'war',   'PLUSQUAMPERFEKT', 'ich',      'B2', 1, 'sein_plusq_ich.mp3'),
  (v_id, 'Warst du schon mal dort gewesen?',                   'Had you ever been there before?',                     'Warst', 'PLUSQUAMPERFEKT', 'du',       'B2', 2, 'sein_plusq_du.mp3'),
  (v_id, 'Er war nie in diesem Land gewesen.',                 'He had never been in that country.',                  'war',   'PLUSQUAMPERFEKT', 'er/sie/es','B2', 3, 'sein_plusq_er.mp3'),
  (v_id, 'Wir waren schon jahrelang Freunde gewesen.',         'We had been friends for years already.',              'waren', 'PLUSQUAMPERFEKT', 'wir',      'B2', 4, 'sein_plusq_wir.mp3'),
  (v_id, 'Ihr wart damals noch jung gewesen.',                 'You (all) had still been young back then.',           'wart',  'PLUSQUAMPERFEKT', 'ihr',      'B2', 5, 'sein_plusq_ihr.mp3'),
  (v_id, 'Sie waren nie wirklich glücklich gewesen.',          'They had never really been happy.',                   'waren', 'PLUSQUAMPERFEKT', 'sie/Sie',  'B2', 6, 'sein_plusq_sie.mp3');

-- ─────────────────────────────────────────────────────────────────────────────
-- FUTUR II — min_level C1
-- Formation: werden (conjugated) + gewesen + sein
-- cloze: conjugated form of "werden"
-- audio: sein_fut2_{person}.mp3

INSERT INTO gwc_verb_sentences
  (verb_id, sentence_de, sentence_en, cloze_word, tense, person, min_level, sort_order, audio_file)
VALUES
  (v_id, 'Bis dann werde ich ausgeruht gewesen sein.',          'By then, I will have been well-rested.',             'werde',  'FUTUR II', 'ich',      'C1', 1, 'sein_fut2_ich.mp3'),
  (v_id, 'Du wirst dann erfahrener gewesen sein.',              'You will have been more experienced by then.',       'wirst',  'FUTUR II', 'du',       'C1', 2, 'sein_fut2_du.mp3'),
  (v_id, 'Es wird ein Fehler gewesen sein.',                    'It will have been a mistake.',                       'wird',   'FUTUR II', 'er/sie/es','C1', 3, 'sein_fut2_er.mp3'),
  (v_id, 'Wir werden lange genug dort gewesen sein.',           'We will have been there long enough.',               'werden', 'FUTUR II', 'wir',      'C1', 4, 'sein_fut2_wir.mp3'),
  (v_id, 'Ihr werdet zu der Zeit fertig gewesen sein.',         'You (all) will have been done by that time.',        'werdet', 'FUTUR II', 'ihr',      'C1', 5, 'sein_fut2_ihr.mp3'),
  (v_id, 'Sie werden nie wirklich zufrieden gewesen sein.',     'They will never have really been satisfied.',        'werden', 'FUTUR II', 'sie/Sie',  'C1', 6, 'sein_fut2_sie.mp3');

END $$;
