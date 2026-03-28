// ExampleSentenceCard — displays a German example sentence with translation,
// word breakdown, register label, grammar note, and audio player.
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
        'relative overflow-hidden rounded-xl border transition-shadow hover:shadow-md',
        isBadExample
          ? 'border-error/30 bg-error-bg'
          : 'border-border bg-white'
      )}
    >
      {/* Left accent border — 5px blush */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[5px]',
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

        {/* Main content area — increased padding */}
        <div className={cn('flex-1 p-6', block.register ? 'pl-1' : 'pl-7')}>
          {/* Bad example icon */}
          {isBadExample && (
            <div className="mb-2 flex items-center gap-1.5 text-error">
              <XCircle size={14} />
              <span className="text-xs font-medium">Incorrect</span>
            </div>
          )}

          {/* German sentence — Newsreader serif */}
          <p className={cn(
            'font-display text-xl font-medium leading-snug',
            isBadExample ? 'text-error/80 line-through' : 'text-text'
          )}>
            {block.german_sentence}
          </p>

          {/* English translation */}
          {block.translation && (
            <p className="mt-1.5 text-[15px] italic text-text3">{block.translation}</p>
          )}

          {/* Word breakdown chips — with subtle shadow and hover */}
          {words.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {words.map((word, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-white px-3 py-2 shadow-xs transition hover:border-primary"
                >
                  <p className="text-[13px] font-semibold text-text">{word.de}</p>
                  <p className="text-[11px] text-text3">{word.en}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-primary">{word.role}</p>
                </div>
              ))}
            </div>
          )}

          {/* Grammar note — sage green box with left border */}
          {block.content && (block.content as { grammar_note?: string }).grammar_note && (
            <div className="mt-4 rounded-lg border-l-[3px] border-sage bg-sage-bg p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-dark">
                Grammar Note
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text2">
                {(block.content as { grammar_note?: string }).grammar_note}
              </p>
            </div>
          )}

          {/* Audio player */}
          {block.audio_url && (
            <div className="mt-4">
              <AudioPlayer src={block.audio_url} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
