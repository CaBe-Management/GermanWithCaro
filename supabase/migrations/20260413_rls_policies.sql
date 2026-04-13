-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security — German With Caro
--
-- Architecture:
--   - Regular users sign in with email/password via Supabase Auth.
--   - session_id is always set to auth.uid()::text (done by AuthGuard.tsx).
--   - Anon key is used in the browser, but with a JWT after sign-in, the role
--     becomes 'authenticated', so auth.uid() is always available.
--   - Content tables are public-read; user data tables are isolated per user.
--
-- IMPORTANT: Run this after running all other migrations.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — CONTENT TABLES (public read, no client writes)
-- Anyone — logged in or not — can browse vocab/grammar content.
-- Only the service role (server-side migrations, admin scripts) can write.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE gwc_vocab             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_vocab_sentences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_grammar_topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_grammar_sentences ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for everyone (anon + authenticated)
CREATE POLICY "gwc_vocab_public_read"
  ON gwc_vocab FOR SELECT USING (true);

CREATE POLICY "gwc_vocab_sentences_public_read"
  ON gwc_vocab_sentences FOR SELECT USING (true);

CREATE POLICY "gwc_grammar_topics_public_read"
  ON gwc_grammar_topics FOR SELECT USING (true);

CREATE POLICY "gwc_grammar_sentences_public_read"
  ON gwc_grammar_sentences FOR SELECT USING (true);

-- Allow full write access for authenticated users (admin)
CREATE POLICY "gwc_vocab_auth_write"
  ON gwc_vocab FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "gwc_vocab_sentences_auth_write"
  ON gwc_vocab_sentences FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "gwc_grammar_topics_auth_write"
  ON gwc_grammar_topics FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "gwc_grammar_sentences_auth_write"
  ON gwc_grammar_sentences FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- gwc_verbs / gwc_verb_sentences / gwc_stories: apply RLS only if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gwc_verbs') THEN
    EXECUTE 'ALTER TABLE gwc_verbs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY gwc_verbs_public_read ON gwc_verbs FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY gwc_verbs_auth_write ON gwc_verbs FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gwc_verb_sentences') THEN
    EXECUTE 'ALTER TABLE gwc_verb_sentences ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY gwc_verb_sentences_public_read ON gwc_verb_sentences FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY gwc_verb_sentences_auth_write ON gwc_verb_sentences FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gwc_stories') THEN
    EXECUTE 'ALTER TABLE gwc_stories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY gwc_stories_public_read ON gwc_stories FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY gwc_stories_auth_write ON gwc_stories FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — USER DATA TABLES (per-user isolation via auth.uid())
-- Login is required to use these features, so auth.uid() is always set.
-- Each user can only see and modify their own rows.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE gwc_vocab_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_grammar_reviews ENABLE ROW LEVEL SECURITY;

-- gwc_vocab_reviews: users only see their own review rows
CREATE POLICY "gwc_vocab_reviews_own"
  ON gwc_vocab_reviews FOR ALL TO authenticated
  USING     (session_id = auth.uid()::text)
  WITH CHECK (session_id = auth.uid()::text);

-- gwc_grammar_reviews: same
CREATE POLICY "gwc_grammar_reviews_own"
  ON gwc_grammar_reviews FOR ALL TO authenticated
  USING     (session_id = auth.uid()::text)
  WITH CHECK (session_id = auth.uid()::text);

-- gwc_verb_reviews: only if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gwc_verb_reviews') THEN
    EXECUTE 'ALTER TABLE gwc_verb_reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY gwc_verb_reviews_own ON gwc_verb_reviews FOR ALL TO authenticated USING (session_id = auth.uid()::text) WITH CHECK (session_id = auth.uid()::text)';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3 — FIX GAMIFICATION TABLES
-- add_gamification.sql already enabled RLS on gwc_user_progress and
-- gwc_user_badges with auth.uid() policies — but those are correct now
-- (since we require login). We just need to make sure the policy names match
-- and that we don't duplicate them.
-- ═══════════════════════════════════════════════════════════════════════════

-- gwc_user_progress: RLS already enabled; existing policy "users_own_progress"
-- uses auth.uid()::text which is correct. Nothing to change.

-- gwc_user_badges: RLS already enabled; existing policy "users_own_badges"
-- uses auth.uid()::text which is correct. Nothing to change.


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4 — gwc_user_paths
-- Used by the navbar to load active learning paths per user.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE gwc_user_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gwc_user_paths_own"
  ON gwc_user_paths FOR ALL TO authenticated
  USING     (session_id = auth.uid()::text)
  WITH CHECK (session_id = auth.uid()::text);
