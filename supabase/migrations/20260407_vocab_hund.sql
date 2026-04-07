-- ─────────────────────────────────────────────────────────────────────────────
-- Vocab entry: der Hund
-- 20 sentences: 5 × Nominativ (A1), 5 × Akkusativ (A1), 5 × Dativ (A2), 5 × Genitiv (B1)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

INSERT INTO gwc_vocab (
  id, slug, word, type, article, plural, level, frequency_rank,
  translation_en, explanation_en, usage_notes, fun_fact,
  synonyms, related_words,
  nom_sg, nom_pl, akk_sg, akk_pl, dat_sg, dat_pl, gen_sg, gen_pl,
  path_a1_vocabulary, path_caros_path
) VALUES (
  gen_random_uuid(),
  'hund',
  'Hund',
  'NOMEN',
  'der',
  'Hunde',
  'A1',
  450,
  'dog',
  '"Hund" is a masculine noun referring to a domestic dog. It is one of the most common pets in German-speaking countries and is used exactly like "dog" in English — in any context, formal or informal.',
  'Neutral — works in both formal and informal contexts. Affectionately you will often hear "Hundi". "Köter" is derogatory and should be avoided.',
  'Germany has one of the highest dog ownership rates in Europe. Dogs are allowed in many restaurants, shops, and even on public transport. And yes, the "Hundesteuer" (dog tax) is real — owners pay €50–150 per year per registered dog.',
  'Köter, Hundi, Tier, Haustier',
  'hündisch, der Welpe, die Hundeleine, der Hundeführer, das Hundefutter',
  'der Hund', 'die Hunde',
  'den Hund', 'die Hunde',
  'dem Hund', 'den Hunden',
  'des Hundes', 'der Hunde',
  1,    -- path_a1_vocabulary: position 1
  NULL  -- path_caros_path: not yet assigned
) ON CONFLICT (slug) DO NOTHING;

-- ─── Sentences ────────────────────────────────────────────────────────────────

DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM gwc_vocab WHERE slug = 'hund';

  -- ── Nominativ (A1) ────────────────────────────────────────────────────────
  INSERT INTO gwc_vocab_sentences (vocab_id, sentence_de, sentence_en, cloze_word, grammatical_case, min_level, sort_order) VALUES
    (v_id, 'Der Hund schläft auf dem Sofa.', 'The dog is sleeping on the sofa.', 'Der Hund', 'NOMINATIV', 'A1', 1),
    (v_id, 'Mein Hund heißt Max.', 'My dog''s name is Max.', 'Hund', 'NOMINATIV', 'A1', 2),
    (v_id, 'Der Hund ist sehr groß und schwarz.', 'The dog is very big and black.', 'Der Hund', 'NOMINATIV', 'A1', 3),
    (v_id, 'Ist das dein Hund?', 'Is that your dog?', 'Hund', 'NOMINATIV', 'A1', 4),
    (v_id, 'Der Hund bellt sehr laut.', 'The dog barks very loudly.', 'Der Hund', 'NOMINATIV', 'A1', 5),

  -- ── Akkusativ (A1) ────────────────────────────────────────────────────────
    (v_id, 'Ich habe einen Hund.', 'I have a dog.', 'einen Hund', 'AKKUSATIV', 'A1', 6),
    (v_id, 'Sie füttert den Hund jeden Abend.', 'She feeds the dog every evening.', 'den Hund', 'AKKUSATIV', 'A1', 7),
    (v_id, 'Wir haben keinen Hund.', 'We don''t have a dog.', 'keinen Hund', 'AKKUSATIV', 'A1', 8),
    (v_id, 'Er möchte einen Hund kaufen.', 'He wants to buy a dog.', 'einen Hund', 'AKKUSATIV', 'A1', 9),
    (v_id, 'Sie streichelt den Hund sanft.', 'She pets the dog gently.', 'den Hund', 'AKKUSATIV', 'A1', 10),

  -- ── Dativ (A2) ────────────────────────────────────────────────────────────
    (v_id, 'Ich gehe mit dem Hund spazieren.', 'I go for a walk with the dog.', 'dem Hund', 'DATIV', 'A2', 11),
    (v_id, 'Das Spielzeug gehört dem Hund.', 'The toy belongs to the dog.', 'dem Hund', 'DATIV', 'A2', 12),
    (v_id, 'Ich bringe dem Hund Wasser.', 'I bring the dog some water.', 'dem Hund', 'DATIV', 'A2', 13),
    (v_id, 'Sie spielt mit dem Hund im Garten.', 'She plays with the dog in the garden.', 'dem Hund', 'DATIV', 'A2', 14),
    (v_id, 'Er gibt dem Hund jeden Tag ein Leckerli.', 'He gives the dog a treat every day.', 'dem Hund', 'DATIV', 'A2', 15),

  -- ── Genitiv (B1) ─────────────────────────────────────────────────────────
    (v_id, 'Das Fell des Hundes ist sehr weich.', 'The dog''s fur is very soft.', 'des Hundes', 'GENITIV', 'B1', 16),
    (v_id, 'Der Name des Hundes steht auf dem Halsband.', 'The dog''s name is on the collar.', 'des Hundes', 'GENITIV', 'B1', 17),
    (v_id, 'Die Farbe des Hundes ist schwarz und weiß.', 'The colour of the dog is black and white.', 'des Hundes', 'GENITIV', 'B1', 18),
    (v_id, 'Das Bellen des Hundes ist sehr laut.', 'The barking of the dog is very loud.', 'des Hundes', 'GENITIV', 'B1', 19),
    (v_id, 'Der Besitzer des Hundes wohnt nebenan.', 'The owner of the dog lives next door.', 'des Hundes', 'GENITIV', 'B1', 20);

END $$;

COMMIT;
