-- ─────────────────────────────────────────────────────────────────────────────
-- Vocab entry: helfen (VERB, A1)
-- 6 sentences: Präsens, one per pronoun (ich/du/er/wir/ihr/sie)
-- is_draft = true → visible to admin only until confirmed live
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

INSERT INTO gwc_vocab (
  slug, word, type, article, plural, level, frequency_rank,
  translation_en, explanation_en, usage_notes, fun_fact,
  synonyms, related_words,
  resources,
  is_draft
) VALUES (
  'helfen',
  'helfen',
  'VERB',
  NULL,
  NULL,
  'A1',
  70,
  'to help',
  '"helfen" means to help or assist. It is an irregular verb — the vowel changes to i in the 2nd and 3rd person singular: du hilfst, er hilft. Crucially, it takes a dative object: the person you help gets dative, not accusative. This makes it one of the first verbs where students encounter the dative case naturally.',
  'Always pair with a dative object: "Ich helfe dir" (not "dich"), "Kannst du mir helfen?", "Er hilft dem Mann." A key verb to practise alongside dative pronouns (mir, dir, ihm, ihr, uns, euch, ihnen).',
  '"helfen" and English "help" share the same Proto-Germanic root *helpan. A great phrase to know: "Das hilft mir nichts" (That doesn''t help me at all) — shows how naturally dative works with this verb.',
  'unterstützen, beistehen, assistieren',
  'die Hilfe, der Helfer, die Helferin, hilfreich, hilflos, behilflich sein',
  '[{"type":"youtube","url":"https://youtube.com/shorts/jszKyV66RrU?feature=share","title":"helfen — German With Caro","description":"How to use helfen correctly with the dative case"}]'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;

-- ── Sentences ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  vid uuid;
BEGIN
  SELECT id INTO vid FROM gwc_vocab WHERE slug = 'helfen';

  INSERT INTO gwc_vocab_sentences
    (vocab_id, sentence_de, sentence_en, cloze_word, grammatical_case, min_level, sort_order, audio_file)
  VALUES
    (vid, 'Ich helfe meiner Mutter.',        'I help my mother.',               'helfe',  NULL, 'A1', 1, 'helfen_praes_ich.mp3'),
    (vid, 'Du hilfst mir sehr.',             'You help me a lot.',              'hilfst', NULL, 'A1', 2, 'helfen_praes_du.mp3'),
    (vid, 'Sie hilft dem kleinen Kind.',     'She helps the small child.',      'hilft',  NULL, 'A1', 3, 'helfen_praes_er.mp3'),
    (vid, 'Wir helfen zusammen.',            'We help together.',               'helfen', NULL, 'A1', 4, 'helfen_praes_wir.mp3'),
    (vid, 'Ihr helft uns immer.',            'You always help us.',             'helft',  NULL, 'A1', 5, 'helfen_praes_ihr.mp3'),
    (vid, 'Sie helfen einander gern.',       'They like to help each other.',   'helfen', NULL, 'A1', 6, 'helfen_praes_sie.mp3');
END $$;

COMMIT;
