'use client'

// AudioPlayer — icon-only play/pause circle button
// No progress bar, no timer, no scrubber, no volume control
// Only one audio plays at a time across the whole page
import { useRef, useState, useCallback, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

// Global ref — only one audio plays at a time across all AudioPlayer instances
let currentlyPlaying: HTMLAudioElement | null = null

// Resolve audio URL: handles full URLs, relative paths, and null
function getAudioUrl(audioUrl: string | null): string | null {
  if (!audioUrl) return null
  if (audioUrl.startsWith('http')) return audioUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${audioUrl}`
}

export default function AudioPlayer({ src }: { src: string | null }) {
  const resolvedUrl = getAudioUrl(src)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Reset icon when audio finishes playing
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

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // Stop any other playing audio first
      if (currentlyPlaying && currentlyPlaying !== audio) {
        currentlyPlaying.pause()
        currentlyPlaying.currentTime = 0
      }
      currentlyPlaying = audio
      audio.play().catch(() => setIsPlaying(false))
      setIsPlaying(true)
    }
  }, [isPlaying])

  // Don't render anything if no audio URL
  if (!resolvedUrl) return null

  return (
    <>
      <audio ref={audioRef} src={resolvedUrl} preload="none" />
      <button
        onClick={toggle}
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
