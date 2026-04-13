'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import {
  awardXPAndUpdateStreak,
  updateDailyCards,
  getOrCreateProgress,
  XP_CORRECT_LEARN,
  XP_WRONG_LEARN,
} from '@/lib/gamification'
import { getPathById } from '@/lib/paths'
import type { GrammarTopic, GrammarSentence } from '@/lib/supabase'
import AudioButton from '@/components/AudioButton'
import { VocabInfoBody } from '@/components/VocabInfoBody'

// ─── Types ────────────────────────────────────────────────────────────────────


interface GrammarLearnItem {
  type: 'grammar'
  topic: GrammarTopic
  sentence: GrammarSentence
}

// New vocab system (gwc_vocab + gwc_vocab_sentences)
interface GwcVocab {
  id: string; slug: string; word: string; type: string; article: string | null
  plural: string | null; level: string; frequency_rank: number | null
  translation_en: string; explanation_en: string
  usage_notes: string | null
  fun_fact: string | null
  synonyms: string | null
  related_words: string | null
  nom_sg: string | null; nom_pl: string | null
  akk_sg: string | null; akk_pl: string | null
  dat_sg: string | null; dat_pl: string | null
  gen_sg: string | null; gen_pl: string | null
  comparative: string | null
  superlative: string | null
}
interface GwcVocabSentence {
  id: string; vocab_id: string; sentence_de: string; sentence_en: string
  cloze_word: string; grammatical_case: string | null; min_level: string; sort_order: number
  audio_file?: string | null
}

type ClozeItem =
  | { kind: 'vocab_new'; vocab: GwcVocab;     sentence: GwcVocabSentence }
  | { kind: 'grammar';   topic: GrammarTopic; sentence: GrammarSentence }

interface UserPath {
  id: string
  path_id: string
  queue_position: number
  daily_goal: number
  batch_size: number
  lesson_order: string
  active: boolean
}

interface ClozeResult {
  id: string           // sentence ID
  type: 'vocab_new' | 'grammar'
  correct: boolean
  vocabId?: string     // vocab_new only — uuid of gwc_vocab row
  topicId?: string     // grammar only — uuid of gwc_grammar_topics row
}

interface CompletionData {
  total: number
  correct: number
  xpGained: number
  newStreak: number
  dailyTotal: number
}

type AppPhase = 'loading' | 'no-paths' | 'no-items' | 'intro-sequence' | 'quiz-time' | 'cloze' | 'batch-done' | 'done' | 'daily-goal-reached'

// One path's worth of items to learn
interface PathBatch {
  name: string
  clozeItems: ClozeItem[]
  introItems: ClozeItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typColor(typ: string) {
  switch (typ) {
    case 'NOMEN':     return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'VERB':      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'ADJEKTIV':  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'ADVERB':    return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'GRAMMATIK': return 'bg-[#7c6df2]/20 text-[#9b8cf5] border-[#7c6df2]/30'
    default:          return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

function highlightWord(sentence: string, word: string) {
  const parts = sentence.split(new RegExp(`(${word})`, 'gi'))
  return parts.map((part, i) =>
    new RegExp(`^${word}$`, 'i').test(part)
      ? <span key={i} className="text-[#9b8cf5] font-bold underline decoration-[#7c6df2]/50">{part}</span>
      : <span key={i}>{part}</span>
  )
}

function normalize(s: string) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

function createCloze(sentence: string, clozeWord: string): string {
  return sentence.replace(new RegExp(clozeWord, 'i'), '___')
}

/** Highlight the vocab's English translation inside the English sentence. */
function highlightTranslation(sentenceEn: string, vocabEn: string) {
  if (!vocabEn) return <span>{sentenceEn}</span>
  const idx = sentenceEn.toLowerCase().indexOf(vocabEn.toLowerCase())
  if (idx === -1) return <span>{sentenceEn}</span>
  return (
    <>
      {sentenceEn.slice(0, idx)}
      <span className="text-[#7c6df2] font-semibold">{sentenceEn.slice(idx, idx + vocabEn.length)}</span>
      {sentenceEn.slice(idx + vocabEn.length)}
    </>
  )
}

function getDeclension(artikel: string, word: string, genitiv: string | null) {
  const art = artikel.toLowerCase()
  let akkArt = artikel, datArt = artikel, genArt = artikel
  let genForm = genitiv || `${word}s`
  if (art === 'der') { akkArt = 'den'; datArt = 'dem'; genArt = 'des' }
  else if (art === 'die') { akkArt = 'die'; datArt = 'der'; genArt = 'der'; genForm = genitiv || word }
  else if (art === 'das') { akkArt = 'das'; datArt = 'dem'; genArt = 'des' }
  return [
    { label: 'Nominativ', art: artikel, noun: word },
    { label: 'Akkusativ', art: akkArt,  noun: word },
    { label: 'Dativ',     art: datArt,  noun: word },
    { label: 'Genitiv',   art: genArt,  noun: genForm },
  ]
}

/** Derive a grey placeholder hint for the grammar blank based on topic category/title */
function getGrammarPlaceholder(topic: GrammarTopic): string {
  const title = (topic.title ?? '').toLowerCase()
  const cat   = (topic.category ?? '').toLowerCase()
  if (title.includes('w-frage') || cat.includes('w_question') || cat.includes('question'))
    return 'question-word'
  if (cat.includes('verb'))   return 'verb form'
  if (cat.includes('article') || cat.includes('artikel')) return 'article'
  if (cat.includes('adj'))     return 'adjective'
  if (cat.includes('prep'))    return 'preposition'
  if (cat.includes('modal'))   return 'modal verb'
  if (cat.includes('pronoun')) return 'pronoun'
  return 'answer'
}

// Simple markdown: **bold** and \n → <br>
function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8e6f0]">$1</strong>')
    .replace(/\n/g, '<br />')
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

// ─── New vocab system fetch (gwc_vocab) ──────────────────────────────────────

// Admin email — draft items are visible to this account only
const ADMIN_EMAIL = 'cabe.management@gmail.com'

async function fetchNewVocabItems(
  sessionId: string,
  isAdmin = false
): Promise<{ vocab: GwcVocab; sentences: GwcVocabSentence[] }[]> {
  // Words that already have ANY review row are considered "learned" — skip them
  const { data: existingRows } = await supabase
    .from('gwc_vocab_reviews')
    .select('vocab_id')
    .eq('session_id', sessionId)

  const learnedIds = new Set((existingRows || []).map((r: { vocab_id: string }) => r.vocab_id))

  let vocabQuery = supabase
    .from('gwc_vocab')
    .select('*')
    .order('frequency_rank', { ascending: true, nullsFirst: false })
  if (!isAdmin) vocabQuery = vocabQuery.eq('is_draft', false)

  const { data: vocabs } = await vocabQuery

  const newVocabs = (vocabs as GwcVocab[] || []).filter(v => !learnedIds.has(v.id))
  if (newVocabs.length === 0) return []

  const vocabIds = newVocabs.map(v => v.id)
  const { data: sentences } = await supabase
    .from('gwc_vocab_sentences')
    .select('*')
    .in('vocab_id', vocabIds)
    .order('sort_order', { ascending: true })

  return newVocabs
    .map(vocab => ({
      vocab,
      sentences: (sentences as GwcVocabSentence[] || []).filter(s => s.vocab_id === vocab.id),
    }))
    .filter(item => item.sentences.length > 0)
}


async function fetchGrammarItems(
  sessionId: string,
  batchSize: number,
  isAdmin = false
): Promise<GrammarLearnItem[]> {
  // Get already-reviewed grammar topic IDs
  const { data: reviewRows } = await supabase
    .from('gwc_grammar_reviews')
    .select('topic_id')
    .eq('session_id', sessionId)

  const reviewedTopicIds = new Set((reviewRows || []).map((r: { topic_id: string }) => r.topic_id))

  // Fetch topics sorted by their sort_order (so we teach topics in order)
  let topicsQuery = supabase
    .from('gwc_grammar_topics')
    .select('*')
    .order('sort_order', { ascending: true })
  if (!isAdmin) topicsQuery = topicsQuery.eq('is_draft', false)

  const { data: topics } = await topicsQuery

  const topicMap: Record<string, GrammarTopic> = Object.fromEntries(
    (topics || []).map((t: GrammarTopic) => [t.id, t])
  )
  const topicOrder: Record<string, number> = Object.fromEntries(
    (topics || []).map((t: GrammarTopic, i: number) => [t.id, i])
  )

  // Fetch all grammar sentences
  const { data: sentences } = await supabase
    .from('gwc_grammar_sentences')
    .select('*')
    .order('sort_order', { ascending: true })

  // Group sentences by topic_id — sorted by sort_order (already done above)
  const sentencesByTopic: Record<string, GrammarSentence[]> = {}
  for (const s of (sentences as GrammarSentence[] || [])) {
    if (!sentencesByTopic[s.topic_id]) sentencesByTopic[s.topic_id] = []
    sentencesByTopic[s.topic_id].push(s)
  }

  // Pick ONE sentence per unreviewed topic (first by sort_order), up to batchSize topics
  const unreviewedTopics = (topics || [])
    .filter(t => !reviewedTopicIds.has(t.id) && topicMap[t.id])
    .slice(0, batchSize)

  return unreviewedTopics
    .map(topic => {
      const first = (sentencesByTopic[topic.id] || [])[0]
      if (!first) return null
      return { type: 'grammar' as const, topic, sentence: first }
    })
    .filter((x): x is GrammarLearnItem => x !== null)
}

// ─── Quiz Time Modal ──────────────────────────────────────────────────────────

function QuizTimeScreen({ count, pathName, onStart, onBack }: {
  count: number; pathName: string; onStart: () => void; onBack?: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 py-3 border-b border-white/5">
        {onBack ? (
          <button onClick={onBack} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
            ← Back
          </button>
        ) : (
          <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
            ✕ Dashboard
          </Link>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold text-[#e8e6f0] mb-8">Quiz Time!</h2>

          {/* Path card */}
          <div className="bg-[#7c6df2]/20 rounded-2xl px-5 py-4 border border-[#7c6df2]/30 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#e8e6f0] font-semibold">{pathName}</span>
              <span className="text-[#9b8cf5] font-bold">+{count}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: Math.max(count * 2, 10) }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full min-w-[14px] ${i < count ? 'bg-[#7c6df2]' : 'bg-white/15'}`} />
              ))}
            </div>
          </div>

          <p className="text-center text-[#9b98b0] text-base mb-8 leading-relaxed px-2">
            Complete a quiz on the {count} item{count !== 1 ? 's' : ''} you just studied to add them to your Review Queue!
          </p>

          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/30 hover:-translate-y-0.5"
          >
            → Review
          </button>
        </div>
      </div>
    </div>
  )
}




// ─── Grammar Topic Explanation (shown inline before first sentence of a topic) ─

function GrammarExplainer({ topic, sentence, onContinue, onBack, current: idx, total }: {
  topic: GrammarTopic; sentence?: GrammarSentence; onContinue: () => void
  onBack?: () => void; current: number; total: number
}) {
  const isLast      = idx >= total - 1
  const hasRegister = topic.register_formal != null || topic.register_standard != null || topic.register_casual != null

  function highlightStructure(text: string) {
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
          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= level ? 'bg-[#7c6df2]' : 'bg-white/10'}`} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      <div className="flex items-center px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-lg w-full mx-auto space-y-4">

          {/* Badges + Title */}
          <div className="text-center mb-2">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
                Grammar
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
                {topic.level}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-[#e8e6f0]">{topic.title}</h2>
            {topic.translation_en && (
              <p className="text-[#9b98b0] text-base mt-1">{topic.translation_en}</p>
            )}
          </div>

          {/* Structure + Register */}
          {(topic.structure || hasRegister) && (
            <div className={`grid gap-3 ${topic.structure && hasRegister ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {topic.structure && (
                <div className="bg-[#1a1830] rounded-2xl p-4 border border-white/5">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-2">Structure</p>
                  <div className="bg-[#0f0e17] rounded-xl px-4 py-3 border border-white/5 font-mono text-sm leading-relaxed">
                    {highlightStructure(topic.structure)}
                  </div>
                </div>
              )}
              {hasRegister && (
                <div className="bg-[#1a1830] rounded-2xl p-4 border border-white/5">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">Register</p>
                  <div className="space-y-2.5">
                    {[['Formal', topic.register_formal], ['Standard', topic.register_standard], ['Casual', topic.register_casual]].map(([label, val]) =>
                      val != null ? (
                        <div key={label as string} className="flex items-center justify-between">
                          <span className="text-sm text-[#c5c3d4]">{label as string}</span>
                          <RegisterDots level={val as number} />
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          <div className="bg-[#1a1830] rounded-2xl p-5 border border-white/5">
            <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-3">How it works</p>
            <div
              className="text-[#c5c3d4] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMd(topic.explanation_en) }}
            />

            {/* Inline example sentence */}
            {sentence && (
              <div className="mt-4 bg-[#252340] rounded-xl px-4 py-3 border border-white/5">
                <p className="text-[#e8e6f0] text-sm">{sentence.sentence_de}</p>
                {sentence.sentence_en && (
                  <p className="text-[#9b98b0] text-xs mt-1">{sentence.sentence_en}</p>
                )}
              </div>
            )}
          </div>

          {/* Fun Fact */}
          {topic.fun_fact && (
            <div className="bg-[#7c6df2]/8 rounded-2xl p-5 border border-[#7c6df2]/25">
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">💡</span>
                <div>
                  <p className="text-xs font-bold text-[#9b8cf5] uppercase tracking-wider mb-1.5">Fun Fact</p>
                  <p className="text-[#c5c3d4] text-sm leading-relaxed">{topic.fun_fact}</p>
                </div>
              </div>
            </div>
          )}

          {/* Synonyms + Related */}
          {(topic.synonyms || topic.related_forms) && (
            <div className={`grid gap-3 ${topic.synonyms && topic.related_forms ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              {topic.synonyms && (
                <div className="bg-[#1a1830] rounded-2xl p-4 border border-white/5">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-2">Synonyms</p>
                  <p className="text-[#c5c3d4] text-sm leading-relaxed">{topic.synonyms}</p>
                </div>
              )}
              {topic.related_forms && (
                <div className="bg-[#1a1830] rounded-2xl p-4 border border-white/5">
                  <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-wider mb-2">Related</p>
                  <p className="text-[#c5c3d4] text-sm leading-relaxed">{topic.related_forms}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Bottom nav — progress dots + Previous / Next */}
      <div className="px-6 pb-8 pt-4 border-t border-white/5 bg-[#0f0e17]">
        <div className="flex justify-center gap-2 mb-5">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i === idx ? 'w-5 h-2 bg-[#7c6df2]' : i < idx ? 'w-2 h-2 bg-[#7c6df2]/40' : 'w-2 h-2 bg-white/15'
            }`} />
          ))}
        </div>
        <div className="flex gap-3 max-w-lg mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-white/10 text-[#9b98b0] hover:text-[#e8e6f0] hover:border-white/20 transition-colors font-semibold"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/20"
          >
            {isLast ? 'Start Quiz →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vocab Intro Screen ── (verb intro removed, verbs are now grammar/vocab) ──

// ─── Vocab Intro Screen ───────────────────────────────────────────────────────

function VocabIntroScreen({ vocab, sentence, onContinue, onBack, current: idx, total }: {
  vocab: GwcVocab
  sentence: GwcVocabSentence
  onContinue: () => void
  onBack?: () => void
  current: number
  total: number
}) {
  const isLast = idx === total - 1

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      <div className="flex items-center px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">

          {/* New word badge */}
          <div className="flex justify-center mb-5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30 uppercase tracking-widest">
              New Word
            </span>
          </div>

          {/* Full detail body — same as vocab detail page */}
          <VocabInfoBody vocab={vocab} showLink={false} />

          {/* Example sentence */}
          <div className="bg-[#1a1830] rounded-2xl border border-white/5 px-5 py-4 mt-4">
            <p className="text-xs text-[#9b98b0] uppercase tracking-wider font-bold mb-2">Example</p>
            <p className="text-[#e8e6f0] text-sm">{sentence.sentence_de}</p>
            <p className="text-[#9b98b0] text-xs mt-1 italic">{sentence.sentence_en}</p>
          </div>

        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-6 py-5 border-t border-white/5 flex flex-col gap-3 max-w-lg mx-auto w-full">
        <div className="flex gap-2">
          {onBack && (
            <button onClick={onBack} className="flex-1 py-3.5 rounded-xl border border-white/10 text-[#9b98b0] font-semibold hover:bg-white/5 transition-colors">
              ← Back
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-all"
          >
            {isLast ? 'Start Quiz →' : 'Next →'}
          </button>
        </div>
        <p className="text-center text-[#9b98b0] text-xs">{idx + 1} of {total}</p>
      </div>
    </div>
  )
}

// ─── Unified Cloze Session ────────────────────────────────────────────────────

function ClozeSession({
  items,
  onComplete,
  onAnswer,
}: {
  items: ClozeItem[]
  onComplete: (results: ClozeResult[]) => void
  onAnswer: (result: ClozeResult) => void
}) {
  const [index, setIndex]                 = useState(0)
  const [input, setInput]                 = useState('')
  const [answered, setAnswered]           = useState(false)
  const [showEN, setShowEN]               = useState(false)
  const [showInfo, setShowInfo]           = useState(false)
  const [results, setResults]             = useState<ClozeResult[]>([])
  const infoRef = useRef<HTMLDivElement>(null)

  const current = items[index]

  // When index changes: reset card state
  useEffect(() => {
    setInput('')
    setAnswered(false)
    setShowInfo(false)
  }, [index])

  // Scroll to info panel when opened
  useEffect(() => {
    if (showInfo && infoRef.current) {
      setTimeout(() => infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [showInfo])

  const sentence   = current?.kind === 'grammar' ? current.sentence
                   : current?.sentence

  const clozeWord  = sentence?.cloze_word ?? ''
  const clozeParts = createCloze(sentence?.sentence_de ?? '', sentence?.cloze_word ?? '').split('___')

  const isCorrect =
    normalize(input) === normalize(clozeWord) ||
    input.trim().toLowerCase() === clozeWord.toLowerCase()

  const handleCheck = useCallback(() => {
    if (!input.trim() || answered) return
    setAnswered(true)
  }, [input, answered])

  function advance(newResults: ClozeResult[]) {
    if (index + 1 >= items.length) {
      onComplete(newResults)
    } else {
      setIndex(i => i + 1)
    }
  }

  const handleNext = useCallback(() => {
    if (!sentence) return
    const r: ClozeResult = {
      id:      sentence.id,
      type:    current.kind === 'vocab_new' ? 'vocab_new' : 'grammar',
      correct: isCorrect,
      vocabId: current.kind === 'vocab_new' ? current.vocab.id : undefined,
      topicId: current.kind === 'grammar'   ? current.topic.id : undefined,
    }
    // Save this item to the DB immediately — marks it as "learned" right away
    onAnswer(r)
    const newResults = [...results, r]
    setResults(newResults)
    advance(newResults)
  }, [results, sentence, current, isCorrect, index, items.length, onAnswer]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') answered ? handleNext() : handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answered, handleCheck, handleNext])

  if (!current || !sentence) return null

  const progress = results.length / items.length

  // Small context badge: grammar → person
  const personBadge = current.kind === 'grammar' ? (current.sentence.person || null) : null


  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {/* Kind badge */}
          {current.kind === 'grammar' && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
              Grammar
            </span>
          )}
          {personBadge && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {personBadge}
            </span>
          )}
          <span className="text-[#9b98b0]">{results.length + 1} / {items.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Main content — not vertically centred so the Info panel can flow below */}
      <div className="flex-1 flex flex-col items-center px-6 pt-16 pb-6">
        <div className="max-w-2xl w-full text-center space-y-6">


          {/* German sentence with gap */}
          <div className="flex items-center justify-center gap-3">
            <p className="text-[#e8e6f0] text-3xl md:text-4xl leading-relaxed font-light">
              {clozeParts[0]}
              <span className="inline-block relative align-middle">
                <span className={`inline-block min-w-[140px] border-b-2 px-2 text-center transition-colors ${
                  !answered
                    ? 'border-[#7c6df2]'
                    : isCorrect
                      ? 'border-[#4ade80] text-[#4ade80] font-bold'
                      : 'border-[#f87171] text-[#f87171] font-bold'
                }`}>
                  {answered
                    ? clozeWord
                    : input
                      ? <span className="font-bold text-[#9b8cf5]">{input}</span>
                      : current.kind === 'grammar'
                        ? <span className="text-[#4d4a65] font-normal italic text-2xl">{getGrammarPlaceholder(current.topic)}</span>
                        : <span className="text-[#4d4a65] font-normal">{clozeWord}</span>
                  }
                </span>
              </span>
              {clozeParts[1]}
            </p>
          </div>

          {/* English translation — always visible for both vocab and grammar */}
          {sentence?.sentence_en && (
            <p className="text-[#9b98b0] text-base">
              {current.kind === 'vocab_new'
                ? highlightTranslation(sentence.sentence_en, current.vocab.translation_en)
                : (current.sentence as GrammarSentence).highlight_en
                  ? highlightTranslation(sentence.sentence_en, (current.sentence as GrammarSentence).highlight_en!)
                  : <span>{sentence.sentence_en}</span>
              }
            </p>
          )}

          {/* Wrong answer feedback */}
          {answered && !isCorrect && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm">
              You typed: <span className="font-bold">"{input}"</span>
            </div>
          )}
        </div>

        {/* ── Info panel — shown when user clicks More Info ────────── */}
        {answered && showInfo && (
          <div ref={infoRef} className="max-w-2xl w-full mt-10 mb-4">
            <div className="h-px bg-white/8 mb-8" />
            {current.kind === 'vocab_new' && (() => {
              const v = current.vocab
              const isNoun = v.type === 'NOMEN' && v.article != null
              const CASE_LABEL: Record<string, string> = {
                NOMINATIV: 'Nominative', AKKUSATIV: 'Accusative', DATIV: 'Dative', GENITIV: 'Genitive',
              }
              return (
                <div className="space-y-4 text-left">
                  {/* Hero */}
                  <div>
                    {v.article && (
                      <p className="text-[#7c6df2] text-xs font-bold uppercase tracking-widest mb-1">
                        {v.article} · {v.type === 'NOMEN' ? 'Noun' : v.type.charAt(0) + v.type.slice(1).toLowerCase()}
                      </p>
                    )}
                    <h2 className="text-3xl font-extrabold text-[#e8e6f0]">{v.word}</h2>
                    {v.plural && <p className="text-[#9b98b0] text-xs mt-0.5">Plural: <span className="text-[#c8c5d8]">die {v.plural}</span></p>}
                    <p className="text-[#9b98b0] text-sm mt-1">🇬🇧 {v.translation_en}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-[#7c6df2]/15 text-[#9b8cf5] px-2.5 py-1 rounded-full">{v.level}</span>
                      {v.frequency_rank && (
                        <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-[#3bd395]/10 text-[#3bd395] px-2.5 py-1 rounded-full">⚡ Rank #{v.frequency_rank}</span>
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                    <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Meaning & Explanation</p>
                    <p className="text-sm text-[#c8c5d8] leading-relaxed">{v.explanation_en}</p>
                    {v.usage_notes && (
                      <p className="text-xs text-[#9b98b0] leading-relaxed mt-3 pt-3 border-t border-white/5">
                        💡 <strong className="text-[#e8e6f0]">Usage:</strong> {v.usage_notes}
                      </p>
                    )}
                  </div>

                  {/* Fun Fact */}
                  {v.fun_fact && (
                    <div className="bg-gradient-to-br from-[#7c6df2]/10 to-[#7c6df2]/5 border border-[#7c6df2]/20 rounded-2xl p-5">
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#7c6df2] mb-2">Fun Fact</p>
                      <p className="text-sm text-[#c8c5d8] leading-relaxed">{v.fun_fact}</p>
                    </div>
                  )}

                  {/* Declension */}
                  {isNoun && (
                    <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Declension</p>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-2 pr-4">Case</th>
                            <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-2 pr-4">Singular</th>
                            <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-2">Plural</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'NOMINATIV', sg: v.nom_sg, pl: v.nom_pl },
                            { key: 'AKKUSATIV', sg: v.akk_sg, pl: v.akk_pl },
                            { key: 'DATIV',     sg: v.dat_sg, pl: v.dat_pl },
                            { key: 'GENITIV',   sg: v.gen_sg, pl: v.gen_pl },
                          ].map(({ key, sg, pl }) => (
                            <tr key={key} className="border-t border-white/5">
                              <td className="py-2 pr-4 font-bold text-[#7c6df2] text-xs">{CASE_LABEL[key]}</td>
                              <td className="py-2 pr-4 text-[#e8e6f0]">{sg || '—'}</td>
                              <td className="py-2 text-[#e8e6f0]">{pl || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Related words */}
                  {(v.synonyms || v.related_words) && (
                    <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5 space-y-3">
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0]">Related Words</p>
                      {v.synonyms && (
                        <div>
                          <p className="text-xs text-[#9b98b0] mb-1.5">Synonyms</p>
                          <div className="flex flex-wrap gap-2">
                            {v.synonyms.split(',').map(s => (
                              <span key={s} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{s.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {v.related_words && (
                        <div>
                          <p className="text-xs text-[#9b98b0] mb-1.5">Related forms</p>
                          <div className="flex flex-wrap gap-2">
                            {v.related_words.split(',').map(r => (
                              <span key={r} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{r.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Link href={`/vocab/${v.slug}`} className="inline-flex items-center gap-2 text-sm text-[#7c6df2] hover:text-[#9b8cf5] transition-colors">
                    Open full word page →
                  </Link>
                  <div className="h-4" />
                </div>
              )
            })()}

            {current.kind === 'grammar' && (() => {
              const t = current.topic
              const hasRegister = t.register_formal != null || t.register_standard != null || t.register_casual != null
              return (
                <div className="space-y-4 text-left">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">Grammar</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">{t.level}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#e8e6f0]">{t.title}</h2>
                    {t.translation_en && <p className="text-sm text-[#9b8cf5] mt-0.5">{t.translation_en}</p>}
                  </div>

                  {/* Structure */}
                  {t.structure && (
                    <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Structure</p>
                      <p className="font-mono text-sm">
                        {t.structure.split(/(\[[^\]]+\])/g).map((part, i) =>
                          part.startsWith('[') && part.endsWith(']')
                            ? <span key={i} className="text-[#9b8cf5] font-semibold">{part}</span>
                            : <span key={i} className="text-[#e8e6f0]">{part}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                    <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Explanation</p>
                    <div
                      className="text-sm text-[#c8c5d8] leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: t.explanation_en
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8e6f0]">$1</strong>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>

                  {/* Fun Fact */}
                  {t.fun_fact && (
                    <div className="bg-gradient-to-br from-[#7c6df2]/10 to-[#7c6df2]/5 border border-[#7c6df2]/20 rounded-2xl p-5">
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#7c6df2] mb-2">Fun Fact</p>
                      <p className="text-sm text-[#c8c5d8] leading-relaxed">{t.fun_fact}</p>
                    </div>
                  )}

                  {/* Register */}
                  {hasRegister && (
                    <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Register</p>
                      <div className="space-y-2 text-sm">
                        {[
                          { label: 'Formal',   val: t.register_formal },
                          { label: 'Standard', val: t.register_standard },
                          { label: 'Casual',   val: t.register_casual },
                        ].map(({ label, val }) => val != null && (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[#9b98b0]">{label}</span>
                            <div className="flex gap-1">
                              {[1,2,3].map(i => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i <= val ? 'bg-[#7c6df2]' : 'bg-white/10'}`} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related forms */}
                  {t.related_forms && (
                    <div>
                      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Related Forms</p>
                      <div className="flex flex-wrap gap-2">
                        {t.related_forms.split(',').map(f => (
                          <span key={f} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{f.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link href={`/grammar/${t.slug}`} className="inline-flex items-center gap-2 text-sm text-[#7c6df2] hover:text-[#9b8cf5] transition-colors">
                    View full topic: {t.title} →
                  </Link>
                  <div className="h-4" />
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Bottom bar — sticky */}
      <div className="sticky bottom-0 z-10 bg-[#0f0e17] border-t border-white/5">
        {!answered ? (
          <div className="px-5 py-4 flex gap-3 max-w-xl mx-auto w-full">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type the missing word..."
              className="flex-1 bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors text-lg"
            />
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg"
            >
              ✓
            </button>
          </div>
        ) : (
          <div className="px-5 pt-3 pb-4 max-w-xl mx-auto w-full space-y-2.5">
            {/* Three action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setAnswered(false); setInput(''); setShowInfo(false) }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/10 text-sm font-medium transition-colors"
              >
                <span>↩</span> Undo
              </button>
              <button
                onClick={() => setShowInfo(v => !v)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  showInfo
                    ? 'bg-[#7c6df2]/20 border-[#7c6df2]/40 text-[#9b8cf5]'
                    : 'bg-white/5 border-white/10 text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/10'
                }`}
              >
                <span>ℹ</span> {showInfo ? 'Hide' : 'More Info'}
              </button>
              <button
                onClick={handleNext}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  isCorrect
                    ? 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10'
                    : 'border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10'
                }`}
              >
                {index + 1 >= items.length ? 'Done ✓' : 'Next →'}
              </button>
            </div>
            {/* Answer result bar */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isCorrect ? 'bg-[#4ade80]/5 border-[#4ade80]/20' : 'bg-[#f87171]/5 border-[#f87171]/20'
            }`}>
              {sentence?.audio_file && <AudioButton key={index} filename={sentence.audio_file} size="sm" />}
              <span className={`flex-1 text-base font-bold ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                {isCorrect ? `✓ ${clozeWord}` : `✗  ${clozeWord}`}
              </span>
              <button
                onClick={handleNext}
                className={`text-lg font-bold px-2 transition-opacity hover:opacity-70 ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Completion Screens ───────────────────────────────────────────────────────

function DailyGoalScreen({ data, onExtend, batchSize }: { data: CompletionData; onExtend: () => void; batchSize: number }) {
  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">Daily goal reached!</h2>
        <p className="text-[#9b98b0] mb-8">
          You've learned <span className="text-[#9b8cf5] font-bold">{data.dailyTotal}</span> new cards today.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">Correct</p>
            <p className="text-xl font-bold text-[#4ade80]">{pct}%</p>
          </div>
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">XP</p>
            <p className="text-xl font-bold text-[#9b8cf5]">+{data.xpGained}</p>
          </div>
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">Streak</p>
            <p className="text-xl font-bold text-orange-400">🔥 {data.newStreak}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onExtend}
            className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2]/20 text-[#9b8cf5] font-bold border border-[#7c6df2]/40 hover:bg-[#7c6df2]/30 transition-colors"
          >
            Learn {batchSize} more →
          </button>
          <Link
            href="/dashboard"
            className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors text-center"
          >
            Done for today
          </Link>
          <Link href="/review" className="text-[#9b98b0] text-sm hover:text-[#e8e6f0] transition-colors py-1">
            Go to Reviews →
          </Link>
        </div>
      </div>
    </div>
  )
}

function CompletionScreen({ data, onExtend, batchSize }: { data: CompletionData; onExtend: () => void; batchSize: number }) {
  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">{pct >= 70 ? 'Great job!' : 'Keep practicing!'}</h2>
        <p className="text-[#9b98b0] mb-1">{data.correct}/{data.total} correct — {pct}%</p>
        <p className="text-[#9b8cf5] font-bold mb-1">+{data.xpGained} XP</p>
        {data.newStreak > 0 && <p className="text-orange-400 text-sm mb-4">🔥 {data.newStreak} day streak</p>}
        <p className="text-[#9b98b0] text-sm mb-8">
          These cards are now in your <span className="text-[#9b8cf5] font-semibold">Review Queue</span>.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onExtend}
            className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2]/20 text-[#9b8cf5] font-bold border border-[#7c6df2]/40 hover:bg-[#7c6df2]/30 transition-colors"
          >
            Learn {batchSize} more →
          </button>
          <Link
            href="/dashboard"
            className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors text-center"
          >
            Done for today
          </Link>
          <Link href="/review" className="text-[#9b98b0] text-sm hover:text-[#e8e6f0] transition-colors py-1">
            Go to Reviews →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Batch Done Screen ────────────────────────────────────────────────────────

function BatchDoneScreen({ data, pathName, goal, onContinue, onExit }: {
  data: CompletionData
  pathName: string
  goal: number
  onContinue: () => void
  onExit: () => void
}) {
  const pct         = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  const goalPct     = goal > 0 ? Math.min(1, data.dailyTotal / goal) : 0
  const goalDone    = data.dailyTotal >= goal

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Title */}
          <h2 className="text-4xl font-bold text-[#e8e6f0] mb-8">Good Job! 🎉</h2>

          {/* Path card with score */}
          <div className="bg-[#7c6df2]/20 rounded-2xl px-5 py-4 border border-[#7c6df2]/30 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#e8e6f0] font-semibold">{pathName}</span>
              <span className="text-[#9b8cf5] font-bold">
                ✓ {data.correct}/{data.total}
              </span>
            </div>
            {/* Score bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7c6df2] rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-[#1a1830] rounded-xl px-4 py-3 border border-white/5 text-center">
              <p className="text-2xl font-bold text-[#9b8cf5]">+{data.xpGained}</p>
              <p className="text-xs text-[#9b98b0] mt-0.5">XP earned</p>
            </div>
            <div className="flex-1 bg-[#1a1830] rounded-xl px-4 py-3 border border-white/5 text-center">
              <p className="text-2xl font-bold text-[#e8e6f0]">{pct}%</p>
              <p className="text-xs text-[#9b98b0] mt-0.5">Correct</p>
            </div>
            {data.newStreak > 0 && (
              <div className="flex-1 bg-[#1a1830] rounded-xl px-4 py-3 border border-white/5 text-center">
                <p className="text-2xl font-bold text-orange-400">🔥{data.newStreak}</p>
                <p className="text-xs text-[#9b98b0] mt-0.5">Day streak</p>
              </div>
            )}
          </div>

          <p className="text-center text-[#9b98b0] text-sm mb-8 leading-relaxed">
            {goalDone
              ? "Daily goal reached! 🏆 These items are now in your Review Queue."
              : "These items are now in your Review Queue. Continue Learning to reach your Daily Goal!"}
          </p>

          {/* Action buttons */}
          {!goalDone && (
            <button
              onClick={onContinue}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/30 hover:-translate-y-0.5 mb-3"
            >
              → Continue Learning
            </button>
          )}
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-[#9b98b0] font-bold hover:text-[#e8e6f0] hover:border-white/20 transition-colors"
          >
            ↩ Exit to Summary
          </button>
        </div>
      </div>

      {/* Daily goal progress bar at bottom */}
      <div className="px-6 pb-8 pt-4 border-t border-white/5">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9b98b0]">Daily Goal</span>
            <span className="text-xs text-[#9b98b0]">{data.dailyTotal} / {goal}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${goalDone ? 'bg-emerald-500' : 'bg-[#7c6df2]'}`}
              style={{ width: `${goalPct * 100}%` }}
            />
          </div>
          {goalDone && (
            <p className="text-center text-emerald-400 text-xs mt-2 font-semibold">Goal complete! 🏆</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const searchParams   = useSearchParams()
  const pathFilter     = searchParams.get('path') ?? null   // e.g. "a1-verbs", "caros-path-a1"

  const [appPhase, setAppPhase]       = useState<AppPhase>('loading')
  const [error, setError]             = useState<string | null>(null)

  // Per-path batches — one entry per active path, processed sequentially
  const [pathBatches, setPathBatches] = useState<PathBatch[]>([])
  const [batchIdx, setBatchIdx]       = useState(0)

  // Current batch's cloze queue + intro sequence
  const [clozeItems, setClozeItems]   = useState<ClozeItem[]>([])
  const [introQueue, setIntroQueue]   = useState<ClozeItem[]>([])
  const [introIndex, setIntroIndex]   = useState(0)

  // Active path name for quiz modal display
  const [pathName, setPathName]       = useState('German With Caro')

  // Daily goal tracking
  const [currentGoal, setCurrentGoal] = useState(10)
  const [batchSize, setBatchSize]     = useState(5)  // actual batch size from user's path config
  const [completion, setCompletion]   = useState<CompletionData | null>(null)

  // Accumulate results across all batches for the final summary
  const accResultsRef = useRef<ClozeResult[]>([])

  // loadKey increments to re-trigger load (used for "learn more" extension)
  const [loadKey, setLoadKey]         = useState(0)
  const extensionBatchRef             = useRef<number | null>(null)

  // ── Load items ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setAppPhase('loading')
      setError(null)
      try {
        const sessionId = getOrCreateSessionId()

        // Check if admin — draft items are visible to the admin account only
        const { data: { user } } = await supabase.auth.getUser()
        const isAdmin = user?.email === ADMIN_EMAIL

        // Extension batch: skip path loading, will refetch all items for next batch
        const extBatch = extensionBatchRef.current
        extensionBatchRef.current = null

        if (extBatch !== null) {
          // Extension: refetch items with same loading logic
          // (no special handling needed — just fall through to normal load)
        }

        // 1. Load user level + daily budget from profile
        const progress = await getOrCreateProgress(sessionId)
        const userLevel = progress?.german_level ?? 'A1'

        // Check if daily goal already reached — don't load new items
        const todayStr       = new Date().toISOString().slice(0, 10)
        const isToday        = progress?.daily_cards_date === todayStr
        const dailyCardsSoFar = isToday ? (progress?.daily_cards_today ?? 0) : 0
        const dailyGoal      = progress?.daily_goal ?? 10
        const remainingBudget = Math.max(0, dailyGoal - dailyCardsSoFar)

        if (remainingBudget === 0) {
          setAppPhase('daily-goal-reached')
          return
        }

        // 2. Load active paths — filtered to a single path if ?path= param is present
        let pathQuery = supabase
          .from('gwc_user_paths')
          .select('*')
          .eq('session_id', sessionId)
          .eq('active', true)
          .order('queue_position', { ascending: true })
        if (pathFilter) {
          pathQuery = pathQuery.eq('path_id', pathFilter)
        }
        const { data: pathRows } = await pathQuery

        const activePaths = (pathRows || []) as UserPath[]

        if (activePaths.length === 0) {
          setAppPhase('no-paths')
          return
        }

        // Set path name and batch size (use first path)
        const firstDef = getPathById(activePaths[0].path_id)
        if (firstDef) setPathName(firstDef.name)
        setBatchSize(activePaths[0].batch_size ?? 5)

        // 3. Build one PathBatch per active path
        const batches: PathBatch[] = []
        let totalGoal = 0
        let budgetLeft = remainingBudget

        for (const path of activePaths) {
          const def = getPathById(path.path_id)
          if (!def) continue
          if (budgetLeft <= 0) break

          // Cap this path's contribution to remaining daily budget
          const effectiveBatch = Math.min(path.batch_size, budgetLeft)
          totalGoal += effectiveBatch

          const pathGrammar: GrammarLearnItem[] = []
          const pathVocab: { vocab: GwcVocab; sentences: GwcVocabSentence[] }[] = []

          if (def.type === 'grammar' || def.type === 'mixed') {
            const g = await fetchGrammarItems(sessionId, effectiveBatch, isAdmin)
            pathGrammar.push(...g)
          }
          if (def.type === 'vocab' || def.type === 'mixed') {
            const voc = await fetchNewVocabItems(sessionId, isAdmin)
            // Limit to remaining budget after grammar
            const vocabSlot = Math.max(0, effectiveBatch - pathGrammar.length)
            pathVocab.push(...voc.slice(0, vocabSlot))
          }

          budgetLeft -= (pathGrammar.length + pathVocab.length)

          if (pathGrammar.length === 0 && pathVocab.length === 0) continue

          // Build cloze items for this path: grammar → vocab
          const clozeItems: ClozeItem[] = [
            ...pathGrammar.map(g => ({ kind: 'grammar' as const, topic: g.topic, sentence: g.sentence })),
            ...pathVocab.map(item => {
              const nomSent = item.sentences.find(s => s.grammatical_case === 'NOMINATIV') ?? item.sentences[0]
              return { kind: 'vocab_new' as const, vocab: item.vocab, sentence: nomSent }
            }),
          ]

          // Build intro items (one per unique topic/vocab)
          const seenIntros = new Set<string>()
          const introItems: ClozeItem[] = []
          for (const item of clozeItems) {
            if (item.kind === 'grammar' && !seenIntros.has(item.topic.id)) {
              seenIntros.add(item.topic.id); introItems.push(item)
            } else if (item.kind === 'vocab_new' && !seenIntros.has(item.vocab.id)) {
              seenIntros.add(item.vocab.id); introItems.push(item)
            }
          }

          batches.push({ name: def.name, clozeItems, introItems })
        }

        setCurrentGoal(totalGoal)

        if (batches.length === 0) {
          setAppPhase('no-items')
          return
        }

        // Reset accumulated results for this session
        accResultsRef.current = []
        setPathBatches(batches)
        setBatchIdx(0)
        setPathName(batches[0].name)
        setClozeItems(batches[0].clozeItems)
        setIntroQueue(batches[0].introItems)
        setIntroIndex(0)

        setAppPhase(batches[0].introItems.length > 0 ? 'intro-sequence' : 'quiz-time')
      } catch (e) {
        setError('Connection error.')
        console.error(e)
        setAppPhase('no-items')
      }
    }
    load()
  }, [loadKey]) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Save a single cloze result immediately when card is answered ─────────
  const saveLearnResult = useCallback(async (r: ClozeResult) => {
    const sessionId = getOrCreateSessionId()
    const srs = calculateNextReview(r.correct, 0)
    const nextReview = new Date(Date.now() + srs.intervalHours * 3_600_000).toISOString()

    if (r.type === 'vocab_new' && r.vocabId) {
      await supabase.from('gwc_vocab_reviews').upsert(
        {
          session_id:        sessionId,
          vocab_id:          r.vocabId,
          interval_days:     Math.ceil(srs.intervalDays),
          ease_factor:       2.5,
          repetitions:       srs.newSrsLevel,
          next_review_at:    nextReview,
          last_sentence_idx: 1,
          total_reviews:     1,
          correct_reviews:   r.correct ? 1 : 0,
        },
        { onConflict: 'session_id,vocab_id', ignoreDuplicates: false }
      )
    } else if (r.type === 'grammar' && r.topicId) {
      const { data: existing } = await supabase
        .from('gwc_grammar_reviews')
        .select('id')
        .eq('session_id', sessionId)
        .eq('topic_id', r.topicId)
        .maybeSingle()

      if (existing) {
        await supabase.from('gwc_grammar_reviews').update({
          next_review_at:  nextReview,
          repetitions:     srs.newSrsLevel,
          ease_factor:     2.5,
          interval_days:   Math.ceil(srs.intervalDays),
          correct_streak:  r.correct ? 1 : 0,
          total_reviews:   1,
          correct_reviews: r.correct ? 1 : 0,
        }).eq('id', existing.id)
      } else {
        await supabase.from('gwc_grammar_reviews').insert({
          session_id:        sessionId,
          topic_id:          r.topicId,
          next_review_at:    nextReview,
          last_sentence_idx: 0,
          repetitions:       srs.newSrsLevel,
          ease_factor:       2.5,
          interval_days:     Math.ceil(srs.intervalDays),
          correct_streak:    r.correct ? 1 : 0,
          total_reviews:     1,
          correct_reviews:   r.correct ? 1 : 0,
        })
      }
    }

    // Award XP per card immediately
    await awardXPAndUpdateStreak(getOrCreateSessionId(), r.correct ? XP_CORRECT_LEARN : XP_WRONG_LEARN)
  }, [])

  // ── Batch complete — each card was already saved via saveLearnResult ────────
  async function handleClozeComplete(results: ClozeResult[]) {
    const sessionId = getOrCreateSessionId()
    // XP and daily cards were already awarded per-card in saveLearnResult.
    // Just update the daily card count total and get the latest streak.
    await updateDailyCards(sessionId, results.length)

    // Accumulate results across all batches
    accResultsRef.current = [...accResultsRef.current, ...results]

    // Advance to next path batch, or show the combined summary
    const nextIdx = batchIdx + 1
    if (nextIdx < pathBatches.length) {
      const next = pathBatches[nextIdx]
      setBatchIdx(nextIdx)
      setPathName(next.name)
      setClozeItems(next.clozeItems)
      setIntroQueue(next.introItems)
      setIntroIndex(0)
      setAppPhase(next.introItems.length > 0 ? 'intro-sequence' : 'quiz-time')
    } else {
      // All paths done — build combined summary from all accumulated results
      const allResults   = accResultsRef.current
      const allCorrect   = allResults.filter(r => r.correct).length
      const allXp        = allResults.filter(r => r.correct).length * XP_CORRECT_LEARN
                         + allResults.filter(r => !r.correct).length * XP_WRONG_LEARN
      const xpResult     = await awardXPAndUpdateStreak(sessionId, 0) // just get streak, XP already awarded
      const { dailyTotal } = await updateDailyCards(sessionId, 0)    // already counted above

      setCompletion({
        total:     allResults.length,
        correct:   allCorrect,
        xpGained:  allXp,
        newStreak: xpResult?.newStreak ?? 0,
        dailyTotal,
      })
      setAppPhase('batch-done')
    }
  }

  // ── Extend session by 5 more items ────────────────────────────────────────
  function handleExtend() {
    setCurrentGoal(g => g + batchSize)
    extensionBatchRef.current = batchSize
    setCompletion(null)
    setLoadKey(k => k + 1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (appPhase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9b98b0]">Loading your learn queue…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-[#e8e6f0] font-bold mb-2">Something went wrong</p>
          <p className="text-[#9b98b0] text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold">Back</Link>
        </div>
      </div>
    )
  }

  // No paths configured → send to learn-settings
  if (appPhase === 'no-paths') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">📚</p>
          <p className="text-[#e8e6f0] font-bold text-xl mb-2">No decks configured</p>
          <p className="text-[#9b98b0] text-sm mb-8">Add a deck to your Learn Queue to get started.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/learn-settings" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">
              Set up Learn Queue →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Nothing left to learn (all items reviewed)
  if (appPhase === 'no-items') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-[#e8e6f0] font-bold text-xl mb-2">All caught up!</p>
          <p className="text-[#9b98b0] text-sm mb-8">
            No new items in your queue. Check back tomorrow or review what you&apos;ve learned.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleExtend}
              className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2]/20 text-[#9b8cf5] font-bold border border-[#7c6df2]/40 hover:bg-[#7c6df2]/30 transition-colors"
            >
              Learn {batchSize} more →
            </button>
            <Link
              href="/review"
              className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors text-center"
            >
              Go to Reviews
            </Link>
            <Link href="/dashboard" className="text-[#9b98b0] text-sm hover:text-[#e8e6f0] transition-colors py-1">
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (appPhase === 'daily-goal-reached' && completion) {
    return <DailyGoalScreen data={completion} onExtend={handleExtend} batchSize={batchSize} />
  }

  if (appPhase === 'done' && completion) {
    return <CompletionScreen data={completion} onExtend={handleExtend} batchSize={batchSize} />
  }

  if (appPhase === 'intro-sequence') {
    const item = introQueue[introIndex]
    const isLast = !item || introIndex >= introQueue.length - 1

    const advanceIntro = () => {
      if (isLast) {
        setAppPhase('quiz-time')
      } else {
        setIntroIndex(i => i + 1)
      }
    }

    const goBackIntro = () => {
      if (introIndex > 0) {
        setIntroIndex(i => i - 1)
      }
    }

    if (!item) return null

    if (item.kind === 'grammar') {
      return (
        <GrammarExplainer
          topic={item.topic}
          sentence={item.sentence}
          onContinue={advanceIntro}
          onBack={introIndex > 0 ? goBackIntro : undefined}
          current={introIndex}
          total={introQueue.length}
        />
      )
    }
    if (item.kind === 'vocab_new') {
      return (
        <VocabIntroScreen
          vocab={item.vocab}
          sentence={item.sentence}
          onContinue={advanceIntro}
          onBack={introIndex > 0 ? goBackIntro : undefined}
          current={introIndex}
          total={introQueue.length}
        />
      )
    }
  }

  if (appPhase === 'quiz-time') {
    return (
      <QuizTimeScreen
        count={clozeItems.length}
        pathName={pathName}
        onStart={() => setAppPhase('cloze')}
        onBack={() => {
          if (introQueue.length > 0) {
            setIntroIndex(introQueue.length - 1)
            setAppPhase('intro-sequence')
          }
        }}
      />
    )
  }

  if (appPhase === 'batch-done' && completion) {
    return (
      <BatchDoneScreen
        data={completion}
        pathName={pathName}
        goal={currentGoal}
        onContinue={() => {
          setLoadKey(k => k + 1)
        }}
        onExit={() => setAppPhase(completion.dailyTotal >= currentGoal ? 'daily-goal-reached' : 'done')}
      />
    )
  }

  if (appPhase === 'cloze') {
    return (
      <ClozeSession
        items={clozeItems}
        onComplete={handleClozeComplete}
        onAnswer={saveLearnResult}
      />
    )
  }

  // No other phases should reach here
  return null
}
