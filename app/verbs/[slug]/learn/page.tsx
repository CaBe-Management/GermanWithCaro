'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { awardXPAndUpdateStreak, updateDailyCards, XP_CORRECT_LEARN, XP_WRONG_LEARN } from '@/lib/gamification'

// ─── Types ────────────────────────────────────────────────────────────────────

type GermanLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
type Phase = 'loading' | 'error' | 'all-learned' | 'intro' | 'study' | 'cloze' | 'done'

interface VerbWord {
  id: string; slug: string; word: string; translation_en: string
  level: string; category: string; frequency_rank: number | null
  explanation_en: string; usage_notes: string | null
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
  min_level: string; sort_order: number
}

interface TenseGroup {
  tense: string
  sentences: VerbSentence[]
  alreadyLearned: boolean
}

interface ClozeItem {
  sentenceId: string
  sentence_de: string
  sentence_en: string
  cloze_word: string
  person: string
  tense: string
}

interface ClozeResult {
  sentenceId: string
  tense: string
  correct: boolean
}

interface CompletionData {
  total: number
  correct: number
  xpGained: number
  newStreak: number
  tensesAdded: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_ORDER: GermanLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const TENSE_MIN_LEVEL: Record<string, GermanLevel> = {
  'PRÄSENS':        'A1',
  'PERFEKT':        'A2',
  'PRÄTERITUM':     'B1',
  'FUTUR I':        'B1',
  'KONJUNKTIV II':  'B2',
  'PLUSQUAMPERFEKT':'B2',
  'FUTUR II':       'C1',
}

const TENSE_LABEL: Record<string, string> = {
  'PRÄSENS':        'Präsens',
  'PERFEKT':        'Perfekt',
  'PRÄTERITUM':     'Präteritum',
  'FUTUR I':        'Futur I',
  'KONJUNKTIV II':  'Konjunktiv II',
  'PLUSQUAMPERFEKT':'Plusquamperfekt',
  'FUTUR II':       'Futur II',
}

const TENSE_ORDER = ['PRÄSENS','PERFEKT','PRÄTERITUM','FUTUR I','KONJUNKTIV II','PLUSQUAMPERFEKT','FUTUR II']

const CAT_LABELS: Record<string, string> = {
  regular: 'Regular', irregular: 'Irregular', modal: 'Modal',
  separable: 'Separable', reflexive: 'Reflexive',
}

function levelGte(a: string, b: string) {
  return LEVEL_ORDER.indexOf(a as GermanLevel) >= LEVEL_ORDER.indexOf(b as GermanLevel)
}

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

function normalize(s: string) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

// Build a conjugation table from verb data
function ConjTable({ verb, tense }: { verb: VerbWord; tense: string }) {
  const rows: { pronoun: string; form: string }[] = []

  const getForm = (ich: string | null, du: string | null, er: string | null, wir: string | null, ihr: string | null, sie: string | null) => [
    { pronoun: 'ich', form: ich ?? '—' },
    { pronoun: 'du', form: du ?? '—' },
    { pronoun: 'er/sie/es', form: er ?? '—' },
    { pronoun: 'wir', form: wir ?? '—' },
    { pronoun: 'ihr', form: ihr ?? '—' },
    { pronoun: 'sie/Sie', form: sie ?? '—' },
  ]

  if (tense === 'PRÄSENS') {
    rows.push(...getForm(verb.praes_ich, verb.praes_du, verb.praes_er, verb.praes_wir, verb.praes_ihr, verb.praes_sie))
  } else if (tense === 'PERFEKT') {
    const aux = verb.auxiliary ?? 'haben'
    const p2  = verb.partizip_ii ?? `ge${verb.word}t`
    rows.push(
      { pronoun: 'ich', form: `${aux === 'haben' ? 'habe' : 'bin'} ${p2}` },
      { pronoun: 'du', form: `${aux === 'haben' ? 'hast' : 'bist'} ${p2}` },
      { pronoun: 'er/sie/es', form: `${aux === 'haben' ? 'hat' : 'ist'} ${p2}` },
      { pronoun: 'wir', form: `${aux === 'haben' ? 'haben' : 'sind'} ${p2}` },
      { pronoun: 'ihr', form: `${aux === 'haben' ? 'habt' : 'seid'} ${p2}` },
      { pronoun: 'sie/Sie', form: `${aux === 'haben' ? 'haben' : 'sind'} ${p2}` },
    )
  } else if (tense === 'PRÄTERITUM') {
    rows.push(...getForm(verb.praet_ich, verb.praet_du, verb.praet_er, verb.praet_wir, verb.praet_ihr, verb.praet_sie))
  } else if (tense === 'FUTUR I') {
    const inf = verb.word
    rows.push(
      { pronoun: 'ich', form: `werde ${inf}` },
      { pronoun: 'du', form: `wirst ${inf}` },
      { pronoun: 'er/sie/es', form: `wird ${inf}` },
      { pronoun: 'wir', form: `werden ${inf}` },
      { pronoun: 'ihr', form: `werdet ${inf}` },
      { pronoun: 'sie/Sie', form: `werden ${inf}` },
    )
  } else if (tense === 'KONJUNKTIV II') {
    rows.push(...getForm(verb.konj2_ich, verb.konj2_du, verb.konj2_er, verb.konj2_wir, verb.konj2_ihr, verb.konj2_sie))
  } else if (tense === 'PLUSQUAMPERFEKT') {
    const aux = verb.auxiliary ?? 'haben'
    const p2  = verb.partizip_ii ?? `ge${verb.word}t`
    const auxPraet = aux === 'haben'
      ? { ich: 'hatte', du: 'hattest', er: 'hatte', wir: 'hatten', ihr: 'hattet', sie: 'hatten' }
      : { ich: 'war', du: 'warst', er: 'war', wir: 'waren', ihr: 'wart', sie: 'waren' }
    rows.push(
      { pronoun: 'ich', form: `${auxPraet.ich} ${p2}` },
      { pronoun: 'du', form: `${auxPraet.du} ${p2}` },
      { pronoun: 'er/sie/es', form: `${auxPraet.er} ${p2}` },
      { pronoun: 'wir', form: `${auxPraet.wir} ${p2}` },
      { pronoun: 'ihr', form: `${auxPraet.ihr} ${p2}` },
      { pronoun: 'sie/Sie', form: `${auxPraet.sie} ${p2}` },
    )
  } else if (tense === 'FUTUR II') {
    const aux = verb.auxiliary ?? 'haben'
    const p2  = verb.partizip_ii ?? `ge${verb.word}t`
    const auxInf = aux === 'haben' ? 'haben' : 'sein'
    rows.push(
      { pronoun: 'ich', form: `werde ${p2} ${auxInf}` },
      { pronoun: 'du', form: `wirst ${p2} ${auxInf}` },
      { pronoun: 'er/sie/es', form: `wird ${p2} ${auxInf}` },
      { pronoun: 'wir', form: `werden ${p2} ${auxInf}` },
      { pronoun: 'ihr', form: `werdet ${p2} ${auxInf}` },
      { pronoun: 'sie/Sie', form: `werden ${p2} ${auxInf}` },
    )
  }

  if (rows.length === 0) return null
  return (
    <div className="overflow-hidden rounded-xl border border-white/8">
      {rows.map((r, i) => (
        <div key={r.pronoun} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? 'bg-white/3' : 'bg-transparent'}`}>
          <span className="text-[#9b98b0] text-sm w-24">{r.pronoun}</span>
          <span className="text-[#e8e6f0] text-sm font-medium">{r.form}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Cloze Input ─────────────────────────────────────────────────────────────

function ClozeInput({ item, onResult }: {
  item: ClozeItem
  onResult: (correct: boolean) => void
}) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    setInput('')
    setSubmitted(false)
  }, [item.sentenceId])

  const parts = item.sentence_de.split(new RegExp(`(${item.cloze_word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'))

  function handleSubmit() {
    if (submitted) {
      onResult(correct)
      return
    }
    const isCorrect =
      normalize(input) === normalize(item.cloze_word) ||
      input.trim().toLowerCase() === item.cloze_word.trim().toLowerCase()
    setCorrect(isCorrect)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      {/* Sentence display */}
      <div className="bg-[#1a1830] rounded-2xl px-5 py-5 border border-white/5">
        <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-3">
          {item.person} · {TENSE_LABEL[item.tense] ?? item.tense}
        </p>
        <p className="text-[#e8e6f0] text-lg leading-relaxed mb-2">
          {parts.map((p, i) =>
            p.toLowerCase() === item.cloze_word.toLowerCase()
              ? <span key={i} className={submitted ? (correct ? 'text-emerald-400 font-bold' : 'text-red-400 line-through') : 'text-[#9b8cf5] font-bold'}>{p}</span>
              : <span key={i}>{p}</span>
          )}
        </p>
        <p className="text-[#9b98b0] text-sm italic">{item.sentence_en}</p>
      </div>

      {/* Input or feedback */}
      {!submitted ? (
        <div className="flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={`Type the ${item.person} form…`}
            className="flex-1 bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0]/50 focus:outline-none focus:border-[#7c6df2]/60 text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-5 py-3 rounded-xl bg-[#7c6df2] text-white font-semibold text-sm disabled:opacity-40 hover:bg-[#9b8cf5] transition-colors"
          >
            Check
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl px-5 py-4 border ${correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
              {correct ? '✓ Correct!' : '✗ Incorrect'}
            </span>
            {!correct && (
              <span className="text-[#e8e6f0] text-sm font-semibold">
                {item.cloze_word}
              </span>
            )}
          </div>
          {!correct && (
            <p className="text-[#9b98b0] text-sm">You answered: <em>{input}</em></p>
          )}
          <button
            onClick={handleSubmit}
            className="mt-3 w-full py-2.5 rounded-xl bg-white/8 text-[#e8e6f0] text-sm font-semibold hover:bg-white/12 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VerbLearnPage() {
  const { slug } = useParams<{ slug: string }>()

  const [phase, setPhase] = useState<Phase>('loading')
  const [verb, setVerb] = useState<VerbWord | null>(null)
  const [tenseGroups, setTenseGroups] = useState<TenseGroup[]>([])
  const [studyIdx, setStudyIdx] = useState(0)   // which tense we're studying
  const [clozeItems, setClozeItems] = useState<ClozeItem[]>([])
  const [clozeIdx, setClozeIdx] = useState(0)
  const [results, setResults] = useState<ClozeResult[]>([])
  const [completion, setCompletion] = useState<CompletionData | null>(null)
  const [userLevel, setUserLevel] = useState<string>('A1')

  // Load verb + sentences + already-learned tenses
  useEffect(() => {
    async function load() {
      const sessionId = getOrCreateSessionId()

      // Load german_level
      const { data: profile } = await supabase
        .from('gwc_sessions')
        .select('german_level')
        .eq('id', sessionId)
        .maybeSingle()
      const level = profile?.german_level ?? 'A1'
      setUserLevel(level)

      // Load verb
      const { data: verbData, error } = await supabase
        .from('gwc_verbs')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (error || !verbData) { setPhase('error'); return }
      setVerb(verbData as VerbWord)

      // Load sentences
      const { data: sentences } = await supabase
        .from('gwc_verb_sentences')
        .select('*')
        .eq('verb_id', verbData.id)
        .order('sort_order', { ascending: true })

      // Check if verb is already in gwc_verb_reviews (one row per verb now)
      const { data: existing } = await supabase
        .from('gwc_verb_reviews')
        .select('id')
        .eq('session_id', sessionId)
        .eq('verb_id', verbData.id)
        .maybeSingle()
      const alreadyLearned = !!existing

      // Group sentences by tense, filter by level — all tenses show as "new" if verb not yet learned
      const groups: TenseGroup[] = TENSE_ORDER
        .filter(t => levelGte(level, TENSE_MIN_LEVEL[t] ?? 'A1'))
        .map(tense => ({
          tense,
          sentences: ((sentences ?? []) as VerbSentence[]).filter(s => s.tense === tense),
          alreadyLearned,
        }))
        .filter(g => g.sentences.length > 0)

      setTenseGroups(groups)
      setPhase(alreadyLearned ? 'all-learned' : 'intro')
    }
    load()
  }, [slug])

  // Move from study → cloze for the current tense
  function startClozeForCurrentTense() {
    const newTenses = tenseGroups.filter(g => !g.alreadyLearned)
    // Build cloze items for all new tenses — 1 sentence per tense (rotates on next review)
    const items: ClozeItem[] = []
    for (const group of newTenses) {
      const shuffled = [...group.sentences].sort(() => Math.random() - 0.5).slice(0, 1)
      for (const s of shuffled) {
        items.push({
          sentenceId: s.id,
          sentence_de: s.sentence_de,
          sentence_en: s.sentence_en,
          cloze_word: s.cloze_word,
          person: s.person,
          tense: s.tense,
        })
      }
    }
    setClozeItems(items)
    setClozeIdx(0)
    setResults([])
    setPhase('cloze')
  }

  // Handle one cloze answer
  function handleClozeResult(correct: boolean) {
    const item = clozeItems[clozeIdx]
    const newResults = [...results, { sentenceId: item.sentenceId, tense: item.tense, correct }]
    setResults(newResults)
    if (clozeIdx + 1 >= clozeItems.length) {
      saveResults(newResults)
    } else {
      setClozeIdx(i => i + 1)
    }
  }

  async function saveResults(finalResults: ClozeResult[]) {
    const sessionId = getOrCreateSessionId()
    const now = new Date().toISOString()

    // Upsert one gwc_verb_reviews row per verb (rotation handles tenses)
    const allCorrect = finalResults.every(r => r.correct)
    const srs = calculateNextReview(allCorrect, 0)
    await supabase.from('gwc_verb_reviews').upsert(
      {
        session_id:       sessionId,
        verb_id:          verb!.id,
        interval_days:    Math.ceil(srs.intervalDays),
        ease_factor:      2.5,
        repetitions:      srs.newSrsLevel,
        next_review_at:   new Date(Date.now() + srs.intervalHours * 3_600_000).toISOString(),
        reviewed_at:      now,
        total_reviews:    1,
        correct_reviews:  allCorrect ? 1 : 0,
        last_sentence_idx: 1,
      },
      { onConflict: 'session_id,verb_id', ignoreDuplicates: false }
    )

    const correctCount  = finalResults.filter(r => r.correct).length
    const wrongCount    = finalResults.length - correctCount
    const xpGained      = correctCount * XP_CORRECT_LEARN + wrongCount * XP_WRONG_LEARN
    const xpResult      = await awardXPAndUpdateStreak(sessionId, xpGained)
    await updateDailyCards(sessionId, finalResults.length)

    setCompletion({
      total: finalResults.length,
      correct: correctCount,
      xpGained,
      newStreak: xpResult?.newStreak ?? 0,
      tensesAdded: tenseGroups.filter(g => !g.alreadyLearned).length,
    })
    setPhase('done')
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex flex-col items-center justify-center px-6">
        <p className="text-[#9b98b0] mb-4">Verb not found.</p>
        <Link href="/verbs" className="text-[#7c6df2] hover:underline text-sm">← Back to verbs</Link>
      </div>
    )
  }

  if (phase === 'all-learned') {
    const unlockedCount = tenseGroups.length
    const nextTense = TENSE_ORDER.find(t => {
      const minLvl = TENSE_MIN_LEVEL[t] ?? 'A1'
      return !levelGte(userLevel, minLvl) && tenseGroups.every(g => g.tense !== t)
    })
    return (
      <div className="min-h-screen bg-[#0f0e17] flex flex-col">
        <div className="flex items-center px-5 py-3 border-b border-white/5">
          <Link href={`/verbs/${slug}`} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
            ← Back
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="text-2xl font-bold text-[#e8e6f0] mb-3">{verb?.word} fully learned</h2>
          <p className="text-[#9b98b0] text-sm mb-2">
            All {unlockedCount} tense{unlockedCount !== 1 ? 's' : ''} for your level are in your review queue.
          </p>
          {nextTense && (
            <p className="text-[#9b98b0] text-sm mt-2">
              <span className="text-[#7c6df2]">{TENSE_LABEL[nextTense]}</span> unlocks at {TENSE_MIN_LEVEL[nextTense]}.
            </p>
          )}
          <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
            <Link
              href="/review"
              className="w-full py-3 rounded-xl bg-[#7c6df2] text-white font-semibold text-sm text-center hover:bg-[#9b8cf5] transition-colors"
            >
              Go to Reviews →
            </Link>
            <Link
              href={`/verbs/${slug}`}
              className="w-full py-3 rounded-xl bg-white/5 text-[#9b98b0] font-semibold text-sm text-center hover:bg-white/8 transition-colors"
            >
              Back to verb
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    const newTenses    = tenseGroups.filter(g => !g.alreadyLearned)
    const learnedTenses = tenseGroups.filter(g => g.alreadyLearned)

    return (
      <div className="min-h-screen bg-[#0f0e17] flex flex-col">
        {/* Header */}
        <div className="flex items-center px-5 py-3 border-b border-white/5">
          <Link href={`/verbs/${slug}`} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
            ← Back
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full">
          {/* Verb header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${levelColor(verb?.level ?? 'A1')}`}>
                {verb?.level}
              </span>
              <span className="text-[#9b98b0] text-xs">{CAT_LABELS[verb?.category ?? 'regular'] ?? verb?.category}</span>
            </div>
            <h1 className="text-3xl font-bold text-[#e8e6f0]">{verb?.word}</h1>
            <p className="text-[#9b98b0] text-base mt-1">{verb?.translation_en}</p>
          </div>

          {/* New tenses */}
          <div className="mb-6">
            <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-3">New tenses to learn</p>
            <div className="space-y-2">
              {newTenses.map(g => (
                <div key={g.tense} className="flex items-center gap-3 bg-[#7c6df2]/10 border border-[#7c6df2]/20 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-[#7c6df2]" />
                  <span className="text-[#e8e6f0] text-sm font-semibold">{TENSE_LABEL[g.tense]}</span>
                  <span className="ml-auto text-[#9b98b0] text-xs">{g.sentences.length} sentences</span>
                </div>
              ))}
            </div>
          </div>

          {/* Already learned */}
          {learnedTenses.length > 0 && (
            <div className="mb-6">
              <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-3">Already in review queue</p>
              <div className="space-y-2">
                {learnedTenses.map(g => (
                  <div key={g.tense} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[#9b98b0] text-sm">{TENSE_LABEL[g.tense]}</span>
                    <span className="ml-auto text-emerald-500 text-xs">✓ learned</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study each tense */}
          {newTenses.map((g, i) => (
            <div key={g.tense} className="mb-6">
              <div className="bg-[#1a1830] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-1">Tense {i + 1} of {newTenses.length}</p>
                  <h3 className="text-lg font-bold text-[#e8e6f0]">{TENSE_LABEL[g.tense]}</h3>
                </div>
                <div className="px-5 py-4">
                  <ConjTable verb={verb!} tense={g.tense} />
                </div>
                {/* Example sentence */}
                {g.sentences[0] && (
                  <div className="px-5 pb-4">
                    <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-2">Example</p>
                    <p className="text-[#e8e6f0] text-sm">{g.sentences[0].sentence_de}</p>
                    <p className="text-[#9b98b0] text-xs mt-1 italic">{g.sentences[0].sentence_en}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* CTA */}
          <button
            onClick={startClozeForCurrentTense}
            className="w-full py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-base hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/20 hover:-translate-y-0.5"
          >
            Start Quiz →
          </button>
          <p className="text-center text-[#9b98b0] text-xs mt-3">
            {newTenses.length} quick question{newTenses.length !== 1 ? 's' : ''} — 1 per tense
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'cloze') {
    const item     = clozeItems[clozeIdx]
    const progress = (clozeIdx / clozeItems.length) * 100

    return (
      <div className="min-h-screen bg-[#0f0e17] flex flex-col">
        {/* Header */}
        <div className="flex items-center px-5 py-3 border-b border-white/5">
          <button onClick={() => setPhase('intro')} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
            ✕
          </button>
          <div className="flex-1 mx-4">
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7c6df2] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-[#9b98b0] text-xs">{clozeIdx + 1} / {clozeItems.length}</span>
        </div>

        <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
          {/* Verb label */}
          <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-4">
            {verb?.word} · {TENSE_LABEL[item.tense] ?? item.tense}
          </p>

          <ClozeInput key={item.sentenceId} item={item} onResult={handleClozeResult} />
        </div>
      </div>
    )
  }

  if (phase === 'done' && completion) {
    const pct = Math.round((completion.correct / completion.total) * 100)

    return (
      <div className="min-h-screen bg-[#0f0e17] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Score ring */}
            <div className="flex flex-col items-center mb-8">
              <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4 ${pct >= 80 ? 'border-emerald-500' : pct >= 50 ? 'border-amber-500' : 'border-red-500'}`}>
                <span className={`text-2xl font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
              </div>
              <h2 className="text-2xl font-bold text-[#e8e6f0]">
                {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practising!'}
              </h2>
              <p className="text-[#9b98b0] text-sm mt-1">{verb?.word} · {completion.tensesAdded} tense{completion.tensesAdded !== 1 ? 's' : ''} added to reviews</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#1a1830] rounded-2xl px-3 py-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-emerald-400">{completion.correct}</p>
                <p className="text-[#9b98b0] text-xs mt-1">Correct</p>
              </div>
              <div className="bg-[#1a1830] rounded-2xl px-3 py-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-red-400">{completion.total - completion.correct}</p>
                <p className="text-[#9b98b0] text-xs mt-1">Wrong</p>
              </div>
              <div className="bg-[#1a1830] rounded-2xl px-3 py-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-[#9b8cf5]">+{completion.xpGained}</p>
                <p className="text-[#9b98b0] text-xs mt-1">XP</p>
              </div>
            </div>

            {/* Streak */}
            {completion.newStreak > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 text-center mb-6">
                <p className="text-amber-400 font-semibold text-sm">🔥 {completion.newStreak}-day streak!</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/review"
                className="w-full py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold text-sm text-center hover:bg-[#9b8cf5] transition-colors"
              >
                Go to Reviews →
              </Link>
              <Link
                href="/learn"
                className="w-full py-3.5 rounded-xl bg-white/5 text-[#9b98b0] font-semibold text-sm text-center hover:bg-white/8 transition-colors"
              >
                Learn more
              </Link>
              <Link
                href={`/verbs/${slug}`}
                className="w-full py-3.5 rounded-xl bg-white/5 text-[#9b98b0] font-semibold text-sm text-center hover:bg-white/8 transition-colors"
              >
                Back to {verb?.word}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
