'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  id: string
  title: string
  level: string
  sort_order: number
  word_count: number | null
  created_at: string
}

// ─── Level badge colour ───────────────────────────────────────────────────────

function levelColor(level: string) {
  switch (level) {
    case 'A1': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'A2': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'B1': return 'bg-[#7c6df2]/20 text-[#9b8cf5] border-[#7c6df2]/30'
    case 'B2': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default:   return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// ─── Story Card ───────────────────────────────────────────────────────────────

function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <Link
      href={`/reading/${story.id}`}
      className="group flex items-center gap-4 bg-[#1a1830] hover:bg-[#1e1c38] border border-white/5 hover:border-[#7c6df2]/30 rounded-2xl px-5 py-4 transition-all duration-200"
    >
      {/* Number */}
      <span className="text-2xl font-bold text-[#7c6df2]/40 group-hover:text-[#7c6df2]/70 transition-colors w-8 text-center shrink-0">
        {index + 1}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[#e8e6f0] font-semibold text-sm truncate group-hover:text-white transition-colors">
          {story.title}
        </p>
        {story.word_count && (
          <p className="text-xs text-[#9b98b0] mt-0.5">{story.word_count} words</p>
        )}
      </div>

      {/* Arrow */}
      <span className="text-[#9b98b0] group-hover:text-[#9b8cf5] group-hover:translate-x-0.5 transition-all text-sm">
        →
      </span>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReadingPage() {
  const [storiesByLevel, setStoriesByLevel] = useState<Record<string, Story[]>>({})
  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('gwc_stories')
          .select('id, title, level, sort_order, word_count, created_at')
          .order('level', { ascending: true })
          .order('sort_order', { ascending: true })

        if (error) throw error

        const grouped: Record<string, Story[]> = {}
        for (const story of (data || [])) {
          if (!grouped[story.level]) grouped[story.level] = []
          grouped[story.level].push(story)
        }

        const sortedLevels = Object.keys(grouped).sort()
        setLevels(sortedLevels)
        setStoriesByLevel(grouped)
      } catch (e) {
        console.error('Reading page load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-3xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-3xl font-bold text-[#e8e6f0]">Reading Practice</h1>
          </div>
          <p className="text-[#9b98b0] text-sm">
            Short German stories in ascending difficulty. Read at your own pace.
          </p>
        </div>

        {/* Empty state */}
        {levels.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">📚</p>
            <h2 className="text-xl font-bold text-[#e8e6f0] mb-2">No stories yet</h2>
            <p className="text-[#9b98b0] text-sm max-w-xs mx-auto">
              Stories will appear here once they've been added to the database.
            </p>
          </div>
        )}

        {/* Stories grouped by level */}
        {levels.map(level => (
          <section key={level} className="mb-10">
            {/* Level header */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${levelColor(level)}`}>
                {level}
              </span>
              <h2 className="text-lg font-bold text-[#e8e6f0]">
                {level === 'A1' ? 'Beginner' :
                 level === 'A2' ? 'Elementary' :
                 level === 'B1' ? 'Intermediate' :
                 level === 'B2' ? 'Upper Intermediate' : level}
              </h2>
              <span className="text-xs text-[#9b98b0]">
                {storiesByLevel[level].length} {storiesByLevel[level].length === 1 ? 'story' : 'stories'}
              </span>
            </div>

            {/* Story list */}
            <div className="space-y-2">
              {storiesByLevel[level].map((story, i) => (
                <StoryCard key={story.id} story={story} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
