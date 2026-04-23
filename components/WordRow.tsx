'use client'

import Link from 'next/link'
import type { VocabWord } from '@/lib/supabase'

interface WordRowProps {
  word: VocabWord
  reviewCount?: number
  onClick?: () => void
}

export default function WordRow({ word, reviewCount = 0, onClick }: WordRowProps) {
  const content = (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg hover:bg-gwc-text/5 transition-colors border border-gwc-text/6">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-gwc-text/8 text-gwc-muted border border-gwc-text/10">
            {word.type}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-gwc-accent/20 text-gwc-accent-soft border border-gwc-accent/30">
            {word.level}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {word.article && <span className="text-gwc-muted text-sm">{word.article}</span>}
            <span className="text-gwc-text font-semibold">{word.word}</span>
            {word.plural && <span className="text-gwc-muted text-xs">/ {word.plural}</span>}
          </div>
          <p className="text-gwc-muted text-xs mt-0.5">{word.translation_en}</p>
        </div>
      </div>
      {reviewCount > 0 && (
        <span className="text-xs text-gwc-muted shrink-0">{reviewCount} reviews</span>
      )}
    </div>
  )

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>
  }

  return <Link href={`/vocab/${word.slug}`}>{content}</Link>
}
