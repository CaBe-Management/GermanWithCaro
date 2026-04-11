'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { CAROS_PATHS, GRAMMAR_PATHS, VOCAB_PATHS, ALL_LEVELS, LEVEL_COLORS, TYPE_COLORS } from '@/lib/paths'
import type { PathDef } from '@/lib/paths'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LevelStats {
  total: number
  learned: number
}

interface AllStats {
  vocab:   Record<string, LevelStats>
  grammar: Record<string, LevelStats>
}

function emptyLevelStats(): Record<string, LevelStats> {
  return Object.fromEntries(ALL_LEVELS.map(l => [l, { total: 0, learned: 0 }]))
}

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchAllStats(sessionId: string): Promise<AllStats> {
  const stats: AllStats = {
    vocab:   emptyLevelStats(),
    grammar: emptyLevelStats(),
  }

  const [
    vocabRes, grammarRes,
    vocabRevRes, grammarRevRes,
  ] = await Promise.all([
    supabase.from('gwc_vocab').select('id, level'),
    supabase.from('gwc_grammar_topics').select('id, level'),
    supabase.from('gwc_vocab_reviews').select('vocab_id').eq('session_id', sessionId),
    supabase.from('gwc_grammar_reviews').select('topic_id').eq('session_id', sessionId),
  ])

  const vocabToLevel  = new Map((vocabRes.data   || []).map((v: { id: string; level: string }) => [v.id, v.level]))
  const topicToLevel  = new Map((grammarRes.data || []).map((t: { id: string; level: string }) => [t.id, t.level]))

  for (const v of vocabRes.data   || []) { if (stats.vocab[v.level])   stats.vocab[v.level].total++ }
  for (const t of grammarRes.data || []) { if (stats.grammar[t.level]) stats.grammar[t.level].total++ }

  const lVocab:   Record<string, Set<string>> = Object.fromEntries(ALL_LEVELS.map(l => [l, new Set<string>()]))
  const lGrammar: Record<string, Set<string>> = Object.fromEntries(ALL_LEVELS.map(l => [l, new Set<string>()]))

  for (const r of vocabRevRes.data || []) {
    const lv = vocabToLevel.get(r.vocab_id); if (lv && lVocab[lv]) lVocab[lv].add(r.vocab_id)
  }
  for (const r of grammarRevRes.data || []) {
    const lv = topicToLevel.get(r.topic_id); if (lv && lGrammar[lv]) lGrammar[lv].add(r.topic_id)
  }

  for (const level of ALL_LEVELS) {
    stats.vocab[level].learned   = lVocab[level].size
    stats.grammar[level].learned = lGrammar[level].size
  }

  return stats
}

async function fetchQueueIds(sessionId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('gwc_user_paths')
    .select('path_id')
    .eq('session_id', sessionId)
    .eq('active', true)
  return new Set((data || []).map((r: { path_id: string }) => r.path_id))
}

async function addToQueue(sessionId: string, pathId: string, position: number) {
  await supabase.from('gwc_user_paths').upsert(
    {
      session_id:     sessionId,
      path_id:        pathId,
      queue_position: position,
      daily_goal:     10,
      batch_size:     5,
      lesson_order:   'default',
      active:         true,
      updated_at:     new Date().toISOString(),
    },
    { onConflict: 'session_id,path_id' }
  )
}

async function removeFromQueue(sessionId: string, pathId: string) {
  await supabase
    .from('gwc_user_paths')
    .delete()
    .eq('session_id', sessionId)
    .eq('path_id', pathId)
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getPathStats(path: PathDef, allStats: AllStats): LevelStats {
  const v = allStats.vocab[path.level]   || { total: 0, learned: 0 }
  const g = allStats.grammar[path.level] || { total: 0, learned: 0 }
  switch (path.type) {
    case 'vocab':   return v
    case 'grammar': return g
    case 'mixed':   return { total: v.total + g.total, learned: v.learned + g.learned }
  }
}

// ─── Path Card ─────────────────────────────────────────────────────────────────

function PathCard({
  path, stats, inQueue, queueSize, onToggleQueue,
}: {
  path: PathDef
  stats: LevelStats
  inQueue: boolean
  queueSize: number
  onToggleQueue: (pathId: string, inQueue: boolean) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const levelColor = LEVEL_COLORS[path.level] ?? LEVEL_COLORS.A1
  const typeColor  = TYPE_COLORS[path.type]   ?? TYPE_COLORS.mixed
  const pct = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0

  async function handleToggle() {
    setBusy(true)
    await onToggleQueue(path.id, inQueue)
    setBusy(false)
  }

  return (
    <div className={`bg-[#1a1830] border rounded-2xl overflow-hidden transition-all flex flex-col ${
      inQueue ? 'border-[#7c6df2]/40 shadow-[0_0_12px_rgba(124,109,242,0.12)]' : 'border-white/6 hover:border-white/12'
    }`}>
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
        <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#4ade80' : 'linear-gradient(90deg, #7c6df2, #9b8cf5)',
            }}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#9b98b0]">
            <svg className={`w-3 h-3 ${inQueue ? 'text-[#7c6df2]' : 'text-[#4ade80]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {stats.total > 0
              ? <span><span className="text-[#e8e6f0] font-semibold">{stats.learned}</span>/{stats.total} ({pct}%)</span>
              : <span className="italic opacity-60">No content yet</span>
            }
          </div>
          {path.type === 'mixed' && (
            <p className="text-[0.65rem] text-[#6b6880]">Vocab · Grammar</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex gap-2">
        {/* Browse — always available */}
        <Link
          href={`/path/${path.id}`}
          className="flex-none px-3 py-1.5 rounded-lg bg-white/5 text-[#9b98b0] text-xs font-medium hover:bg-white/10 hover:text-[#e8e6f0] transition-colors"
        >
          Browse
        </Link>

        {/* Queue toggle */}
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-1 ${
            inQueue
              ? 'bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30 hover:bg-[#f87171]/10 hover:text-[#f87171] hover:border-[#f87171]/30'
              : 'bg-[#7c6df2] text-white hover:bg-[#9b8cf5]'
          }`}
          title={inQueue ? 'Remove from learn queue' : 'Add to learn queue'}
        >
          {busy ? (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : inQueue ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              In queue
            </>
          ) : (
            <>＋ Add to queue</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────────

function PathSection({
  title, subtitle, icon, paths, stats, queueIds, queueSize, loading, onToggleQueue
}: {
  title: string
  subtitle: string
  icon: string
  paths: PathDef[]
  stats: AllStats | null
  queueIds: Set<string>
  queueSize: number
  loading: boolean
  onToggleQueue: (pathId: string, inQueue: boolean) => Promise<void>
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
              <PathCard
                path={path}
                stats={pathStats}
                inQueue={queueIds.has(path.id)}
                queueSize={queueSize}
                onToggleQueue={onToggleQueue}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PathsPage() {
  const [stats,    setStats]    = useState<AllStats | null>(null)
  const [queueIds, setQueueIds] = useState<Set<string>>(new Set())
  const [loading,  setLoading]  = useState(true)

  const sessionId = typeof window !== 'undefined' ? getOrCreateSessionId() : ''

  const load = useCallback(async () => {
    if (!sessionId) return
    try {
      const [s, q] = await Promise.all([
        fetchAllStats(sessionId),
        fetchQueueIds(sessionId),
      ])
      setStats(s)
      setQueueIds(q)
    } catch (e) {
      console.error('PathsPage: failed to fetch', e)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  async function handleToggleQueue(pathId: string, currentlyInQueue: boolean) {
    if (currentlyInQueue) {
      await removeFromQueue(sessionId, pathId)
      setQueueIds(prev => { const next = new Set(prev); next.delete(pathId); return next })
    } else {
      await addToQueue(sessionId, pathId, queueIds.size + 1)
      setQueueIds(prev => new Set([...prev, pathId]))
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-[#e8e6f0] mb-2">Learning Paths</h1>
            <p className="text-[#9b98b0] max-w-xl text-sm">
              Add paths to your learn queue — then go to <Link href="/learn" className="text-[#9b8cf5] hover:underline">Learn</Link> to study.
              Caro's Path is the recommended starting point.
            </p>
          </div>
          {/* Queue count badge + go-to-learn button */}
          {queueIds.size > 0 && (
            <Link
              href="/learn"
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c6df2] text-white text-sm font-semibold hover:bg-[#9b8cf5] transition-colors"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs font-bold flex items-center justify-center">
                {queueIds.size}
              </span>
              Go to Learn →
            </Link>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-12">
          <PathSection
            title="Caro's Path"
            subtitle="Curated mix of vocab & grammar — recommended starting point"
            icon="⭐"
            paths={CAROS_PATHS}
            stats={stats}
            queueIds={queueIds}
            queueSize={queueIds.size}
            loading={loading}
            onToggleQueue={handleToggleQueue}
          />
          <PathSection
            title="Grammar"
            subtitle="All grammar topics in teaching order"
            icon="📝"
            paths={GRAMMAR_PATHS}
            stats={stats}
            queueIds={queueIds}
            queueSize={queueIds.size}
            loading={loading}
            onToggleQueue={handleToggleQueue}
          />
          <PathSection
            title="Vocabulary"
            subtitle="Most common words first, ordered by frequency"
            icon="📚"
            paths={VOCAB_PATHS}
            stats={stats}
            queueIds={queueIds}
            queueSize={queueIds.size}
            loading={loading}
            onToggleQueue={handleToggleQueue}
          />
        </div>

        {!loading && (
          <p className="mt-10 text-center text-xs text-[#4a4862]">
            Stats refresh automatically every 30 seconds
          </p>
        )}
      </div>
    </div>
  )
}
