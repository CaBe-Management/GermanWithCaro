'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { GrammarTopic } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicWithCount extends GrammarTopic {
  sentenceCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Human-readable category labels
const CATEGORY_LABELS: Record<string, string> = {
  verb_conjugation: 'Verb Conjugation',
  adjective_usage:  'Adjective Usage',
  preposition:      'Preposition',
  word_order:       'Word Order',
  case_system:      'Case System',
  modal_verbs:      'Modal Verbs',
}

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat
}

// Color for category badge
function categoryColor(cat: string): string {
  switch (cat) {
    case 'verb_conjugation': return 'bg-green-500/15 text-green-300 border-green-500/25'
    case 'adjective_usage':  return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25'
    case 'preposition':      return 'bg-blue-500/15 text-blue-300 border-blue-500/25'
    case 'word_order':       return 'bg-orange-500/15 text-orange-300 border-orange-500/25'
    case 'case_system':      return 'bg-red-500/15 text-red-300 border-red-500/25'
    default:                 return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// Color for level badge
function levelColor(level: string): string {
  switch (level) {
    case 'A1': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'A2': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'B1': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'B2': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'C1': return 'bg-red-500/20 text-red-300 border-red-500/30'
    default:   return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ topic }: { topic: TopicWithCount }) {
  return (
    <Link
      href={`/grammar/${topic.slug}`}
      className="block bg-[#1a1830] rounded-2xl p-5 border border-white/5 hover:border-[#7c6df2]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[#7c6df2]/10 group"
    >
      {/* Title + badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-[#e8e6f0] text-lg leading-tight group-hover:text-[#9b8cf5] transition-colors">
          {topic.title}
        </h3>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelColor(topic.level)}`}>
          {topic.level}
        </span>
      </div>

      {/* Category badge + sentence count */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${categoryColor(topic.category)}`}>
          {categoryLabel(topic.category)}
        </span>
        <span className="text-xs text-[#9b98b0]">
          {topic.sentenceCount} sentences
        </span>
      </div>

      {/* Arrow */}
      <div className="flex justify-end mt-3">
        <span className="text-[#7c6df2] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Study →
        </span>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GrammarPage() {
  const [topics, setTopics]         = useState<TopicWithCount[]>([])
  const [loading, setLoading]       = useState(true)
  const [levelFilter, setLevelFilter]     = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch]         = useState('')

  // Load all grammar topics + sentence counts
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Fetch topics
        const { data: topicsData, error: tErr } = await supabase
          .from('gwc_grammar_topics')
          .select('*')
          .order('sort_order', { ascending: true })

        if (tErr) throw tErr
        if (!topicsData) { setTopics([]); return }

        // Fetch sentence counts per topic
        const { data: sentences } = await supabase
          .from('gwc_grammar_sentences')
          .select('topic_id')

        const countMap: Record<string, number> = {}
        ;(sentences || []).forEach((s: { topic_id: string }) => {
          countMap[s.topic_id] = (countMap[s.topic_id] || 0) + 1
        })

        setTopics(topicsData.map((t: GrammarTopic) => ({
          ...t,
          sentenceCount: countMap[t.id] || 0,
        })))
      } catch (e) {
        console.error('Grammar load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Derived filters
  const levels = [...new Set(topics.map(t => t.level))].sort()
  const categories = [...new Set(topics.map(t => t.category))].sort()

  const filtered = topics.filter(t => {
    if (levelFilter !== 'all' && t.level !== levelFilter) return false
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matchesTitle   = t.title.toLowerCase().includes(q)
      const matchesEN      = t.translation_en?.toLowerCase().includes(q) ?? false
      const matchesExplain = t.explanation_en?.toLowerCase().includes(q) ?? false
      if (!matchesTitle && !matchesEN && !matchesExplain) return false
    }
    return true
  })

  // Group filtered topics by level for display
  const byLevel: Record<string, TopicWithCount[]> = {}
  filtered.forEach(t => {
    if (!byLevel[t.level]) byLevel[t.level] = []
    byLevel[t.level].push(t)
  })
  const sortedLevels = Object.keys(byLevel).sort()

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e8e6f0] mb-1">Grammar</h1>
          <p className="text-[#9b98b0] text-sm">
            Browse all grammar topics. Learn individually or add to your review queue.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search topics…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors"
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-2 flex-wrap mb-8">
          {/* Level filter */}
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              levelFilter === 'all'
                ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
            }`}
          >
            All Levels
          </button>
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                levelFilter === level
                  ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                  : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
              }`}
            >
              {level}
            </button>
          ))}

          <div className="w-px h-7 bg-white/10 self-center mx-1" />

          {/* Category filter */}
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              categoryFilter === 'all'
                ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
            }`}
          >
            All Types
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                categoryFilter === cat
                  ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                  : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-[#9b98b0]">No topics match your filters.</p>
          </div>
        )}

        {/* ── Topics grouped by level ── */}
        {!loading && sortedLevels.map(level => (
          <div key={level} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#e8e6f0]">{level}</h2>
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-[#9b98b0]">{byLevel[level].length} topics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {byLevel[level].map(topic => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
