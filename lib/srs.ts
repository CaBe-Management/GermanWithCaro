/**
 * Bunpro-style Spaced Repetition System
 *
 * Fixed 12-step ladder — no ease factors, no variable multipliers.
 * The SRS level (0–11) is stored in the `repetitions` DB column.
 * `next_review_at` is the authoritative timestamp for when to review.
 *
 * Bunpro Normal Review intervals:
 *   SRS 0  → 4 hours        (immediately after first learn)
 *   SRS 1  → 8 hours
 *   SRS 2  → 24 hours       (1 day)
 *   SRS 3  → 2 days
 *   SRS 4  → 4 days
 *   SRS 5  → 8 days
 *   SRS 6  → 2 weeks
 *   SRS 7  → 1 month
 *   SRS 8  → 2 months
 *   SRS 9  → 4 months
 *   SRS 10 → 6 months
 *   SRS 11 → Mastered (1000 years)
 *
 * Correct answer: SRS level +1 (cap 11)
 * Wrong answer:   SRS level -2 (floor 0)
 */

export const SRS_INTERVALS_HOURS: readonly number[] = [
  4,          // SRS  0 — 4 hours
  8,          // SRS  1 — 8 hours
  24,         // SRS  2 — 24 hours (1 day)
  48,         // SRS  3 — 2 days
  96,         // SRS  4 — 4 days
  192,        // SRS  5 — 8 days
  336,        // SRS  6 — 2 weeks
  720,        // SRS  7 — 1 month (30 days)
  1_440,      // SRS  8 — 2 months
  2_880,      // SRS  9 — 4 months
  4_320,      // SRS 10 — 6 months
  8_760_000,  // SRS 11 — Mastered (~1000 years)
] as const

export const SRS_MAX_LEVEL = 11

/** Human-readable label for a level shown in the UI */
export const SRS_LABELS: readonly string[] = [
  'Novice I', 'Novice II', 'Novice III',
  'Apprentice I', 'Apprentice II', 'Apprentice III',
  'Journeyman I', 'Journeyman II',
  'Expert I', 'Expert II',
  'Master',
  '⭐ Mastered',
] as const

export interface SRSResult {
  /** New SRS level (0–11). Store in `repetitions` column. */
  newSrsLevel: number
  /** Hours until next review. */
  intervalHours: number
  /** Fractional days until next review (= intervalHours / 24). Store in `interval_days` as ceiling. */
  intervalDays: number
  /** Always 2.5 — kept for DB column compatibility, not used in calculations. */
  newEaseFactor: number
  /** Alias of newSrsLevel — kept so old call sites that read `.newRepetitions` still compile. */
  newRepetitions: number
  /** Alias of intervalHours / 24 rounded — kept for old `.nextInterval` call sites. */
  nextInterval: number
}

/**
 * Calculate the next SRS state.
 *
 * @param correct         Did the user answer correctly?
 * @param currentSrsLevel Current SRS level, read from the `repetitions` DB column (0–11).
 *                        Old SM-2 rows will have `repetitions` = 0–3, which maps naturally
 *                        to the early Bunpro levels, so no migration is needed.
 */
export function calculateNextReview(
  correct: boolean,
  currentSrsLevel: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _legacyEaseFactor?: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _legacyIntervalDays?: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _legacyRepetitions?: number,
): SRSResult {
  const lvl = Math.min(Math.max(0, Math.round(currentSrsLevel ?? 0)), SRS_MAX_LEVEL)
  const newLevel = correct
    ? Math.min(lvl + 1, SRS_MAX_LEVEL)
    : Math.max(lvl - 2, 0)

  const hours = SRS_INTERVALS_HOURS[newLevel]

  return {
    newSrsLevel:    newLevel,
    intervalHours:  hours,
    intervalDays:   hours / 24,
    newEaseFactor:  2.5,
    newRepetitions: newLevel,   // alias
    nextInterval:   Math.ceil(hours / 24), // alias (days, integer, for old callers)
  }
}

/** Compute the timestamp of the next review from an interval in hours. */
export function getNextReviewDate(intervalHours: number): Date {
  return new Date(Date.now() + intervalHours * 3_600_000)
}

/** Convenience: milliseconds for a given SRS level's interval. */
export function srsLevelToMs(srsLevel: number): number {
  const clamped = Math.min(Math.max(0, srsLevel), SRS_MAX_LEVEL)
  return SRS_INTERVALS_HOURS[clamped] * 3_600_000
}
