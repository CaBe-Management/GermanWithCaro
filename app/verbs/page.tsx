'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface VerbWord {
  id: string
  slug: string
  word: string
  translation_en: string
  level: string
  category: string
  frequency_rank: number | null
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CAT_LABELS: Record<string, string> = {
  regular: 'Regular', irregular: 'Irregular', modal: 'Modal',
  separable: 'Separable', reflexive: 'Reflexive',
}
const CAT_COLORS: Record<string, string> = {
  regular:   'bg-[#7c6df2]/10 text-[#9b8cf5]',
  irregular: 'bg-[#f59e0b]/10 text-[#f59e0b]',
  modal:     'bg-[#10b981]/10 text-[#10b981]',
  separable: 'bg-[#3b82f6]/10 text-[#60a5fa]',
  reflexive: 'bg-[#ec4899]/10 text-[#f472b6]',
}

export default function VerbsPage() {
  const [verbs, setVerbs]       = useState<VerbWord[]>([])
  const [filtered, setFiltered] = useState<VerbWord[]>([])
  const [search, setSearch]     = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [catFilter, setCatFilter]     = useState<string>('all')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase
      .from('gwc_verbs')
      .select('id, slug, word, translation_en, level, category, frequency_rank')
      .order('frequency_rank', { ascending: true })
      .then(({ data }) => {
        setVerbs((data || []) as VerbWord[])
        setFiltered((data || []) as VerbWord[])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      verbs.filter(v =>
        (levelFilter === 'all' || v.level === levelFilter) &&
        (catFilter   === 'all' || v.category === catFilter) &&
        (v.word.toLowerCase().includes(q) || v.translation_en.toLowerCase().includes(q))
      )
    )
  }, [search, levelFilter, catFilter, verbs])

  const byLevel = LEVELS.reduce<Record<string, VerbWord[]>>((acc, l) => {
    acc[l] = filtered.filter(v => v.level === l)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e8e6f0] mb-1">🔤 Verb Conjugation</h1>
          <p className="text-[#9b98b0] text-sm">
            {verbs.length} verb{verbs.length !== 1 ? 's' : ''} — learn all conjugation forms with sentence-based SRS
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search verbs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-[#1a1830] border border-white/8 rounded-xl px-4 py-2.5 text-[#e8e6f0] placeholder-[#6b6880] text-sm focus:outline-none focus:border-[#7c6df2]/50 transition-colors"
          />
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="bg-[#1a1830] border border-white/8 rounded-xl px-3 py-2.5 text-[#e8e6f0] text-sm focus:outline-none focus:border-[#7c6df2]/50"
          >
            <option value="all">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-[#1a1830] border border-white/8 rounded-xl px-3 py-2.5 text-[#e8e6f0] text-sm focus:outline-none focus:border-[#7c6df2]/50"
          >
            <option value="all">All Types</option>
            {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#9b98b0] text-sm">Loading verbs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#9b98b0]">No verbs found.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {LEVELS.map(level => {
              const group = byLevel[level]
              if (!group || group.length === 0) return null
              return (
                <div key={level}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#9b98b0]">{level}</span>
                    <div className="flex-1 h-px bg-white/6" />
                    <span className="text-xs text-[#6b6880]">{group.length} verb{group.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {group.map(verb => (
                      <Link
                        key={verb.id}
                        href={`/verbs/${verb.slug}`}
                        className="flex items-center gap-4 bg-[#1a1830] border border-white/5 rounded-xl px-4 py-3.5 hover:border-[#7c6df2]/30 hover:bg-[#1f1d3a] transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#e8e6f0] font-semibold">{verb.word}</span>
                            <span className="text-[#9b98b0] text-sm">— {verb.translation_en}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[0.65rem] font-bold ${CAT_COLORS[verb.category] ?? 'bg-white/5 text-[#9b98b0]'}`}>
                            {CAT_LABELS[verb.category] ?? verb.category}
                          </span>
                          <span className="text-[#6b6880] group-hover:text-[#9b8cf5] transition-colors">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
