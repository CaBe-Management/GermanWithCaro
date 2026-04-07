'use client'

import Link from 'next/link'
import Badge from './Badge'
import { Word } from '@/lib/supabase'

interface WordRowProps {
  word: Word
  reviewCount?: number
  onClick?: () => void
}

export default function WordRow({ word, reviewCount = 0, onClick }: WordRowProps) {
  const content = (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg hover:bg-bg-card transition-colors border border-bg-secondary">
      {/* Left: Badges and Word */}
      <div className="flex-1 flex items-center gap-4">
        <div className="flex gap-2">
          <Badge type="typ" value={word.typ} />
          <Badge type="level" value={word.level} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {word.artikel && <span className="text-text-muted text-sm">{word.artikel}</span>}
            <span className="text-text-primary font-semibold">{word.word}</span>
          </div>
          {word.plural && <p className="text-text-muted text-xs mt-1">Plural: {word.plural}</p>}
        </div>
      </div>

      {/* Right: Review Count */}
      <div className="text-right">
        <Badge type="srs" value={`${reviewCount}`} />
      </div>
    </div>
  )

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>
  }

  return <Link href={`/word/${word.id}`}>{content}</Link>
}
