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

// ─── Types ────────────────────────────────────────────────────────────────────

interface VocabWord {
  id: string
  word: string
  typ: string
  artikel: string | null
  plural: string | null
  level: string
  frequenz_rang: number | null
  erklaerung: string | null
  verwendung: string | null
  genitiv: string | null
}

interface VocabSentence {
  id: string
  word_id: string
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  cloze_word_en: string | null
  sort_order: number
  audio_file: string | null
}

interface VocabLearnItem {
  type: 'vocab'
  word: VocabWord
  sentences: VocabSentence[]
}

interface GrammarLearnItem {
  type: 'grammar'
  topic: GrammarTopic
  sentence: GrammarSentence
}

interface VerbWord {
  id: string; slug: string; word: string; translation_en: string
  level: string; category: string; frequency_rank: number | null
  explanation_en: string; usage_notes: string | null
  fun_fact: string | null; synonyms: string | null; related_words: string | null
  auxiliary: string | null; partizip_ii: string | null
  praes_ich: string | null; praes_du: string | null; praes_er: string | null
  praes_wir: string | null; praes_ihr: string | null; praes_sie: string | null
  praet_ich: string | null; praet_du: string | null; praet_er: string | null
  praet_wir: string | null; praet_ihr: string | null; praet_sie: string | null
  konj2_ich: string | null; konj2_du: string | null; konj2_er: string | null
  konj2_wir: string | null; konj2_ihr: string | null; konj2_sie: string | null
}
interface VerbSentence {
  id: string; verb_id: string; sentence_de: string; sentence_en: string
  cloze_word: string; tense: string; person: string
  min_level: string; sort_order: number; audio_file: string | null
}
interface VerbLearnItem {
  type: 'verb'; verb: VerbWord; sentences: VerbSentence[]
}

// Unified cloze item
type ClozeItem =
  | { kind: 'vocab';   word: VocabWord;   sentence: VocabSentence }
  | { kind: 'grammar'; topic: GrammarTopic; sentence: GrammarSentence }
  | { kind: 'verb';    verb: VerbWord;    sentence: VerbSentence; tense: string }

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
  type: 'vocab' | 'grammar' | 'verb'
  correct: boolean
  verbId?: string      // verb only — uuid of gwc_verbs row
  verbTense?: string   // verb only — tense string
}

interface CompletionData {
  total: number
  correct: number
  xpGained: number
  newStreak: number
  dailyTotal: number
}

type AppPhase = 'loading' | 'no-paths' | 'no-items' | 'studying' | 'quiz-modal' | 'cloze' | 'done' | 'daily-goal-reached'

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

// Simple markdown: **bold** and \n → <br>
function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8e6f0]">$1</strong>')
    .replace(/\n/g, '<br />')
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchVocabItems(
  sessionId: string,
  lessonOrder: string,
  batchSize: number
): Promise<VocabLearnItem[]> {
  // Get sentence IDs that are already in the vocab review queue
  const { data: reviewRows } = await supabase
    .from('gwc_user_reviews')
    .select('word_sentence_id')
    .eq('session_id', sessionId)
    .eq('item_type', 'vocab')
    .not('word_sentence_id', 'is', null)

  const reviewedSentenceIds = (reviewRows || []).map((r: { word_sentence_id: string }) => r.word_sentence_id)

  // Resolve those sentence IDs to word IDs
  let reviewedWordIds = new Set<string>()
  if (reviewedSentenceIds.length > 0) {
    const { data: reviewed } = await supabase
      .from('gwc_word_sentences')
      .select('word_id')
      .in('id', reviewedSentenceIds)
    reviewedWordIds = new Set((reviewed || []).map((s: { word_id: string }) => s.word_id))
  }

  // Fetch words in the order set by lessonOrder
  const orderCol = lessonOrder === 'alphabetical' ? 'word' : 'frequenz_rang'
  const { data: words } = await supabase
    .from('gwc_words')
    .select('*')
    .order(orderCol, { ascending: true, nullsFirst: false })
    .limit(500)

  const newWords = (words || []).filter((w: VocabWord) => !reviewedWordIds.has(w.id))
  const wordIds  = newWords.slice(0, batchSize * 3).map((w: VocabWord) => w.id)
  if (wordIds.length === 0) return []

  const { data: sentences } = await supabase
    .from('gwc_word_sentences')
    .select('*')
    .in('word_id', wordIds)
    .order('sort_order', { ascending: true })

  const result: VocabLearnItem[] = []
  for (const word of newWords) {
    const wordSentences = (sentences || []).filter((s: VocabSentence) => s.word_id === word.id)
    if (wordSentences.length > 0) {
      result.push({ type: 'vocab', word, sentences: wordSentences })
    }
    if (result.length >= batchSize) break
  }
  return result
}

async function fetchGrammarItems(
  sessionId: string,
  batchSize: number
): Promise<GrammarLearnItem[]> {
  // Get already-reviewed grammar sentence IDs
  const { data: reviewRows } = await supabase
    .from('gwc_user_reviews')
    .select('grammar_sentence_id')
    .eq('session_id', sessionId)
    .eq('item_type', 'grammar')
    .not('grammar_sentence_id', 'is', null)

  const reviewedIds = new Set((reviewRows || []).map((r: { grammar_sentence_id: string }) => r.grammar_sentence_id))

  // Fetch topics sorted by their sort_order (so we teach topics in order)
  const { data: topics } = await supabase
    .from('gwc_grammar_topics')
    .select('*')
    .order('sort_order', { ascending: true })

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

  // Filter unreviewed, sort by (topicOrder, sentenceSortOrder), take batchSize
  const unreviewed = (sentences as GrammarSentence[] || [])
    .filter(s => !reviewedIds.has(s.id))
    .sort((a, b) => {
      const tDiff = (topicOrder[a.topic_id] ?? 999) - (topicOrder[b.topic_id] ?? 999)
      return tDiff !== 0 ? tDiff : a.sort_order - b.sort_order
    })
    .slice(0, batchSize)

  return unreviewed
    .filter(s => topicMap[s.topic_id])
    .map(s => ({
      type: 'grammar' as const,
      topic: topicMap[s.topic_id],
      sentence: s,
    }))
}

// ─── Fetch Verbs ──────────────────────────────────────────────────────────────

const TENSE_MIN_LEVEL: Record<string, string> = {
  'PRÄSENS': 'A1', 'PERFEKT': 'A2', 'PRÄTERITUM': 'B1',
  'FUTUR I': 'B1', 'KONJUNKTIV II': 'B2', 'PLUSQUAMPERFEKT': 'B2', 'FUTUR II': 'C1',
}
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
function levelGte(a: string, b: string) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b)
}

// Map path IDs to the gwc_verbs column that stores position in that path
const VERB_PATH_COL: Record<string, string> = {
  'a1-verbs':      'path_a1_verbs',
  'caros-path-a1': 'path_caros_path',
}

async function fetchVerbItems(sessionId: string, batchSize: number, userLevel = 'A1', pathId?: string): Promise<VerbLearnItem[]> {
  // Check at (verb × tense) granularity — not just verb level.
  // This means levelling up to A2 surfaces "sein × Perfekt" as a new card
  // even though "sein × Präsens" was already learned.
  const { data: reviewRows } = await supabase
    .from('gwc_verb_reviews')
    .select('verb_id, tense')
    .eq('session_id', sessionId)
  const learnedCards = new Set(
    (reviewRows || []).map((r: { verb_id: string; tense: string }) => `${r.verb_id}__${r.tense}`)
  )

  const pathCol = pathId ? VERB_PATH_COL[pathId] : null

  let query = supabase.from('gwc_verbs').select('*')
  if (pathCol) {
    query = query.not(pathCol, 'is', null).order(pathCol, { ascending: true })
  } else {
    query = query.order('frequency_rank', { ascending: true, nullsFirst: false })
  }
  const { data: verbs } = await query.limit(200)
  if (!verbs || verbs.length === 0) return []

  const verbIds = (verbs as VerbWord[]).map(v => v.id)
  const { data: sentences } = await supabase
    .from('gwc_verb_sentences')
    .select('*')
    .in('verb_id', verbIds)
    .order('sort_order', { ascending: true })

  const result: VerbLearnItem[] = []
  for (const verb of verbs as VerbWord[]) {
    // Only sentences for tenses unlocked at current level AND not yet learned
    const newSents = ((sentences || []) as VerbSentence[]).filter(s =>
      s.verb_id === verb.id &&
      levelGte(userLevel, TENSE_MIN_LEVEL[s.tense] ?? 'A1') &&
      !learnedCards.has(`${verb.id}__${s.tense}`)
    )
    if (newSents.length > 0) {
      result.push({ type: 'verb', verb, sentences: newSents })
    }
    if (result.length >= batchSize) break
  }
  return result
}

// ─── Quiz Time Modal ──────────────────────────────────────────────────────────

function QuizTimeModal({ count, pathName, onStart }: {
  count: number; pathName: string; onStart: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#1a1830] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-[#e8e6f0]">Quiz Time!</h2>
          <p className="text-[#9b98b0] text-sm mt-1">{pathName}</p>
        </div>
        <div className="mx-6 mb-6 bg-[#7c6df2]/20 rounded-xl px-4 py-3 border border-[#7c6df2]/30">
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: Math.max(count * 2, 10) }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full min-w-[12px] ${i < count ? 'bg-[#7c6df2]' : 'bg-white/15'}`} />
            ))}
          </div>
        </div>
        <p className="text-center text-[#9b98b0] text-sm px-8 mb-6 leading-relaxed">
          Practice the {count} word{count !== 1 ? 's' : ''} you just studied to add them to your Review Queue!
        </p>
        <div className="px-6 pb-6">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/30"
          >
            Start Quiz →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Slide: Word Overview ─────────────────────────────────────────────────────

function WordOverviewSlide({ word }: { word: VocabWord }) {
  const isNoun = word.typ === 'NOMEN' && word.artikel
  const declension = isNoun ? getDeclension(word.artikel!, word.word, word.genitiv) : null

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        <span className={`px-3 py-1 rounded-md text-xs font-bold border ${typColor(word.typ)}`}>{word.typ}</span>
        <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">{word.level}</span>
        {word.frequenz_rang && (
          <span className="px-3 py-1 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">#{word.frequenz_rang}</span>
        )}
        {word.verwendung && (
          <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{word.verwendung}</span>
        )}
      </div>
      <h1 className="text-5xl sm:text-6xl font-bold text-[#9b8cf5] mb-3 leading-tight">
        {word.artikel ? `${word.artikel} ${word.word}` : word.word}
      </h1>
      {word.plural && (
        <p className="text-[#9b98b0] text-base mb-4">Pl. <span className="text-[#e8e6f0] font-medium">{word.plural}</span></p>
      )}
      {word.erklaerung && (
        <div className="w-full max-w-sm mt-4 bg-[#252340] rounded-xl p-4 border border-white/5 text-left">
          <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1.5">Explanation</p>
          <p className="text-[#e8e6f0] text-sm leading-relaxed">{word.erklaerung}</p>
        </div>
      )}
      {declension && (
        <div className="w-full max-w-sm mt-4 bg-[#252340] rounded-xl border border-white/5 overflow-hidden text-left">
          <p className="text-xs text-[#9b98b0] uppercase tracking-wider px-4 pt-3 pb-2">Declension (Singular)</p>
          {declension.map(({ label, art, noun }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2 border-t border-white/5">
              <span className="text-xs text-[#9b98b0] w-20 shrink-0">{label}</span>
              <span className="text-[#7c6df2] font-medium text-sm">{art}</span>
              <span className="text-[#e8e6f0] text-sm">{noun}</span>
            </div>
          ))}
        </div>
      )}
      {!declension && (
        <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm text-left">
          <div className="bg-[#252340] rounded-xl p-4 border border-white/5">
            <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1">Type</p>
            <p className="text-[#e8e6f0] font-bold">{word.typ}</p>
          </div>
          {word.frequenz_rang && (
            <div className="bg-[#252340] rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1">Frequenz</p>
              <p className="text-[#e8e6f0] font-bold">#{word.frequenz_rang}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Slide: Example Sentences ─────────────────────────────────────────────────

function SentencesSlide({ word, sentences }: { word: VocabWord; sentences: VocabSentence[] }) {
  const [showEN, setShowEN] = useState(false)
  return (
    <div className="flex flex-col min-h-[440px] px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-0.5">Examples</p>
          <p className="font-bold text-[#e8e6f0]">
            <span className="text-[#9b8cf5]">{word.word}</span> — {sentences.length} sentences
          </p>
        </div>
        <button
          onClick={() => setShowEN(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            showEN ? 'bg-[#7c6df2]/20 text-[#9b8cf5] border-[#7c6df2]/30' : 'bg-white/5 text-[#9b98b0] border-white/10 hover:border-white/20'
          }`}
        >
          {showEN ? '🙈 Hide EN' : '👁 Show EN'}
        </button>
      </div>
      <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
        {sentences.map((s, i) => (
          <div key={s.id} className="bg-[#252340] rounded-xl p-4 border border-white/5">
            <div className="flex gap-3">
              <span className="text-xs text-[#9b98b0] shrink-0 mt-1 w-4 text-right">{i + 1}.</span>
              <div>
                <p className="text-[#e8e6f0] leading-relaxed">{highlightWord(s.sentence_de, s.cloze_word)}</p>
                {showEN && s.sentence_en && (
                  <p className="text-[#9b98b0] text-sm mt-1 leading-relaxed">{s.sentence_en}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Audio Button ─────────────────────────────────────────────────────────────

function AudioButton({ filename, size = 'md' }: { filename?: string | null; size?: 'sm' | 'md' }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Clean up on unmount (card change via key prop)
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

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

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <button
      onClick={toggle}
      className={`${dim} rounded-full flex items-center justify-center transition-colors shrink-0 ${
        playing
          ? 'bg-[#7c6df2] text-white'
          : 'bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5]'
      }`}
      title={playing ? 'Stop' : 'Audio abspielen'}
    >
      {playing ? (
        <svg className={icon} fill="currentColor" viewBox="0 0 16 16">
          <rect x="3" y="3" width="4" height="10" rx="1" />
          <rect x="9" y="3" width="4" height="10" rx="1" />
        </svg>
      ) : (
        <svg className={icon} fill="currentColor" viewBox="0 0 16 16">
          <path d="M5 3.5l9 4.5-9 4.5V3.5z" />
        </svg>
      )}
    </button>
  )
}

// ─── Grammar Topic Explanation (shown inline before first sentence of a topic) ─

function GrammarExplainer({ topic, onContinue }: { topic: GrammarTopic; onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      <div className="flex items-center px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
              Grammar
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {topic.level}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-[#e8e6f0] text-center mb-6">{topic.title}</h2>

          {/* Explanation */}
          <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5 mb-8">
            <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-4">How it works</p>
            <div
              className="text-[#c5c3d4] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMd(topic.explanation_en) }}
            />
          </div>

          <button
            onClick={onContinue}
            className="w-full py-4 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#7c6df2]/30 text-lg"
          >
            Practice →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Verb Intro (shown before first cloze of each new verb × tense) ──────────

const TENSE_LABEL_MAP: Record<string, string> = {
  'PRÄSENS':        'Präsens',
  'PERFEKT':        'Perfekt',
  'PRÄTERITUM':     'Präteritum',
  'FUTUR I':        'Futur I',
  'KONJUNKTIV II':  'Konjunktiv II',
  'PLUSQUAMPERFEKT':'Plusquamperfekt',
  'FUTUR II':       'Futur II',
}

function getConjRows(verb: VerbWord, tense: string): { person: string; form: string }[] {
  const persons = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']
  const futAux  = ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden']
  const plusqAux = verb.auxiliary === 'sein'
    ? ['war','warst','war','waren','wart','waren']
    : ['hatte','hattest','hatte','hatten','hattet','hatten']

  switch (tense) {
    case 'PRÄSENS':
      return [
        { person: 'ich',       form: verb.praes_ich ?? '—' },
        { person: 'du',        form: verb.praes_du  ?? '—' },
        { person: 'er/sie/es', form: verb.praes_er  ?? '—' },
        { person: 'wir',       form: verb.praes_wir ?? '—' },
        { person: 'ihr',       form: verb.praes_ihr ?? '—' },
        { person: 'sie/Sie',   form: verb.praes_sie ?? '—' },
      ]
    case 'PERFEKT':
      return persons.map((p, i) => ({
        person: p,
        form: `${verb.auxiliary === 'sein'
          ? ['bin','bist','ist','sind','seid','sind'][i]
          : ['habe','hast','hat','haben','habt','haben'][i]} ${verb.partizip_ii ?? '…'}`,
      }))
    case 'PRÄTERITUM':
      return [
        { person: 'ich',       form: verb.praet_ich ?? '—' },
        { person: 'du',        form: verb.praet_du  ?? '—' },
        { person: 'er/sie/es', form: verb.praet_er  ?? '—' },
        { person: 'wir',       form: verb.praet_wir ?? '—' },
        { person: 'ihr',       form: verb.praet_ihr ?? '—' },
        { person: 'sie/Sie',   form: verb.praet_sie ?? '—' },
      ]
    case 'FUTUR I':
      return persons.map((p, i) => ({ person: p, form: `${futAux[i]} ${verb.word}` }))
    case 'KONJUNKTIV II':
      return verb.konj2_ich ? [
        { person: 'ich',       form: verb.konj2_ich ?? '—' },
        { person: 'du',        form: verb.konj2_du  ?? '—' },
        { person: 'er/sie/es', form: verb.konj2_er  ?? '—' },
        { person: 'wir',       form: verb.konj2_wir ?? '—' },
        { person: 'ihr',       form: verb.konj2_ihr ?? '—' },
        { person: 'sie/Sie',   form: verb.konj2_sie ?? '—' },
      ] : persons.map(p => ({ person: p, form: `würde ${verb.word}` }))
    case 'PLUSQUAMPERFEKT':
      return persons.map((p, i) => ({ person: p, form: `${plusqAux[i]} ${verb.partizip_ii ?? '…'}` }))
    case 'FUTUR II':
      return persons.map((p, i) => ({
        person: p,
        form: `${futAux[i]} ${verb.partizip_ii ?? '…'} ${verb.auxiliary ?? 'haben'}`,
      }))
    default:
      return []
  }
}

function VerbIntroScreen({ verb, tense, onContinue }: {
  verb: VerbWord
  tense: string
  onContinue: () => void
}) {
  const rows = getConjRows(verb, tense)
  const tenseLabel = TENSE_LABEL_MAP[tense] ?? tense
  const minLevel = TENSE_MIN_LEVEL[tense] ?? 'A1'

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      <div className="flex items-center px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="max-w-lg w-full">

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 justify-center flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
              Verb
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
              {tenseLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {minLevel}
            </span>
          </div>

          {/* Verb name */}
          <h2 className="text-4xl font-bold text-[#7c6df2] text-center mb-1">{verb.word}</h2>
          <p className="text-[#9b98b0] text-center italic mb-6">{verb.translation_en}</p>

          {/* Conjugation table */}
          <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-white/5">
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider font-bold">{tenseLabel}</p>
            </div>
            <table className="w-full">
              <tbody>
                {rows.map(({ person, form }) => (
                  <tr key={person} className="border-t border-white/5 first:border-0">
                    <td className="py-2.5 px-5 text-[#9b98b0] text-sm w-28">{person}</td>
                    <td className="py-2.5 px-5 text-[#e8e6f0] font-semibold">{form}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fun fact */}
          {verb.fun_fact && (
            <div className="bg-[#1a1830] rounded-2xl border border-[#7c6df2]/15 px-5 py-4 mb-4">
              <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-1.5">✨ Fun Fact</p>
              <p className="text-[#c5c3d4] text-sm leading-relaxed">{verb.fun_fact}</p>
            </div>
          )}

          <button
            onClick={onContinue}
            className="w-full py-4 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#7c6df2]/30 text-lg mt-2"
          >
            Practice →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Unified Cloze Session ────────────────────────────────────────────────────

function ClozeSession({
  items,
  hasVocab,
  onComplete,
}: {
  items: ClozeItem[]
  hasVocab: boolean
  onComplete: (results: ClozeResult[]) => void
}) {
  const [index, setIndex]                 = useState(0)
  const [input, setInput]                 = useState('')
  const [answered, setAnswered]           = useState(false)
  const [showingExplainer, setShowingExplainer] = useState(false)
  const [showFormationHint, setShowFormationHint] = useState(false)
  const [showEN, setShowEN]               = useState(false)
  const [results, setResults]             = useState<ClozeResult[]>([])
  const seenTopicsRef                     = useRef<Set<string>>(new Set())

  const current = items[index]

  // When index changes: reset state and check if we need an intro screen
  useEffect(() => {
    setInput('')
    setAnswered(false)
    setShowFormationHint(false)
    setShowEN(false)
    if (current?.kind === 'grammar' && !seenTopicsRef.current.has(current.topic.id)) {
      seenTopicsRef.current.add(current.topic.id)
      setShowingExplainer(true)
    } else if (current?.kind === 'verb') {
      // Show intro once per (verb × tense) combination
      const key = `${current.verb.id}__${current.tense}`
      if (!seenTopicsRef.current.has(key)) {
        seenTopicsRef.current.add(key)
        setShowingExplainer(true)
      } else {
        setShowingExplainer(false)
      }
    } else {
      setShowingExplainer(false)
    }
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  const sentence   = current?.kind === 'vocab' ? current.sentence
                   : current?.kind === 'grammar' ? current.sentence
                   : current?.sentence
  const clozeWord  = sentence?.cloze_word ?? ''
  const clozeParts = createCloze(sentence?.sentence_de ?? '', clozeWord).split('___')

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
      id:        sentence.id,
      type:      current.kind === 'vocab' ? 'vocab' : current.kind === 'grammar' ? 'grammar' : 'verb',
      correct:   isCorrect,
      verbId:    current.kind === 'verb' ? current.verb.id : undefined,
      verbTense: current.kind === 'verb' ? current.tense  : undefined,
    }
    const newResults = [...results, r]
    setResults(newResults)
    advance(newResults)
  }, [results, sentence, current, isCorrect, index, items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showingExplainer) return
      if (e.key === 'Enter') answered ? handleNext() : handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answered, handleCheck, handleNext, showingExplainer])

  // Show intro screen before first cloze of a grammar topic or verb × tense
  if (showingExplainer && current?.kind === 'grammar') {
    return (
      <GrammarExplainer
        topic={current.topic}
        onContinue={() => setShowingExplainer(false)}
      />
    )
  }
  if (showingExplainer && current?.kind === 'verb') {
    return (
      <VerbIntroScreen
        verb={current.verb}
        tense={current.tense}
        onContinue={() => setShowingExplainer(false)}
      />
    )
  }

  if (!current || !sentence) return null

  const progress = results.length / items.length

  // Badge shown in top-right of card
  const cardBadge = current.kind === 'vocab'   ? current.word.word
                  : current.kind === 'grammar' ? current.topic.title
                  : current.verb.word

  // Small context badges: grammar → person, verb → tense + person
  const personBadge = current.kind === 'grammar' ? (current.sentence.person || null)
                    : current.kind === 'verb'    ? (current.sentence.person || null)
                    : null
  const tenseBadge  = current.kind === 'verb' ? current.tense : null

  // Hint 1 (big box translation): for vocab use sentence_en is shown inline;
  // for grammar/verb show translation in card label area
  const hint1 = current.kind === 'vocab'   ? null
              : current.kind === 'grammar' ? current.topic.translation_en
              : current.verb.translation_en

  // Formation hint: shown behind a reveal button for complex verb tenses
  const FORMATION_HINTS: Partial<Record<string, string>> = {
    'PERFEKT':          'haben / sein  +  Partizip II',
    'FUTUR I':          'werden  +  Infinitiv',
    'KONJUNKTIV II':    'Konj. II-Form  oder  würde + Infinitiv',
    'PLUSQUAMPERFEKT':  'hatte / war  +  Partizip II',
    'FUTUR II':         'werden  +  Partizip II  +  haben / sein',
  }
  const formationHint = current.kind === 'verb'
    ? (FORMATION_HINTS[current.tense] ?? null)
    : null

  // EN translation display (with cloze_word_en highlight for vocab)
  function renderEN() {
    if (!sentence?.sentence_en) return null
    if (current.kind === 'vocab' && current.sentence.cloze_word_en) {
      const regex = new RegExp(`(${current.sentence.cloze_word_en})`, 'gi')
      const parts = (current.sentence.sentence_en ?? '').split(regex)
      return (
        <p className="text-[#9b98b0] text-xl leading-relaxed">
          {parts.map((part, i) =>
            regex.test(part)
              ? <span key={i} className="text-[#9b8cf5] font-bold">{part}</span>
              : <span key={i}>{part}</span>
          )}
        </p>
      )
    }
    return <p className="text-[#9b98b0] text-xl leading-relaxed italic">{sentence.sentence_en}</p>
  }

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
          {current.kind === 'verb' && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
              Verb
            </span>
          )}
          {/* Tense badge (verb only) */}
          {tenseBadge && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
              {tenseBadge}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-6">

          {/* Word/topic label — hidden for verb (already shown inside hint box) */}
          {current.kind !== 'verb' && (
            <p className="text-[#9b8cf5] font-bold text-lg">{cardBadge}</p>
          )}

          {/* Hint box — verb: show tense + translation in structured card */}
          {current.kind === 'verb' ? (
            <div className="w-full max-w-md mx-auto space-y-2">
              <div className="bg-[#252340] rounded-xl border border-white/5 overflow-hidden">
                {/* Tense row */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5">
                  <span className="text-xs font-bold text-[#60a5fa] uppercase tracking-wider">
                    {current.verb.word} · {current.tense}
                  </span>
                  <span className="text-xs text-[#9b98b0]">{current.sentence.person}</span>
                </div>
                {/* Translation row */}
                <div className="px-5 py-3">
                  <p className="text-[#e8e6f0] text-xl font-semibold italic">{current.verb.translation_en}</p>
                </div>
              </div>

              {/* Formation hint reveal button — only for complex tenses */}
              {formationHint && (
                <div className="flex justify-center">
                  {showFormationHint ? (
                    <p className="text-xs text-[#9b98b0] italic px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      {formationHint}
                    </p>
                  ) : (
                    <button
                      onClick={() => setShowFormationHint(true)}
                      className="text-xs text-[#9b98b0] hover:text-[#e8e6f0] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      💡 Bildung zeigen
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : hint1 ? (
            <div className="w-full max-w-md mx-auto">
              <div className="bg-[#252340] rounded-xl px-5 py-3 border border-white/5">
                <p className="text-[#e8e6f0] text-xl font-semibold italic">{hint1}</p>
              </div>
            </div>
          ) : null}

          {/* German sentence with gap */}
          <div className="flex items-center justify-center gap-3">
            <p className="text-[#e8e6f0] text-3xl md:text-4xl leading-relaxed font-light">
              {clozeParts[0]}
              <span className={`inline-block min-w-[120px] border-b-2 px-2 font-bold text-center transition-colors ${
                !answered
                  ? 'border-[#7c6df2] text-[#9b8cf5]'
                  : isCorrect
                    ? 'border-[#4ade80] text-[#4ade80]'
                    : 'border-[#f87171] text-[#f87171]'
              }`}>
                {answered ? clozeWord : (input || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0')}
              </span>
              {clozeParts[1]}
            </p>
          </div>

          {/* English translation: collapsible on front, always shown on back */}
          {sentence?.sentence_en && (
            answered ? (
              current.kind === 'vocab' ? renderEN() : (
                <p className="text-[#9b98b0] text-base italic">{sentence.sentence_en}</p>
              )
            ) : (
              showEN ? (
                <div className="space-y-1">
                  {current.kind === 'vocab' ? renderEN() : (
                    <p className="text-[#9b98b0] text-base italic">{sentence.sentence_en}</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowEN(true)}
                  className="text-xs text-[#9b98b0] hover:text-[#e8e6f0] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  🌐 Translation anzeigen
                </button>
              )
            )
          )}

          {/* Audio button — below everything, key=index remounts on card change */}
          {sentence?.audio_file && (
            <div className="flex justify-center">
              <AudioButton key={index} filename={sentence.audio_file} />
            </div>
          )}

          {/* Wrong answer feedback */}
          {answered && !isCorrect && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm">
              You typed: <span className="font-bold">"{input}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom input area */}
      <div className="bg-[#0f0e17] border-t border-white/5">
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
          <div className="px-5 py-4 max-w-xl mx-auto w-full space-y-3">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isCorrect ? 'bg-[#4ade80]/5 border-[#4ade80]/20' : 'bg-[#f87171]/5 border-[#f87171]/20'
            }`}>
              <span className={`text-lg font-bold ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                {isCorrect ? '✓' : '✗'}
              </span>
              <span className={`text-sm font-medium ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                {isCorrect ? 'Correct!' : `Answer: ${clozeWord}`}
              </span>
            </div>
            <button
              onClick={handleNext}
              className={`w-full py-3.5 rounded-xl border-2 font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                isCorrect
                  ? 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10'
                  : 'border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10'
              }`}
            >
              {index + 1 >= items.length ? 'Done ✓' : 'Next →'}
              <span className="text-xs opacity-60">(Enter)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Completion Screens ───────────────────────────────────────────────────────

function DailyGoalScreen({ data, onExtend }: { data: CompletionData; onExtend: () => void }) {
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
            Learn 5 more →
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

function CompletionScreen({ data }: { data: CompletionData }) {
  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">{pct >= 70 ? 'Great job!' : 'Keep practicing!'}</h2>
        <p className="text-[#9b98b0] mb-1">{data.correct}/{data.total} correct — {pct}%</p>
        <p className="text-[#9b8cf5] font-bold mb-1">+{data.xpGained} XP</p>
        {data.newStreak > 0 && <p className="text-orange-400 text-sm mb-4">🔥 {data.newStreak} day streak</p>}
        <p className="text-[#9b98b0] text-sm mb-8">
          These cards are now in your <span className="text-[#9b8cf5] font-semibold">Review Queue</span>.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">
            Dashboard
          </Link>
          <Link href="/learn" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">
            Learn More
          </Link>
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

  // Vocab study queue (browse slides)
  const [vocabQueue, setVocabQueue]   = useState<VocabLearnItem[]>([])
  const [wordIndex, setWordIndex]     = useState(0)
  const [slideIndex, setSlideIndex]   = useState(0)

  // Unified cloze queue (vocab + grammar)
  const [clozeItems, setClozeItems]   = useState<ClozeItem[]>([])

  // Active path name for quiz modal display
  const [pathName, setPathName]       = useState('German With Caro')

  // Daily goal tracking
  const [currentGoal, setCurrentGoal] = useState(10)
  const [completion, setCompletion]   = useState<CompletionData | null>(null)

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

        // Extension batch: skip path loading, fetch 5 more of the same type as last session
        const extBatch = extensionBatchRef.current
        extensionBatchRef.current = null

        if (extBatch !== null) {
          // Simple extension: just load more vocab (most common case)
          const vocab = await fetchVocabItems(sessionId, 'default', extBatch)
          setVocabQueue(vocab)
          const items: ClozeItem[] = vocab.map(v => ({ kind: 'vocab', word: v.word, sentence: v.sentences[0] }))
          setClozeItems(items)
          setWordIndex(0)
          setSlideIndex(0)
          if (vocab.length > 0) setAppPhase('studying')
          else setAppPhase('no-items')
          return
        }

        // 1. Load user level from profile
        const progress = await getOrCreateProgress(sessionId)
        const userLevel = progress?.german_level ?? 'A1'

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

        // Set path name for quiz modal (use first path)
        const firstDef = getPathById(activePaths[0].path_id)
        if (firstDef) setPathName(firstDef.name)

        // 3. Fetch items from each path
        const allVocab: VocabLearnItem[]     = []
        const allGrammar: GrammarLearnItem[] = []
        const allVerbs: VerbLearnItem[]      = []
        let totalGoal = 0

        for (const path of activePaths) {
          const def = getPathById(path.path_id)
          if (!def) continue

          totalGoal += path.daily_goal

          if (def.type === 'vocab' || def.type === 'mixed') {
            const vocab = await fetchVocabItems(sessionId, path.lesson_order, path.batch_size)
            allVocab.push(...vocab)
          }
          if (def.type === 'grammar' || def.type === 'mixed') {
            const grammar = await fetchGrammarItems(sessionId, path.batch_size)
            allGrammar.push(...grammar)
          }
          if (def.type === 'verb' || def.type === 'mixed') {
            const verbs = await fetchVerbItems(sessionId, path.batch_size, userLevel, path.path_id)
            allVerbs.push(...verbs)
          }
        }

        setCurrentGoal(totalGoal)

        if (allVocab.length === 0 && allGrammar.length === 0 && allVerbs.length === 0) {
          setAppPhase('no-items')
          return
        }

        // 3. Build cloze sequence: vocab, then verbs (Präsens ich-form), then grammar
        const items: ClozeItem[] = [
          ...allVocab.map(v => ({ kind: 'vocab' as const, word: v.word, sentence: v.sentences[0] })),
          ...allVerbs.flatMap(v => {
            // For each verb, add one cloze item per tense (using ich-form sentence or first available)
            const tenses = [...new Set(v.sentences.map(s => s.tense))]
            return tenses.map(tense => {
              const s = v.sentences.find(s2 => s2.tense === tense && s2.person === 'ich') ?? v.sentences.find(s2 => s2.tense === tense)!
              return { kind: 'verb' as const, verb: v.verb, sentence: s, tense }
            })
          }),
          ...allGrammar.map(g => ({ kind: 'grammar' as const, topic: g.topic, sentence: g.sentence })),
        ]

        setVocabQueue(allVocab)
        setClozeItems(items)
        setWordIndex(0)
        setSlideIndex(0)

        // If there are vocab items, start in study browse phase; otherwise go directly to cloze
        if (allVocab.length > 0) {
          setAppPhase('studying')
        } else {
          setAppPhase('cloze')
        }
      } catch (e) {
        setError('Connection error.')
        console.error(e)
        setAppPhase('no-items')
      }
    }
    load()
  }, [loadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Vocab study navigation ────────────────────────────────────────────────
  const SLIDES = ['overview', 'sentences']
  const currentVocabItem = vocabQueue[wordIndex]

  function goNext() {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(s => s + 1)
    } else if (wordIndex + 1 < vocabQueue.length) {
      setWordIndex(w => w + 1)
      setSlideIndex(0)
    } else {
      setAppPhase('quiz-modal')
    }
  }

  function goBack() {
    if (slideIndex > 0) setSlideIndex(s => s - 1)
    else if (wordIndex > 0) { setWordIndex(w => w - 1); setSlideIndex(SLIDES.length - 1) }
  }

  // ── Save results and award XP ─────────────────────────────────────────────
  async function handleClozeComplete(results: ClozeResult[]) {
    const sessionId = getOrCreateSessionId()
    const now = new Date().toISOString()

    const vocabResults   = results.filter(r => r.type === 'vocab')
    const grammarResults = results.filter(r => r.type === 'grammar')
    const verbResults    = results.filter(r => r.type === 'verb')

    // Save vocab reviews — upsert to avoid duplicate inserts if session is replayed
    if (vocabResults.length > 0) {
      await supabase.from('gwc_user_reviews').upsert(
        vocabResults.map(r => {
          const srs = calculateNextReview(r.correct, 2.5, 1, 0)
          return {
            session_id:          sessionId,
            word_sentence_id:    r.id,
            grammar_sentence_id: null,
            item_type:           'vocab',
            correct:             r.correct,
            reviewed_at:         now,
            next_review_at:      new Date(Date.now() + srs.nextInterval * 86400000).toISOString(),
            ease_factor:         srs.newEaseFactor,
            interval_days:       srs.nextInterval,
            repetitions:         srs.newRepetitions,
          }
        }),
        { onConflict: 'session_id,word_sentence_id', ignoreDuplicates: false }
      )
    }

    // Save grammar reviews — some may already exist (via "Add to Reviews" on topic page)
    if (grammarResults.length > 0) {
      const { data: existing } = await supabase
        .from('gwc_user_reviews')
        .select('id, grammar_sentence_id')
        .eq('session_id', sessionId)
        .eq('item_type', 'grammar')
        .in('grammar_sentence_id', grammarResults.map(r => r.id))

      const existingMap = Object.fromEntries(
        (existing || []).map((e: { id: string; grammar_sentence_id: string }) => [e.grammar_sentence_id, e.id])
      )

      const toInsert = grammarResults.filter(r => !existingMap[r.id])
      const toUpdate = grammarResults.filter(r => !!existingMap[r.id])

      if (toInsert.length > 0) {
        await supabase.from('gwc_user_reviews').insert(
          toInsert.map(r => {
            const srs = calculateNextReview(r.correct, 2.5, 1, 0)
            return {
              session_id:          sessionId,
              word_sentence_id:    null,
              grammar_sentence_id: r.id,
              item_type:           'grammar',
              correct:             r.correct,
              reviewed_at:         now,
              next_review_at:      new Date(Date.now() + srs.nextInterval * 86400000).toISOString(),
              ease_factor:         srs.newEaseFactor,
              interval_days:       srs.nextInterval,
              repetitions:         srs.newRepetitions,
            }
          })
        )
      }

      for (const r of toUpdate) {
        const srs = calculateNextReview(r.correct, 2.5, 1, 0)
        await supabase
          .from('gwc_user_reviews')
          .update({
            correct:        r.correct,
            reviewed_at:    now,
            next_review_at: new Date(Date.now() + srs.nextInterval * 86400000).toISOString(),
            ease_factor:    srs.newEaseFactor,
            interval_days:  srs.nextInterval,
            repetitions:    srs.newRepetitions,
          })
          .eq('id', existingMap[r.id])
      }
    }

    // Save verb reviews — upsert one row per (session × verb × tense)
    if (verbResults.length > 0) {
      const verbCardMap = new Map<string, ClozeResult>()
      for (const r of verbResults) {
        if (r.verbId && r.verbTense) verbCardMap.set(`${r.verbId}__${r.verbTense}`, r)
      }
      for (const r of verbCardMap.values()) {
        const srs = calculateNextReview(r.correct, 2.5, 1, 0)
        await supabase.from('gwc_verb_reviews').upsert(
          {
            session_id:      sessionId,
            verb_id:         r.verbId,
            tense:           r.verbTense,
            correct:         r.correct,
            interval_days:   srs.nextInterval,
            ease_factor:     srs.newEaseFactor,
            repetitions:     srs.newRepetitions,
            next_review_at:  new Date(Date.now() + srs.nextInterval * 86400000).toISOString(),
            total_reviews:   1,
            correct_reviews: r.correct ? 1 : 0,
          },
          { onConflict: 'session_id,verb_id,tense', ignoreDuplicates: false }
        )
      }
    }

    // Award XP and update daily cards
    const correctCount = results.filter(r => r.correct).length
    const wrongCount   = results.length - correctCount
    const xpGained     = correctCount * XP_CORRECT_LEARN + wrongCount * XP_WRONG_LEARN
    const xpResult     = await awardXPAndUpdateStreak(sessionId, xpGained)
    const { dailyTotal } = await updateDailyCards(sessionId, results.length)

    const data: CompletionData = {
      total: results.length, correct: correctCount, xpGained,
      newStreak: xpResult?.newStreak ?? 0, dailyTotal,
    }
    setCompletion(data)
    setAppPhase(dailyTotal >= currentGoal ? 'daily-goal-reached' : 'done')
  }

  // ── Extend session by 5 more items ────────────────────────────────────────
  function handleExtend() {
    setCurrentGoal(g => g + 5)
    extensionBatchRef.current = 5
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
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-[#e8e6f0] font-bold text-xl mb-2">All caught up!</p>
          <p className="text-[#9b98b0] text-sm mb-8">No new items in your queue. Check back tomorrow or review what you've learned.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">
              Dashboard
            </Link>
            <Link href="/review" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">
              Review
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (appPhase === 'daily-goal-reached' && completion) {
    return <DailyGoalScreen data={completion} onExtend={handleExtend} />
  }

  if (appPhase === 'done' && completion) {
    return <CompletionScreen data={completion} />
  }

  if (appPhase === 'cloze') {
    return (
      <ClozeSession
        items={clozeItems}
        hasVocab={vocabQueue.length > 0}
        onComplete={handleClozeComplete}
      />
    )
  }

  // ── Study phase (vocab browse) ──────────────────────────────────────────────
  if (!currentVocabItem) return null

  const totalSlides        = vocabQueue.length * SLIDES.length
  const currentSlideGlobal = wordIndex * SLIDES.length + slideIndex

  return (
    <div className="min-h-screen bg-[#0f0e17] relative">

      {/* Quiz Time Modal — appears when all vocab has been browsed */}
      {appPhase === 'quiz-modal' && (
        <QuizTimeModal
          count={vocabQueue.length}
          pathName={pathName}
          onStart={() => setAppPhase('cloze')}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] text-sm transition-colors">
            ← Dashboard
          </Link>
          <span className="text-[#9b98b0] text-sm">Word {wordIndex + 1} / {vocabQueue.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#7c6df2] rounded-full transition-all duration-500"
            style={{ width: `${(currentSlideGlobal / totalSlides) * 100}%` }}
          />
        </div>

        {/* Slide tabs */}
        <div className="flex gap-1 bg-[#1a1830] rounded-xl p-1 mb-6">
          {['Overview', 'Examples'].map((label, i) => (
            <button
              key={label}
              onClick={() => i <= slideIndex && setSlideIndex(i)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                slideIndex === i ? 'bg-[#7c6df2] text-white' : 'text-[#9b98b0] hover:text-[#e8e6f0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Slide content */}
        <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden">
          {slideIndex === 0 && <WordOverviewSlide word={currentVocabItem.word} />}
          {slideIndex === 1 && <SentencesSlide word={currentVocabItem.word} sentences={currentVocabItem.sentences} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goBack}
            disabled={wordIndex === 0 && slideIndex === 0}
            className="px-5 py-2.5 rounded-xl bg-white/5 text-[#9b98b0] font-bold hover:bg-white/10 transition-colors disabled:opacity-0"
          >
            ← Back
          </button>

          <div className="hidden sm:flex gap-1.5">
            {vocabQueue.map((_, wi) =>
              SLIDES.map((_, si) => {
                const isCurrent = wi === wordIndex && si === slideIndex
                const isPast    = wi < wordIndex || (wi === wordIndex && si < slideIndex)
                return (
                  <div
                    key={`${wi}-${si}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCurrent ? 'w-5 bg-[#7c6df2]' : isPast ? 'w-2 bg-[#7c6df2]/40' : 'w-2 bg-white/15'
                    }`}
                  />
                )
              })
            )}
          </div>

          <button
            onClick={goNext}
            className="px-5 py-2.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#7c6df2]/20"
          >
            {wordIndex === vocabQueue.length - 1 && slideIndex === SLIDES.length - 1 ? 'Done ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
