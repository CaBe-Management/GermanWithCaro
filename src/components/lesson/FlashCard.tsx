'use client'

// FlashCard — displays a German example sentence with word chips and grammar note
import { useRef, useState, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import type { LessonBlock, WordBreakdown } from '@/types'
import Badge from '@/components/ui/Badge'

// Global audio ref — one at a time
let currentlyPlaying: HTMLAudioElement | null = null

function getAudioUrl(audioUrl: string | null): string | null {
  if (!audioUrl) return null
  if (audioUrl.startsWith('http')) return audioUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${audioUrl}`
}

export default function FlashCard({ block }: { block: LessonBlock }) {
  const words = (block.word_breakdown ?? []) as WordBreakdown[]
  const grammarNote = block.content
    ? (block.content as { grammar_note?: string }).grammar_note
    : null
  const resolvedAudio = getAudioUrl(block.audio_url)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      if (currentlyPlaying && currentlyPlaying !== audio) {
        currentlyPlaying.pause()
        currentlyPlaying.currentTime = 0
      }
      currentlyPlaying = audio
      audio.play().catch(() => setIsPlaying(false))
      setIsPlaying(true)
    }
  }, [isPlaying])

  return (
    <div className="overflow-hidden rounded-[18px] border-[1.5px] border-border shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      {/* Top: German sentence + audio + register */}
      <div className="flex flex-col items-center gap-4 px-[22px] pb-5 pt-7 text-center">
        {block.register && (
          <Badge variant={block.register.toLowerCase() === 'casual' ? 'casual' : block.register.toLowerCase() === 'formal' ? 'formal' : 'neutral'}>
            {block.register}
          </Badge>
        )}
        <p className="text-[28px] font-bold leading-[1.25] text-text-1">
          {block.german_sentence}
        </p>
        <p className="text-[15px] italic text-text-3">
          {block.translation}
        </p>
        {resolvedAudio && (
          <>
            <audio ref={audioRef} src={resolvedAudio} preload="none" onEnded={() => setIsPlaying(false)} />
            <button
              onClick={toggleAudio}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,102,241,0.30)] transition-all hover:opacity-[0.92] active:scale-[0.98]"
              aria-label="Play audio"
            >
              {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
            </button>
          </>
        )}
      </div>

      {/* Word chips */}
      {words.length > 0 && (
        <div className="border-t border-border-light bg-bg-subtle px-[22px] py-4">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[1.2px] text-text-3">
            Words
          </p>
          <div className="flex flex-wrap justify-center gap-[10px]">
            {words.map((word, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-[2px] rounded-xl border-[1.5px] border-border bg-bg-card px-3 py-[6px] transition hover:border-[#a5b4fc]"
              >
                <span className="text-[14px] font-bold text-text-1">{word.de}</span>
                <span className="text-[11px] text-text-3">{word.en}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar note */}
      {grammarNote && (
        <div className="flex gap-3 border-t border-border-light px-[18px] py-[14px]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-[14px]">
            💡
          </div>
          <p className="text-[14px] leading-[1.6] text-text-2">{grammarNote}</p>
        </div>
      )}
    </div>
  )
}
