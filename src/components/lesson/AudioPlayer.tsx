'use client'

// AudioPlayer — simple play/pause circle button, no progress bar or timer
import { useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors duration-150 hover:bg-primary-dark"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
    </>
  )
}
