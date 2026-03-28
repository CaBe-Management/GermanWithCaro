'use client'

// ConversationBlock — displays a mini-conversation (Mini-Gespräch) at the end of a lesson
// Chat-style layout with two speakers, expandable translations and word breakdowns
import { useState, useRef, useCallback } from 'react'
import { Play, Pause, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types for the conversation data inside the content JSON
type WordBreakdownItem = {
  de: string
  en: string
  role: string
}

type ConversationLine = {
  speaker: string
  german: string
  english: string
  audio_url: string | null
  word_breakdown: WordBreakdownItem[]
}

type ConversationContent = {
  title: string
  context: string
  lines: ConversationLine[]
}

export default function ConversationBlock({
  content,
}: {
  content: ConversationContent
}) {
  // Track which lines have translation/breakdown visible
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(new Set())
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<number>>(new Set())
  const [playingLine, setPlayingLine] = useState<number | null>(null)
  const [playingAll, setPlayingAll] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Get unique speakers to assign colours (first = A, second = B)
  const speakers = [...new Set(content.lines.map((l) => l.speaker))]
  const speakerA = speakers[0]

  function toggleTranslation(index: number) {
    setRevealedTranslations((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleBreakdown(index: number) {
    setExpandedBreakdowns((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Play a single line's audio
  function playLine(index: number) {
    const line = content.lines[index]
    if (!line.audio_url || !audioRef.current) return

    audioRef.current.src = line.audio_url
    audioRef.current.play()
    setPlayingLine(index)
  }

  // Play all lines sequentially
  const playAll = useCallback(async () => {
    if (playingAll) {
      if (audioRef.current) audioRef.current.pause()
      setPlayingAll(false)
      setPlayingLine(null)
      return
    }

    setPlayingAll(true)
    for (let i = 0; i < content.lines.length; i++) {
      const line = content.lines[i]
      if (!line.audio_url) continue

      setPlayingLine(i)
      if (audioRef.current) {
        audioRef.current.src = line.audio_url
        await audioRef.current.play()
        // Wait for audio to finish + 1.5s pause
        await new Promise<void>((resolve) => {
          audioRef.current!.onended = () => {
            setTimeout(resolve, 1500)
          }
        })
      }
    }
    setPlayingAll(false)
    setPlayingLine(null)
  }, [playingAll, content.lines])

  // Check if any line has audio
  const hasAudio = content.lines.some((l) => l.audio_url)

  return (
    <div className="rounded-xl bg-sage-bg p-5 sm:p-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          if (!playingAll) setPlayingLine(null)
        }}
      />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {/* Label */}
          <div className="flex items-center gap-1.5">
            <MessageCircle size={13} className="text-sage-dark" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-sage-dark">
              Mini-Gespräch
            </span>
          </div>
          {/* Title */}
          <h3 className="mt-1 font-display text-xl font-semibold text-text">
            {content.title}
          </h3>
          {/* Context */}
          <p className="mt-1 text-sm italic text-text2">{content.context}</p>
        </div>

        {/* Play All button */}
        {hasAudio && (
          <button
            onClick={playAll}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sage px-3 py-1.5 text-xs font-semibold text-sage transition hover:bg-sage hover:text-white"
          >
            {playingAll ? <Pause size={12} /> : <Play size={12} />}
            {playingAll ? 'Stop' : 'Play all'}
          </button>
        )}
      </div>

      {/* Chat lines */}
      <div className="space-y-4">
        {content.lines.map((line, i) => {
          const isA = line.speaker === speakerA
          const isRevealed = revealedTranslations.has(i)
          const isExpanded = expandedBreakdowns.has(i)
          const isPlaying = playingLine === i
          const initial = line.speaker.charAt(0).toUpperCase()

          return (
            <div
              key={i}
              className={cn(
                'flex gap-2.5',
                isA ? 'flex-row' : 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                  isA ? 'bg-primary' : 'bg-sage'
                )}
              >
                {initial}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%]',
                  isA
                    ? 'rounded-tl-sm border border-border bg-white'
                    : 'rounded-tr-sm border border-primary/20 bg-primary-light'
                )}
              >
                {/* Speaker name */}
                <p className="mb-1 text-[11px] font-bold text-text2">
                  {line.speaker}
                </p>

                {/* German sentence */}
                <p className="font-display text-[17px] leading-snug text-text">
                  {line.german}
                </p>

                {/* Audio play button (inline) */}
                {line.audio_url && (
                  <button
                    onClick={() => playLine(i)}
                    className="mt-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                  >
                    {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
                  </button>
                )}

                {/* Translation (hidden by default) */}
                <button
                  onClick={() => toggleTranslation(i)}
                  className="mt-2 text-[11px] font-medium text-text3 transition hover:text-text2"
                >
                  {isRevealed ? 'Hide translation' : 'Show translation'}
                </button>
                {isRevealed && (
                  <p className="mt-1 text-[13px] italic text-text2">
                    {line.english}
                  </p>
                )}

                {/* Word breakdown (collapsed by default) */}
                {line.word_breakdown && line.word_breakdown.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleBreakdown(i)}
                      className="mt-1.5 flex items-center gap-0.5 text-[11px] font-medium text-text3 transition hover:text-text2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={10} /> Hide words
                        </>
                      ) : (
                        <>
                          <ChevronDown size={10} /> Show words
                        </>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {line.word_breakdown.map((word, j) => (
                          <div
                            key={j}
                            className="rounded-lg border border-border bg-white px-2 py-1"
                          >
                            <p className="text-[11px] font-semibold text-text">{word.de}</p>
                            <p className="text-[10px] text-text3">{word.en}</p>
                            <p className="text-[9px] font-medium text-primary">{word.role}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
