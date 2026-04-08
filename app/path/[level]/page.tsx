'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPathById, LEVEL_COLORS, TYPE_COLORS } from '@/lib/paths'
import { getOrCreateSessionId } from '@/lib/session'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VocabItem {
  kind: 'vocab'
  id: string
  word: string
  artikel: string | null
  typ: string
  level: string
  frequenz_rang: number | null
}

interface GrammarItem {
  kind: 'grammar'
  id: string
  slug: string
  title: string
  level: string
  category: string
  sort_order: number | null
}

interface VerbItem {
  kind: 'verb'
  id: string
  slug: string
  word: string
  translation_en: string
  level: string
  category: string
  frequency_rank: number | null
}

type PathItem = VocabItem | GrammarItem | VerbItem

const TYP_LABELS: Record<string, string> = {
  NOMEN: 'Noun', VERB: 'Verb', ADJEKTIV: 'Adj',
  AUSDRUCK: 'Phrase', ADVERB: 'Adverb', PRÄPOSITION: 'Prep', GRAMMATIK: 'Grammar',
}
const CAT_LABELS: Record<string, string> = {
  question_words: 'Q Words', verb_conjugation: 'Conjugation',
  cases: 'Cases', adjectives: 'Adjectives', modal_verbs: 'Modal',
  word_order: 'Word Order', negation: 'Negation',
  regular: 'Regular', irregular: 'Irregular', modal: 'Modal',
  separable: 'Separable', reflexive: 'Reflexive',
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PathPage() {
  const params  = useParams()
  const pathId  = params.level as string
  const path    = getPathById(pathId)

  const [items,    setItems]    = useState<PathItem[]>([])
  const [filtered, setFiltered] = useState<PathItem[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [inQueue,  setInQueue]  = useState(false)
  const [queueBusy, setQueueBusy] = useState(false)

  // Check if this path is already in the learn queue
  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    supabase
      .from('gwc_user_paths')
      .select('id')
      .eq('session_id', sessionId)
      .eq('path_id', pathId)
      .eq('active', true)
      .maybeSingle()
      .then(({ data }) => setInQueue(!!data))
  }, [pathId])

  async function handleQueueToggle() {
    setQueueBusy(true)
    const sessionId = getOrCreateSessionId()
    if (inQueue) {
      await supabase
        .from('gwc_user_paths')
        .update({ active: false })
        .eq('session_id', sessionId)
        .eq('path_id', pathId)
      setInQueue(false)
    } else {
      const { data: existing } = await supabase
        .from('gwc_user_paths')
        .select('id')
        .eq('session_id', sessionId)
        .eq('path_id', pathId)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('gwc_user_paths')
          .update({ active: true })
          .eq('session_id', sessionId)
          .eq('path_id', pathId)
      } else {
        const { count } = await supabase
          .from('gwc_user_paths')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .eq('active', true)
        await supabase.from('gwc_user_paths').insert({
          session_id:     sessionId,
          path_id:        pathId,
          active:         true,
          queue_position: (count ?? 0) + 1,
          daily_goal:     5,
          batch_size:     5,
        })
      }
      setInQueue(true)
    }
    setQueueBusy(false)
  }

  useEffect(() => {
    if (!path) { setLoading(false); return }

    async function load() {
      const level   = path!.level
      const results: PathItem[] = []

      // ── Vocabulary ──────────────────────────────────────────────────────────
      if (path!.type === 'vocab' || path!.type === 'mixed') {
        const { data } = await supabase
          .from('gwc_vocab')
          .select('id, word, article, type, level, frequency_rank')
          .eq('level', level)
          .order('frequency_rank', { ascending: true, nullsFirst: false })
          .limit(1000)

        for (const row of (data || []) as any[]) {
          results.push({
            kind:         'vocab',
            id:           row.id,
            word:         row.word,
            artikel:      row.article,
            typ:          row.type,
            level:        row.level,
            frequenz_rang: row.frequency_rank,
          })
        }
      }

      // ── Grammar ─────────────────────────────────────────────────────────────
      if (path!.type === 'grammar' || path!.type === 'mixed') {
        const { data } = await supabase
          .from('gwc_grammar_topics')
          .select('id, slug, title, level, category, sort_order')
          .eq('level', level)
          .order('sort_order', { ascending: true })

        for (const row of (data || []) as any[]) {
          results.push({
            kind:       'grammar',
            id:         row.id,
            slug:       row.slug,
            title:      row.title,
            level:      row.level,
            category:   row.category,
            sort_order: row.sort_order,
          })
        }
      }

      // ── Verbs ───────────────────────────────────────────────────────────────
      if (path!.type === 'verb' || path!.type === 'mixed') {
        const { data } = await supabase
          .from('gwc_verbs')
          .select('id, slug, word, translation_en, level, category, frequency_rank')
          .eq('level', level)
          .order('frequency_rank', { ascending: true, nullsFirst: false })
          .limit(500)

        for (const row of (data || []) as any[]) {
          results.push({
            kind:           'verb',
            id:             row.id,
            slug:           row.slug,
            word:           row.word,
            translation_en: row.translation_en,
            level:          row.level,
            category:       row.category,
            frequency_rank: row.frequency_rank,
          })
        }
      }

      // For mixed paths: group by type section (vocab → grammar → verbs)
      // Keep them as separate sections rather than interleaving in browse view.
      setItems(results)
      setFiltered(results)
      setLoading(false)
    }

    load()
  }, [pathId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      items.filter(item => {
        if (item.kind === 'vocab')   return item.word.toLowerCase().includes(q)
        if (item.kind === 'grammar') return item.title.toLowerCase().includes(q)
        if (item.kind === 'verb')    return item.word.toLowerCase().includes(q) || item.translation_en.toLowerCase().includes(q)
        return false
      })
    )
  }, [search, items])

  if (!path) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#9b98b0] mb-4">Path not found.</p>
          <Link href="/paths" className="text-[#7c6df2] hover:underline">← All Paths</Link>
        </div>
      </div>
    )
  }

  const levelColor = LEVEL_COLORS[path.level] ?? LEVEL_COLORS.A1
  const typeColor  = TYPE_COLORS[path.type]   ?? TYPE_COLORS.mixed

  // Split mixed items by kind for section headers
  const vocabItems   = filtered.filter(i => i.kind === 'vocab')
  const grammarItems = filtered.filter(i => i.kind === 'grammar')
  const verbItems    = filtered.filter(i => i.kind === 'verb')

  function renderList(list: PathItem[]) {
    return list.map((item, i) => {
      if (item.kind === 'vocab') return (
        <div
          key={item.id}
          className="flex items-center gap-4 bg-[#1a1830] border border-white/5 rounded-xl px-4 py-3 hover:border-[#7c6df2]/25 transition-colors"
        >
          <span className="text-[#6b6880] text-xs w-7 text-right shrink-0 tabular-nums">
            {item.frequenz_rang ?? i + 1}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {item.artikel && <span className="text-[#9b98b0] text-sm">{item.artikel}</span>}
            <span className="text-[#e8e6f0] font-semibold">{item.word}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-[#7c6df2]/10 text-[#9b8cf5] shrink-0">
            {TYP_LABELS[item.typ] ?? item.typ}
          </span>
        </div>
      )

      if (item.kind === 'grammar') return (
        <Link
          key={item.id}
          href={`/grammar/${item.slug}`}
          className="flex items-center gap-4 bg-[#1a1830] border border-white/5 rounded-xl px-4 py-3 hover:border-[#7c6df2]/25 transition-colors group"
        >
          <span className="text-[#6b6880] text-xs w-7 text-right shrink-0 tabular-nums">
            {item.sort_order ?? i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-[#e8e6f0] font-semibold">{item.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-blue-500/10 text-blue-300">
              {CAT_LABELS[item.category] ?? item.category}
            </span>
            <span className="text-[#6b6880] group-hover:text-[#9b8cf5] transition-colors text-sm">→</span>
          </div>
        </Link>
      )

      if (item.kind === 'verb') return (
        <Link
          key={item.id}
          href={`/verbs/${item.slug}`}
          className="flex items-center gap-4 bg-[#1a1830] border border-white/5 rounded-xl px-4 py-3 hover:border-[#7c6df2]/25 transition-colors group"
        >
          <span className="text-[#6b6880] text-xs w-7 text-right shrink-0 tabular-nums">
            {item.frequency_rank ?? i + 1}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-[#e8e6f0] font-semibold">{item.word}</span>
            <span className="text-[#9b98b0] text-xs">—</span>
            <span className="text-[#9b98b0] text-sm truncate">{item.translation_en}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-orange-500/10 text-orange-300">
              {CAT_LABELS[item.category] ?? item.category}
            </span>
            <span className="text-[#6b6880] group-hover:text-[#9b8cf5] transition-colors text-sm">→</span>
          </div>
        </Link>
      )

      return null
    })
  }

  const totalItems = items.length
  const vocabCount   = items.filter(i => i.kind === 'vocab').length
  const grammarCount = items.filter(i => i.kind === 'grammar').length
  const verbCount    = items.filter(i => i.kind === 'verb').length

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <Link href="/paths" className="inline-flex items-center gap-1.5 text-sm text-[#9b98b0] hover:text-[#e8e6f0] transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Paths
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${levelColor.bg} border ${levelColor.border}`}>
              {path.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold text-[#e8e6f0]">
                  {path.name} <span className={levelColor.text}>{path.level}</span>
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${typeColor.bg} ${typeColor.text}`}>
                  {path.badge}
                </span>
              </div>
              <p className="text-[#9b98b0] text-sm">{path.description}</p>
            </div>
          </div>

          {/* Stats row */}
          {!loading && (
            <div className="flex flex-wrap gap-3 text-sm text-[#9b98b0] mb-5">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-[#e8e6f0]">{totalItems}</span> items total
              </span>
              {path.type === 'mixed' && (
                <>
                  <span className="text-white/10">·</span>
                  <span>{vocabCount} words</span>
                  <span className="text-white/10">·</span>
                  <span>{grammarCount} grammar</span>
                  <span className="text-white/10">·</span>
                  <span>{verbCount} verbs</span>
                </>
              )}
            </div>
          )}

          {/* Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleQueueToggle}
              disabled={queueBusy}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
                inQueue
                  ? 'bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                  : 'bg-[#7c6df2] text-white hover:bg-[#9b8cf5]'
              }`}
            >
              {queueBusy
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : inQueue
                  ? '✓ In learn queue'
                  : '+ Add to learn queue'
              }
            </button>
            {inQueue && (
              <Link
                href="/learn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c6df2] text-white font-semibold text-sm hover:bg-[#9b8cf5] transition-colors"
              >
                Go to Learn →
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder={
              path.type === 'grammar' ? 'Search grammar topics...' :
              path.type === 'vocab'   ? 'Search words...' :
              path.type === 'verb'    ? 'Search verbs...' :
              'Search words, grammar, verbs...'
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1830] border border-white/8 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#6b6880] text-sm focus:outline-none focus:border-[#7c6df2]/50 transition-colors"
          />
        </div>

        {/* Items */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#9b98b0] text-sm">Loading path...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#9b98b0]">
              {search ? 'No results for your search.' : 'No content for this level yet.'}
            </p>
          </div>
        ) : path.type === 'mixed' ? (
          /* Mixed path: show as labelled sections */
          <div className="space-y-8">
            {vocabItems.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📚</span> Vocabulary ({vocabItems.length})
                </h3>
                <div className="space-y-2">{renderList(vocabItems)}</div>
              </div>
            )}
            {grammarItems.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📝</span> Grammar ({grammarItems.length})
                </h3>
                <div className="space-y-2">{renderList(grammarItems)}</div>
              </div>
            )}
            {verbItems.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>🔤</span> Verb Conjugation ({verbItems.length})
                </h3>
                <div className="space-y-2">{renderList(verbItems)}</div>
              </div>
            )}
          </div>
        ) : (
          /* Single-type path: flat list */
          <div className="space-y-2">{renderList(filtered)}</div>
        )}
      </div>
    </div>
  )
}
