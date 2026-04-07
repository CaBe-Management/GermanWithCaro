'use client'

import Link from 'next/link'

interface PathCardProps {
  level: string
  wordCount: number
  reviewCount: number
}

export default function PathCard({ level, wordCount, reviewCount }: PathCardProps) {
  const getLevelLabel = () => {
    switch (level) {
      case 'A1':
        return "Caro's A1 Path"
      case 'A2':
        return "Caro's A2 Path"
      case 'B1':
        return "Caro's B1 Path"
      default:
        return `Caro's ${level} Path`
    }
  }

  const progressPercent = 0 // Placeholder for actual progress

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-text-primary mb-1">{getLevelLabel()}</h3>
        <p className="text-text-muted text-sm">Build your {level} foundation</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-muted text-xs font-medium">{wordCount} Words</span>
          <span className="text-accent-purple text-xs font-medium">{progressPercent}%</span>
        </div>
        <div className="w-full bg-bg-secondary rounded-full h-2 border border-bg-card overflow-hidden">
          <div
            className="bg-accent-purple h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/path/${level}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple text-white font-medium hover:bg-accent-violet transition-colors w-full justify-center"
      >
        <span>Learn</span>
        {reviewCount > 0 && <span className="ml-auto text-sm">({reviewCount} due)</span>}
      </Link>
    </div>
  )
}
