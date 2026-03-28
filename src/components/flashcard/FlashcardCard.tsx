'use client'

// FlashcardCard — a single flashcard with front (German) and back (translation + breakdown)
// Front: shows the German sentence + audio
// Back: shows translation, word breakdown, lesson source, and rating buttons
import { useState, useEffect, useRef } from 'react'
import AudioPlayer from '@/components/lesson/AudioPlayer'
import type { DueCard } from '@/components/flashcard/FlashcardViewer'

export default function FlashcardCard({
  card,
  autoplayAudio,
  onRate,
}: {
  card: DueCard
  autoplayAudio: boolean
  onRate: (quality: 0 | 1) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const block = card.lesson_blocks
  const words = block.word_breakdown ?? []

  // Reset revealed state when card changes
  useEffect(() => {
    setRevealed(false)
  }, [card.id])

  // Auto-play audio when card appears (if setting is on)
  useEffect(() => {
    if (autoplayAudio && block.audio_url && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser may block autoplay — that's ok
      })
    }
  }, [card.id, autoplayAudio, block.audio_url])

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      {/* === FRONT OF CARD (always visible) === */}
      <div className="p-6">
        {/* Hidden audio element for autoplay */}
        {block.audio_url && (
          <audio ref={audioRef} src={block.audio_url} preload="metadata" />
        )}

        {/* German sentence — large and centered */}
        <p className="text-center font-display text-2xl font-medium text-text">
          {block.german_sentence}
        </p>

        {/* Register label if present */}
        {block.register && (
          <p className="mt-2 text-center text-xs text-text3">
            ({block.register})
          </p>
        )}

        {/* Audio player */}
        {block.audio_url && (
          <div className="mt-4">
            <AudioPlayer src={block.audio_url} />
          </div>
        )}

        {/* Reveal button (only when card is face-down) */}
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 w-full rounded-lg border-2 border-primary bg-primary-bg py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Reveal
          </button>
        )}
      </div>

      {/* === BACK OF CARD (shown after reveal) === */}
      {revealed && (
        <div className="border-t border-border p-6">
          {/* Translation */}
          <p className="text-center text-lg font-bold text-text">
            {block.translation}
          </p>

          {/* Word breakdown grid */}
          {words.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {words.map((word, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-center"
                >
                  <p className="text-sm font-semibold text-text">{word.de}</p>
                  <p className="text-xs text-text3">{word.en}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-primary">{word.role}</p>
                </div>
              ))}
            </div>
          )}

          {/* Grammar note */}
          {block.content?.grammar_note && (
            <div className="mt-4 rounded-lg border-l-[3px] border-sage bg-sage-bg px-3 py-2">
              <p className="text-xs leading-relaxed text-sage-dark">
                <span className="font-semibold">Grammar: </span>
                {block.content.grammar_note}
              </p>
            </div>
          )}

          {/* Lesson source */}
          <p className="mt-4 text-center text-xs text-text3">
            From: {block.lessons.unit_name} &middot; {block.lessons.title}
          </p>

          {/* Rating buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* Didn't know */}
            <button
              onClick={() => onRate(0)}
              className="flex flex-col items-center gap-1 rounded-lg border border-border py-4 transition hover:border-error hover:bg-error-bg"
            >
              <span className="text-2xl">😐</span>
              <span className="text-xs font-medium text-text2">Didn&apos;t know</span>
            </button>

            {/* Knew it */}
            <button
              onClick={() => onRate(1)}
              className="flex flex-col items-center gap-1 rounded-lg bg-sage py-4 text-white transition hover:bg-sage-dark"
            >
              <span className="text-2xl">😊</span>
              <span className="text-xs font-medium">Knew it!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
