'use client'

import { useState, useEffect, useRef } from 'react'

interface AudioButtonProps {
  filename?: string | null
  /** 'sm' = small icon only, 'md' = round play button (default), 'lg' = pill with text */
  size?: 'sm' | 'md' | 'lg'
}

export default function AudioButton({ filename, size = 'md' }: AudioButtonProps) {
  const [playing, setPlaying]     = useState(false)
  const [available, setAvailable] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check if the file actually exists before showing the button
  useEffect(() => {
    if (!filename) { setAvailable(false); return }
    fetch(`/audio/${filename}`, { method: 'HEAD' })
      .then(r => setAvailable(r.ok))
      .catch(() => setAvailable(false))
  }, [filename])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  if (!filename || !available) return null

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(`/audio/${filename!}`)
      audioRef.current.onended = () => setPlaying(false)
      audioRef.current.onerror = () => { setPlaying(false); setAvailable(false) }
    }
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    } else {
      audioRef.current.play().catch(() => setAvailable(false))
      setPlaying(true)
    }
  }

  if (size === 'sm') {
    return (
      <button
        onClick={toggle}
        className={`shrink-0 p-1 transition-colors ${playing ? 'text-gwc-accent' : 'text-gwc-muted hover:text-gwc-accent'}`}
      >
        {playing ? '⏸' : '🔊'}
      </button>
    )
  }

  if (size === 'lg') {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          playing
            ? 'bg-gwc-accent/30 border border-gwc-accent/50 text-gwc-accent-soft'
            : 'bg-gwc-accent/10 border border-gwc-accent/25 text-gwc-accent hover:bg-gwc-accent/20'
        }`}
      >
        {playing ? '⏸ Stop' : '🔊 Listen'}
      </button>
    )
  }

  // md (default) — round button
  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors font-bold ${
        playing
          ? 'bg-gwc-accent text-white'
          : 'bg-white/10 text-gwc-muted hover:bg-gwc-accent/30 hover:text-gwc-accent-soft'
      }`}
    >
      {playing ? '⏸' : '▶'}
    </button>
  )
}
