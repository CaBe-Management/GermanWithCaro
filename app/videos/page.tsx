'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Video {
  id: string
  platform: string
  video_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string
  sentence_count: number
}

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  A2: 'bg-green-500/20 text-green-400 border-green-500/30',
  B1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  B2: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  C1: 'bg-red-500/20 text-red-400 border-red-500/30',
  C2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

function TikTokThumbnail({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="w-full aspect-video bg-gradient-to-br from-[#1a1830] to-[#0f0e17] flex items-center justify-center relative overflow-hidden rounded-t-xl">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-6xl opacity-20">📱</span>
      </div>
      <div className="relative z-10 w-12 h-12 rounded-full bg-[#7c6df2]/20 border border-[#7c6df2]/40 flex items-center justify-center">
        <svg className="w-5 h-5 text-[#9b8cf5] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState('All')

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    const { data } = await supabase
      .from('gwc_videos')
      .select('*, gwc_video_sentences(id)')
      .eq('is_draft', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (data) {
      const enriched = data.map((v: Video & { gwc_video_sentences?: { id: string }[] }) => ({
        ...v,
        sentence_count: v.gwc_video_sentences?.length ?? 0,
      }))
      setVideos(enriched)
    }
    setLoading(false)
  }

  const filtered = activeLevel === 'All'
    ? videos
    : videos.filter(v => v.level === activeLevel)

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#e8e6f0] mb-1">🎬 Learn from Videos</h1>
          <p className="text-[#9b98b0] text-sm">
            Real sentences from Caro's TikTok videos — click any sentence to add it to your SRS queue.
          </p>
        </div>

        {/* Level filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setActiveLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeLevel === l
                  ? 'bg-[#7c6df2] text-white'
                  : 'bg-white/5 text-[#9b98b0] hover:bg-white/10 hover:text-[#e8e6f0]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-[#9b98b0] text-lg">
              {activeLevel === 'All' ? 'Noch keine Videos veröffentlicht.' : `Keine ${activeLevel}-Videos gefunden.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(video => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group bg-[#1a1830] rounded-xl border border-white/8 hover:border-[#7c6df2]/40 transition-all overflow-hidden hover:shadow-lg hover:shadow-[#7c6df2]/5"
              >
                {/* Thumbnail */}
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <TikTokThumbnail videoId={video.video_id} title={video.title} />
                )}

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${LEVEL_COLORS[video.level] ?? 'bg-white/10 text-[#9b98b0] border-white/10'}`}>
                      {video.level}
                    </span>
                    <span className="text-xs text-[#9b98b0]">
                      {video.platform === 'tiktok' ? '📱' : '▶️'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#e8e6f0] leading-snug group-hover:text-[#9b8cf5] transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-xs text-[#9b98b0] mt-1 line-clamp-2">{video.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3">
                    <svg className="w-3.5 h-3.5 text-[#7c6df2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-xs text-[#9b98b0]">{video.sentence_count} sentences to learn</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
