'use client'

// ConversationsArchiveView — list of conversations with expandable chat view
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import PageCard, { PageCardHeader, PageCardContent } from '@/components/layout/PageCard'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type ConvLine = { speaker: string; german: string; english: string; audio_url: string | null }
type ConvContent = { title: string; context: string; lines: ConvLine[] }
type Conversation = {
  id: string
  lesson_id: string
  content: ConvContent
  lessons: { title: string; unit_name: string; order_index: number }
}
type Lesson = { id: string; title: string; unit_name: string; order_index: number }

function avatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export default function ConversationsArchiveView({
  conversations,
  allLessons,
}: {
  conversations: Conversation[]
  allLessons: Lesson[]
}) {
  const [filter, setFilter] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const unitNames = useMemo(() => {
    const names = new Set(allLessons.map((l) => l.unit_name))
    return ['All', ...Array.from(names)]
  }, [allLessons])

  const filtered = filter === 'All'
    ? conversations
    : conversations.filter((c) => c.lessons.unit_name === filter)

  return (
    <PageCard>
      <PageCardHeader>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[20px] text-text-2">←</Link>
          <div>
            <h1 className="text-[17px] font-bold text-text-1">My Conversations</h1>
            <p className="text-[13px] italic text-text-3">Conversations from your completed lessons</p>
          </div>
        </div>
      </PageCardHeader>

      <PageCardContent className="flex flex-col gap-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {unitNames.map((name) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition',
                filter === name
                  ? 'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white'
                  : 'bg-bg-subtle text-text-2 hover:bg-border'
              )}
            >
              {name === 'All' ? 'All' : name.split(' · ')[0]}
            </button>
          ))}
        </div>

        {/* Conversation cards */}
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[14px] text-text-3">No conversations yet. Complete lessons to unlock them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => {
              const content = conv.content
              const speakers = [...new Set(content.lines.map((l) => l.speaker))]
              const isExpanded = expandedId === conv.id

              return (
                <div
                  key={conv.id}
                  className={cn(
                    'rounded-[14px] transition-all',
                    isExpanded
                      ? 'border-[1.5px] border-primary bg-bg-card shadow-[0_2px_16px_rgba(0,0,0,0.06)]'
                      : 'border-[1.5px] border-transparent bg-bg-subtle hover:bg-border-light'
                  )}
                >
                  {/* Card header */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="tag">Conversation</Badge>
                      <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
                        Lesson {conv.lessons.order_index}
                      </span>
                    </div>
                    <p className="mt-1 text-[16px] font-bold text-text-1">{content.title}</p>
                    <p className="mt-0.5 text-[13px] italic text-text-3">{content.context}</p>
                    <p className="mt-1 text-[12px] text-text-3">{speakers.join(', ')}</p>

                    {!isExpanded && (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="truncate text-[13px] text-text-3">
                          &ldquo;{content.lines[0]?.german}&rdquo;
                        </p>
                        <button
                          onClick={() => setExpandedId(conv.id)}
                          className="shrink-0 text-[13px] font-semibold text-primary"
                        >
                          Read →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded messages */}
                  {isExpanded && (
                    <div className="border-t border-border-light px-4 pb-4 pt-3">
                      <div className="mb-3 flex justify-end">
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-[13px] font-semibold text-text-3 hover:text-text-2"
                        >
                          Close <X size={12} className="ml-0.5 inline" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {content.lines.map((line, i) => {
                          const isA = line.speaker === speakers[0]
                          return (
                            <div key={i} className={`flex gap-2.5 ${isA ? 'flex-row' : 'flex-row-reverse'}`}>
                              {/* DiceBear avatar */}
                              <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full border-[1.5px] border-border bg-bg-page">
                                <img
                                  src={avatarUrl(line.speaker)}
                                  alt={line.speaker}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="max-w-[85%]">
                                <p className="mb-0.5 text-[11px] font-semibold text-text-3">{line.speaker}</p>
                                <div
                                  className={cn(
                                    'rounded-2xl px-4 py-2.5',
                                    isA
                                      ? 'rounded-bl-[4px] bg-bg-page text-text-1'
                                      : 'rounded-br-[4px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white'
                                  )}
                                >
                                  <p className="text-[15px] leading-snug">{line.german}</p>
                                </div>
                                <p className="mt-1 text-[11px] italic text-text-3">{line.english}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PageCardContent>
    </PageCard>
  )
}
