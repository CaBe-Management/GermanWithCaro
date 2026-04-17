'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
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
}


interface Sentence {
  id: string
  video_id: string
  sentence_de: string
  sentence_en: string
  highlight_de: string | null
  highlight_en: string | null
  sort_order: number
}

export default function AdminVideoSentencesPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New sentence form
  const [sentenceDe, setSentenceDe] = useState('')
  const [sentenceEn, setSentenceEn] = useState('')
  const [highlightDe, setHighlightDe] = useState('')
  const [highlightEn, setHighlightEn] = useState('')

  // Bulk input mode
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDe, setEditDe] = useState('')
  const [editEn, setEditEn] = useState('')
  const [editHighlightDe, setEditHighlightDe] = useState('')
  const [editHighlightEn, setEditHighlightEn] = useState('')

  useEffect(() => {
    checkAdminAndLoad()
  }, [videoId])

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== 'caroline091996@gmail.com') { router.push('/dashboard'); return }
    await loadData()
  }

  async function loadData() {
    setLoading(true)
    const [{ data: vid }, { data: sents }] = await Promise.all([
      supabase.from('gwc_videos').select('*').eq('id', videoId).single(),
      supabase.from('gwc_video_sentences').select('*').eq('video_id', videoId).order('sort_order'),
    ])
    if (vid) setVideo(vid)
    if (sents) setSentences(sents)
    setLoading(false)
  }

  async function addSentence(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const nextOrder = sentences.length > 0
      ? Math.max(...sentences.map(s => s.sort_order)) + 1
      : 0

    const { data, error } = await supabase
      .from('gwc_video_sentences')
      .insert({
        video_id: videoId,
        sentence_de: sentenceDe.trim(),
        sentence_en: sentenceEn.trim(),
        highlight_de: highlightDe.trim() || null,
        highlight_en: highlightEn.trim() || null,
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setSentences(prev => [...prev, data])
      setSentenceDe('')
      setSentenceEn('')
      setHighlightDe('')
      setHighlightEn('')
      setSuccess('Satz hinzugefügt!')
      setTimeout(() => setSuccess(null), 2000)
    }
    setSaving(false)
  }

  // Bulk add: parse "DE | EN" lines
  async function addBulk(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const lines = bulkText.trim().split('\n').filter(l => l.trim())
    const rows = lines.map((line, i) => {
      const parts = line.split('|')
      const de = parts[0]?.trim() ?? ''
      const en = parts[1]?.trim() ?? ''
      return { video_id: videoId, sentence_de: de, sentence_en: en, sort_order: sentences.length + i }
    }).filter(r => r.sentence_de && r.sentence_en)

    if (rows.length === 0) {
      setError('Format: "Deutscher Satz | English sentence" — eine pro Zeile')
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('gwc_video_sentences')
      .insert(rows)
      .select()

    if (error) {
      setError(error.message)
    } else {
      setSentences(prev => [...prev, ...(data ?? [])])
      setBulkText('')
      setSuccess(`${rows.length} Sätze hinzugefügt!`)
      setTimeout(() => setSuccess(null), 3000)
      setBulkMode(false)
    }
    setSaving(false)
  }

  async function deleteSentence(id: string) {
    await supabase.from('gwc_video_sentences').delete().eq('id', id)
    setSentences(prev => prev.filter(s => s.id !== id))
  }

  async function moveSentence(index: number, direction: 'up' | 'down') {
    const newSentences = [...sentences]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newSentences.length) return

    // Swap in local state
    ;[newSentences[index], newSentences[swapIndex]] = [newSentences[swapIndex], newSentences[index]]

    // Reassign sort_order to match new positions
    const updated = newSentences.map((s, i) => ({ ...s, sort_order: i }))
    setSentences(updated)

    // Persist both swapped rows
    await Promise.all([
      supabase.from('gwc_video_sentences').update({ sort_order: updated[index].sort_order }).eq('id', updated[index].id),
      supabase.from('gwc_video_sentences').update({ sort_order: updated[swapIndex].sort_order }).eq('id', updated[swapIndex].id),
    ])
  }

  function startEdit(s: Sentence) {
    setEditingId(s.id)
    setEditDe(s.sentence_de)
    setEditEn(s.sentence_en)
    setEditHighlightDe(s.highlight_de ?? '')
    setEditHighlightEn(s.highlight_en ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    if (!editDe.trim() || !editEn.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('gwc_video_sentences')
      .update({
        sentence_de: editDe.trim(),
        sentence_en: editEn.trim(),
        highlight_de: editHighlightDe.trim() || null,
        highlight_en: editHighlightEn.trim() || null,
      })
      .eq('id', id)
    if (!error) {
      setSentences(prev => prev.map(s => s.id === id ? {
        ...s,
        sentence_de: editDe.trim(),
        sentence_en: editEn.trim(),
        highlight_de: editHighlightDe.trim() || null,
        highlight_en: editHighlightEn.trim() || null,
      } : s))
      setEditingId(null)
    } else {
      setError(error.message)
    }
    setSaving(false)
  }

  async function togglePublish() {
    if (!video) return
    const { error } = await supabase
      .from('gwc_videos')
      .update({ is_draft: !video.is_draft })
      .eq('id', videoId)
    if (!error) setVideo({ ...video, is_draft: !video.is_draft })
  }

  async function fetchAndSaveThumbnail() {
    if (!video || video.platform !== 'tiktok') return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tiktok-meta?url=${encodeURIComponent(video.video_url)}`)
      if (!res.ok) throw new Error('TikTok API nicht erreichbar')
      const data = await res.json()
      if (!data.thumbnail_url) throw new Error('Kein Cover gefunden')
      const { error } = await supabase
        .from('gwc_videos')
        .update({ thumbnail_url: data.thumbnail_url })
        .eq('id', videoId)
      if (error) throw new Error(error.message)
      setVideo({ ...video, thumbnail_url: data.thumbnail_url })
      setSuccess('Cover geladen!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Covers')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-[#9b98b0]">Video not found.</p>
          <Link href="/admin/videos" className="text-[#7c6df2] mt-4 inline-block">← Back</Link>
        </div>
      </div>
    )
  }

  const tiktokEmbedUrl = video.platform === 'tiktok'
    ? `https://www.tiktok.com/embed/v2/${video.video_id}`
    : null

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Link href="/admin/videos" className="mt-1 text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-xl">
            ←
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#e8e6f0] leading-tight">{video.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[#9b98b0]">{video.platform === 'tiktok' ? '📱 TikTok' : '▶️ YouTube'} · {video.level}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                video.is_draft ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {video.is_draft ? 'Draft' : 'Published'}
              </span>
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#7c6df2] hover:underline"
              >
                Open video ↗
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {video.platform === 'tiktok' && !video.thumbnail_url && (
              <button
                onClick={fetchAndSaveThumbnail}
                disabled={saving}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-white/5 text-[#9b98b0] hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                🖼 Load cover
              </button>
            )}
            <button
              onClick={togglePublish}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                video.is_draft
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow/30'
              }`}
            >
              {video.is_draft ? '✓ Publish' : '⟳ Unpublish'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: TikTok embed + add sentences */}
          <div className="space-y-6">

            {/* Embed preview */}
            {tiktokEmbedUrl && (
              <div className="bg-[#1a1830] rounded-xl border border-white/8 p-4">
                <p className="text-xs text-[#9b98b0] mb-3 font-medium">Video preview</p>
                <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
                  <iframe
                    src={tiktokEmbedUrl}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  />
                </div>
              </div>
            )}

            {/* Add sentence form */}
            <div className="bg-[#1a1830] rounded-xl border border-white/8 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#e8e6f0]">Add sentence</h2>
                <button
                  onClick={() => setBulkMode(v => !v)}
                  className="text-xs text-[#7c6df2] hover:underline"
                >
                  {bulkMode ? '← Single' : 'Add multiple →'}
                </button>
              </div>

              {/* Feedback */}
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              {success && <p className="text-emerald-400 text-sm mb-3">{success}</p>}

              {bulkMode ? (
                <form onSubmit={addBulk} className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#9b98b0] mb-1.5">
                      Format: <code className="bg-white/5 px-1 rounded text-[#7c6df2]">German sentence | English sentence</code> — one line per sentence
                    </label>
                    <textarea
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      rows={8}
                      placeholder={`Ich bin müde. | I am tired.\nWo wohnst du? | Where do you live?\nDas ist sehr schön! | That is very beautiful!`}
                      className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2] resize-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !bulkText.trim()}
                    className="w-full py-2 bg-[#7c6df2] text-white rounded-lg text-sm font-semibold hover:bg-[#6b5de0] disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Add all'}
                  </button>
                </form>
              ) : (
                <form onSubmit={addSentence} className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#9b98b0] mb-1">🇩🇪 Deutscher Satz</label>
                    <input
                      type="text"
                      value={sentenceDe}
                      onChange={e => setSentenceDe(e.target.value)}
                      placeholder="Ich bin sehr müde heute."
                      required
                      className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#9b98b0] mb-1">🇬🇧 English translation</label>
                    <input
                      type="text"
                      value={sentenceEn}
                      onChange={e => setSentenceEn(e.target.value)}
                      placeholder="I am very tired today."
                      required
                      className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#9b98b0] mb-1">Highlight DE (optional)</label>
                      <input
                        type="text"
                        value={highlightDe}
                        onChange={e => setHighlightDe(e.target.value)}
                        placeholder="müde"
                        className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#9b98b0] mb-1">Highlight EN (optional)</label>
                      <input
                        type="text"
                        value={highlightEn}
                        onChange={e => setHighlightEn(e.target.value)}
                        placeholder="tired"
                        className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !sentenceDe.trim() || !sentenceEn.trim()}
                    className="w-full py-2 bg-[#7c6df2] text-white rounded-lg text-sm font-semibold hover:bg-[#6b5de0] disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : '+ Add sentence'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: Sentence list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#e8e6f0]">
                Sentences ({sentences.length})
              </h2>
              {sentences.length > 0 && (
                <a
                  href={`/videos/${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#7c6df2] hover:underline"
                >
                  Preview ↗
                </a>
              )}
            </div>

            {sentences.length === 0 ? (
              <div className="bg-[#1a1830] rounded-xl border border-white/8 p-8 text-center">
                <p className="text-3xl mb-3">📝</p>
                <p className="text-[#9b98b0] text-sm">No sentences yet.</p>
                <p className="text-[#9b98b0] text-xs mt-1">Add sentences from the video.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sentences.map((s, i) => (
                  <div
                    key={s.id}
                    className="bg-[#1a1830] rounded-xl border border-white/8 p-4"
                  >
                    {editingId === s.id ? (
                      /* ── Edit mode ── */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-[#4a4760] font-mono w-5 shrink-0">{i + 1}</span>
                          <span className="text-xs text-[#7c6df2] font-semibold">Editing</span>
                        </div>
                        <input
                          type="text"
                          value={editDe}
                          onChange={e => setEditDe(e.target.value)}
                          placeholder="🇩🇪 German sentence"
                          className="w-full bg-[#0f0e17] border border-[#7c6df2]/50 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                        />
                        <input
                          type="text"
                          value={editEn}
                          onChange={e => setEditEn(e.target.value)}
                          placeholder="🇬🇧 English translation"
                          className="w-full bg-[#0f0e17] border border-[#7c6df2]/50 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editHighlightDe}
                            onChange={e => setEditHighlightDe(e.target.value)}
                            placeholder="Highlight DE (optional)"
                            className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                          />
                          <input
                            type="text"
                            value={editHighlightEn}
                            onChange={e => setEditHighlightEn(e.target.value)}
                            placeholder="Highlight EN (optional)"
                            className="w-full bg-[#0f0e17] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e6f0] placeholder:text-[#4a4760] focus:outline-none focus:border-[#7c6df2]"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEdit(s.id)}
                            disabled={saving || !editDe.trim() || !editEn.trim()}
                            className="flex-1 py-1.5 bg-[#7c6df2] text-white rounded-lg text-xs font-semibold hover:bg-[#6b5de0] disabled:opacity-50 transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-1.5 bg-white/5 text-[#9b98b0] rounded-lg text-xs font-semibold hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── View mode ── */
                      <div className="flex items-start gap-3">
                        {/* Reorder buttons */}
                        <div className="flex flex-col shrink-0 mt-0.5">
                          <button
                            onClick={() => moveSentence(i, 'up')}
                            disabled={i === 0}
                            className="p-0.5 text-[#4a4760] hover:text-[#9b8cf5] disabled:opacity-20 disabled:cursor-default transition-colors"
                            title="Move up"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSentence(i, 'down')}
                            disabled={i === sentences.length - 1}
                            className="p-0.5 text-[#4a4760] hover:text-[#9b8cf5] disabled:opacity-20 disabled:cursor-default transition-colors"
                            title="Move down"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-xs text-[#4a4760] font-mono mt-0.5 w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#e8e6f0] font-medium leading-snug">
                            {s.highlight_de ? (
                              s.sentence_de.split(s.highlight_de).map((part, idx, arr) => (
                                idx < arr.length - 1 ? (
                                  <span key={idx}>{part}<span className="text-[#9b8cf5] font-bold">{s.highlight_de}</span></span>
                                ) : part
                              ))
                            ) : s.sentence_de}
                          </p>
                          <p className="text-xs text-[#9b98b0] mt-0.5 leading-snug">
                            {s.highlight_en ? (
                              s.sentence_en.split(s.highlight_en).map((part, idx, arr) => (
                                idx < arr.length - 1 ? (
                                  <span key={idx}>{part}<span className="text-[#9b8cf5]">{s.highlight_en}</span></span>
                                ) : part
                              ))
                            ) : s.sentence_en}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            onClick={() => startEdit(s)}
                            className="p-1.5 text-[#4a4760] hover:text-[#9b8cf5] transition-colors rounded"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteSentence(s.id)}
                            className="p-1.5 text-[#4a4760] hover:text-[#f87171] transition-colors rounded"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
