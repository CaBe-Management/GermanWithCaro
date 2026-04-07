'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  slug: string
  word: string
  type: 'NOMEN' | 'VERB' | 'ADJEKTIV' | 'AUSDRUCK' | 'ADVERB' | 'PRÄPOSITION'
  article: string | null
  plural: string | null
  level: string
  frequency_rank: number | null
  translation_en: string
  explanation_en: string
  usage_notes: string | null
  fun_fact: string | null
  synonyms: string | null
  related_words: string | null
  nom_sg: string | null; nom_pl: string | null
  akk_sg: string | null; akk_pl: string | null
  dat_sg: string | null; dat_pl: string | null
  gen_sg: string | null; gen_pl: string | null
}

interface VocabSentence {
  id: string
  vocab_id: string
  sentence_de: string
  sentence_en: string
  cloze_word: string
  grammatical_case: 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV' | null
  min_level: string
  sort_order: number
}

interface VocabLearnItem {
  type: 'vocab'
  word: VocabWord
  sentences: VocabSentence[]
}

interface GrammarLearnItem {
  type: 'grammar'
  topic: GrammarTopic
  sentence: GrammarSentence   // representative sentence for the cloze quiz
  formKey: string             // "topic_uuid:person" — uniquely identifies this SRS form
  person: string | null       // which conjugation person this form covers (null = no-person topic)
}

type ClozeItem =
  | { kind: 'vocab'; word: VocabWord; sentence: VocabSentence }
  | { kind: 'grammar'; topic: GrammarTopic; sentence: GrammarSentence; formKey: string }

// A single slide in the study phase (shown before the cloze quiz)
type StudySlide =
  | { kind: 'vocab'; word: VocabWord; sentences: VocabSentence[] }
  | { kind: 'grammar'; topic: GrammarTopic; personsInBatch: (string | null)[] }

interface UserPath {
  id: string
  path_id: string
  queue_position: number
  daily_goal: number
  batch_size: number
  lesson_order: string
  active: boolean
}

// Extended result — stores sentence text for the Results screen
interface ClozeResult {
  id: string
  type: 'vocab' | 'grammar'
  correct: boolean
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  label: string    // word.word or topic.title
  formKey?: string // grammar only — stored in DB for form-level SRS
}

interface CompletionData {
  total: number
  correct: number
  xpGained: number
  newStreak: number
  dailyTotal: number
}

// All phases the app can be in
type AppPhase =
  | 'loading'
  | 'no-paths'
  | 'no-items'
  | 'studying'        // vocab browse (word overview, one word at a time)
  | 'quiz-modal'      // "Quiz Time!" overlay before cloze
  | 'cloze'           // cloze quiz cards
  | 'path-end'        // after one path's batch: offer "5 more" or "continue" or "done"
  | 'good-job'        // early-exit modal mid-session
  | 'results'         // full results screen after session
  | 'daily-goal-reached'

// ─── Helpers ──────────────────────────────────────────────────────────────────


function normalize(s: string) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

function createCloze(sentence: string, clozeWord: string): string {
  return sentence.replace(new RegExp(clozeWord, 'i'), '___')
}


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
  // Words are "learned" once any gwc_vocab_reviews row exists for them
  const { data: reviewRows } = await supabase
    .from('gwc_vocab_reviews')
    .select('vocab_id')
    .eq('session_id', sessionId)

  const learnedWordIds = new Set((reviewRows || []).map((r: { vocab_id: string }) => r.vocab_id))

  // Fetch words ordered by frequency rank (or alphabetically)
  const orderCol = lessonOrder === 'alphabetical' ? 'word' : 'frequency_rank'
  const { data: words } = await supabase
    .from('gwc_vocab')
    .select('*')
    .order(orderCol, { ascending: true, nullsFirst: false })
    .limit(500)

  const newWords = (words || []).filter((w: VocabWord) => !learnedWordIds.has(w.id))
  const wordIds  = newWords.slice(0, batchSize * 3).map((w: VocabWord) => w.id)
  if (wordIds.length === 0) return []

  const { data: sentences } = await supabase
    .from('gwc_vocab_sentences')
    .select('*')
    .in('vocab_id', wordIds)
    .order('sort_order', { ascending: true })

  const result: VocabLearnItem[] = []
  for (const word of newWords) {
    const wordSentences = (sentences || []).filter((s: VocabSentence) => s.vocab_id === word.id)
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
  // ── Architecture: SRS unit = FORM (topic_id, person), not individual sentence ──
  // Form key format: "topic_uuid:person"  e.g. "3a7b…:ich"
  //                 "topic_uuid:null"     for topics without person (one-shot grammar topics)
  // Each form has a pool of ~8–10 sentences. During learn, we show the first sentence.
  // During review, we pick a random sentence from the pool each time.

  // 1. Get form keys for forms already learned (new-style rows with grammar_form_key)
  const { data: newStyleRows } = await supabase
    .from('gwc_user_reviews')
    .select('grammar_form_key')
    .eq('session_id', sessionId)
    .eq('item_type', 'grammar')
    .not('grammar_form_key', 'is', null)

  const learnedFormKeys = new Set<string>(
    (newStyleRows || []).map((r: { grammar_form_key: string }) => r.grammar_form_key).filter(Boolean)
  )

  // 2. Also get old-style reviewed sentence IDs (backwards compat — rows without form_key)
  const { data: oldStyleRows } = await supabase
    .from('gwc_user_reviews')
    .select('grammar_sentence_id')
    .eq('session_id', sessionId)
    .eq('item_type', 'grammar')
    .is('grammar_form_key', null)
    .not('grammar_sentence_id', 'is', null)

  const oldReviewedSentIds = new Set<string>(
    (oldStyleRows || []).map((r: { grammar_sentence_id: string }) => r.grammar_sentence_id).filter(Boolean)
  )

  // 3. Fetch all topics and sentences
  const [{ data: topics }, { data: allSentences }] = await Promise.all([
    supabase.from('gwc_grammar_topics').select('*').order('sort_order', { ascending: true }),
    supabase.from('gwc_grammar_sentences').select('*').order('sort_order', { ascending: true }),
  ])

  const topicMap: Record<string, GrammarTopic> = Object.fromEntries(
    (topics || []).map((t: GrammarTopic) => [t.id, t])
  )
  const topicOrder: Record<string, number> = Object.fromEntries(
    (topics || []).map((t: GrammarTopic, i: number) => [t.id, i])
  )

  // 4. Group sentences into forms: Map<form_key, { topicId, person, sentences[] }>
  const formsMap = new Map<string, { topicId: string; person: string | null; sentences: GrammarSentence[] }>()
  for (const s of (allSentences as GrammarSentence[] || [])) {
    const key = `${s.topic_id}:${s.person ?? 'null'}`
    if (!formsMap.has(key)) formsMap.set(key, { topicId: s.topic_id, person: s.person, sentences: [] })
    formsMap.get(key)!.sentences.push(s)
  }

  // 5. For old-style rows: if any sentence of a form was reviewed, mark the form as learned
  for (const [key, form] of formsMap) {
    if (!learnedFormKeys.has(key) && form.sentences.some(s => oldReviewedSentIds.has(s.id))) {
      learnedFormKeys.add(key)
    }
  }

  // Standard grammatical person order (used to sort forms within a topic)
  const PERSON_ORDER = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']

  // 6. Filter to new (unlearned) forms, sort by topic order → person order, take batchSize
  const newForms = Array.from(formsMap.entries())
    .filter(([key, form]) => !learnedFormKeys.has(key) && topicMap[form.topicId])
    .sort(([, formA], [, formB]) => {
      const topicDiff = (topicOrder[formA.topicId] ?? 999) - (topicOrder[formB.topicId] ?? 999)
      if (topicDiff !== 0) return topicDiff
      const pA = formA.person ? PERSON_ORDER.indexOf(formA.person) : PERSON_ORDER.length
      const pB = formB.person ? PERSON_ORDER.indexOf(formB.person) : PERSON_ORDER.length
      return pA - pB
    })
    .slice(0, batchSize)

  // 7. Build one GrammarLearnItem per form (first sentence in pool = representative for learn)
  return newForms.map(([key, form]) => ({
    type: 'grammar' as const,
    topic:   topicMap[form.topicId],
    sentence: form.sentences[0],
    formKey: key,
    person:  form.person,
  }))
}

// ─── Word Overview Slide ──────────────────────────────────────────────────────
// Shows full word info for a vocab item. "Continue" advances to next word or quiz.

const TYPE_LABELS: Record<string, string> = {
  NOMEN: 'Noun', VERB: 'Verb', ADJEKTIV: 'Adjective',
  AUSDRUCK: 'Expression', ADVERB: 'Adverb', PRÄPOSITION: 'Preposition',
}

const CASE_LABEL: Record<string, string> = {
  NOMINATIV: 'Nominative', AKKUSATIV: 'Accusative', DATIV: 'Dative', GENITIV: 'Genitive',
}

const CASE_COLORS: Record<string, string> = {
  NOMINATIV: 'bg-[#7c6df2]/15 text-[#9b8cf5]',
  AKKUSATIV: 'bg-[#3bd395]/10 text-[#3bd395]',
  DATIV:     'bg-[#ffa550]/10 text-[#ffa550]',
  GENITIV:   'bg-[#ffc850]/10 text-[#ffc850]',
}

function highlightCloze(sentence: string, cloze: string) {
  const idx = sentence.toLowerCase().indexOf(cloze.toLowerCase())
  if (idx === -1) return <span>{sentence}</span>
  return (
    <>
      {sentence.slice(0, idx)}
      <span className="text-[#7c6df2] font-bold">{sentence.slice(idx, idx + cloze.length)}</span>
      {sentence.slice(idx + cloze.length)}
    </>
  )
}

function WordOverviewSlide({
  word,
  sentences,
  onContinue,
  onExit,
  current,
  total,
}: {
  word: VocabWord
  sentences: VocabSentence[]
  onContinue: () => void
  onExit: () => void
  current: number
  total: number
}) {
  const isNoun = word.type === 'NOMEN'

  // Group sentences by case for nouns
  const caseOrder = ['NOMINATIV', 'AKKUSATIV', 'DATIV', 'GENITIV'] as const
  const sentencesByCase = isNoun
    ? caseOrder.reduce((acc, cas) => {
        acc[cas] = sentences.filter(s => s.grammatical_case === cas)
        return acc
      }, {} as Record<string, VocabSentence[]>)
    : null

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <button onClick={onExit} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Exit
        </button>
        <span className="text-[#9b98b0] text-sm">{current} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${((current - 1) / total) * 100}%` }} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">

          {/* Hero */}
          <div>
            {word.article && (
              <p className="text-[#7c6df2] text-sm font-bold uppercase tracking-widest mb-1">{word.article} · {TYPE_LABELS[word.type] ?? word.type}</p>
            )}
            <h1 className="text-[2.2rem] font-extrabold text-[#e8e6f0] leading-tight">{word.word}</h1>
            {word.plural && (
              <p className="text-[#9b98b0] text-sm mt-1">Plural: <span className="text-[#e8e6f0]">die {word.plural}</span></p>
            )}
            <p className="text-[#9b98b0] text-base mt-2">🇬🇧 {word.translation_en}</p>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <span className="text-[0.72rem] font-bold tracking-widest uppercase bg-[#7c6df2]/15 text-[#9b8cf5] px-3 py-1 rounded-full">{word.level}</span>
              {word.frequency_rank && (
                <span className="text-[0.72rem] font-bold tracking-widest uppercase bg-[#3bd395]/10 text-[#3bd395] px-3 py-1 rounded-full">⚡ Rank #{word.frequency_rank}</span>
              )}
            </div>
          </div>

          {/* Meaning & Explanation */}
          <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
            <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Meaning & Explanation</p>
            <p className="text-[#e8e6f0] text-sm leading-relaxed">{word.explanation_en}</p>
            {word.usage_notes && (
              <p className="text-[#9b98b0] text-xs leading-relaxed mt-3 pt-3 border-t border-white/5">
                💡 <strong className="text-[#e8e6f0]">Usage:</strong> {word.usage_notes}
              </p>
            )}
          </div>

          {/* Declension table for nouns */}
          {isNoun && (word.nom_sg || word.akk_sg || word.dat_sg || word.gen_sg) && (
            <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
              <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-4">Declension</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-3 pr-4">Case</th>
                    <th className="text-left text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-3 pr-4">Singular</th>
                    <th className="text-left text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-3">Plural</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Nominative', sg: word.nom_sg, pl: word.nom_pl },
                    { label: 'Accusative', sg: word.akk_sg, pl: word.akk_pl },
                    { label: 'Dative',     sg: word.dat_sg, pl: word.dat_pl },
                    { label: 'Genitive',   sg: word.gen_sg, pl: word.gen_pl },
                  ].map(({ label, sg, pl }) => (
                    <tr key={label} className="border-t border-white/5">
                      <td className="py-2.5 pr-4 font-bold text-[#7c6df2] text-xs">{label}</td>
                      <td className="py-2.5 pr-4 text-[#e8e6f0]">{sg || '—'}</td>
                      <td className="py-2.5 text-[#e8e6f0]">{pl || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fun Fact */}
          {word.fun_fact && (
            <div className="bg-gradient-to-br from-[#7c6df2]/10 to-[#7c6df2]/5 border border-[#7c6df2]/20 rounded-2xl p-5">
              <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#7c6df2] mb-2">Fun Fact</p>
              <p className="text-[#c8c5d8] text-sm leading-relaxed">{word.fun_fact}</p>
            </div>
          )}

          {/* Synonyms + Related */}
          {(word.synonyms || word.related_words) && (
            <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
              <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Related Words</p>
              {word.synonyms && (
                <>
                  <p className="text-[#e8e6f0] text-xs mb-2">Synonyms</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {word.synonyms.split(',').map(s => (
                      <span key={s} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{s.trim()}</span>
                    ))}
                  </div>
                </>
              )}
              {word.related_words && (
                <>
                  <p className="text-[#e8e6f0] text-xs mb-2">Related forms</p>
                  <div className="flex flex-wrap gap-2">
                    {word.related_words.split(',').map(r => (
                      <span key={r} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{r.trim()}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* All sentences */}
          {sentences.length > 0 && (
            <div className="space-y-4">
              {isNoun && sentencesByCase ? (
                caseOrder.map(cas => {
                  const grp = sentencesByCase[cas]
                  if (!grp || grp.length === 0) return null
                  return (
                    <div key={cas}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[0.68rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${CASE_COLORS[cas]}`}>
                          {CASE_LABEL[cas]}
                        </span>
                        <div className="flex-1 h-px bg-white/6" />
                      </div>
                      <div className="space-y-2">
                        {grp.map(s => (
                          <div key={s.id} className="bg-[#1a1830] border border-white/5 rounded-2xl px-5 py-4">
                            <p className="text-[#e8e6f0] text-[0.95rem] font-medium leading-snug">
                              {highlightCloze(s.sentence_de, s.cloze_word)}
                            </p>
                            <p className="text-[#9b98b0] text-[0.8rem] mt-1">{s.sentence_en}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div>
                  <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Example Sentences</p>
                  <div className="space-y-2">
                    {sentences.map(s => (
                      <div key={s.id} className="bg-[#1a1830] border border-white/5 rounded-2xl px-5 py-4">
                        <p className="text-[#e8e6f0] text-[0.95rem] font-medium leading-snug">
                          {highlightCloze(s.sentence_de, s.cloze_word)}
                        </p>
                        <p className="text-[#9b98b0] text-[0.8rem] mt-1">{s.sentence_en}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Continue button */}
      <div className="px-6 py-4 border-t border-white/5">
        <button
          onClick={onContinue}
          className="w-full max-w-2xl mx-auto block py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/30"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Grammar Study Slide ──────────────────────────────────────────────────────
// Shown in the study phase (before the cloze quiz) for each unique grammar topic
// in the batch. Highlights which person/form(s) are being learned.

const GRAMMAR_CATEGORY_LABELS: Record<string, string> = {
  verb_conjugation:   'Verb Conjugation',
  adjective_usage:    'Adjective Usage',
  preposition:        'Preposition',
  sentence_structure: 'Word Order',
  case_system:        'Case System',
}

function GrammarStudySlide({
  topic,
  personsInBatch,
  onContinue,
  onExit,
  current,
  total,
}: {
  topic: GrammarTopic
  personsInBatch: (string | null)[]  // which forms from this topic are in the current batch
  onContinue: () => void
  onExit: () => void
  current: number
  total: number
}) {
  const hasPersons = personsInBatch.some(p => p !== null)

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <button onClick={onExit} className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Exit
        </button>
        <span className="text-[#9b98b0] text-sm">{current} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full bg-[#7c6df2] transition-all duration-500"
          style={{ width: `${((current - 1) / total) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">
          {/* Badges */}
          <div className="flex gap-2 mb-6 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
              Grammar
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {topic.level}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {GRAMMAR_CATEGORY_LABELS[topic.category] ?? topic.category}
            </span>
          </div>

          {/* Topic title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e8e6f0] text-center mb-4">{topic.title}</h1>

          {/* Highlight which forms we're practicing (only for verb conjugation topics) */}
          {hasPersons && (
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              {personsInBatch
                .filter((p): p is string => p !== null)
                .map(p => (
                  <span key={p} className="px-3 py-1.5 rounded-xl text-sm font-bold bg-[#7c6df2]/30 text-[#9b8cf5] border border-[#7c6df2]/50">
                    {p}
                  </span>
                ))}
            </div>
          )}

          {/* Full explanation */}
          <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
            <p className="text-xs text-[#9b98b0] uppercase tracking-wider mb-4">How it works</p>
            <div
              className="text-[#c5c3d4] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMd(topic.explanation_en) }}
            />
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="px-6 py-4 border-t border-white/5">
        <button
          onClick={onContinue}
          className="w-full max-w-lg mx-auto block py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/30"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Quiz Time Modal ──────────────────────────────────────────────────────────
// Shown after the study phase, before the cloze quiz.
// X button and → Review both start the quiz.
// "Don't show again" saves preference to localStorage.

function QuizTimeModal({ count, pathName, pathBadge, onStart }: {
  count: number
  pathName: string
  pathBadge: string
  onStart: () => void
}) {
  const [dontShow, setDontShow] = useState(false)

  function handleStart() {
    if (dontShow) localStorage.setItem('gwc_skip_quiz_modal', 'true')
    onStart()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#1a1830] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#e8e6f0]">Quiz Time!</h2>
            <p className="text-[#9b98b0] text-sm mt-0.5">
              {pathName} {pathBadge}{' '}
              <span className="text-[#9b8cf5] font-bold">+{count} item{count !== 1 ? 's' : ''}</span>
            </p>
          </div>
          {/* X closes and starts quiz (same as → Review) */}
          <button
            onClick={handleStart}
            className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-xl leading-none p-1 mt-0.5"
            aria-label="Start quiz"
          >
            ✕
          </button>
        </div>

        {/* Progress dots */}
        <div className="mx-6 mb-4 bg-[#7c6df2]/20 rounded-xl px-4 py-3 border border-[#7c6df2]/30">
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: Math.max(count, 5) }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full min-w-[12px] ${i < count ? 'bg-[#7c6df2]' : 'bg-white/15'}`} />
            ))}
          </div>
        </div>

        <p className="text-center text-[#9b98b0] text-sm px-8 mb-6 leading-relaxed">
          Complete a quiz on the items you just studied to add them to your Review Queue and clear your Daily Goal!
        </p>

        <div className="px-6 pb-6 space-y-4">
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#9b8cf5] transition-all shadow-lg shadow-[#7c6df2]/30"
          >
            → Review
          </button>
          {/* "Don't show again" preference */}
          <label className="flex items-center justify-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded accent-[#7c6df2]"
            />
            <span className="text-[#9b98b0] text-sm">Don&apos;t show this message again</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Good Job Modal (early exit mid-session) ──────────────────────────────────

function GoodJobModal({
  itemsDone,
  xpSoFar,
  pathName,
  onContinue,
  onExit,
}: {
  itemsDone: number
  xpSoFar: number
  pathName: string
  onContinue: () => void
  onExit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#1a1830] rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl overflow-hidden p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💪</div>
          <h2 className="text-2xl font-bold text-[#e8e6f0] mb-1">Good Job!</h2>
          <p className="text-[#9b98b0] text-sm">{itemsDone} items saved to your Review Queue</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#252340] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-xs text-[#9b98b0] mb-1">Items Done</p>
            <p className="text-xl font-bold text-[#e8e6f0]">{itemsDone}</p>
          </div>
          <div className="bg-[#252340] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-xs text-[#9b98b0] mb-1">XP Earned</p>
            <p className="text-xl font-bold text-[#9b8cf5]">+{xpSoFar}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors"
          >
            Continue with {pathName}
          </button>
          <button
            onClick={onExit}
            className="w-full py-3.5 rounded-xl bg-white/5 text-[#9b98b0] font-bold hover:bg-white/10 transition-colors border border-white/10"
          >
            Exit to Summary
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Path End Screen ──────────────────────────────────────────────────────────
// Shown after completing one path's batch. Offers "5 more", "Continue", or "Done".

function PathEndScreen({
  currentPathName,
  nextPathName,
  batchSize,
  itemsDone,
  onMore,
  onContinue,
  onDone,
}: {
  currentPathName: string
  nextPathName: string | null
  batchSize: number
  itemsDone: number
  onMore: () => void
  onContinue: () => void
  onDone: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#e8e6f0] mb-2">Batch complete!</h2>
        <p className="text-[#9b98b0] mb-8">
          You finished <span className="text-[#9b8cf5] font-bold">{itemsDone}</span> cards from <span className="text-[#e8e6f0] font-bold">{currentPathName}</span>.
        </p>

        <div className="flex flex-col gap-3">
          {/* Learn more from current path */}
          <button
            onClick={onMore}
            className="w-full py-3.5 rounded-xl bg-[#7c6df2]/20 text-[#9b8cf5] font-bold border border-[#7c6df2]/40 hover:bg-[#7c6df2]/30 transition-colors"
          >
            Learn {batchSize} more from {currentPathName} →
          </button>

          {/* Move to next path (if exists) */}
          {nextPathName && (
            <button
              onClick={onContinue}
              className="w-full py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors"
            >
              Continue → {nextPathName}
            </button>
          )}

          {/* Done for today */}
          <button
            onClick={onDone}
            className="w-full py-3.5 rounded-xl bg-white/5 text-[#9b98b0] font-bold hover:bg-white/10 transition-colors border border-white/10"
          >
            Done for Today
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────────────────────
// Full results after every session: accuracy, XP, sentence list with tabs/filters.

interface Results24hItem {
  sentence_de: string
  sentence_en: string | null
  cloze_word: string
  label: string
  correct: boolean
}

function ResultsScreen({
  results,
  xpGained,
  newStreak,
  dailyTotal,
}: {
  results: ClozeResult[]
  xpGained: number
  newStreak: number
  dailyTotal: number
}) {
  const [tab, setTab] = useState<'session' | '24h'>('session')
  const [filter, setFilter] = useState<'all' | 'correct' | 'missed'>('all')
  const [items24h, setItems24h] = useState<Results24hItem[]>([])
  const [loading24h, setLoading24h] = useState(false)

  const correct = results.filter(r => r.correct).length
  const pct = results.length > 0 ? Math.round((correct / results.length) * 100) : 0

  // Load 24h results when that tab is selected
  useEffect(() => {
    if (tab !== '24h' || items24h.length > 0) return
    async function load() {
      setLoading24h(true)
      try {
        const sessionId = getOrCreateSessionId()
        const since = new Date(Date.now() - 86400000).toISOString()
        const { data } = await supabase
          .from('gwc_user_reviews')
          .select('correct, reviewed_at, word_sentence_id, grammar_sentence_id, item_type')
          .eq('session_id', sessionId)
          .gte('reviewed_at', since)
          .order('reviewed_at', { ascending: false })
          .limit(200)
        // We just show them as a list of sentence IDs; fetch sentence text separately
        const rows = (data || []) as { correct: boolean; word_sentence_id: string | null; grammar_sentence_id: string | null; item_type: string }[]
        const vocabIds = rows.filter(r => r.item_type === 'vocab' && r.word_sentence_id).map(r => r.word_sentence_id!)
        const grammarIds = rows.filter(r => r.item_type === 'grammar' && r.grammar_sentence_id).map(r => r.grammar_sentence_id!)

        const [vocabSents, grammarSents] = await Promise.all([
          vocabIds.length > 0
            ? supabase.from('gwc_word_sentences').select('id, sentence_de, sentence_en, cloze_word, word_id').in('id', vocabIds)
            : { data: [] },
          grammarIds.length > 0
            ? supabase.from('gwc_grammar_sentences').select('id, sentence_de, sentence_en, cloze_word, topic_id').in('id', grammarIds)
            : { data: [] },
        ])

        // Get word labels
        const wordIds = (vocabSents.data || []).map((s: { word_id: string }) => s.word_id)
        const topicIds = (grammarSents.data || []).map((s: { topic_id: string }) => s.topic_id)
        const [wordsData, topicsData] = await Promise.all([
          wordIds.length > 0 ? supabase.from('gwc_words').select('id, word').in('id', wordIds) : { data: [] },
          topicIds.length > 0 ? supabase.from('gwc_grammar_topics').select('id, title').in('id', topicIds) : { data: [] },
        ])

        const wordMap: Record<string, string> = Object.fromEntries((wordsData.data || []).map((w: { id: string; word: string }) => [w.id, w.word]))
        const topicMap: Record<string, string> = Object.fromEntries((topicsData.data || []).map((t: { id: string; title: string }) => [t.id, t.title]))
        const vocabSentMap: Record<string, { sentence_de: string; sentence_en: string | null; cloze_word: string; word_id: string }> = Object.fromEntries(
          (vocabSents.data || []).map((s: { id: string; sentence_de: string; sentence_en: string | null; cloze_word: string; word_id: string }) => [s.id, s])
        )
        const grammarSentMap: Record<string, { sentence_de: string; sentence_en: string | null; cloze_word: string; topic_id: string }> = Object.fromEntries(
          (grammarSents.data || []).map((s: { id: string; sentence_de: string; sentence_en: string | null; cloze_word: string; topic_id: string }) => [s.id, s])
        )

        const built: Results24hItem[] = rows.map(r => {
          if (r.item_type === 'vocab' && r.word_sentence_id) {
            const s = vocabSentMap[r.word_sentence_id]
            return s ? { sentence_de: s.sentence_de, sentence_en: s.sentence_en, cloze_word: s.cloze_word, label: wordMap[s.word_id] ?? '', correct: r.correct } : null
          } else if (r.grammar_sentence_id) {
            const s = grammarSentMap[r.grammar_sentence_id]
            return s ? { sentence_de: s.sentence_de, sentence_en: s.sentence_en, cloze_word: s.cloze_word, label: topicMap[s.topic_id] ?? '', correct: r.correct } : null
          }
          return null
        }).filter(Boolean) as Results24hItem[]

        setItems24h(built)
      } catch (e) {
        console.error('24h results load error:', e)
      }
      setLoading24h(false)
    }
    load()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayItems: { sentence_de: string; sentence_en: string | null; cloze_word: string; label: string; correct: boolean }[] =
    tab === 'session' ? results : items24h

  const filtered = displayItems.filter(r =>
    filter === 'all' ? true : filter === 'correct' ? r.correct : !r.correct
  )

  const correctCount24h = items24h.filter(r => r.correct).length
  const pct24h = items24h.length > 0 ? Math.round((correctCount24h / items24h.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">{pct >= 70 ? '🎉' : '📚'}</div>
          <h2 className="text-2xl font-bold text-[#e8e6f0]">Session Complete</h2>
          <p className="text-[#9b98b0] text-sm mt-1">{dailyTotal} cards learned today</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1830] rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-[#4ade80]">{pct}%</p>
            <p className="text-xs text-[#9b98b0] mt-1">Accuracy</p>
          </div>
          <div className="bg-[#1a1830] rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-[#9b8cf5]">+{xpGained}</p>
            <p className="text-xs text-[#9b98b0] mt-1">XP Earned</p>
          </div>
          <div className="bg-[#1a1830] rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-orange-400">🔥 {newStreak}</p>
            <p className="text-xs text-[#9b98b0] mt-1">Streak</p>
          </div>
        </div>

        {/* Correct / Incorrect bars */}
        <div className="bg-[#1a1830] rounded-xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#4ade80] w-16 shrink-0">Correct</span>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#4ade80]/70 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-[#4ade80] w-8 text-right shrink-0">{correct}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#f87171] w-16 shrink-0">Missed</span>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#f87171]/70 rounded-full transition-all duration-700" style={{ width: `${100 - pct}%` }} />
            </div>
            <span className="text-xs font-bold text-[#f87171] w-8 text-right shrink-0">{results.length - correct}</span>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 bg-[#1a1830] rounded-xl p-1 border border-white/5">
          {(['session', '24h'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === t ? 'bg-[#7c6df2] text-white' : 'text-[#9b98b0] hover:text-[#e8e6f0]'
              }`}
            >
              {t === 'session' ? 'This Session' : 'Last 24 Hours'}
            </button>
          ))}
        </div>

        {/* Filter tabs for sentence list */}
        <div className="flex gap-1">
          {(['all', 'correct', 'missed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
                filter === f
                  ? f === 'correct' ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30'
                  : f === 'missed'  ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30'
                  : 'bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30'
                  : 'bg-white/5 text-[#9b98b0] border border-white/10 hover:text-[#e8e6f0]'
              }`}
            >
              {f === 'all' ? `All (${displayItems.length})` : f === 'correct' ? `Correct (${displayItems.filter(r => r.correct).length})` : `Missed (${displayItems.filter(r => !r.correct).length})`}
            </button>
          ))}
        </div>

        {/* Sentence list */}
        {tab === '24h' && loading24h ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#9b98b0] text-sm py-6">
            {tab === '24h' && items24h.length === 0 ? 'No reviews in the last 24 hours.' : 'Nothing to show.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r, i) => {
              // Replace cloze_word with highlighted version
              const parts = r.sentence_de.split(new RegExp(`(${r.cloze_word})`, 'i'))
              return (
                <div key={i} className={`bg-[#1a1830] rounded-xl p-4 border ${r.correct ? 'border-[#4ade80]/20' : 'border-[#f87171]/20'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-sm font-bold shrink-0 mt-0.5 ${r.correct ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      {r.correct ? '✓' : '✗'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#9b98b0] uppercase tracking-wider mb-1">{r.label}</p>
                      <p className="text-[#e8e6f0] text-sm leading-relaxed">
                        {parts.map((part, j) =>
                          new RegExp(`^${r.cloze_word}$`, 'i').test(part)
                            ? <span key={j} className={`font-bold ${r.correct ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{part}</span>
                            : <span key={j}>{part}</span>
                        )}
                      </p>
                      {r.sentence_en && (
                        <p className="text-[#9b98b0] text-xs mt-1 leading-relaxed">{r.sentence_en}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 24h stats summary if on that tab */}
        {tab === '24h' && !loading24h && items24h.length > 0 && (
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5 text-center">
            <p className="text-sm text-[#9b98b0]">
              {items24h.length} reviews · <span className="text-[#4ade80] font-bold">{pct24h}%</span> accuracy
            </p>
          </div>
        )}

        {/* Return to Dashboard */}
        <Link
          href="/dashboard"
          className="w-full block py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-center hover:bg-[#9b8cf5] transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}

// ─── Daily Goal Screen ────────────────────────────────────────────────────────

function DailyGoalScreen({ data, onExtend, onDone }: {
  data: CompletionData
  onExtend: () => void
  onDone: () => void
}) {
  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">Daily Goal Reached!</h2>
        <p className="text-[#9b98b0] mb-8">
          You&apos;ve learned <span className="text-[#9b8cf5] font-bold">{data.dailyTotal}</span> new cards today.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#1a1830] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-[#9b98b0] mb-1">Accuracy</p>
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
            Learn 5 More Cards →
          </button>
          <button
            onClick={onDone}
            className="w-full px-6 py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors"
          >
            Done for Today
          </button>
          <Link href="/review" className="text-[#9b98b0] text-sm hover:text-[#e8e6f0] transition-colors py-1">
            Go to Reviews →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Cloze Session ────────────────────────────────────────────────────────────
// Handles the actual cloze quiz. Shows one card at a time.

function ClozeSession({
  items,
  onComplete,
  onEarlyExit,
}: {
  items: ClozeItem[]
  onComplete: (results: ClozeResult[]) => void
  onEarlyExit: (partialResults: ClozeResult[]) => void
}) {
  const [index, setIndex]                       = useState(0)
  const [input, setInput]                       = useState('')
  const [answered, setAnswered]                 = useState(false)
  const [showTranslation, setShowTranslation]   = useState(false)
  const [results, setResults]                   = useState<ClozeResult[]>([])

  const current = items[index]

  // Reset state when card changes (grammar explanations are now in the study phase before cloze)
  useEffect(() => {
    setInput('')
    setAnswered(false)
    setShowTranslation(false)
  }, [index])

  const sentence  = current?.kind === 'vocab' ? current.sentence : current?.sentence
  const clozeWord = sentence?.cloze_word ?? ''
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
    if (!sentence || !current) return
    const r: ClozeResult = {
      id:          sentence.id,
      type:        current.kind === 'vocab' ? 'vocab' : 'grammar',
      correct:     isCorrect,
      sentence_de: sentence.sentence_de,
      sentence_en: sentence.sentence_en ?? null,
      cloze_word:  clozeWord,
      label:       current.kind === 'vocab' ? current.word.word : current.topic.title,
      // Carry the form key so saveBatchResults can store it for form-level SRS
      formKey:     current.kind === 'grammar' ? current.formKey : undefined,
    }
    const newResults = [...results, r]
    setResults(newResults)
    advance(newResults)
  }, [results, sentence, current, isCorrect, clozeWord, index, items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut: Enter to check/advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') answered ? handleNext() : handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answered, handleCheck, handleNext])

  if (!current || !sentence) return null

  const progress = results.length / items.length

  // Hint 1: grammar person (e.g. "ich"); vocab no longer has a cloze_word_en field
  const hint1Vocab = null
  const hint1Grammar = current.kind === 'grammar' ? current.sentence.person : null

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        {/* Exit button → triggers good-job modal */}
        <button
          onClick={() => onEarlyExit(results)}
          className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm"
        >
          ← Exit
        </button>
        <div className="flex items-center gap-3 text-sm">
          {current.kind === 'grammar' && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">
              Grammar
            </span>
          )}
          {hint1Grammar && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
              {hint1Grammar}
            </span>
          )}
          <span className="text-[#9b98b0]">{results.length + 1} / {items.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Card content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 sm:py-12">
        <div className="max-w-2xl w-full text-center space-y-6">

          {/* Word/topic label */}
          <p className="text-[#9b8cf5] font-bold text-lg">
            {current.kind === 'vocab' ? current.word.word : current.topic.title}
          </p>

          {/* Hint 1: English equivalent word — always visible above the sentence */}
          {hint1Vocab && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#7c6df2]/10 border border-[#7c6df2]/20">
              <span className="text-[#9b8cf5] font-bold text-base">"{hint1Vocab}"</span>
            </div>
          )}

          {/* Hint 2: Show Translation button (only before answering) */}
          {!answered && sentence.sentence_en && (
            <div>
              {!showTranslation ? (
                <button
                  onClick={() => setShowTranslation(true)}
                  className="text-xs text-[#9b98b0] hover:text-[#e8e6f0] border border-white/10 rounded-lg px-3 py-1.5 transition-colors min-h-[36px]"
                >
                  Show Translation
                </button>
              ) : (
                <p className="text-[#9b98b0] text-base sm:text-lg leading-relaxed italic">{sentence.sentence_en}</p>
              )}
            </div>
          )}

          {/* German sentence with gap */}
          <p className="text-[#e8e6f0] text-xl sm:text-3xl md:text-4xl leading-relaxed font-light">
            {clozeParts[0]}
            <span className={`inline-block min-w-[120px] border-b-2 px-2 font-bold text-center transition-colors ${
              !answered
                ? 'border-[#7c6df2] text-[#9b8cf5]'
                : isCorrect
                  ? 'border-[#4ade80] text-[#4ade80]'
                  : 'border-[#f87171] text-[#f87171]'
            }`}>
              {/* Never show the cloze word before user submits */}
              {answered ? clozeWord : (input || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0')}
            </span>
            {clozeParts[1]}
          </p>

          {/* After answering: show wrong-answer feedback and full translation */}
          {answered && !isCorrect && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm break-words max-w-full">
              You typed: <span className="font-bold">"{input}"</span>
            </div>
          )}
          {answered && sentence.sentence_en && (
            <p className="text-[#9b98b0] text-base sm:text-lg leading-relaxed italic">{sentence.sentence_en}</p>
          )}
        </div>
      </div>

      {/* Bottom input / next button */}
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

// ─── Main Learn Page ──────────────────────────────────────────────────────────

export default function LearnPage() {
  const searchParams = useSearchParams()
  const targetPathId = searchParams.get('path') // optional: single-path mode from dashboard

  const [appPhase, setAppPhase]             = useState<AppPhase>('loading')
  const [error, setError]                   = useState<string | null>(null)

  // All active paths (sorted by queue_position)
  const [activePaths, setActivePaths]       = useState<UserPath[]>([])
  // Which path in activePaths we're currently serving
  const [currentPathIdx, setCurrentPathIdx] = useState(0)

  // Study phase slides: vocab word overviews + grammar topic explanations (before cloze)
  const [studyQueue, setStudyQueue]         = useState<StudySlide[]>([])
  const [slideIndex, setSlideIndex]         = useState(0)

  // Cloze items for current path's batch
  const [clozeItems, setClozeItems]         = useState<ClozeItem[]>([])

  // Accumulated results across the whole session
  const [allResults, setAllResults]         = useState<ClozeResult[]>([])

  // Current batch results (to save to DB when a batch is done)
  const [batchResults, setBatchResults]     = useState<ClozeResult[]>([])

  // Path name for quiz modal
  const [currentPathName, setCurrentPathName] = useState('German With Caro')

  // Completion/session summary data
  const [completion, setCompletion]         = useState<CompletionData | null>(null)

  // Daily goal tracking
  const [currentGoal, setCurrentGoal]       = useState(10)

  // Good-job modal state
  const [showGoodJob, setShowGoodJob]       = useState(false)
  const [goodJobXP, setGoodJobXP]           = useState(0)

  // "learn more" extension: stores batch size to re-load with
  const extensionBatchRef                   = useRef<number | null>(null)
  const loadKey                             = useRef(0)

  // ── Load items for a specific path index ─────────────────────────────────

  const loadPath = useCallback(async (
    pathIdx: number,
    paths: UserPath[],
    batchOverride?: number,
  ) => {
    setAppPhase('loading')
    setError(null)
    try {
      const sessionId = getOrCreateSessionId()
      const path = paths[pathIdx]
      const def  = getPathById(path.path_id)
      if (!def) { setAppPhase('no-items'); return }

      setCurrentPathName(def.name)

      const batchSize = batchOverride ?? path.batch_size

      const vocab:   VocabLearnItem[]   = []
      const grammar: GrammarLearnItem[] = []

      if (def.type === 'vocab' || def.type === 'mixed') {
        vocab.push(...await fetchVocabItems(sessionId, path.lesson_order, batchSize))
      }
      if (def.type === 'grammar' || def.type === 'mixed') {
        grammar.push(...await fetchGrammarItems(sessionId, batchSize))
      }

      if (vocab.length === 0 && grammar.length === 0) {
        // No items for this path — try next path
        if (pathIdx + 1 < paths.length) {
          await loadPath(pathIdx + 1, paths)
          return
        }
        setAppPhase(allResults.length > 0 ? 'results' : 'no-items')
        return
      }

      // Build the study queue: one vocab slide per word + one grammar slide per unique topic
      // Grammar slides are deduplicated by topic (explanation shown once per topic, not per form)
      const grammarTopicsSeen = new Set<string>()
      const slides: StudySlide[] = []

      // Vocab slides first (one per word, all sentences included)
      for (const v of vocab) {
        slides.push({ kind: 'vocab', word: v.word, sentences: v.sentences })
      }

      // Grammar slides: one per unique topic, listing which persons are in this batch
      for (const g of grammar) {
        if (!grammarTopicsSeen.has(g.topic.id)) {
          grammarTopicsSeen.add(g.topic.id)
          const personsForTopic = grammar
            .filter(item => item.topic.id === g.topic.id)
            .map(item => item.person)
          slides.push({ kind: 'grammar', topic: g.topic, personsInBatch: personsForTopic })
        }
      }

      setStudyQueue(slides)
      setSlideIndex(0)

      // Cloze items carry formKey for grammar so it can be stored in DB
      const items: ClozeItem[] = [
        ...vocab.map(v => ({ kind: 'vocab' as const, word: v.word, sentence: v.sentences[0] })),
        ...grammar.map(g => ({ kind: 'grammar' as const, topic: g.topic, sentence: g.sentence, formKey: g.formKey })),
      ]
      setClozeItems(items)

      // Always enter studying phase (shows both vocab and grammar slides)
      // Skip studying phase only when there are no slides at all
      if (slides.length > 0) {
        setAppPhase('studying')
      } else {
        setAppPhase('cloze')
      }
    } catch (e) {
      console.error('Load path error:', e)
      setError('Connection error. Please try again.')
      setAppPhase('no-items')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults.length])

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      setAppPhase('loading')
      setError(null)
      try {
        const sessionId = getOrCreateSessionId()

        // Load active paths
        const { data: pathRows } = await supabase
          .from('gwc_user_paths')
          .select('*')
          .eq('session_id', sessionId)
          .eq('active', true)
          .order('queue_position', { ascending: true })

        let paths = (pathRows || []) as UserPath[]

        if (paths.length === 0) { setAppPhase('no-paths'); return }

        // If a specific path was requested via URL param, filter to just that one
        if (targetPathId) {
          paths = paths.filter(p => p.path_id === targetPathId)
          if (paths.length === 0) { setAppPhase('no-paths'); return }
        }

        setActivePaths(paths)
        setCurrentPathIdx(0)

        // Load daily goal from user progress
        const progress = await getOrCreateProgress(sessionId)
        setCurrentGoal(progress?.daily_goal ?? 10)

        await loadPath(0, paths)
      } catch (e) {
        console.error('Init error:', e)
        setError('Connection error.')
        setAppPhase('no-items')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Study phase navigation ────────────────────────────────────────────────

  function goNextSlide() {
    if (slideIndex + 1 < studyQueue.length) {
      setSlideIndex(s => s + 1)
    } else {
      // All study slides done → check "don't show again" preference before modal
      const skipModal = typeof window !== 'undefined'
        && localStorage.getItem('gwc_skip_quiz_modal') === 'true'
      setAppPhase(skipModal ? 'cloze' : 'quiz-modal')
    }
  }

  // ── Save batch results to DB and award XP ─────────────────────────────────

  async function saveBatchResults(results: ClozeResult[]): Promise<CompletionData> {
    const sessionId = getOrCreateSessionId()
    const now = new Date().toISOString()

    const vocabResults   = results.filter(r => r.type === 'vocab')
    const grammarResults = results.filter(r => r.type === 'grammar')

    // Save vocab reviews (new inserts only — learn page always creates new entries)
    if (vocabResults.length > 0) {
      await supabase.from('gwc_user_reviews').insert(
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
        })
      )
    }

    // Save grammar reviews (may already exist from topic page — upsert)
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
              // Store form key — enables form-level SRS (one card per form, random sentence at review)
              grammar_form_key:    r.formKey ?? null,
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

    const correctCount = results.filter(r => r.correct).length
    const wrongCount   = results.length - correctCount
    const xpGained     = correctCount * XP_CORRECT_LEARN + wrongCount * XP_WRONG_LEARN

    const xpResult     = await awardXPAndUpdateStreak(sessionId, xpGained)
    const { dailyTotal } = await updateDailyCards(sessionId, results.length)

    return {
      total:      results.length,
      correct:    correctCount,
      xpGained,
      newStreak:  xpResult?.newStreak ?? 0,
      dailyTotal,
    }
  }

  // ── After a path's cloze batch is done ───────────────────────────────────

  async function handleBatchComplete(results: ClozeResult[]) {
    const combined = [...allResults, ...results]
    setAllResults(combined)
    setBatchResults(results)

    // Save to DB and get completion data
    const data = await saveBatchResults(results)
    setCompletion(data)

    // Check daily goal first
    if (data.dailyTotal >= currentGoal) {
      setAppPhase('daily-goal-reached')
      return
    }

    // If only one path (or single-path mode via URL param), go straight to results
    if (activePaths.length <= 1) {
      setAppPhase('results')
      return
    }

    // Show path-end screen to ask: more from this path? continue? done?
    setAppPhase('path-end')
  }

  // ── Early exit (Good Job modal) ───────────────────────────────────────────

  async function handleEarlyExit(partialResults: ClozeResult[]) {
    if (partialResults.length === 0) {
      // Nothing done — just navigate back
      window.location.href = '/dashboard'
      return
    }
    // Save partial results
    const combined = [...allResults, ...partialResults]
    setAllResults(combined)

    const data = await saveBatchResults(partialResults)
    setCompletion(data)

    const xp = partialResults.filter(r => r.correct).length * XP_CORRECT_LEARN
             + partialResults.filter(r => !r.correct).length * XP_WRONG_LEARN
    setGoodJobXP(xp)
    setShowGoodJob(true)
  }

  // ── Path-end: "5 more from current path" ─────────────────────────────────

  async function handleMoreFromCurrentPath() {
    const path    = activePaths[currentPathIdx]
    const newBatch = path?.batch_size ?? 5
    setAllResults(prev => [...prev])  // keep accumulated
    await loadPath(currentPathIdx, activePaths, newBatch)
  }

  // ── Path-end: "Continue to next path" ────────────────────────────────────

  async function handleContinueToNextPath() {
    const nextIdx = currentPathIdx + 1
    setCurrentPathIdx(nextIdx)
    await loadPath(nextIdx, activePaths)
  }

  // ── Path-end: "Done for Today" → results ─────────────────────────────────

  function handleDoneForToday() {
    setAppPhase('results')
  }

  // ── Daily goal: extend by 5 more items ───────────────────────────────────

  async function handleExtend() {
    setCurrentGoal(g => g + 5)
    setCompletion(null)
    await loadPath(currentPathIdx, activePaths, 5)
  }

  // ── Render error states ───────────────────────────────────────────────────

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
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (appPhase === 'no-paths') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">📚</p>
          <p className="text-[#e8e6f0] font-bold text-xl mb-2">No decks configured</p>
          <p className="text-[#9b98b0] text-sm mb-8">Add a deck to your Learn Queue to get started.</p>
          <Link href="/learn-settings" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">
            Set up Learn Queue →
          </Link>
        </div>
      </div>
    )
  }

  if (appPhase === 'no-items') {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-[#e8e6f0] font-bold text-xl mb-2">All caught up!</p>
          <p className="text-[#9b98b0] text-sm mb-8">No new items in your queue. Check back tomorrow or review what you&apos;ve learned.</p>
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

  // ── Results screens ───────────────────────────────────────────────────────

  if (appPhase === 'daily-goal-reached' && completion) {
    return (
      <DailyGoalScreen
        data={completion}
        onExtend={handleExtend}
        onDone={() => setAppPhase('results')}
      />
    )
  }

  if (appPhase === 'results') {
    return (
      <ResultsScreen
        results={allResults}
        xpGained={completion?.xpGained ?? 0}
        newStreak={completion?.newStreak ?? 0}
        dailyTotal={completion?.dailyTotal ?? 0}
      />
    )
  }

  // ── Path-end screen ───────────────────────────────────────────────────────

  if (appPhase === 'path-end') {
    const currentPath = activePaths[currentPathIdx]
    const nextPath    = activePaths[currentPathIdx + 1]
    const nextDef     = nextPath ? getPathById(nextPath.path_id) : null

    return (
      <PathEndScreen
        currentPathName={currentPathName}
        nextPathName={nextDef?.name ?? null}
        batchSize={currentPath?.batch_size ?? 5}
        itemsDone={batchResults.length}
        onMore={handleMoreFromCurrentPath}
        onContinue={handleContinueToNextPath}
        onDone={handleDoneForToday}
      />
    )
  }

  // ── Cloze phase ───────────────────────────────────────────────────────────

  if (appPhase === 'cloze') {
    return (
      <>
        {showGoodJob && completion && (
          <GoodJobModal
            itemsDone={allResults.length + batchResults.length}
            xpSoFar={goodJobXP}
            pathName={currentPathName}
            onContinue={() => setShowGoodJob(false)}
            onExit={() => { setShowGoodJob(false); setAppPhase('results') }}
          />
        )}
        <ClozeSession
          items={clozeItems}
          onComplete={handleBatchComplete}
          onEarlyExit={handleEarlyExit}
        />
      </>
    )
  }

  // ── Quiz Time Modal ───────────────────────────────────────────────────────
  // Shown after all study slides, before the cloze quiz.

  if (appPhase === 'quiz-modal') {
    const pathDef = getPathById(activePaths[currentPathIdx]?.path_id ?? '')
    return (
      <div className="min-h-screen bg-[#0f0e17]">
        <QuizTimeModal
          count={clozeItems.length}
          pathName={currentPathName}
          pathBadge={pathDef?.badge ?? ''}
          onStart={() => setAppPhase('cloze')}
        />
      </div>
    )
  }

  // ── Study phase: vocab overviews + grammar topic explanations ─────────────

  const currentSlide = studyQueue[slideIndex]
  if (!currentSlide) return null

  return (
    <>
      {/* Good Job modal can appear over the study phase too */}
      {showGoodJob && completion && (
        <GoodJobModal
          itemsDone={allResults.length}
          xpSoFar={goodJobXP}
          pathName={currentPathName}
          onContinue={() => setShowGoodJob(false)}
          onExit={() => { setShowGoodJob(false); setAppPhase('results') }}
        />
      )}

      {/* Vocab word overview slide */}
      {currentSlide.kind === 'vocab' && (
        <WordOverviewSlide
          word={currentSlide.word}
          sentences={currentSlide.sentences}
          onContinue={goNextSlide}
          onExit={() => handleEarlyExit([])}
          current={slideIndex + 1}
          total={studyQueue.length}
        />
      )}

      {/* Grammar topic explanation slide */}
      {currentSlide.kind === 'grammar' && (
        <GrammarStudySlide
          topic={currentSlide.topic}
          personsInBatch={currentSlide.personsInBatch}
          onContinue={goNextSlide}
          onExit={() => handleEarlyExit([])}
          current={slideIndex + 1}
          total={studyQueue.length}
        />
      )}
    </>
  )
}
