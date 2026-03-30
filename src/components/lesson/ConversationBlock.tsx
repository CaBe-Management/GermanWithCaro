'use client'

// ConversationBlock — chat-style conversation with gradient avatars
import { useState, useRef, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import Badge from '@/components/ui/Badge'

type ConversationLine = {
  speaker: string
  german: string
  english: string
  audio_url: string | null
  word_breakdown: { de: string; en: string; role: string }[]
}

type ConversationContent = {
  title: string
  context: string
  lines: ConversationLine[]
}

let currentlyPlaying: HTMLAudioElement | null = null

function getAudioUrl(audioUrl: string | null): string | null {
  if (!audioUrl) return null
  if (audioUrl.startsWith('http')) return audioUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${audioUrl}`
}

export default function ConversationBlock({
  content,
}: {
  content: ConversationContent
}) {
  const speakers = [...new Set(content.lines.map((l) => l.speaker))]
  const speakerA = speakers[0]
  const [revealedLines, setRevealedLines] = useState<Set<number>>(new Set())
  const [playingLine, setPlayingLine] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const toggleTranslation = (i: number) => {
    setRevealedLines((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const playLine = useCallback((i: number, url: string) => {
    const audio = audioRef.current
    if (!audio) return
    if (currentlyPlaying && currentlyPlaying !== audio) {
      currentlyPlaying.pause()
      currentlyPlaying.currentTime = 0
    }
    currentlyPlaying = audio
    audio.src = url
    audio.play().catch(() => {})
    setPlayingLine(i)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <audio ref={audioRef} preload="none" onEnded={() => setPlayingLine(null)} />

      <div className="text-center">
        <Badge variant="tag">Conversation</Badge>
        <p className="mt-2 text-[17px] font-bold text-text-1">{content.title}</p>
        <p className="mt-1 text-[13px] italic text-text-3">{content.context}</p>
      </div>

      <div className="flex flex-col gap-4">
        {content.lines.map((line, i) => {
          const isA = line.speaker === speakerA
          const resolvedAudio = getAudioUrl(line.audio_url)
          return (
            <div key={i} className={`flex gap-2.5 ${isA ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Avatar */}
              <div
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${
                  isA
                    ? 'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]'
                    : 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]'
                }`}
              >
                {line.speaker.charAt(0)}
              </div>

              {/* Bubble */}
              <div className="max-w-[85%]">
                <p className="mb-1 text-[11px] font-semibold text-text-3">{line.speaker}</p>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isA
                      ? 'rounded-bl-[4px] bg-bg-page text-text-1'
                      : 'rounded-br-[4px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white'
                  }`}
                >
                  <p className="text-[15px] leading-snug">{line.german}</p>
                </div>

                {/* Translation toggle */}
                <button
                  onClick={() => toggleTranslation(i)}
                  className="mt-1 text-[11px] font-medium text-text-3 hover:text-text-2"
                >
                  {revealedLines.has(i) ? 'Hide' : 'Show translation'}
                </button>
                {revealedLines.has(i) && (
                  <p className="mt-0.5 text-[12px] italic text-text-3">{line.english}</p>
                )}

                {/* Audio */}
                {resolvedAudio && (
                  <button
                    onClick={() => playLine(i, resolvedAudio)}
                    className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white"
                  >
                    {playingLine === i ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
