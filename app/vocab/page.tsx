'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { VocabWord } from '@/lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  NOMEN:      'Noun',
  VERB:       'Verb',
  ADJEKTIV:   'Adjective',
  AUSDRUCK:   'Expression',
  ADVERB:     'Adverb',
  PRÄPOSITION: 'Preposition',
}

function typeColor(type: string): string {
  switch (type) {
    case 'NOMEN':       return 'bg-[#7c6df2]/15 text-[#9b8cf5] border-[#7c6df2]/25'
    case 'VERB':        return 'bg-[#3bd395]/10 text-[#3bd395] border-[#3bd395]/25'
    case 'ADJEKTIV':    return 'bg-[#ffc850]/10 text-[#ffc850] border-[#ffc850]/25'
    case 'AUSDRUCK':    return 'bg-blue-500/15 text-blue-300 border-blue-500/25'
    case 'ADVERB':      return 'bg-orange-500/15 text-orange-300 border-orange-500/25'
    case 'PRÄPOSITION': return 'bg-pink-500/15 text-pink-300 border-pink-500/25'
    default:            return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

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

// ─── Word Card ────────────────────────────────────────────────────────────────

function WordCard({ word }: { word: VocabWord }) {
  return (
    <Link
      href={`/vocab/${word.slug}`}
      className="block bg-[#1a1830] rounded-2xl p-5 border border-white/5 hover:border-[#7c6df2]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[#7c6df2]/10 group"
    >
      {/* Article + word + level */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2">
          {word.article && (
            <span className="text-[#7c6df2] text-sm font-bold">{word.article}</span>
          )}
          <h3 className="font-extrabold text-[#e8e6f0] text-xl leading-tight group-hover:text-[#9b8cf5] transition-colors">
            {word.word}
          </h3>
        </div>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelColor(word.level)}`}>
          {word.level}
        </span>
      </div>

      {/* Translation */}
      <p className="text-[#9b98b0] text-sm mb-3">{word.translation_en}</p>

      {/* Type badge + frequency rank */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${typeColor(word.type)}`}>
          {TYPE_LABELS[word.type] ?? word.type}
        </span>
        {word.plural && (
          <span className="text-xs text-[#9b98b0]">pl. {word.plural}</span>
        )}
        {word.frequency_rank && (
          <span className="text-xs text-[#9b98b0] ml-auto">⚡ #{word.frequency_rank}</span>
        )}
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

export default function VocabPage() {
  const [words, setWords]           = useState<VocabWord[]>([])
  const [loading, setLoading]       = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter]   = useState<string>('all')
  const [search, setSearch]           = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('gwc_vocab')
          .select('*')
          .order('frequency_rank', { ascending: true, nullsFirst: false })

        if (error) throw error
        setWords((data || []) as VocabWord[])
      } catch (e) {
        console.error('Vocab load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Derived filter options
  const levels     = [...new Set(words.map(w => w.level))].sort()
  const types      = [...new Set(words.map(w => w.type))].sort()

  const filtered = words.filter(w => {
    if (levelFilter !== 'all' && w.level !== levelFilter) return false
    if (typeFilter  !== 'all' && w.type  !== typeFilter)  return false
    if (search && !w.word.toLowerCase().includes(search.toLowerCase()) &&
                  !w.translation_en.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by level
  const byLevel: Record<string, VocabWord[]> = {}
  filtered.forEach(w => {
    if (!byLevel[w.level]) byLevel[w.level] = []
    byLevel[w.level].push(w)
  })
  const sortedLevels = Object.keys(byLevel).sort()

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e8e6f0] mb-1">Vocabulary</h1>
          <p className="text-[#9b98b0] text-sm">
            Browse all words. Click a word to see explanations, declensions, and practice sentences.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search words or translations…"
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

          {/* Type filter */}
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              typeFilter === 'all'
                ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
            }`}
          >
            All Types
          </button>
          {types.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                typeFilter === type
                  ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                  : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
              }`}
            >
              {TYPE_LABELS[type] ?? type}
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
            <p className="text-4xl mb-4">📚</p>
            <p className="text-[#9b98b0]">No words match your filters.</p>
          </div>
        )}

        {/* ── Words grouped by level ── */}
        {!loading && sortedLevels.map(level => (
          <div key={level} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#e8e6f0]">{level}</h2>
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-[#9b98b0]">{byLevel[level].length} words</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {byLevel[level].map(word => (
                <WordCard key={word.id} word={word} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
