'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import type { GrammarTopic, VocabWord } from '@/lib/supabase'
import WordRow from '@/components/WordRow'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordWithReviewCount extends VocabWord {
  reviewCount: number
}

interface VerbResult {
  id: string
  slug: string
  word: string
  translation_en: string
  level: string
  category: string
  auxiliary: string | null
  partizip_ii: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  verb_conjugation: 'Verb Conjugation',
  adjective_usage:  'Adjective Usage',
  preposition:      'Preposition',
  word_order:       'Word Order',
  case_system:      'Case System',
  modal_verbs:      'Modal Verbs',
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState<'all' | 'vocab' | 'grammar' | 'verbs'>('all')
  const [loading, setLoading] = useState(false)

  const [wordResults,    setWordResults]    = useState<WordWithReviewCount[]>([])
  const [grammarResults, setGrammarResults] = useState<GrammarTopic[]>([])
  const [verbResults,    setVerbResults]    = useState<VerbResult[]>([])

  useEffect(() => {
    const search = async () => {
      if (query.trim().length === 0) {
        setWordResults([])
        setGrammarResults([])
        setVerbResults([])
        return
      }

      setLoading(true)
      try {
        const sessionId = getOrCreateSessionId()
        const q = query.trim()

        // ── Vocab words — match German OR English ─────────────────────────────
        if (filter === 'all' || filter === 'vocab') {
          const [{ data: byDE }, { data: byEN }] = await Promise.all([
            supabase.from('gwc_vocab').select('*').ilike('word', `%${q}%`).limit(30),
            supabase.from('gwc_vocab').select('*').ilike('translation_en', `%${q}%`).limit(30),
          ])

          // Merge + deduplicate by id
          const merged: VocabWord[] = []
          const seen = new Set<string>()
          for (const w of [...(byDE || []), ...(byEN || [])]) {
            if (!seen.has(w.id)) { seen.add(w.id); merged.push(w) }
          }
          merged.sort((a, b) => (a.frequency_rank ?? 999) - (b.frequency_rank ?? 999))

          if (merged.length > 0) {
            const { data: reviews } = await supabase
              .from('gwc_vocab_reviews').select('vocab_id').eq('session_id', sessionId)
            const reviewsPerVocab: Record<string, number> = {}
            ;(reviews || []).forEach((r: { vocab_id: string }) => {
              reviewsPerVocab[r.vocab_id] = (reviewsPerVocab[r.vocab_id] || 0) + 1
            })
            setWordResults(merged.map((w: VocabWord) => ({ ...w, reviewCount: reviewsPerVocab[w.id] || 0 })))
          } else {
            setWordResults([])
          }
        } else {
          setWordResults([])
        }

        // ── Grammar topics — match title OR explanation_en OR translation_en ──
        if (filter === 'all' || filter === 'grammar') {
          const [{ data: byTitle }, { data: byExpl }, { data: byTrans }] = await Promise.all([
            supabase.from('gwc_grammar_topics').select('*').ilike('title', `%${q}%`).limit(20),
            supabase.from('gwc_grammar_topics').select('*').ilike('explanation_en', `%${q}%`).limit(20),
            supabase.from('gwc_grammar_topics').select('*').ilike('translation_en', `%${q}%`).limit(20),
          ])

          const merged: GrammarTopic[] = []
          const seen = new Set<string>()
          for (const t of [...(byTitle || []), ...(byExpl || []), ...(byTrans || [])]) {
            if (!seen.has(t.id)) { seen.add(t.id); merged.push(t) }
          }
          merged.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
          setGrammarResults(merged)
        } else {
          setGrammarResults([])
        }

        // ── Verbs — match German word OR English translation ──────────────────
        if (filter === 'all' || filter === 'verbs') {
          const [{ data: byDE }, { data: byEN }] = await Promise.all([
            supabase.from('gwc_verbs').select('id,slug,word,translation_en,level,category,auxiliary,partizip_ii').ilike('word', `%${q}%`).limit(20),
            supabase.from('gwc_verbs').select('id,slug,word,translation_en,level,category,auxiliary,partizip_ii').ilike('translation_en', `%${q}%`).limit(20),
          ])

          const merged: VerbResult[] = []
          const seen = new Set<string>()
          for (const v of [...(byDE || []), ...(byEN || [])]) {
            if (!seen.has(v.id)) { seen.add(v.id); merged.push(v) }
          }
          merged.sort((a, b) => a.word.localeCompare(b.word))
          setVerbResults(merged)
        } else {
          setVerbResults([])
        }

      } catch (e) {
        console.error('Search error:', e)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query, filter])

  const hasResults = wordResults.length > 0 || grammarResults.length > 0 || verbResults.length > 0
  const isEmpty    = query.trim().length === 0

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e8e6f0] mb-1">Search</h1>
          <p className="text-[#9b98b0] text-sm">Search in German or English — words, grammar and verbs.</p>
        </div>

        {/* ── Search input ── */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search in German or English…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors text-lg"
          />
        </div>

        {/* ── Filter buttons ── */}
        <div className="flex gap-2 flex-wrap mb-8">
          {([
            { id: 'all',     label: 'All' },
            { id: 'vocab',   label: 'Words' },
            { id: 'verbs',   label: 'Verbs' },
            { id: 'grammar', label: 'Grammar' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                filter === f.id
                  ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                  : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && isEmpty && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-[#9b98b0]">Search in German or English — words, verbs and grammar topics.</p>
          </div>
        )}

        {/* ── No results ── */}
        {!loading && !isEmpty && !hasResults && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-[#e8e6f0] font-medium mb-1">No results for "{query}"</p>
            <p className="text-[#9b98b0] text-sm">Try a different search or check the spelling.</p>
          </div>
        )}

        {/* ── Vocab results ── */}
        {!loading && wordResults.length > 0 && (
          <div className="mb-8">
            {filter === 'all' && (
              <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">
                Words ({wordResults.length})
              </p>
            )}
            <div className="space-y-3">
              {wordResults.map(word => (
                <WordRow key={word.id} word={word} reviewCount={word.reviewCount} />
              ))}
            </div>
          </div>
        )}

        {/* ── Verb results ── */}
        {!loading && verbResults.length > 0 && (
          <div className="mb-8">
            {filter === 'all' && (
              <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">
                Verbs ({verbResults.length})
              </p>
            )}
            <div className="space-y-3">
              {verbResults.map(verb => (
                <Link
                  key={verb.id}
                  href={`/verbs/${verb.slug}`}
                  className="flex items-center gap-4 bg-[#1a1830] rounded-2xl px-4 py-3.5 border border-white/5 hover:border-[#7c6df2]/40 transition-all group"
                >
                  {/* Level badge */}
                  <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold border ${levelColor(verb.level)}`}>
                    {verb.level}
                  </span>
                  {/* Verb + translation */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#e8e6f0] group-hover:text-[#9b8cf5] transition-colors">
                      {verb.word}
                    </p>
                    <p className="text-sm text-[#9b98b0] truncate">{verb.translation_en}</p>
                  </div>
                  {/* Category */}
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {verb.category}
                  </span>
                  <span className="text-[#7c6df2] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Grammar topic results ── */}
        {!loading && grammarResults.length > 0 && (
          <div>
            {filter === 'all' && (
              <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">
                Grammar ({grammarResults.length})
              </p>
            )}
            <div className="space-y-3">
              {grammarResults.map(topic => (
                <Link
                  key={topic.id}
                  href={`/grammar/${topic.slug}`}
                  className="block bg-[#1a1830] rounded-2xl p-4 border border-white/5 hover:border-[#7c6df2]/40 transition-all hover:shadow-lg hover:shadow-[#7c6df2]/10 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold border ${levelColor(topic.level)}`}>
                          {topic.level}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 text-[#9b98b0] border border-white/10 shrink-0">
                          {CATEGORY_LABELS[topic.category] ?? topic.category}
                        </span>
                      </div>
                      <p className="font-bold text-[#e8e6f0] group-hover:text-[#9b8cf5] transition-colors">
                        {topic.title}
                      </p>
                      {topic.translation_en && (
                        <p className="text-xs text-[#9b98b0] mt-0.5 truncate">{topic.translation_en}</p>
                      )}
                    </div>
                    <span className="text-[#7c6df2] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
