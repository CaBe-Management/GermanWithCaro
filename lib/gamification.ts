/**
 * Gamification utilities: XP, levels, streaks, badges, daily goal.
 * All DB writes go through these helpers so logic stays in one place.
 */

import { supabase } from './supabase'

// ─── XP Values ────────────────────────────────────────────────────────────────

export const XP_CORRECT_LEARN  = 10   // correct answer in learn cloze session
export const XP_WRONG_LEARN    = 2    // wrong answer in learn cloze session
export const XP_CORRECT_REVIEW = 5    // correct answer in SRS review
export const XP_WRONG_REVIEW   = 1    // wrong answer in SRS review

// ─── Level System ─────────────────────────────────────────────────────────────
// LEVEL_THRESHOLDS[i] = minimum XP required to reach level (i + 1).
// These cover levels 1–15. Beyond level 15 the system extends infinitely:
// each subsequent level gap is multiplied by LEVEL_SCALE_FACTOR (1.2),
// so the cost keeps rising but levels never stop.

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2200,   // Level 7
  3000,   // Level 8
  4000,   // Level 9
  5500,   // Level 10
  7500,   // Level 11
  10000,  // Level 12
  13000,  // Level 13
  16500,  // Level 14
  20500,  // Level 15  — predefined thresholds end here; formula continues beyond
]

// Each level beyond 15 costs 20% more XP than the previous level's gap.
const LEVEL_SCALE_FACTOR = 1.2

/**
 * Returns the minimum XP required to reach `level` (1-based, infinite).
 * For levels within the predefined array this is an O(1) lookup.
 * For levels beyond it, gaps compound by LEVEL_SCALE_FACTOR each step.
 */
export function getThresholdForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1]
  }
  // Extend beyond the array: start from the last defined threshold and
  // keep adding scaled gaps until we reach the requested level.
  const lastGap = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 2]  // 20500 - 16500 = 4000
  let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]  // 20500
  let gap = lastGap
  for (let i = LEVEL_THRESHOLDS.length + 1; i <= level; i++) {
    gap = Math.round(gap * LEVEL_SCALE_FACTOR)
    threshold += gap
  }
  return threshold
}

/** Returns the level number (1-based, infinite) for a given XP total. */
export function getLevelFromXP(xp: number): number {
  // Walk the predefined thresholds first
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else return level  // found the right bucket
  }
  // xp is at or beyond the last predefined threshold — extend with scaled gaps
  const lastGap = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 2]
  let gap = lastGap
  let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  while (true) {
    gap = Math.round(gap * LEVEL_SCALE_FACTOR)
    threshold += gap
    if (xp < threshold) break
    level++
  }
  return level
}

/** Returns progress details used to render the XP bar (never stuck at 100%). */
export function getXPProgress(xp: number): {
  level: number
  xpInLevel: number  // XP earned within the current level
  xpNeeded: number   // total XP needed to complete the current level
  pct: number        // 0–99 (never 100 — there's always a next level)
} {
  const level = getLevelFromXP(xp)
  const currentThreshold = getThresholdForLevel(level)
  const nextThreshold    = getThresholdForLevel(level + 1)
  const xpInLevel = xp - currentThreshold
  const xpNeeded  = nextThreshold - currentThreshold
  // Cap at 99 so the bar never appears "full" — there's always a next level
  const pct = Math.min(99, Math.round((xpInLevel / xpNeeded) * 100))
  return { level, xpInLevel, xpNeeded, pct }
}

// ─── Badge Definitions ────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'reviews' | 'words' | 'days'
  /** The stat value required to earn this badge */
  threshold: number
}

export const BADGE_DEFS: BadgeDef[] = [
  // ── Streak badges ──
  { id: 'streak_3',    name: '3-Day Streak',        description: 'Studied 3 days in a row',             icon: '🔥', category: 'streak',  threshold: 3    },
  { id: 'streak_7',    name: '7-Day Streak',        description: 'Studied 7 days in a row',             icon: '🔥', category: 'streak',  threshold: 7    },
  { id: 'streak_14',   name: 'Persistent',          description: 'Studied 14 days in a row',            icon: '💪', category: 'streak',  threshold: 14   },
  { id: 'streak_30',   name: '30-Day Streak',       description: 'Studied 30 days in a row',            icon: '🏆', category: 'streak',  threshold: 30   },
  { id: 'streak_60',   name: 'Iron Will',           description: 'Studied 60 days in a row',            icon: '⚡', category: 'streak',  threshold: 60   },
  { id: 'streak_90',   name: 'Unshakeable',         description: 'Studied 90 days in a row',            icon: '🌟', category: 'streak',  threshold: 90   },
  { id: 'streak_180',  name: 'Half-Year Champion',  description: 'Studied 180 days in a row',           icon: '👑', category: 'streak',  threshold: 180  },
  { id: 'streak_365',  name: 'Year-Long Record',    description: 'Studied 365 days in a row',           icon: '🎖️', category: 'streak',  threshold: 365  },
  // ── Days studied badges ──
  { id: 'days_7',      name: 'Regular',             description: 'Studied on 7 days',                   icon: '📅', category: 'days',    threshold: 7    },
  { id: 'days_30',     name: 'Consistent',          description: 'Studied on 30 days',                  icon: '📅', category: 'days',    threshold: 30   },
  { id: 'days_50',     name: 'Creature of Habit',   description: 'Studied on 50 days',                  icon: '📆', category: 'days',    threshold: 50   },
  { id: 'days_100',    name: 'Unstoppable',         description: 'Studied on 100 days',                 icon: '🌟', category: 'days',    threshold: 100  },
  { id: 'days_200',    name: 'Everburning',         description: 'Studied on 200 days',                 icon: '🔥', category: 'days',    threshold: 200  },
  { id: 'days_365',    name: 'Year-Round Learner',  description: 'Studied on 365 days',                 icon: '🏅', category: 'days',    threshold: 365  },
  // ── Review count badges ──
  { id: 'reviews_50',   name: 'Diligent',           description: 'Completed 50 reviews',                icon: '📝', category: 'reviews', threshold: 50   },
  { id: 'reviews_100',  name: 'Committed',          description: 'Completed 100 reviews',               icon: '📝', category: 'reviews', threshold: 100  },
  { id: 'reviews_250',  name: 'Enduring',           description: 'Completed 250 reviews',               icon: '💫', category: 'reviews', threshold: 250  },
  { id: 'reviews_500',  name: 'Seasoned',           description: 'Completed 500 reviews',               icon: '🎯', category: 'reviews', threshold: 500  },
  { id: 'reviews_1k',   name: 'Master',             description: 'Completed 1,000 reviews',             icon: '🏅', category: 'reviews', threshold: 1000 },
  { id: 'reviews_2500', name: 'Grandmaster',        description: 'Completed 2,500 reviews',             icon: '🏆', category: 'reviews', threshold: 2500 },
  { id: 'reviews_5k',   name: 'Legend',             description: 'Completed 5,000 reviews',             icon: '👑', category: 'reviews', threshold: 5000 },
  { id: 'reviews_10k',  name: 'Immortal',           description: 'Completed 10,000 reviews',            icon: '⭐', category: 'reviews', threshold: 10000},
  // ── Words learned badges ──
  { id: 'words_10',    name: 'First Steps',         description: 'Learned 10 words',                    icon: '🌱', category: 'words',   threshold: 10   },
  { id: 'words_25',    name: 'Vocabulary Builder',   description: 'Learned 25 words',                   icon: '📖', category: 'words',   threshold: 25   },
  { id: 'words_50',    name: 'Word Collector',      description: 'Learned 50 words',                    icon: '📚', category: 'words',   threshold: 50   },
  { id: 'words_100',   name: 'Well-Read',           description: 'Learned 100 words',                   icon: '📖', category: 'words',   threshold: 100  },
  { id: 'words_250',   name: 'Language Talent',     description: 'Learned 250 words',                   icon: '🎓', category: 'words',   threshold: 250  },
  { id: 'words_500',   name: 'Word Master',         description: 'Learned 500 words',                   icon: '🌟', category: 'words',   threshold: 500  },
  { id: 'words_750',   name: 'Word Acrobat',        description: 'Learned 750 words',                   icon: '🎪', category: 'words',   threshold: 750  },
  { id: 'words_1000',  name: 'Thousand Words',      description: 'Learned 1,000 words',                 icon: '👑', category: 'words',   threshold: 1000 },
]

/** Returns the current stat value for a badge's category. */
export function getBadgeStat(
  badge: BadgeDef,
  stats: { streakCurrent: number; totalReviews: number; learnedWords: number; daysStudied: number }
): number {
  switch (badge.category) {
    case 'streak':  return stats.streakCurrent
    case 'reviews': return stats.totalReviews
    case 'words':   return stats.learnedWords
    case 'days':    return stats.daysStudied
  }
}

/** Returns badge IDs that should be unlocked given the current stats. */
export function getEarnedBadgeIds(stats: {
  streakCurrent: number
  totalReviews: number
  learnedWords: number
  daysStudied: number
}): string[] {
  return BADGE_DEFS
    .filter(b => getBadgeStat(b, stats) >= b.threshold)
    .map(b => b.id)
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD string (local time). */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns yesterday's date as YYYY-MM-DD string (local time). */
function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── User Progress Interface ───────────────────────────────────────────────────

export interface UserProgress {
  session_id: string
  xp_total: number
  streak_current: number
  streak_last_date: string | null
  daily_goal: number
  daily_cards_today: number
  daily_cards_date: string | null
  days_studied: number
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

/**
 * Fetches the user progress row. Creates one with defaults if it doesn't exist yet.
 * Safe to call multiple times — won't reset data on second call.
 */
export async function getOrCreateProgress(sessionId: string): Promise<UserProgress | null> {
  // Try to fetch existing row
  const { data: existing } = await supabase
    .from('gwc_user_progress')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) return existing as UserProgress

  // Create new row with default values
  const { data: created, error } = await supabase
    .from('gwc_user_progress')
    .insert({ session_id: sessionId })
    .select()
    .single()

  if (error) {
    // Might be a race condition duplicate — try fetching again
    const { data: retry } = await supabase
      .from('gwc_user_progress')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()
    return retry as UserProgress | null
  }

  return created as UserProgress
}

/**
 * Awards XP and updates the streak for today.
 * Calling this multiple times on the same day only adds XP — streak increments once per day.
 */
export async function awardXPAndUpdateStreak(
  sessionId: string,
  xpGained: number
): Promise<{ newStreak: number; newXP: number; newDaysStudied: number } | null> {
  const progress = await getOrCreateProgress(sessionId)
  if (!progress) return null

  const today     = todayStr()
  const yesterday = yesterdayStr()
  const lastDate  = progress.streak_last_date

  let newStreak      = progress.streak_current
  let newDaysStudied = progress.days_studied

  if (lastDate === today) {
    // Already recorded today — just add XP, don't touch streak or days count
  } else if (lastDate === yesterday) {
    // Consecutive day — extend the streak
    newStreak++
    newDaysStudied++
  } else {
    // Streak broken (or first time ever)
    newStreak = 1
    newDaysStudied++
  }

  const newXP = progress.xp_total + xpGained

  const { error } = await supabase
    .from('gwc_user_progress')
    .update({
      xp_total:         newXP,
      streak_current:   newStreak,
      streak_last_date: today,
      days_studied:     newDaysStudied,
      updated_at:       new Date().toISOString(),
    })
    .eq('session_id', sessionId)

  if (error) {
    console.error('awardXPAndUpdateStreak error:', error)
    return null
  }

  return { newStreak, newXP, newDaysStudied }
}

/**
 * Increments daily_cards_today and returns the new total + user's current goal.
 * Automatically resets the counter when a new day starts.
 */
export async function updateDailyCards(
  sessionId: string,
  cardsLearned: number
): Promise<{ dailyTotal: number; goal: number }> {
  const progress = await getOrCreateProgress(sessionId)
  const today = todayStr()

  const isToday    = progress?.daily_cards_date === today
  const current    = isToday ? (progress?.daily_cards_today ?? 0) : 0
  const newCount   = current + cardsLearned
  const goal       = progress?.daily_goal ?? 10

  if (progress) {
    await supabase
      .from('gwc_user_progress')
      .update({
        daily_cards_today: newCount,
        daily_cards_date:  today,
        updated_at:        new Date().toISOString(),
      })
      .eq('session_id', sessionId)
  }

  return { dailyTotal: newCount, goal }
}

/**
 * Saves the user's daily goal preference to the DB.
 * Also syncs to localStorage for backwards compatibility.
 */
export async function saveDailyGoal(sessionId: string, goal: number): Promise<void> {
  await getOrCreateProgress(sessionId)  // ensure row exists first
  await supabase
    .from('gwc_user_progress')
    .update({ daily_goal: goal, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  // Keep localStorage in sync so the learn page can read it as a fallback
  if (typeof window !== 'undefined') {
    localStorage.setItem('gwc_daily_goal', String(goal))
  }
}

/**
 * Checks which badges should now be unlocked, saves any new ones to the DB,
 * and returns the IDs of newly earned badges.
 */
export async function checkAndAwardBadges(
  sessionId: string,
  stats: {
    streakCurrent: number
    totalReviews: number
    learnedWords: number
    daysStudied: number
  }
): Promise<string[]> {
  const earnedIds = getEarnedBadgeIds(stats)
  if (earnedIds.length === 0) return []

  // Find which ones aren't already in the DB
  const { data: existing } = await supabase
    .from('gwc_user_badges')
    .select('badge_id')
    .eq('session_id', sessionId)

  const existingSet = new Set((existing || []).map((b: { badge_id: string }) => b.badge_id))
  const newBadges   = earnedIds.filter(id => !existingSet.has(id))

  if (newBadges.length > 0) {
    await supabase.from('gwc_user_badges').insert(
      newBadges.map(badge_id => ({ session_id: sessionId, badge_id }))
    )
  }

  return newBadges
}
