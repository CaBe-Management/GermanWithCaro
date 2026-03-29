'use client'

// MiniAudioPlayer — same as AudioPlayer but accepts parent callbacks for state sync
// Used in the library page where parent tracks active audio ID
import { useRef, useState, useCallback, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

// Shared global ref — ensures only one audio plays across the entire page
// This is the same variable as in AudioPlayer.tsx (module-level singletons
// are shared when both modules are loaded in the same page)
let currentlyPlaying: HTMLAudioElement | null = null

function getAudioUrl(audioUrl: string | null): string | null {
  if (!audioUrl) return null
  if (audioUrl.startsWith('http')) return audioUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${audioUrl}`
}

export default function MiniAudioPlayer({
  src,
  isActive,
  onPlay,
}: {
  src: string
  isActive: boolean
  onPlay: () => void
}) {
  const resolvedUrl = getAudioUrl(src)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Reset when audio finishes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleEnded = () => {
      setIsPlaying(false)
      audio.currentTime = 0
    }
    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [])

  // Stop if parent says another player is now active
  useEffect(() => {
    if (!isActive && isPlaying) {
      audioRef.current?.pause()
      if (audioRef.current) audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [isActive, isPlaying])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // Stop any other playing audio globally
      if (currentlyPlaying && currentlyPlaying !== audio) {
        currentlyPlaying.pause()
        currentlyPlaying.currentTime = 0
      }
      currentlyPlaying = audio
      onPlay() // tell parent this player is now active
      audio.play().catch(() => setIsPlaying(false))
      setIsPlaying(true)
    }
  }, [isPlaying, onPlay])

  if (!resolvedUrl) return null

  return (
    <>
      <audio ref={audioRef} src={resolvedUrl} preload="none" />
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle()
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors duration-150 hover:bg-primary-dark"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying
          ? <Pause size={16} fill="white" />
          : <Play size={16} fill="white" className="ml-0.5" />
        }
      </button>
    </>
  )
}
