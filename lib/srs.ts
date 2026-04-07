/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo algorithm
 */

export interface SRSResult {
  nextInterval: number
  newEaseFactor: number
  newRepetitions: number
}

export function calculateNextReview(
  correct: boolean,
  easeFactor: number,
  intervalDays: number,
  repetitions: number
): SRSResult {
  if (!correct) {
    // Wrong answer: reset interval and lower ease factor
    return {
      nextInterval: 1,
      newEaseFactor: Math.max(1.3, easeFactor - 0.2),
      newRepetitions: 0,
    }
  }

  // Correct answer: increase repetitions
  let newRepetitions = repetitions + 1

  // Adjust ease factor based on answer quality (assuming quality = 4 for correct)
  const quality = 4
  let newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor)

  // Calculate next interval
  let nextInterval: number
  if (newRepetitions === 1) {
    nextInterval = 1
  } else if (newRepetitions === 2) {
    nextInterval = 6
  } else {
    nextInterval = Math.round(intervalDays * newEaseFactor)
  }

  return {
    nextInterval,
    newEaseFactor,
    newRepetitions,
  }
}

export function getNextReviewDate(days: number): Date {
  const now = new Date()
  const nextDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  return nextDate
}
