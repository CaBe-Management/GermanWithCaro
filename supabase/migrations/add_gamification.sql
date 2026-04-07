-- ─── Gamification Migration ───────────────────────────────────────────────────
-- Adds XP, levels, streaks, badges, and improved daily goal tracking.
-- Run this in your Supabase SQL editor.

-- ─── User Progress Table ──────────────────────────────────────────────────────
-- One row per user (keyed by session_id).
-- Stores XP total, current streak, daily goal, and daily card count.

CREATE TABLE IF NOT EXISTS gwc_user_progress (
  session_id        TEXT        PRIMARY KEY,
  xp_total          INTEGER     NOT NULL DEFAULT 0,
  streak_current    INTEGER     NOT NULL DEFAULT 0,
  streak_last_date  DATE,                              -- last date a session was completed
  daily_goal        INTEGER     NOT NULL DEFAULT 10,   -- user's target new cards per day
  daily_cards_today INTEGER     NOT NULL DEFAULT 0,    -- new cards learned today
  daily_cards_date  DATE,                              -- which day daily_cards_today belongs to
  days_studied      INTEGER     NOT NULL DEFAULT 0,    -- total unique days with activity
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Badges Table ────────────────────────────────────────────────────────
-- Records which achievement badges a user has unlocked and when.

CREATE TABLE IF NOT EXISTS gwc_user_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT        NOT NULL,
  badge_id    TEXT        NOT NULL,   -- e.g. 'streak_7', 'words_100'
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, badge_id)       -- can't unlock the same badge twice
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- The app stores session_id = auth.uid() for every logged-in user
-- (see AuthGuard.tsx: localStorage.setItem('gwc_session_id', session.user.id)).
-- Policies therefore restrict each user to only their own rows.

ALTER TABLE gwc_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_user_badges   ENABLE ROW LEVEL SECURITY;

-- Users can only read/write rows where session_id matches their own auth UID.
CREATE POLICY "users_own_progress"
  ON gwc_user_progress FOR ALL
  USING     (session_id = auth.uid()::text)
  WITH CHECK (session_id = auth.uid()::text);

CREATE POLICY "users_own_badges"
  ON gwc_user_badges FOR ALL
  USING     (session_id = auth.uid()::text)
  WITH CHECK (session_id = auth.uid()::text);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gwc_user_badges_session
  ON gwc_user_badges (session_id);

CREATE INDEX IF NOT EXISTS idx_gwc_user_badges_unlocked
  ON gwc_user_badges (session_id, unlocked_at DESC);
