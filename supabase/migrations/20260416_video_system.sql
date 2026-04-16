-- ─────────────────────────────────────────────────────────────────────────────
-- GWC Video System
--
-- Allows Caroline to link TikTok (and later YouTube) videos to the app.
-- Each video has a set of sentences that learners can add to their SRS queue.
-- Review mode for video sentences = flip cards (DE front / EN back).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. gwc_videos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gwc_videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      text NOT NULL DEFAULT 'tiktok' CHECK (platform IN ('tiktok', 'youtube')),
  video_id      text NOT NULL,              -- TikTok video ID or YouTube video ID
  video_url     text NOT NULL,              -- full original URL
  title         text NOT NULL,
  description   text,
  thumbnail_url text,
  level         text NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  is_draft      boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0, -- lower = shown first
  created_at    timestamptz DEFAULT now(),
  UNIQUE (platform, video_id)
);

-- ── 2. gwc_video_sentences ────────────────────────────────────────────────────
-- Sentences extracted/curated from a video.
-- Front = German sentence, Back = English translation (flip card style).
CREATE TABLE IF NOT EXISTS gwc_video_sentences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id     uuid NOT NULL REFERENCES gwc_videos(id) ON DELETE CASCADE,
  sentence_de  text NOT NULL,
  sentence_en  text NOT NULL,
  highlight_de text,   -- optional: the key word/phrase to highlight in the German sentence
  highlight_en text,   -- optional: the key word/phrase to highlight in the English sentence
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gwc_video_sentences_video_id
  ON gwc_video_sentences (video_id, sort_order);

-- ── 3. gwc_video_reviews ─────────────────────────────────────────────────────
-- SRS state: one row per user per sentence.
-- Uses the same Bunpro-style 12-step ladder as vocab/grammar.
CREATE TABLE IF NOT EXISTS gwc_video_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text NOT NULL,
  sentence_id     uuid NOT NULL REFERENCES gwc_video_sentences(id) ON DELETE CASCADE,
  -- SRS fields (same pattern as gwc_vocab_reviews)
  interval_days   integer NOT NULL DEFAULT 1,
  ease_factor     float   NOT NULL DEFAULT 2.5,
  repetitions     integer NOT NULL DEFAULT 0,   -- = SRS level (0–11)
  next_review_at  timestamptz NOT NULL DEFAULT now(),
  -- Stats
  correct_streak  integer NOT NULL DEFAULT 0,
  total_reviews   integer NOT NULL DEFAULT 0,
  correct_reviews integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (session_id, sentence_id)
);

CREATE INDEX IF NOT EXISTS gwc_video_reviews_due
  ON gwc_video_reviews (session_id, next_review_at);

-- ── 4. RLS Policies ──────────────────────────────────────────────────────────

ALTER TABLE gwc_videos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_video_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_video_reviews   ENABLE ROW LEVEL SECURITY;

-- Videos: anyone can read published videos; only authenticated (Caroline) can write
CREATE POLICY "gwc_videos_public_read"
  ON gwc_videos FOR SELECT USING (is_draft = false OR auth.role() = 'authenticated');

CREATE POLICY "gwc_videos_auth_write"
  ON gwc_videos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Video sentences: same as videos (inherit draft status from parent)
CREATE POLICY "gwc_video_sentences_public_read"
  ON gwc_video_sentences FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gwc_videos v
      WHERE v.id = gwc_video_sentences.video_id
        AND (v.is_draft = false OR auth.role() = 'authenticated')
    )
  );

CREATE POLICY "gwc_video_sentences_auth_write"
  ON gwc_video_sentences FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Video reviews: per-user isolation
CREATE POLICY "gwc_video_reviews_own"
  ON gwc_video_reviews FOR ALL TO authenticated
  USING     (session_id = auth.uid()::text)
  WITH CHECK (session_id = auth.uid()::text);
