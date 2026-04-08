'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { CAROS_PATHS, GRAMMAR_PATHS, VOCAB_PATHS, VERB_PATHS, ALL_LEVELS, LEVEL_COLORS, TYPE_COLORS } from '@/lib/paths'
import type { PathDef } from '@/lib/paths'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LevelStats {
  total: number
  learned: number
}

interface AllStats {
  vocab:   Record<string, LevelStats>  // level → stats
  grammar: Record<string, LevelStats>
  verb:    Record<string, LevelStats>
}

function emptyLevelStats(): Record<string, LevelStats> {
  return Object.fromEntries(ALL_LEVELS.map(l => [l, { total: 0, learned: 0 }]))
}

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchAllStats(sessionId: string): Promise<AllStats> {
  const stats: AllStats = {
    vocab:   emptyLevelStats(),
    grammar: emptyLevelStats(),
    verb:    emptyLevelStats(),
  }

  // Fetch all items + review data in parallel
  const [
    wordRes, grammarRes, verbRes,
    wordSentRes, grammarSentRes,
    vocabRevRes, grammarRevRes, verbRevRes,
  ] = await Promise.all([
    supabase.from('gwc_words').select('id, level'),
    supabase.from('gwc_grammar_topics').select('id, level'),
    supabase.from('gwc_verbs').select('id, level'),
    supabase.from('gwc_word_sentences').select('id, word_id'),
    supabase.from('gwc_grammar_sentences').select('id, topic_id'),
    supabase.from('gwc_user_reviews').select('word_sentence_id').eq('session_id', sessionId).eq('item_type', 'vocab').not('word_sentence_id', 'is', null),
    supabase.from('gwc_user_reviews').select('grammar_sentence_id').eq('session_id', sessionId).eq('item_type', 'grammar').not('grammar_sentence_id', 'is', null),
    supabase.from('gwc_verb_reviews').select('verb_id').eq('session_id', sessionId),
  ])

  // Build lookup maps
  const sentToWord  = new Map((wordSentRes.data || []).map((s: { id: string; word_id: string }) => [s.id, s.word_id]))
  const sentToTopic = new Map((grammarSentRes.data || []).map((s: { id: string; topic_id: string }) => [s.id, s.topic_id]))
  const wordToLevel  = new Map((wordRes.data || []).map((w: { id: string; level: string }) => [w.id, w.level]))
  const topicToLevel = new Map((grammarRes.data || []).map((t: { id: string; level: string }) => [t.id, t.level]))
  const verbToLevel  = new Map((verbRes.data || []).map((v: { id: string; level: string }) => [v.id, v.level]))

  // Count totals
  for (const w of wordRes.data || []) {
    if (stats.vocab[w.level]) stats.vocab[w.level].total++
  }
  for (const t of grammarRes.data || []) {
    if (stats.grammar[t.level]) stats.grammar[t.level].total++
  }
  for (const v of verbRes.data || []) {
    if (stats.verb[v.level]) stats.verb[v.level].total++
  }

  // Count learned (distinct items with at least one review)
  const learnedVocab:   Record<string, Set<string>> = Object.fromEntries(ALL_LEVELS.map(l => [l, new Set<string>()]))
  const learnedGrammar: Record<string, Set<string>> = Object.fromEntries(ALL_LEVELS.map(l => [l, new Set<string>()]))
  const learnedVerb:    Record<string, Set<string>> = Object.fromEntries(ALL_LEVELS.map(l => [l, new Set<string>()]))

  for (const r of vocabRevRes.data || []) {
    const wordId = sentToWord.get(r.word_sentence_id)
    if (wordId) {
      const level = wordToLevel.get(wordId)
      if (level && learnedVocab[level]) learnedVocab[level].add(wordId)
    }
  }
  for (const r of grammarRevRes.data || []) {
    const topicId = sentToTopic.get(r.grammar_sentence_id)
    if (topicId) {
      const level = topicToLevel.get(topicId)
      if (level && learnedGrammar[level]) learnedGrammar[level].add(topicId)
    }
  }
  for (const r of verbRevRes.data || []) {
    const level = verbToLevel.get(r.verb_id)
    if (level && learnedVerb[level]) learnedVerb[level].add(r.verb_id)
  }

  for (const level of ALL_LEVELS) {
    stats.vocab[level].learned   = learnedVocab[level].size
    stats.grammar[level].learned = learnedGrammar[level].size
    stats.verb[level].learned    = learnedVerb[level].size
  }

  return stats
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getPathStats(path: PathDef, allStats: AllStats): LevelStats {
  const v = allStats.vocab[path.level]   || { total: 0, learned: 0 }
  const g = allStats.grammar[path.level] || { total: 0, learned: 0 }
  const b = allStats.verb[path.level]    || { total: 0, learned: 0 }

  switch (path.type) {
    case 'vocab':   return v
    case 'grammar': return g
    case 'verb':    return b
    case 'mixed':   return {
      total:   v.total   + g.total   + b.total,
      learned: v.learned + g.learned + b.learned,
    }
  }
}

// ─── Path Card ─────────────────────────────────────────────────────────────────

function PathCard({ path, stats }: { path: PathDef; stats: LevelStats }) {
  const levelColor = LEVEL_COLORS[path.level] ?? LEVEL_COLORS.A1
  const typeColor  = TYPE_COLORS[path.type]   ?? TYPE_COLORS.mixed
  const pct = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0

  return (
    <div className="bg-[#1a1830] border border-white/6 rounded-2xl overflow-hidden hover:border-white/12 transition-all group flex flex-col">
      {/* Card header */}
      <div className={`px-4 pt-4 pb-3 ${levelColor.bg} border-b border-white/5`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{path.icon}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor.bg} ${typeColor.text}`}>
                {path.badge}
              </span>
            </div>
            <p className={`text-2xl font-black ${levelColor.text}`}>{path.level}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[#9b98b0] text-xs">
              {stats.total > 0 ? `${pct}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-3">
        {/* Progress bar */}
        <div>
          <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? '#4ade80'
                  : `linear-gradient(90deg, #7c6df2, #9b8cf5)`,
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#9b98b0]">
            <svg className="w-3 h-3 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {stats.total > 0
              ? <span><span className="text-[#e8e6f0] font-semibold">{stats.learned}</span>/{stats.total} ({pct}%) learned</span>
              : <span className="italic">No content yet</span>
            }
          </div>
          {path.type === 'mixed' && (
            <p className="text-[0.65rem] text-[#6b6880]">Vocab · Grammar · Verbs</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex gap-2">
        <Link
          href={`/path/${path.id}`}
          className="flex-1 text-center px-2 py-1.5 rounded-lg bg-white/5 text-[#9b98b0] text-xs font-medium hover:bg-white/10 hover:text-[#e8e6f0] transition-colors"
        >
          Browse
        </Link>
        <Link
          href={`/learn?path=${path.id}`}
          className="flex-1 text-center px-2 py-1.5 rounded-lg bg-[#7c6df2] text-white text-xs font-semibold hover:bg-[#9b8cf5] transition-colors"
        >
          Learn →
        </Link>
      </div>
    </div>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────────

function PathSection({
  title, subtitle, icon, paths, stats, loading
}: {
  title: string
  subtitle: string
  icon: string
  paths: PathDef[]
  stats: AllStats | null
  loading: boolean
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-lg font-bold text-[#e8e6f0]">{title}</h2>
          <p className="text-xs text-[#9b98b0]">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {paths.map(path => {
          const pathStats = stats ? getPathStats(path, stats) : { total: 0, learned: 0 }
          return (
            <div key={path.id} className={loading ? 'opacity-60 pointer-events-none' : ''}>
              <PathCard path={path} stats={pathStats} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PathsPage() {
  const [stats, setStats]   = useState<AllStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const sessionId = getOrCreateSessionId()
    try {
      const s = await fetchAllStats(sessionId)
      setStats(s)
    } catch (e) {
      console.error('PathsPage: failed to fetch stats', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Refresh every 30 s so counts update after studying
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#e8e6f0] mb-2">Learning Paths</h1>
          <p className="text-[#9b98b0] max-w-xl">
            Choose a path to start learning. Each path covers one level — from beginner A1 all the way to master-level C2.
            Pick Caro's Path for a curated mix of everything, or focus on grammar, vocabulary, or verb conjugation.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          <PathSection
            title="Caro's Path"
            subtitle="Curated mix of vocab, grammar & verbs — recommended"
            icon="⭐"
            paths={CAROS_PATHS}
            stats={stats}
            loading={loading}
          />
          <PathSection
            title="Verb Conjugation"
            subtitle="Master every tense — tenses unlock as your level grows"
            icon="🔤"
            paths={VERB_PATHS}
            stats={stats}
            loading={loading}
          />
          <PathSection
            title="Grammar"
            subtitle="All grammar topics in teaching order"
            icon="📝"
            paths={GRAMMAR_PATHS}
            stats={stats}
            loading={loading}
          />
          <PathSection
            title="Vocabulary"
            subtitle="Most common words first, ordered by frequency"
            icon="📚"
            paths={VOCAB_PATHS}
            stats={stats}
            loading={loading}
          />
        </div>

        {/* Last updated indicator */}
        {!loading && (
          <p className="mt-10 text-center text-xs text-[#4a4862]">
            Stats refresh automatically every 30 seconds
          </p>
        )}
      </div>
    </div>
  )
}
