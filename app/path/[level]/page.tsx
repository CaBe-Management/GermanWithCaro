'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPathById } from '@/lib/paths'

interface VocabItem {
  kind: 'vocab'
  id: string
  slug: string
  word: string
  article: string | null
  type: string
  level: string
  translation_en: string
  position: number
}

interface GrammarItem {
  kind: 'grammar'
  id: string
  slug: string
  title: string
  level: string
  category: string
  translation_en: string | null
  position: number
}

type PathItem = VocabItem | GrammarItem

// Map path ID → DB column name for vocab + grammar
const VOCAB_COL: Record<string, string> = {
  'a1-vocabulary':  'path_a1_vocabulary',
  'caros-path-a1':  'path_caros_path',
}
const GRAMMAR_COL: Record<string, string> = {
  'a1-grammar':    'path_a1_grammar',
  'caros-path-a1': 'path_caros_path',
}

const TYPE_LABELS: Record<string, string> = {
  NOMEN: 'Noun', VERB: 'Verb', ADJEKTIV: 'Adj',
  AUSDRUCK: 'Phrase', ADVERB: 'Adverb', PRÄPOSITION: 'Prep',
}
const CAT_LABELS: Record<string, string> = {
  question_words: 'Question Words', verb_conjugation: 'Verb Conjugation',
  cases: 'Cases', adjectives: 'Adjectives', modal_verbs: 'Modal Verbs',
  word_order: 'Word Order', negation: 'Negation',
}

export default function PathPage() {
  const params = useParams()
  const router = useRouter()
  const pathId = params.level as string

  const path = getPathById(pathId)

  const [items, setItems] = useState<PathItem[]>([])
  const [filtered, setFiltered] = useState<PathItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!path) { setLoading(false); return }

    async function load() {
      const results: PathItem[] = []

      // ── Vocab ────────────────────────────────────────────────────────────
      const vocabCol = VOCAB_COL[pathId]
      if (vocabCol) {
        const { data } = await supabase
          .from('gwc_vocab')
          .select(`id, slug, word, article, type, level, translation_en, ${vocabCol}`)
          .not(vocabCol, 'is', null)
          .order(vocabCol, { ascending: true })

        for (const row of data || []) {
          results.push({
            kind: 'vocab',
            id: row.id,
            slug: row.slug,
            word: row.word,
            article: row.article,
            type: row.type,
            level: row.level,
            translation_en: row.translation_en,
            position: row[vocabCol] as number,
          })
        }
      }

      // ── Grammar ──────────────────────────────────────────────────────────
      const grammarCol = GRAMMAR_COL[pathId]
      if (grammarCol) {
        const { data } = await supabase
          .from('gwc_grammar_topics')
          .select(`id, slug, title, level, category, translation_en, ${grammarCol}`)
          .not(grammarCol, 'is', null)
          .order(grammarCol, { ascending: true })

        for (const row of data || []) {
          results.push({
            kind: 'grammar',
            id: row.id,
            slug: row.slug,
            title: row.title,
            level: row.level,
            category: row.category,
            translation_en: row.translation_en,
            position: row[grammarCol] as number,
          })
        }
      }

      // For mixed path: sort everything by position
      if (path?.type === 'mixed') {
        results.sort((a, b) => a.position - b.position)
      }

      setItems(results)
      setFiltered(results)
      setLoading(false)
    }

    load()
  }, [pathId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      items.filter(item =>
        item.kind === 'vocab'
          ? item.word.toLowerCase().includes(q) || item.translation_en.toLowerCase().includes(q)
          : item.title.toLowerCase().includes(q) || (item.translation_en ?? '').toLowerCase().includes(q)
      )
    )
  }, [search, items])

  if (!path) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#9b98b0] mb-4">Path not found.</p>
          <Link href="/dashboard" className="text-[#7c6df2] hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{path.icon}</span>
            <h1 className="text-3xl font-bold text-[#e8e6f0]">{path.name}</h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/15 text-[#9b8cf5] border border-[#7c6df2]/20">
              {path.level}
            </span>
          </div>
          <p className="text-[#9b98b0] text-sm mb-6 max-w-xl">{path.description}</p>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/learn?path=${pathId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c6df2] text-white font-semibold hover:bg-[#9b8cf5] transition-colors"
            >
              Learn {items.length} →
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search words or grammar..."
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
            <p className="text-[#9b98b0]">{search ? 'No results for your search.' : 'No items in this path yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => (
              item.kind === 'vocab' ? (
                <Link
                  key={item.id}
                  href={`/vocab/${item.slug}`}
                  className="flex items-center gap-4 bg-[#1a1830] border border-white/5 rounded-xl px-4 py-3.5 hover:border-[#7c6df2]/30 hover:bg-[#1f1d3a] transition-all group"
                >
                  <span className="text-[#6b6880] text-xs w-6 text-right shrink-0">{item.position}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.article && (
                        <span className="text-[#9b98b0] text-sm">{item.article}</span>
                      )}
                      <span className="text-[#e8e6f0] font-semibold">{item.word}</span>
                      <span className="text-[#9b98b0] text-xs">—</span>
                      <span className="text-[#9b98b0] text-sm">{item.translation_en}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-[#7c6df2]/10 text-[#9b8cf5]">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    <span className="text-[0.68rem] font-bold text-[#6b6880] tracking-wider">{item.level}</span>
                    <span className="text-[#6b6880] group-hover:text-[#9b8cf5] transition-colors">→</span>
                  </div>
                </Link>
              ) : (
                <Link
                  key={item.id}
                  href={`/grammar/${item.slug}`}
                  className="flex items-center gap-4 bg-[#1a1830] border border-white/5 rounded-xl px-4 py-3.5 hover:border-[#7c6df2]/30 hover:bg-[#1f1d3a] transition-all group"
                >
                  <span className="text-[#6b6880] text-xs w-6 text-right shrink-0">{item.position}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#e8e6f0] font-semibold">{item.title}</span>
                      {item.translation_en && (
                        <>
                          <span className="text-[#9b98b0] text-xs">—</span>
                          <span className="text-[#9b98b0] text-sm">{item.translation_en}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-[#2a1f5a]/60 text-[#b4a8f5]">
                      {CAT_LABELS[item.category] ?? item.category}
                    </span>
                    <span className="text-[0.68rem] font-bold text-[#6b6880] tracking-wider">{item.level}</span>
                    <span className="text-[#6b6880] group-hover:text-[#9b8cf5] transition-colors">→</span>
                  </div>
                </Link>
              )
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
