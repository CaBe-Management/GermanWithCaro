'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { GrammarTopic, GrammarSentence, GrammarResource } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { SrsProgressCard } from '@/components/SrsProgressCard'
import type { SrsReviewData } from '@/components/SrsProgressCard'

// GrammarTopic now includes all detail-page fields (translation_en, structure, register_*, fun_fact, resources)
type GrammarTopicExtended = GrammarTopic

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

const CATEGORY_LABELS: Record<string, string> = {
  verb_conjugation: 'Verb Conjugation',
  adjective_usage:  'Adjective Usage',
  preposition:      'Preposition',
  word_order:       'Word Order',
  case_system:      'Case System',
  question:         'Question Form',
  negation:         'Negation',
  article:          'Article',
  modal_verb:       'Modal Verb',
}

function highlightStructure(text: string) {
  // Highlight [placeholders] in purple and | separators
  const parts = text.split(/(\[[^\]]+\])/g)
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']')
      ? <span key={i} className="text-[#9b8cf5] font-semibold">{part}</span>
      : <span key={i} className="text-[#e8e6f0]">{part}</span>
  )
}

function RegisterDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            i <= level ? 'bg-[#7c6df2]' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}

function groupByPerson(sentences: GrammarSentence[]) {
  const groups: { person: string; sentences: GrammarSentence[] }[] = []
  const seen = new Map<string, GrammarSentence[]>()
  for (const s of sentences) {
    const key = s.person ?? 'general'
    if (!seen.has(key)) {
      seen.set(key, [])
      groups.push({ person: key, sentences: seen.get(key)! })
    }
    seen.get(key)!.push(s)
  }
  return groups
}

function parseResources(raw: GrammarResource[] | null | undefined): GrammarResource[] {
  if (!raw) return []
  return raw
}

// ─── Audio Button ──────────────────────────────────────────────────────────────

function AudioButton({ filename }: { filename?: string | null }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function toggle() {
    if (!filename) return
    if (!audioRef.current) {
      audioRef.current = new Audio(`/audio/${filename}`)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  if (!filename) return null

  return (
    <button
      onClick={toggle}
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        playing
          ? 'bg-[#7c6df2] text-white'
          : 'bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5]'
      }`}
      title={playing ? 'Stop' : 'Play audio'}
    >
      {playing ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
          <rect x="3" y="3" width="4" height="10" rx="1" />
          <rect x="9" y="3" width="4" height="10" rx="1" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5 3.5l9 4.5-9 4.5V3.5z" />
        </svg>
      )}
    </button>
  )
}

// ─── Sentence Card ─────────────────────────────────────────────────────────────

function SentenceCard({
  sentence,
  index,
  showAudio = false,
}: {
  sentence: GrammarSentence & { audio_file?: string | null }
  index: number
  showAudio?: boolean
}) {
  const [revealed, setRevealed] = useState(false)

  // Highlight cloze word
  const parts = sentence.sentence_de.split(
    new RegExp(`(${sentence.cloze_word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i')
  )
  const highlighted = parts.map((part, i) =>
    new RegExp(`^${sentence.cloze_word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(part)
      ? <span key={i} className="text-[#9b8cf5] font-bold">{part}</span>
      : <span key={i}>{part}</span>
  )

  return (
    <div className="bg-[#1e1c35] rounded-xl p-4 border border-white/5 hover:border-[#7c6df2]/20 transition-colors group">
      <div className="flex gap-3 items-start">
        <span className="text-xs text-[#9b98b0] shrink-0 mt-1 w-5 text-right font-mono">
          {index + 1}.
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[#e8e6f0] leading-relaxed">{highlighted}</p>
          {sentence.sentence_en && (
            <p
              className={`text-sm mt-1 transition-all duration-200 ${
                revealed ? 'text-[#9b98b0]' : 'text-transparent select-none blur-[3px] cursor-pointer'
              }`}
              onClick={() => !revealed && setRevealed(true)}
              title={revealed ? '' : 'Click to reveal translation'}
            >
              {sentence.sentence_en}
            </p>
          )}
        </div>
        {showAudio && (sentence as any).audio_file && (
          <AudioButton filename={(sentence as any).audio_file} />
        )}
      </div>
    </div>
  )
}

// ─── Tab Button ────────────────────────────────────────────────────────────────

function TabBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-[#7c6df2] text-white shadow-lg shadow-[#7c6df2]/25'
          : 'text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ─── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: GrammarResource }) {
  const icons: Record<string, string> = {
    youtube: '▶',
    tiktok: '♪',
    website: '🔗',
  }
  const colors: Record<string, string> = {
    youtube: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40',
    tiktok: 'bg-[#7c6df2]/10 border-[#7c6df2]/20 hover:border-[#7c6df2]/40',
    website: 'bg-white/5 border-white/10 hover:border-white/20',
  }
  const iconColors: Record<string, string> = {
    youtube: 'text-red-400 bg-red-500/15',
    tiktok: 'text-[#9b8cf5] bg-[#7c6df2]/15',
    website: 'text-[#9b98b0] bg-white/10',
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${colors[resource.type] ?? colors.website}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${iconColors[resource.type] ?? iconColors.website}`}>
        {icons[resource.type] ?? icons.website}
      </div>
      <div className="min-w-0">
        <p className="text-[#e8e6f0] font-semibold text-sm leading-snug">{resource.title}</p>
        {resource.description && (
          <p className="text-[#9b98b0] text-xs mt-0.5 leading-relaxed">{resource.description}</p>
        )}
        <p className="text-[#9b98b0] text-xs mt-1 truncate opacity-50">{resource.url}</p>
      </div>
    </a>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'details' | 'examples' | 'resources'

export default function GrammarTopicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [topic, setTopic]         = useState<GrammarTopicExtended | null>(null)
  const [sentences, setSentences] = useState<GrammarSentence[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [tab, setTab]             = useState<Tab>('details')

  const [reviewedForms, setReviewedForms] = useState(0)
  const [totalForms, setTotalForms]       = useState(0)
  const [addState, setAddState]           = useState<'idle' | 'adding' | 'added' | 'all_added'>('idle')
  const [srsData, setSrsData]             = useState<SrsReviewData | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const sessionId = getOrCreateSessionId()

        const { data: topicData, error: tErr } = await supabase
          .from('gwc_grammar_topics')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (tErr) throw tErr
        if (!topicData) { setError('Topic not found.'); return }
        setTopic(topicData)

        const { data: sentData, error: sErr } = await supabase
          .from('gwc_grammar_sentences')
          .select('*')
          .eq('topic_id', topicData.id)
          .order('sort_order', { ascending: true })

        if (sErr) throw sErr
        setSentences(sentData || [])

        if (sentData && sentData.length > 0) {
          const sents = sentData as GrammarSentence[]
          const uniquePersons = [...new Set(sents.map(s => s.person ?? 'null'))]
          setTotalForms(uniquePersons.length)

          // Check if this topic has a review record
          const { data: reviewRecord } = await supabase
            .from('gwc_grammar_reviews')
            .select('id, repetitions, next_review_at, created_at, total_reviews, correct_reviews')
            .eq('session_id', sessionId)
            .eq('topic_id', topicData.id)
            .maybeSingle()

          if (reviewRecord) {
            setReviewedForms(uniquePersons.length)
            setAddState('all_added')
            setSrsData(reviewRecord as SrsReviewData)
          } else {
            setReviewedForms(0)
          }
        }
      } catch (e) {
        setError('Could not load this topic.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  async function handleAddToReviews() {
    if (!topic) return
    setAddState('adding')

    const sessionId = getOrCreateSessionId()

    // Check if this topic already has a review record
    const { data: existing } = await supabase
      .from('gwc_grammar_reviews')
      .select('id')
      .eq('session_id', sessionId)
      .eq('topic_id', topic.id)
      .maybeSingle()

    if (existing) {
      setAddState('all_added')
      return
    }

    // Insert new topic review record
    const srs = calculateNextReview(false, 2.5, 1, 0)
    await supabase.from('gwc_grammar_reviews').insert({
      session_id:      sessionId,
      topic_id:        topic.id,
      next_review_at:  new Date().toISOString(),
      last_sentence_idx: 0,
      repetitions:     0,
      ease_factor:     2.5,
      interval_days:   1,
      correct_streak:  0,
      total_reviews:   0,
      correct_reviews: 0,
    })

    setReviewedForms(totalForms)
    setAddState('added')
    setSrsData({
      repetitions:     0,
      next_review_at:  new Date().toISOString(),
      created_at:      new Date().toISOString(),
      total_reviews:   0,
      correct_reviews: 0,
    })
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-[#e8e6f0] font-bold mb-2">{error || 'Topic not found'}</p>
            <Link href="/grammar" className="text-[#7c6df2] hover:text-[#9b8cf5] transition-colors text-sm">
              ← Back to Grammar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const groups       = groupByPerson(sentences)
  const resources    = parseResources(topic.resources)
  const progressPct  = totalForms > 0 ? Math.round((reviewedForms / totalForms) * 100) : 0
  const hasFormal    = topic.register_formal != null
  const hasRegister  = hasFormal || topic.register_standard != null || topic.register_casual != null

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-3xl mx-auto px-5 py-10">

        {/* ── Breadcrumb ── */}
        <div className="mb-6">
          <Link href="/grammar" className="text-[#9b98b0] hover:text-[#e8e6f0] text-sm transition-colors inline-flex items-center gap-1.5">
            <span>←</span>
            <span>Grammar</span>
          </Link>
        </div>

        {/* ── Hero Header ── */}
        <div className="mb-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelColor(topic.level)}`}>
              {topic.level}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/5 text-[#9b98b0] border border-white/10">
              {CATEGORY_LABELS[topic.category] ?? topic.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-[#e8e6f0] mb-1 leading-tight">
            {topic.title}
          </h1>
          {topic.translation_en && (
            <p className="text-[#9b98b0] text-lg">{topic.translation_en}</p>
          )}

          {/* Progress bar */}
          {reviewedForms > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#9b98b0] mb-1.5">
                <span>{reviewedForms}/{totalForms} forms in SRS</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-[#7c6df2] rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap mt-5">
            <Link
              href={`/grammar/${topic.slug}/learn`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors text-sm shadow-lg shadow-[#7c6df2]/25"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5 3.5l9 4.5-9 4.5V3.5z" />
              </svg>
              Learn
            </Link>

            <button
              onClick={handleAddToReviews}
              disabled={addState === 'adding' || addState === 'all_added'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                addState === 'added' || addState === 'all_added'
                  ? 'border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/5'
                  : 'border-white/15 text-[#e8e6f0] hover:border-[#7c6df2]/50 hover:bg-[#7c6df2]/10'
              }`}
            >
              {addState === 'adding' && (
                <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
              )}
              {addState === 'idle'      && <><span>+</span><span>Add to Reviews</span></>}
              {addState === 'adding'    && 'Adding…'}
              {addState === 'added'     && <><span>✓</span><span>Added</span></>}
              {addState === 'all_added' && <><span>✓</span><span>In Reviews</span></>}
            </button>
          </div>
        </div>

        {/* ── SRS Progress ─────────────────────────────────────────── */}
        {srsData && (
          <div className="mb-6">
            <SrsProgressCard data={srsData} />
          </div>
        )}

        {/* ── Tab Nav ── */}
        <div className="flex items-center gap-1 p-1 bg-[#1a1830] rounded-2xl border border-white/5 mb-6">
          <TabBtn label="Details"   icon="📖" active={tab === 'details'}   onClick={() => setTab('details')} />
          <TabBtn label="Examples"  icon="✏️" active={tab === 'examples'}  onClick={() => setTab('examples')} />
          <TabBtn
            label={`Resources${resources.length > 0 ? ` (${resources.length})` : ''}`}
            icon="🔗"
            active={tab === 'resources'}
            onClick={() => setTab('resources')}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DETAILS TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'details' && (
          <div className="space-y-4">

            {/* Structure + Register row */}
            <div className={`grid gap-4 ${hasRegister ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

              {/* Structure card */}
              {topic.structure && (
                <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">Structure</p>
                  <div className="bg-[#0f0e17] rounded-xl p-4 border border-white/5 font-mono text-sm leading-relaxed">
                    {highlightStructure(topic.structure)}
                  </div>
                </div>
              )}

              {/* Register card */}
              {hasRegister && (
                <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">Register</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#c5c3d4]">Formal</span>
                      <RegisterDots level={topic.register_formal ?? 0} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#c5c3d4]">Standard</span>
                      <RegisterDots level={topic.register_standard ?? 0} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#c5c3d4]">Casual</span>
                      <RegisterDots level={topic.register_casual ?? 0} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* About / Explanation */}
            <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
              <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-4">About</p>
              <div className="text-[#c5c3d4] text-sm leading-relaxed space-y-3 whitespace-pre-line">
                {topic.explanation_en}
              </div>

              {/* First 2 example sentences inline in the About section */}
              {sentences.slice(0, 2).length > 0 && (
                <div className="mt-4 space-y-2">
                  {sentences.slice(0, 2).map((s, i) => (
                    <div key={s.id} className="bg-[#252340] rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <AudioButton filename={(s as any).audio_file} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#e8e6f0] text-sm">{s.sentence_de}</p>
                          {s.sentence_en && (
                            <p className="text-[#9b98b0] text-xs mt-0.5">{s.sentence_en}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fun Fact */}
            {topic.fun_fact && (
              <div className="bg-[#7c6df2]/8 rounded-2xl p-5 border border-[#7c6df2]/25">
                <div className="flex gap-3">
                  <span className="text-xl flex-shrink-0">💡</span>
                  <div>
                    <p className="text-xs font-bold text-[#9b8cf5] uppercase tracking-wider mb-2">Fun Fact</p>
                    <p className="text-[#c5c3d4] text-sm leading-relaxed">{topic.fun_fact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Synonyms + Related forms */}
            {(topic.synonyms || topic.related_forms) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {topic.synonyms && (
                  <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
                    <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">Synonyms</p>
                    <p className="text-[#c5c3d4] text-sm leading-relaxed">{topic.synonyms}</p>
                  </div>
                )}
                {topic.related_forms && (
                  <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
                    <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">Related</p>
                    <p className="text-[#c5c3d4] text-sm leading-relaxed">{topic.related_forms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sentence coverage */}
            {sentences.length > 0 && (
              <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider">Sentence Coverage</p>
                  <span className="text-xs text-[#9b98b0]">{sentences.length} sentences</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {sentences.map((s, i) => (
                    <div
                      key={s.id}
                      className="w-4 h-4 rounded-sm bg-[#7c6df2]/30 hover:bg-[#7c6df2]/60 transition-colors cursor-default"
                      title={s.sentence_de}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            EXAMPLES TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'examples' && (
          <div className="space-y-6">
            {groups.length === 0 && (
              <div className="text-center py-12 text-[#9b98b0]">
                No examples yet for this topic.
              </div>
            )}

            {groups.map(({ person, sentences: groupSents }) => (
              <div key={person}>
                {/* Person label */}
                {person !== 'general' && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
                      {person}
                    </span>
                    <span className="text-xs text-[#9b98b0]">{groupSents.length} sentences</span>
                  </div>
                )}

                <div className="space-y-2">
                  {groupSents.map((s, i) => (
                    <SentenceCard
                      key={s.id}
                      sentence={s}
                      index={i}
                      showAudio={true}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Add-to-reviews CTA at bottom of examples */}
            {sentences.length > 0 && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleAddToReviews}
                  disabled={addState === 'adding' || addState === 'all_added'}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    addState === 'added' || addState === 'all_added'
                      ? 'bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80]'
                      : 'bg-[#7c6df2] text-white hover:bg-[#9b8cf5] shadow-lg shadow-[#7c6df2]/25'
                  }`}
                >
                  {addState === 'idle'      && 'Add all to SRS queue'}
                  {addState === 'adding'    && 'Adding…'}
                  {addState === 'added'     && '✓ Added to queue'}
                  {addState === 'all_added' && '✓ Already in queue'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            RESOURCES TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'resources' && (
          <div className="space-y-4">
            {resources.length === 0 ? (
              <div className="bg-[#1a1830] rounded-2xl p-10 border border-white/5 text-center">
                <p className="text-3xl mb-3">📚</p>
                <p className="text-[#9b98b0] text-sm">No resources added yet for this topic.</p>
              </div>
            ) : (
              <>
                {/* YouTube resources */}
                {resources.filter(r => r.type === 'youtube').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3 px-1">
                      YouTube
                    </p>
                    <div className="space-y-2">
                      {resources.filter(r => r.type === 'youtube').map((r, i) => (
                        <ResourceCard key={i} resource={r} />
                      ))}
                    </div>
                  </div>
                )}

                {/* TikTok resources */}
                {resources.filter(r => r.type === 'tiktok').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3 px-1">
                      TikTok
                    </p>
                    <div className="space-y-2">
                      {resources.filter(r => r.type === 'tiktok').map((r, i) => (
                        <ResourceCard key={i} resource={r} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other resources */}
                {resources.filter(r => r.type === 'website').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3 px-1">
                      Other
                    </p>
                    <div className="space-y-2">
                      {resources.filter(r => r.type === 'website').map((r, i) => (
                        <ResourceCard key={i} resource={r} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
