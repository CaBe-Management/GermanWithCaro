'use client'

// ReviewCard — shows German sentence front, then translation + words + grammar on back
import { useRef, useState, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'

type DueCard = {
  id: string
  block_id: string
  lesson_blocks: {
    id: string
    content: { grammar_note?: string } | null
    german_sentence: string
    translation: string
    register: string | null
    word_breakdown: { de: string; en: string; role: string }[] | null
    audio_url: string | null
    lessons: { title: string; unit_name: string }
  }
}

let currentlyPlaying: HTMLAudioElement | null = null

function getAudioUrl(audioUrl: string | null): string | null {
  if (!audioUrl) return null
  if (audioUrl.startsWith('http')) return audioUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${audioUrl}`
}

export default function ReviewCard({
  card,
  revealed,
}: {
  card: DueCard
  revealed: boolean
}) {
  const block = card.lesson_blocks
  const words = block.word_breakdown ?? []
  const grammarNote = block.content?.grammar_note ?? null
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
    <div>
      {resolvedAudio && (
        <audio ref={audioRef} src={resolvedAudio} preload="none" onEnded={() => setIsPlaying(false)} />
      )}

      {/* Front: German sentence + audio */}
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        {!revealed && (
          <p className="text-[14px] text-text-3">What does this mean?</p>
        )}
        <p className="text-[28px] font-bold leading-[1.25] text-text-1">
          {block.german_sentence}
        </p>
        {resolvedAudio && (
          <button
            onClick={toggleAudio}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,102,241,0.30)]"
            aria-label="Play audio"
          >
            {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
          </button>
        )}
      </div>

      {/* Back: translation + words + grammar */}
      {revealed && (
        <>
          <div className="border-t border-border-light px-[22px] py-3 text-center">
            <p className="text-[14px] italic text-text-3">{block.translation}</p>
          </div>

          {words.length > 0 && (
            <div className="border-t border-border-light px-[22px] py-4">
              <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[1.2px] text-text-3">
                Words
              </p>
              <div className="flex flex-wrap justify-center gap-[10px]">
                {words.map((w, i) => (
                  <div key={i} className="flex flex-col items-center gap-[2px] rounded-xl border-[1.5px] border-border bg-bg-card px-3 py-[6px]">
                    <span className="text-[14px] font-bold text-text-1">{w.de}</span>
                    <span className="text-[11px] text-text-3">{w.en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grammarNote && (
            <div className="flex gap-3 border-t border-border-light px-[18px] py-[14px]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-[14px]">
                💡
              </div>
              <p className="text-[14px] leading-[1.6] text-text-2">{grammarNote}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
