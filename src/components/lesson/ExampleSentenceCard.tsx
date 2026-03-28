// ExampleSentenceCard — displays a German example sentence with translation,
// word breakdown, register label, and audio player.
// For "bad examples", wraps in a red-tinted card with an X icon.
import { XCircle } from 'lucide-react'
import AudioPlayer from '@/components/lesson/AudioPlayer'
import type { LessonBlock, WordBreakdown } from '@/types'
import { cn } from '@/lib/utils'

export default function ExampleSentenceCard({
  block,
  isBadExample = false,
}: {
  block: LessonBlock
  isBadExample?: boolean
}) {
  const words = (block.word_breakdown ?? []) as WordBreakdown[]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border',
        isBadExample
          ? 'border-error/30 bg-error-bg'      // red tint for bad examples
          : 'border-border bg-white'            // normal white card
      )}
    >
      {/* Left accent border */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          isBadExample ? 'bg-error' : 'bg-primary'
        )}
      />

      <div className="flex">
        {/* Register label (rotated 90° on the left side) */}
        {block.register && (
          <div className="flex w-8 shrink-0 items-center justify-center">
            <span
              className={cn(
                '-rotate-90 whitespace-nowrap text-[10px] font-medium uppercase tracking-widest',
                isBadExample ? 'text-error/60' : 'text-text3'
              )}
            >
              {block.register}
            </span>
          </div>
        )}

        {/* Main content area */}
        <div className={cn('flex-1 p-4', block.register ? 'pl-0' : 'pl-5')}>
          {/* Bad example icon */}
          {isBadExample && (
            <div className="mb-2 flex items-center gap-1.5 text-error">
              <XCircle size={14} />
              <span className="text-xs font-medium">Incorrect</span>
            </div>
          )}

          {/* German sentence (the main content) */}
          <p className={cn(
            'font-display text-xl font-medium',
            isBadExample ? 'text-error/80 line-through' : 'text-text'
          )}>
            {block.german_sentence}
          </p>

          {/* English translation */}
          {block.translation && (
            <p className="mt-1 text-sm text-text3">{block.translation}</p>
          )}

          {/* Word breakdown chips */}
          {words.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {words.map((word, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5"
                >
                  {/* German word */}
                  <p className="text-xs font-semibold text-text">{word.de}</p>
                  {/* English meaning */}
                  <p className="text-[10px] text-text3">{word.en}</p>
                  {/* Grammatical role */}
                  <p className="mt-0.5 text-[10px] font-medium text-primary">{word.role}</p>
                </div>
              ))}
            </div>
          )}

          {/* Grammar note — pulled from the content JSON field */}
          {block.content && (block.content as { grammar_note?: string }).grammar_note && (
            <div className="mt-3 rounded-lg border-l-[3px] border-sage bg-sage-bg px-3 py-2">
              <p className="text-xs leading-relaxed text-sage-dark">
                <span className="font-semibold">Grammar: </span>
                {(block.content as { grammar_note?: string }).grammar_note}
              </p>
            </div>
          )}

          {/* Audio player */}
          {block.audio_url && (
            <div className="mt-3">
              <AudioPlayer src={block.audio_url} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
