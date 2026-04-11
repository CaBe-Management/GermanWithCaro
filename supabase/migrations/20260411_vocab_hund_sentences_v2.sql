-- ─────────────────────────────────────────────────────────────────────────────
-- Hund sentences v2 — new schema
-- A1 noun: 5 NOM-SG + 5 NOM-PL + 5 AKK-SG + 5 AKK-PL = 20 sentences
-- Sort order alternates SG/PL within each case block:
--   NOM: sg_1(1), pl_1(2), sg_2(3), pl_2(4), ... sg_5(9), pl_5(10)
--   AKK: sg_1(11), pl_1(12), sg_2(13), pl_2(14), ... sg_5(19), pl_5(20)
-- Audio naming: {slug}_{case}_{sg|pl}_{n}.mp3
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM gwc_vocab WHERE slug = 'hund';

  -- Remove old sentences
  DELETE FROM gwc_vocab_sentences WHERE vocab_id = v_id;

  -- ── NOMINATIV — alternating SG / PL (sort 1–10) ──────────────────────────

  INSERT INTO gwc_vocab_sentences
    (vocab_id, sentence_de, sentence_en, cloze_word, grammatical_case, min_level, sort_order, audio_file)
  VALUES
    -- NOM-SG 1
    (v_id, 'Der Hund schläft auf dem Sofa.',  'The dog is sleeping on the sofa.',  'Der Hund',  'NOMINATIV', 'A1',  1, 'hund_nom_sg_1.mp3'),
    -- NOM-PL 1
    (v_id, 'Die Hunde schlafen.',              'The dogs are sleeping.',             'Die Hunde', 'NOMINATIV', 'A1',  2, 'hund_nom_pl_1.mp3'),
    -- NOM-SG 2
    (v_id, 'Mein Hund heißt Max.',             'My dog''s name is Max.',             'Hund',      'NOMINATIV', 'A1',  3, 'hund_nom_sg_2.mp3'),
    -- NOM-PL 2
    (v_id, 'Die Hunde bellen.',                'The dogs are barking.',              'Die Hunde', 'NOMINATIV', 'A1',  4, 'hund_nom_pl_2.mp3'),
    -- NOM-SG 3
    (v_id, 'Der Hund ist sehr groß.',          'The dog is very big.',               'Der Hund',  'NOMINATIV', 'A1',  5, 'hund_nom_sg_3.mp3'),
    -- NOM-PL 3
    (v_id, 'Meine Hunde sind klein.',          'My dogs are small.',                 'Hunde',     'NOMINATIV', 'A1',  6, 'hund_nom_pl_3.mp3'),
    -- NOM-SG 4
    (v_id, 'Ist das dein Hund?',               'Is that your dog?',                  'Hund',      'NOMINATIV', 'A1',  7, 'hund_nom_sg_4.mp3'),
    -- NOM-PL 4
    (v_id, 'Die Hunde spielen im Park.',       'The dogs are playing in the park.',  'Die Hunde', 'NOMINATIV', 'A1',  8, 'hund_nom_pl_4.mp3'),
    -- NOM-SG 5
    (v_id, 'Ein Hund bellt laut.',             'A dog is barking loudly.',           'Hund',      'NOMINATIV', 'A1',  9, 'hund_nom_sg_5.mp3'),
    -- NOM-PL 5
    (v_id, 'Hier sind zwei Hunde.',            'There are two dogs here.',           'Hunde',     'NOMINATIV', 'A1', 10, 'hund_nom_pl_5.mp3'),

  -- ── AKKUSATIV — alternating SG / PL (sort 11–20) ─────────────────────────

    -- AKK-SG 1
    (v_id, 'Ich habe einen Hund.',             'I have a dog.',                      'einen Hund',  'AKKUSATIV', 'A1', 11, 'hund_akk_sg_1.mp3'),
    -- AKK-PL 1
    (v_id, 'Ich liebe Hunde.',                 'I love dogs.',                       'Hunde',       'AKKUSATIV', 'A1', 12, 'hund_akk_pl_1.mp3'),
    -- AKK-SG 2
    (v_id, 'Sie füttert den Hund.',            'She feeds the dog.',                 'den Hund',    'AKKUSATIV', 'A1', 13, 'hund_akk_sg_2.mp3'),
    -- AKK-PL 2
    (v_id, 'Sie füttert die Hunde.',           'She feeds the dogs.',                'die Hunde',   'AKKUSATIV', 'A1', 14, 'hund_akk_pl_2.mp3'),
    -- AKK-SG 3
    (v_id, 'Wir haben keinen Hund.',           'We don''t have a dog.',              'keinen Hund', 'AKKUSATIV', 'A1', 15, 'hund_akk_sg_3.mp3'),
    -- AKK-PL 3
    (v_id, 'Wir haben drei Hunde.',            'We have three dogs.',                'Hunde',       'AKKUSATIV', 'A1', 16, 'hund_akk_pl_3.mp3'),
    -- AKK-SG 4
    (v_id, 'Er streichelt den Hund.',          'He pets the dog.',                   'den Hund',    'AKKUSATIV', 'A1', 17, 'hund_akk_sg_4.mp3'),
    -- AKK-PL 4
    (v_id, 'Er sieht die Hunde.',              'He sees the dogs.',                  'die Hunde',   'AKKUSATIV', 'A1', 18, 'hund_akk_pl_4.mp3'),
    -- AKK-SG 5
    (v_id, 'Ich sehe den Hund.',               'I see the dog.',                     'den Hund',    'AKKUSATIV', 'A1', 19, 'hund_akk_sg_5.mp3'),
    -- AKK-PL 5
    (v_id, 'Magst du Hunde?',                  'Do you like dogs?',                  'Hunde',       'AKKUSATIV', 'A1', 20, 'hund_akk_pl_5.mp3');

END $$;

COMMIT;
