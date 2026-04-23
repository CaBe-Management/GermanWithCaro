'use client'

import { SRS_LABELS, SRS_INTERVALS_HOURS } from '@/lib/srs'

export interface SrsReviewData {
  repetitions:     number
  next_review_at:  string
  created_at:      string
  total_reviews:   number
  correct_reviews: number
}

function formatNextReview(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now()
  if (diff <= 0)                        return 'Now'
  const hours = diff / 3_600_000
  if (hours < 1)                        return 'in <1 hour'
  if (hours < 24)                       return `in ${Math.round(hours)}h`
  const days = Math.round(hours / 24)
  if (days === 1)                       return 'Tomorrow'
  if (days < 30)                        return `in ${days} days`
  const months = Math.round(days / 30)
  return `in ${months} month${months > 1 ? 's' : ''}`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// Color per SRS tier
function blockColor(level: number, i: number): string {
  if (i > level) return 'bg-white/8'
  if (i <= 2)  return 'bg-[#f472b6]'   // Novice    — pink
  if (i <= 5)  return 'bg-gwc-accent'   // Apprentice — purple
  if (i <= 7)  return 'bg-[#60a5fa]'   // Journeyman — blue
  if (i <= 9)  return 'bg-[#34d399]'   // Expert     — teal
  if (i === 10) return 'bg-[#fb923c]'  // Master     — orange
  return 'bg-[#fbbf24]'                // Mastered   — gold
}

function intervalLabel(level: number): string {
  const hours = SRS_INTERVALS_HOURS[level] ?? 0
  if (hours >= 8_000_000) return '∞'
  if (hours < 24)         return `${hours}h`
  const days = hours / 24
  if (days < 14)          return `${days}d`
  if (days < 60)          return `${Math.round(days / 7)}w`
  return `${Math.round(days / 30)}mo`
}

export function SrsProgressCard({ data }: { data: SrsReviewData }) {
  const lvl      = Math.min(Math.max(0, data.repetitions ?? 0), 11)
  const accuracy = data.total_reviews > 0
    ? Math.round((data.correct_reviews / data.total_reviews) * 100)
    : null

  return (
    <div className="bg-gwc-panel border border-white/5 rounded-2xl p-5">
      <p className="text-[0.7rem] font-bold tracking-widest uppercase text-gwc-muted mb-4">Your Progress</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-0.5">Current Stage</p>
          <p className="text-gwc-text text-sm font-semibold">{SRS_LABELS[lvl]}</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-0.5">Next Review</p>
          <p className={`text-sm font-semibold ${data.next_review_at && new Date(data.next_review_at) <= new Date() ? 'text-[#f472b6]' : 'text-gwc-text'}`}>
            {data.next_review_at ? formatNextReview(data.next_review_at) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-0.5">First Studied</p>
          <p className="text-gwc-text text-sm font-semibold">{formatDate(data.created_at)}</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-0.5">Times Reviewed</p>
          <p className="text-gwc-text text-sm font-semibold">{data.total_reviews}</p>
        </div>
        {accuracy !== null && (
          <div>
            <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-0.5">Accuracy</p>
            <p className={`text-sm font-semibold ${accuracy >= 80 ? 'text-[#34d399]' : accuracy >= 50 ? 'text-[#fb923c]' : 'text-[#f472b6]'}`}>
              {accuracy}%
            </p>
          </div>
        )}
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-0.5">Interval</p>
          <p className="text-gwc-text text-sm font-semibold">{intervalLabel(lvl)}</p>
        </div>
      </div>

      {/* SRS level bar — 12 blocks */}
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            title={SRS_LABELS[i]}
            className={`flex-1 h-2.5 rounded-sm transition-colors ${blockColor(lvl, i)}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[0.6rem] text-gwc-muted">Novice</span>
        <span className="text-[0.6rem] text-[#fbbf24]">Mastered</span>
      </div>
    </div>
  )
}
