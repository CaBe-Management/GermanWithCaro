'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Video {
  id: string
  platform: string
  video_id: string
  video_url: string
  title: string
  description: string | null
  thumbnail_url: string | null
  level: string
  is_draft: boolean
  sentences_done: boolean
  sort_order: number
  created_at: string
  sentence_count?: number
}

type AdminFilter = 'all' | 'todo' | 'done'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/20 text-emerald-400',
  A2: 'bg-green-500/20 text-green-400',
  B1: 'bg-blue-500/20 text-blue-400',
  B2: 'bg-purple-500/20 text-purple-400',
  C1: 'bg-red-500/20 text-red-400',
  C2: 'bg-orange-500/20 text-orange-400',
}

// Extract TikTok video ID from URL
function extractTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : null
}

export default function AdminVideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminFilter, setAdminFilter] = useState<AdminFilter>('all')

  // Form state
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState('A1')
  const [platform, setPlatform] = useState<'tiktok' | 'youtube'>('tiktok')
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== 'caroline091996@gmail.com') { router.push('/dashboard'); return }
    await loadVideos()
  }

  async function loadVideos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('gwc_videos')
      .select('*, gwc_video_sentences(id)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!error && data) {
      const enriched = data.map((v: Video & { gwc_video_sentences?: { id: string }[] }) => ({
        ...v,
        sentence_count: v.gwc_video_sentences?.length ?? 0,
      }))
      setVideos(enriched)
    }
    setLoading(false)
  }

  // Auto-detect platform from URL and try to fetch metadata
  async function handleUrlChange(value: string) {
    setUrl(value)
    if (value.includes('tiktok.com')) {
      setPlatform('tiktok')
    } else if (value.includes('youtube.com') || value.includes('youtu.be')) {
      setPlatform('youtube')
    }
  }

  async function fetchTikTokMeta() {
    const videoId = extractTikTokId(url)
    if (!videoId) { setError('Kein gültiger TikTok-Link.'); return }
    setFetchingMeta(true)
    setError(null)
    try {
      const res = await fetch(`/api/tiktok-meta?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error('TikTok API nicht erreichbar')
      const data = await res.json()
      if (data.title) setTitle(data.title)
      if (data.thumbnail_url) setThumbnailUrl(data.thumbnail_url)
    } catch {
      setError('Konnte Metadaten nicht laden – Titel und Cover bitte manuell eingeben.')
    }
    setFetchingMeta(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const videoId = platform === 'tiktok'
      ? extractTikTokId(url)
      : extractYouTubeId(url)

    if (!videoId) {
      setError('Kein gültiger Video-Link.')
      setSaving(false)
      return
    }

    // Build thumbnail URL
    const resolvedThumbnailUrl = platform === 'youtube'
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : thumbnailUrl // Set via oEmbed when URL was entered

    const { data, error } = await supabase
      .from('gwc_videos')
      .insert({
        platform,
        video_id: videoId,
        video_url: url.trim(),
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: resolvedThumbnailUrl,
        level,
        is_draft: true,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    // Redirect to sentence editor
    router.push(`/admin/videos/${data.id}`)
  }

  async function toggleDraft(video: Video) {
    await supabase
      .from('gwc_videos')
      .update({ is_draft: !video.is_draft })
      .eq('id', video.id)
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_draft: !v.is_draft } : v))
  }

  async function toggleDone(video: Video) {
    await supabase
      .from('gwc_videos')
      .update({ sentences_done: !video.sentences_done })
      .eq('id', video.id)
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, sentences_done: !v.sentences_done } : v))
  }

  async function deleteVideo(id: string) {
    if (!confirm('Video und alle Sätze wirklich löschen?')) return
    await supabase.from('gwc_videos').delete().eq('id', id)
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#e8e6f0]">🎬 Video Management</h1>
            <p className="text-[#9b98b0] text-sm mt-1">TikTok & YouTube Videos with learning sentences</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c6df2] text-white rounded-lg font-semibold text-sm hover:bg-[#6b5de0] transition-colors"
          >
            <span className="text-base">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancel' : 'Add video'}
          </button>
        </div>

        {/* Add Video Form */}
        {showForm && (
          <div className="bg-[#1a1830] rounded-2xl border border-white/8 p-6 mb-8">
            <h2 className="text-lg font-semibold text-[#e8e6f0] mb-4">New video</h2>
            <form onSubmit={handleSave} className="space-y-4">

              {/* URL */}
              <div>
                <label className="block text-sm text-[#9b98b0] mb-1.5">Video link (TikTok or YouTube)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => handleUrlChange(e.target.value)}
                    onBlur={() => url.includes('tiktok.com') && fetchTikTokMeta()}
                    placeholder="https://www.tiktok.com/@germanwithcaro/video/..."
                    required
                    className="flex-1 bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                  />
                  <span className="flex items-center px-3 py-2 bg-white/5 rounded-lg text-sm text-[#9b98b0] border border-white/8">
                    {platform === 'tiktok' ? '📱 TikTok' : '▶️ YouTube'}
                  </span>
                </div>
                {fetchingMeta && <p className="text-xs text-[#7c6df2] mt-1">Loading metadata...</p>}
                {thumbnailUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={thumbnailUrl} alt="Cover preview" className="w-20 h-14 object-cover rounded-lg" />
                    <span className="text-xs text-emerald-400">✓ Cover loaded</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-[#9b98b0] mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder='z.B. "10 German sentences for beginners"'
                  required
                  className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-[#9b98b0] mb-1.5">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Kurze Beschreibung des Videos..."
                  className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2] resize-none"
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm text-[#9b98b0] mb-1.5">Level</label> {/* No translation for Level labels A1-C2 */}
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        level === l
                          ? 'bg-[#7c6df2] text-white'
                          : 'bg-white/5 text-[#9b98b0] hover:bg-white/10'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-[#9b98b0] hover:text-[#e8e6f0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#7c6df2] text-white rounded-lg text-sm font-semibold hover:bg-[#6b5de0] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save & add sentences →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        {videos.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {([
              { key: 'all',  label: 'All',     count: videos.length },
              { key: 'todo', label: '⬜ To Do', count: videos.filter(v => !v.sentences_done).length },
              { key: 'done', label: '✅ Done',  count: videos.filter(v => v.sentences_done).length },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setAdminFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  adminFilter === f.key
                    ? 'bg-[#7c6df2]/30 text-[#9b8cf5]'
                    : 'bg-white/5 text-[#9b98b0] hover:bg-white/10'
                }`}
              >
                {f.label}
                <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{f.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Video list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎬</p>
            <p className="text-[#9b98b0]">No videos yet. Add your first video!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.filter(v => {
              if (adminFilter === 'todo') return !v.sentences_done
              if (adminFilter === 'done') return v.sentences_done
              return true
            }).map(video => (
              <div
                key={video.id}
                className={`bg-[#1a1830] rounded-xl border p-4 transition-colors ${
                  video.is_draft ? 'border-white/5 opacity-75' : 'border-white/8'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded-lg shrink-0 bg-white/5"
                    />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-2xl">
                      {video.platform === 'tiktok' ? '📱' : '▶️'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${LEVEL_COLORS[video.level] ?? 'bg-white/10 text-[#9b98b0]'}`}>
                        {video.level}
                      </span>
                      <span className="text-xs text-[#9b98b0]">
                        {video.platform === 'tiktok' ? '📱 TikTok' : '▶️ YouTube'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        video.is_draft
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {video.is_draft ? 'Draft' : 'Published'}
                      </span>
                    </div>
                    <p className="text-[#e8e6f0] font-semibold text-sm truncate">{video.title}</p>
                    <p className="text-[#9b98b0] text-xs mt-0.5">
                      {video.sentence_count ?? 0} sentences
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleDone(video)}
                      title={video.sentences_done ? 'Mark as to do' : 'Mark as done'}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        video.sentences_done
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                          : 'bg-white/5 text-[#9b98b0] hover:bg-white/10'
                      }`}
                    >
                      {video.sentences_done ? '✅ Done' : '⬜ To Do'}
                    </button>
                    <Link
                      href={`/admin/videos/${video.id}`}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#7c6df2]/20 text-[#9b8cf5] rounded-lg hover:bg-[#7c6df2]/30 transition-colors"
                    >
                      Edit sentences
                    </Link>
                    <button
                      onClick={() => toggleDraft(video)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        video.is_draft
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      }`}
                    >
                      {video.is_draft ? 'Publish' : 'Unpublish'}
                    </button>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="px-2 py-1.5 text-xs text-[#f87171] hover:bg-[#f87171]/10 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer link */}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
          <Link href="/videos" className="text-sm text-[#9b98b0] hover:text-[#7c6df2] transition-colors">
            → View public videos page
          </Link>
        </div>

      </div>
    </div>
  )
}
