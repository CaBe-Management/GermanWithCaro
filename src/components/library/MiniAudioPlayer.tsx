'use client'

// MiniAudioPlayer — compact play/pause circle button for flashcards in the library
// Only one audio plays at a time (managed by parent via onPlay callback)
import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'

// Resolve audio URL: if relative path, prepend Supabase Storage URL
function getAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith('http')) return audioUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${audioUrl}`
}

export default function MiniAudioPlayer({
  src,
  isActive,
  onPlay,
}: {
  src: string
  isActive: boolean   // true if this player is the currently active one
  onPlay: () => void  // called when play starts (parent stops other players)
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const resolvedSrc = getAudioUrl(src)

  // Stop playing when another player becomes active
  useEffect(() => {
    if (!isActive && playing) {
      audioRef.current?.pause()
      setPlaying(false)
    }
  }, [isActive, playing])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      onPlay() // tell parent this player is now active
      setLoading(true)
      audio.play().then(() => {
        setLoading(false)
        setPlaying(true)
      }).catch(() => {
        setLoading(false)
      })
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onCanPlay={() => setLoading(false)}
      />
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle()
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-dark"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : playing ? (
          <Pause size={12} />
        ) : (
          <Play size={12} className="ml-0.5" />
        )}
      </button>
    </>
  )
}
