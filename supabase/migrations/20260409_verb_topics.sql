-- ─────────────────────────────────────────────────────────────────────────────
-- gwc_verb_topics: one row per verb×tense, auto-created via trigger
-- level = max(verb.level, TENSE_MIN_LEVEL[tense])
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gwc_verb_topics (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  verb_id     uuid        NOT NULL REFERENCES gwc_verbs(id) ON DELETE CASCADE,
  tense       varchar     NOT NULL,
  slug        varchar     NOT NULL,   -- e.g. "sein-prasens"
  level       varchar     NOT NULL,   -- effective level (A1–C2)
  title       varchar     NOT NULL,   -- e.g. "sein – Präsens"
  created_at  timestamptz DEFAULT now(),
  UNIQUE(verb_id, tense),
  UNIQUE(slug)
);

-- ─── Trigger function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION gwc_create_verb_topics()
RETURNS TRIGGER AS $$
DECLARE
  tenses    text[] := ARRAY['PRÄSENS','PERFEKT','PRÄTERITUM','FUTUR I','KONJUNKTIV II','PLUSQUAMPERFEKT','FUTUR II'];
  min_lvls  text[] := ARRAY['A1','A2','B1','B1','B2','C1','C2'];
  url_slugs text[] := ARRAY['prasens','perfekt','prateritum','futur-i','konjunktiv-ii','plusquamperfekt','futur-ii'];
  labels    text[] := ARRAY['Präsens','Perfekt','Präteritum','Futur I','Konjunktiv II','Plusquamperfekt','Futur II'];
  lv        text[] := ARRAY['A1','A2','B1','B2','C1','C2'];
  i         int;
  v_idx     int;
  t_idx     int;
  eff_level text;
BEGIN
  v_idx := array_position(lv, NEW.level);

  FOR i IN 1..7 LOOP
    t_idx     := array_position(lv, min_lvls[i]);
    eff_level := lv[GREATEST(v_idx, t_idx)];

    INSERT INTO gwc_verb_topics (verb_id, tense, slug, level, title)
    VALUES (
      NEW.id,
      tenses[i],
      NEW.slug || '-' || url_slugs[i],
      eff_level,
      NEW.word || ' – ' || labels[i]
    )
    ON CONFLICT (verb_id, tense) DO UPDATE
      SET slug  = EXCLUDED.slug,
          level = EXCLUDED.level,
          title = EXCLUDED.title;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Attach trigger ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS gwc_verb_topics_trigger ON gwc_verbs;

CREATE TRIGGER gwc_verb_topics_trigger
AFTER INSERT OR UPDATE OF level, word, slug ON gwc_verbs
FOR EACH ROW EXECUTE FUNCTION gwc_create_verb_topics();

-- ─── Backfill existing verbs ───────────────────────────────────────────────────
-- touching `level` fires the trigger for every existing row

UPDATE gwc_verbs SET level = level;
