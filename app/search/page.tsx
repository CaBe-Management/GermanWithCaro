'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import type { GrammarTopic, Word } from '@/lib/supabase'
import WordRow from '@/components/WordRow'
import Navbar from '@/components/Navbar'

interface WordWithReviewCount extends Word {
  reviewCount: number
}

// Category labels for grammar topics
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

export default function SearchPage() {
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState<'all' | 'vocab' | 'grammar'>('all')
  const [loading, setLoading] = useState(false)

  const [wordResults, setWordResults]       = useState<WordWithReviewCount[]>([])
  const [grammarResults, setGrammarResults] = useState<GrammarTopic[]>([])

  useEffect(() => {
    const search = async () => {
      if (query.trim().length === 0) {
        setWordResults([])
        setGrammarResults([])
        return
      }

      setLoading(true)
      try {
        const sessionId = getOrCreateSessionId()
        const q = query.trim()

        // ── Vocab words ───────────────────────────────────────────────────────
        if (filter === 'all' || filter === 'vocab') {
          const { data: words } = await supabase
            .from('gwc_words')
            .select('*')
            .ilike('word', `%${q}%`)
            .limit(30)

          if (words && words.length > 0) {
            const wordIds = words.map((w: Word) => w.id)
            const [{ data: sentences }, { data: reviews }] = await Promise.all([
              supabase.from('gwc_word_sentences').select('id, word_id').in('word_id', wordIds),
              supabase.from('gwc_user_reviews').select('word_sentence_id').eq('session_id', sessionId).eq('item_type', 'vocab'),
            ])

            const sentenceToWord: Record<string, string> = {}
            ;(sentences || []).forEach((s: { id: string; word_id: string }) => { sentenceToWord[s.id] = s.word_id })
            const reviewsPerWord: Record<string, number> = {}
            ;(reviews || []).forEach((r: { word_sentence_id: string }) => {
              const wid = sentenceToWord[r.word_sentence_id]
              if (wid) reviewsPerWord[wid] = (reviewsPerWord[wid] || 0) + 1
            })

            setWordResults(words.map((w: Word) => ({ ...w, reviewCount: reviewsPerWord[w.id] || 0 })))
          } else {
            setWordResults([])
          }
        } else {
          setWordResults([])
        }

        // ── Grammar topics ────────────────────────────────────────────────────
        if (filter === 'all' || filter === 'grammar') {
          const { data: topics } = await supabase
            .from('gwc_grammar_topics')
            .select('*')
            .ilike('title', `%${q}%`)
            .order('sort_order', { ascending: true })
            .limit(20)

          setGrammarResults((topics as GrammarTopic[]) || [])
        } else {
          setGrammarResults([])
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

  const hasResults = wordResults.length > 0 || grammarResults.length > 0
  const isEmpty    = query.trim().length === 0

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e8e6f0] mb-1">Search</h1>
          <p className="text-[#9b98b0] text-sm">Search words and grammar topics.</p>
        </div>

        {/* ── Search input ── */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search words or grammar topics…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors text-lg"
          />
        </div>

        {/* ── Filter buttons ── */}
        <div className="flex gap-2 flex-wrap mb-8">
          {(['all', 'vocab', 'grammar'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                filter === f
                  ? 'bg-[#7c6df2] text-white border-[#7c6df2]'
                  : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20 hover:text-[#e8e6f0]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'vocab' ? 'Words' : 'Grammar Topics'}
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
            <p className="text-[#9b98b0]">Start typing to search words and grammar topics.</p>
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

        {/* ── Word results ── */}
        {!loading && wordResults.length > 0 && (
          <div className="mb-8">
            {(filter === 'all') && (
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

        {/* ── Grammar topic results ── */}
        {!loading && grammarResults.length > 0 && (
          <div>
            {(filter === 'all') && (
              <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">
                Grammar Topics ({grammarResults.length})
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
                    </div>
                    <span className="text-[#7c6df2] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                      →
                    </span>
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
