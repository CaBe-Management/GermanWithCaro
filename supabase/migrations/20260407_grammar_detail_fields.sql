-- ============================================================
-- Migration: Grammar detail page fields
-- Adds new columns to gwc_grammar_topics to support the
-- Bunpro-style grammar detail page (structure, register, etc.)
-- ============================================================

-- English translation of the topic title (shown under the heading)
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS translation_en TEXT;

-- Grammar formula / pattern string, e.g. "[Verb] + wie + [Noun]?"
-- [placeholders] are highlighted in purple in the UI
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS structure TEXT;

-- Register levels 0–3 (0 = not used, 3 = very common in that register)
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS register_formal   SMALLINT DEFAULT 0 CHECK (register_formal   BETWEEN 0 AND 3);

ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS register_standard SMALLINT DEFAULT 0 CHECK (register_standard BETWEEN 0 AND 3);

ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS register_casual   SMALLINT DEFAULT 0 CHECK (register_casual   BETWEEN 0 AND 3);

-- Fun fact shown in the purple info box on the details tab
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS fun_fact TEXT;

-- JSON array of resource links:
-- [{"type":"youtube"|"tiktok"|"website", "url":"...", "title":"...", "description":"..."}]
ALTER TABLE gwc_grammar_topics
  ADD COLUMN IF NOT EXISTS resources JSONB;

-- ── Example data: W-Frage: wie? ──────────────────────────────────────────────
-- (Update the slug to match whichever row you have)

UPDATE gwc_grammar_topics SET
  translation_en   = 'W-Question: how?',
  structure        = '[Verb] + wie + [Noun/Adjective]?' || E'\n' ||
                     'Wie + [Verb] + [Subject]?' || E'\n' ||
                     'Wie + [Verb] + [Subject] + [Object]?',
  register_formal  = 3,
  register_standard = 3,
  register_casual  = 2,
  fun_fact         = '„Wie" can also function as a conjunction for comparisons: „so groß wie ich" (as tall as me). It is one of the rare W-words that works both as a question starter and as a linking word.',
  resources        = '[
    {"type":"youtube","url":"https://www.youtube.com/watch?v=example1","title":"German W-Questions Explained – Easy German","description":"Beginner-friendly explainer with real street interviews."},
    {"type":"tiktok","url":"https://www.tiktok.com/@german.with.caro","title":"@german.with.caro – Wie-Fragen im Alltag","description":"Everyday examples with subtitles."}
  ]'::jsonb
WHERE slug = 'w-frage-wie';
