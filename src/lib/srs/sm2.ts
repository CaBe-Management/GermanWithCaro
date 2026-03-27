// SM-2 Spaced Repetition Algorithm
// This is the same algorithm used by Anki — simple and battle-tested.
//
// How it works:
// - If you FORGOT the card (quality = 0): reset to day 1
// - If you KNEW the card (quality = 1): space it further out based on ease factor
// - The ease factor adjusts over time — cards you always get right get spaced further apart

export function calculateNextReview(card: {
  interval: number      // current interval in days
  easeFactor: number    // how easy this card is (starts at 2.5)
  repetitions: number   // how many times reviewed successfully in a row
}, quality: 0 | 1) {
  let { interval, easeFactor, repetitions } = card

  if (quality === 0) {
    // Failed: reset the card back to the beginning
    repetitions = 0
    interval = 1
  } else {
    // Passed: increase the interval
    if (repetitions === 0) interval = 1       // first success: review tomorrow
    else if (repetitions === 1) interval = 6  // second success: review in 6 days
    else interval = Math.round(interval * easeFactor) // after that: multiply by ease factor
    repetitions += 1
  }

  // Adjust ease factor (minimum 1.3 so cards never get stuck)
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (1 - quality) * 0.2))

  // Calculate the actual next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return { interval, easeFactor, repetitions, nextReviewDate }
}
