-- ─────────────────────────────────────────────────────────────────────────────
-- Verb conjugation system
-- SRS card unit = (verb × tense)
-- Each tense has 6 sentences (one per pronoun), rotating via last_sentence_idx
-- Tense level gating:
--   PRÄSENS → A1 | PERFEKT → A2
--   PRÄTERITUM → B1 | FUTUR I → B1
--   KONJUNKTIV II → B2 | PLUSQUAMPERFEKT → B2
--   FUTUR II → C1
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gwc_verbs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,        -- e.g. "machen"
  word            text NOT NULL,               -- infinitive: "machen"
  translation_en  text NOT NULL,               -- "to make / to do"
  level           text NOT NULL DEFAULT 'A1',  -- A1 | A2 | B1 | B2 | C1 | C2
  frequency_rank  integer,                     -- lower = more common
  category        text NOT NULL DEFAULT 'regular',
    -- regular | irregular | modal | separable | reflexive

  explanation_en  text NOT NULL,
  usage_notes     text,
  fun_fact        text,
  synonyms        text,
  related_words   text,

  -- Perfekt
  auxiliary       text,          -- "haben" | "sein"
  partizip_ii     text,          -- "gemacht"

  -- Präsens conjugation (all 6 forms)
  praes_ich       text,   -- "mache"
  praes_du        text,   -- "machst"
  praes_er        text,   -- "macht"       (er/sie/es)
  praes_wir       text,   -- "machen"
  praes_ihr       text,   -- "macht"
  praes_sie       text,   -- "machen"      (sie/Sie)

  -- Präteritum (B1+, irregular/modal verbs)
  praet_ich       text,
  praet_du        text,
  praet_er        text,
  praet_wir       text,
  praet_ihr       text,
  praet_sie       text,

  -- Konjunktiv II (B2) — irregular forms stored; regular = "würde + Infinitiv"
  konj2_ich       text,   -- "wäre" / "würde machen"
  konj2_du        text,
  konj2_er        text,
  konj2_wir       text,
  konj2_ihr       text,
  konj2_sie       text,
  -- Note: FUTUR I, PLUSQUAMPERFEKT, FUTUR II are derived from existing fields
  --   FUTUR I:          werden (conjugated) + Infinitiv
  --   PLUSQUAMPERFEKT:  Präteritum(auxiliary) + Partizip II
  --   FUTUR II:         werden (conjugated) + Partizip II + auxiliary Infinitiv

  -- Path membership (NULL = not in path, number = position)
  path_a1_verbs   integer,
  path_caros_path integer,

  audio_file      text,
  created_at      timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 sentences per (verb, tense) — one per pronoun, ordered by sort_order
-- sort_order convention: 1=ich 2=du 3=er/sie/es 4=wir 5=ihr 6=sie/Sie

CREATE TABLE IF NOT EXISTS gwc_verb_sentences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verb_id     uuid NOT NULL REFERENCES gwc_verbs(id) ON DELETE CASCADE,
  sentence_de text NOT NULL,
  sentence_en text NOT NULL,
  cloze_word  text NOT NULL,    -- the exact conjugated form in the sentence
  tense       text NOT NULL     CHECK (tense IN (
                                  'PRÄSENS',
                                  'PERFEKT',
                                  'PRÄTERITUM',
                                  'FUTUR I',
                                  'KONJUNKTIV II',
                                  'PLUSQUAMPERFEKT',
                                  'FUTUR II'
                                )),
  person      text NOT NULL     CHECK (person IN ('ich','du','er/sie/es','wir','ihr','sie/Sie')),
  min_level   text NOT NULL DEFAULT 'A1',
    -- PRÄSENS→A1, PERFEKT→A2, PRÄTERITUM/FUTUR I→B1, KONJUNKTIV II/PLUSQUAMPERFEKT→B2, FUTUR II→C1
  sort_order  integer NOT NULL DEFAULT 0,
    -- within a tense: 1=ich 2=du 3=er/sie/es 4=wir 5=ihr 6=sie/Sie
  audio_file  text,
  created_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SRS: one card per (session_id × verb_id × tense)
-- last_sentence_idx rotates through the 6 pronoun sentences

CREATE TABLE IF NOT EXISTS gwc_verb_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        text NOT NULL,
  verb_id           uuid NOT NULL REFERENCES gwc_verbs(id) ON DELETE CASCADE,
  tense             text NOT NULL,
  -- SM-2 fields
  interval_days     integer NOT NULL DEFAULT 1,
  ease_factor       numeric NOT NULL DEFAULT 2.5,
  repetitions       integer NOT NULL DEFAULT 0,
  next_review_at    timestamptz NOT NULL DEFAULT now(),
  last_sentence_idx integer NOT NULL DEFAULT -1,  -- cycles 0–5 (6 pronouns)
  -- Stats
  total_reviews     integer NOT NULL DEFAULT 0,
  correct_reviews   integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(session_id, verb_id, tense)
);
