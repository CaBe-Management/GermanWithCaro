// StreakBar — shows 3 stat cells: day streak, cards reviewed, lessons done
import { Flame, BookOpen, GraduationCap } from 'lucide-react'

export default function StreakBar({
  streak,
  cardsReviewed,
  lessonsCompleted,
}: {
  streak: number
  cardsReviewed: number
  lessonsCompleted: number
}) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {/* Day streak */}
      <div className="flex flex-col items-center rounded-lg border border-border bg-white p-3">
        <Flame size={18} className="text-primary" />
        <span className="mt-1 text-lg font-bold text-text">{streak}</span>
        <span className="text-[10px] text-text3">Day streak</span>
      </div>

      {/* Cards reviewed */}
      <div className="flex flex-col items-center rounded-lg border border-border bg-white p-3">
        <BookOpen size={18} className="text-primary" />
        <span className="mt-1 text-lg font-bold text-text">{cardsReviewed}</span>
        <span className="text-[10px] text-text3">Cards reviewed</span>
      </div>

      {/* Lessons done */}
      <div className="flex flex-col items-center rounded-lg border border-border bg-white p-3">
        <GraduationCap size={18} className="text-primary" />
        <span className="mt-1 text-lg font-bold text-text">{lessonsCompleted}</span>
        <span className="text-[10px] text-text3">Lessons done</span>
      </div>
    </div>
  )
}
