'use client'

import { Word } from '@/lib/supabase'

interface WordCardProps {
  word: Word
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <div className="bg-bg-card rounded-lg p-4 border border-bg-secondary">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-3">
            {word.artikel && (
              <span className="text-accent-violet font-medium">{word.artikel}</span>
            )}
            <span className="text-text-primary font-semibold text-lg">
              {word.word}
            </span>
          </div>

          {word.plural && (
            <div className="text-text-muted text-sm mt-2">
              Plural: {word.artikel} {word.plural}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-accent-pink font-medium text-sm">
            {word.typ}
          </div>
          <div className="text-text-muted text-xs mt-1">{word.level}</div>
        </div>
      </div>
    </div>
  )
}
