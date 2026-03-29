'use client'

// FlashcardList — shows a preview of flashcard sentences inside an expanded lesson row
// Max 5 visible by default, "Alle X Karten anzeigen" button to see the rest
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Play, Pause } from 'lucide-react'

type FlashcardBlock = {
  id: string
  lesson_id: string
  order_index: number
  german_sentence: string | null
  translation: string | null
  audio_url: string | null
  content: Record<string, unknown> | null
}

export default function FlashcardList({
  flashcards,
  lessonSlug,
}: {
  flashcards: FlashcardBlock[]
  lessonSlug: string
}) {
  const [showAll, setShowAll] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const visible = showAll ? flashcards : flashcards.slice(0, 5)
  const hasMore = flashcards.length > 5

  function playAudio(id: string, url: string) {
    if (!audioRef.current) return

    if (playingId === id) {
      audioRef.current.pause()
      setPlayingId(null)
      return
    }

    audioRef.current.src = url
    audioRef.current.play()
    setPlayingId(id)
  }

  return (
    <div className="rounded-lg bg-sage-bg p-3">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => setPlayingId(null)}
      />

      <div className="space-y-1">
        {visible.map((fc) => {
          const hasGrammarNote = fc.content && (fc.content as { grammar_note?: string }).grammar_note
          return (
            <Link
              key={fc.id}
              href={`/lessons/${lessonSlug}#block-${fc.id}`}
              className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-sage-light"
            >
              {/* Audio play button (if audio exists) */}
              {fc.audio_url ? (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    playAudio(fc.id, fc.audio_url!)
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white"
                >
                  {playingId === fc.id ? (
                    <Pause size={10} />
                  ) : (
                    <Play size={10} className="ml-0.5" />
                  )}
                </button>
              ) : (
                <div className="h-7 w-7 shrink-0" /> // spacer when no audio
              )}

              {/* Sentence content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-display text-[15px] text-text">
                    {fc.german_sentence}
                  </p>
                  {/* Sage dot if grammar note exists */}
                  {hasGrammarNote && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                  )}
                </div>
                <p className="truncate text-[13px] italic text-text2">
                  {fc.translation}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Show all button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 w-full rounded-md py-1.5 text-xs font-medium text-sage-dark transition hover:bg-sage-light"
        >
          Alle {flashcards.length} Karten anzeigen
        </button>
      )}
    </div>
  )
}
