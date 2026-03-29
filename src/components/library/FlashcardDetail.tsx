'use client'

// FlashcardDetail — a single expanded flashcard showing German sentence,
// translation, register, grammar note, word breakdown, and audio
import AudioPlayer from '@/components/lesson/AudioPlayer'

type WordBreakdownItem = {
  de: string
  en: string
  role: string
}

type FlashcardBlock = {
  id: string
  lesson_id: string
  order_index: number
  german_sentence: string | null
  translation: string | null
  register: string | null
  audio_url: string | null
  content: Record<string, unknown> | null
  word_breakdown: WordBreakdownItem[] | null
}

export default function FlashcardDetail({
  flashcard,
}: {
  flashcard: FlashcardBlock
}) {
  const grammarNote = flashcard.content
    ? (flashcard.content as { grammar_note?: string }).grammar_note
    : null
  const words = (flashcard.word_breakdown ?? []) as WordBreakdownItem[]

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      {/* Top row: German sentence + register + audio */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {/* Register label */}
          {flashcard.register && (
            <span className="mb-1 inline-block rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium uppercase text-primary-dark">
              {flashcard.register}
            </span>
          )}
          {/* German sentence */}
          <p className="font-display text-lg leading-snug text-text">
            {flashcard.german_sentence}
          </p>
          {/* English translation */}
          {flashcard.translation && (
            <p className="mt-1 text-sm italic text-text2">
              {flashcard.translation}
            </p>
          )}
        </div>

        {/* Audio play button (only if audio exists) */}
        {flashcard.audio_url && (
          <AudioPlayer src={flashcard.audio_url} />
        )}
      </div>

      {/* Grammar note */}
      {grammarNote && (
        <div className="mt-3 rounded-lg border-l-[3px] border-sage bg-sage-bg p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-dark">
            Grammar Note
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text2">
            {grammarNote}
          </p>
        </div>
      )}

      {/* Word breakdown chips */}
      {words.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {words.map((word, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5"
            >
              <p className="text-[13px] font-semibold text-text">{word.de}</p>
              <p className="text-[11px] text-primary-dark">{word.en}</p>
              <p className="text-[10px] text-text3">{word.role}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
