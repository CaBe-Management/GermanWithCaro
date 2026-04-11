'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { calculateNextReview } from '@/lib/srs'
import { awardXPAndUpdateStreak, XP_CORRECT_REVIEW, XP_WRONG_REVIEW } from '@/lib/gamification'

import type { GrammarTopic, GrammarSentence } from '@/lib/supabase'
import AudioButton from '@/components/AudioButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GrammarCard {
  kind: 'grammar'
  reviewId: string
  topic: GrammarTopic
  sentence: GrammarSentence
  srsLevel: number
}

// ── New vocab system (gwc_vocab + gwc_vocab_sentences + gwc_vocab_reviews) ──
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
}
interface GwcVocabSentence {
  id: string; vocab_id: string; sentence_de: string; sentence_en: string
  cloze_word: string; grammatical_case: string | null; min_level: string; sort_order: number
  audio_file?: string | null
}
interface VocabNewCard {
  kind: 'vocab_new'
  reviewId: string
  vocab: GwcVocab
  sentence: GwcVocabSentence        // the sentence to show this review
  lastSentenceIdx: number            // current idx (will be incremented on save)
  srsLevel: number
}

type ReviewCard = GrammarCard | VocabNewCard

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

function typColor(typ: string) {
  switch (typ) {
    case 'NOMEN':     return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'VERB':      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'ADJEKTIV':  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'ADVERB':    return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default:          return 'bg-white/10 text-[#9b98b0] border-white/10'
  }
}

// ─── Info Panels (auto-shown after answer, no toggle) ─────────────────────────

function RegisterDots({ level }: { level: number | null }) {
  if (level == null) return null
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= level ? 'bg-[#7c6df2]' : 'bg-white/10'}`} />
      ))}
    </div>
  )
}

function highlightStructure(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']')
      ? <span key={i} className="text-[#9b8cf5] font-semibold">{part}</span>
      : <span key={i} className="text-[#e8e6f0]">{part}</span>
  )
}

function GrammarInfoPanel({ topic, sentence }: { topic: GrammarTopic; sentence: GrammarSentence }) {
  const hasRegister = topic.register_formal != null || topic.register_standard != null || topic.register_casual != null
  return (
    <div className="border-t border-white/8 px-5 py-6 space-y-4 max-w-xl mx-auto w-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">Grammar</span>
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">{topic.level}</span>
          {sentence.person && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">{sentence.person}</span>
          )}
        </div>
        <p className="text-lg font-bold text-[#e8e6f0]">{topic.title}</p>
        {topic.translation_en && (
          <p className="text-sm text-[#9b8cf5] mt-0.5">{topic.translation_en}</p>
        )}
      </div>

      {/* Structure */}
      {topic.structure && (
        <div className="bg-[#1a1830] border border-white/5 rounded-xl p-4">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Structure</p>
          <p className="font-mono text-sm">{highlightStructure(topic.structure)}</p>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-[#1a1830] border border-white/5 rounded-xl p-4">
        <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Explanation</p>
        <div
          className="text-sm text-[#c8c5d8] leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: topic.explanation_en
              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8e6f0]">$1</strong>')
              .replace(/\n/g, '<br />')
          }}
        />
      </div>

      {/* Fun Fact */}
      {topic.fun_fact && (
        <div className="bg-gradient-to-br from-[#7c6df2]/10 to-[#7c6df2]/5 border border-[#7c6df2]/20 rounded-xl p-4">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#7c6df2] mb-2">Fun Fact</p>
          <p className="text-sm text-[#c8c5d8] leading-relaxed">{topic.fun_fact}</p>
        </div>
      )}

      {/* Register */}
      {hasRegister && (
        <div className="bg-[#1a1830] border border-white/5 rounded-xl p-4">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Register</p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Formal',   val: topic.register_formal },
              { label: 'Standard', val: topic.register_standard },
              { label: 'Casual',   val: topic.register_casual },
            ].map(({ label, val }) => val != null && (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[#9b98b0]">{label}</span>
                <RegisterDots level={val} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related forms */}
      {topic.related_forms && (
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Related Forms</p>
          <div className="flex flex-wrap gap-2">
            {topic.related_forms.split(',').map(f => (
              <span key={f} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{f.trim()}</span>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/grammar/${topic.slug}`}
        className="block text-center text-xs text-[#7c6df2] hover:text-[#9b8cf5] transition-colors pt-1"
      >
        View full topic: {topic.title} →
      </Link>
    </div>
  )
}

function VocabNewInfoPanel({ vocab, grammaticalCase }: { vocab: GwcVocab; grammaticalCase: string | null }) {
  const CASE_LABEL: Record<string, string> = {
    NOMINATIV: 'Nominative', AKKUSATIV: 'Accusative', DATIV: 'Dative', GENITIV: 'Genitive',
  }
  const CASE_COLOR: Record<string, string> = {
    NOMINATIV: 'bg-[#7c6df2]/15 border-[#7c6df2]/30 text-[#9b8cf5]',
    AKKUSATIV: 'bg-[#3bd395]/10 border-[#3bd395]/30 text-[#3bd395]',
    DATIV:     'bg-[#ffa550]/10 border-[#ffa550]/30 text-[#ffa550]',
    GENITIV:   'bg-[#ffc850]/10 border-[#ffc850]/30 text-[#ffc850]',
  }
  const isNoun = vocab.article != null
  const declRows = isNoun ? [
    { key: 'NOMINATIV', sg: vocab.nom_sg, pl: vocab.nom_pl },
    { key: 'AKKUSATIV', sg: vocab.akk_sg, pl: vocab.akk_pl },
    { key: 'DATIV',     sg: vocab.dat_sg, pl: vocab.dat_pl },
    { key: 'GENITIV',   sg: vocab.gen_sg, pl: vocab.gen_pl },
  ] : []

  return (
    <div className="border-t border-white/8 px-5 py-6 space-y-4 max-w-xl mx-auto w-full">

      {/* Hero */}
      <div>
        {vocab.article && (
          <p className="text-[#7c6df2] text-xs font-bold uppercase tracking-widest mb-1">
            {vocab.article} · Noun
          </p>
        )}
        <p className="text-2xl font-extrabold text-[#e8e6f0]">{vocab.word}</p>
        {vocab.plural && (
          <p className="text-[#9b98b0] text-xs mt-0.5">Plural: <span className="text-[#c8c5d8]">die {vocab.plural}</span></p>
        )}
        <p className="text-sm text-[#9b98b0] mt-1">🇬🇧 {vocab.translation_en}</p>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-[#7c6df2]/15 text-[#9b8cf5] px-2.5 py-1 rounded-full">{vocab.level}</span>
          {vocab.frequency_rank && (
            <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-[#3bd395]/10 text-[#3bd395] px-2.5 py-1 rounded-full">
              ⚡ Rank #{vocab.frequency_rank}
            </span>
          )}
          {grammaticalCase && (
            <span className={`text-[0.65rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${CASE_COLOR[grammaticalCase] ?? 'bg-white/5 border-white/10 text-[#9b98b0]'}`}>
              {CASE_LABEL[grammaticalCase] ?? grammaticalCase}
            </span>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-[#1a1830] border border-white/5 rounded-xl p-4">
        <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-2">Meaning & Explanation</p>
        <p className="text-sm text-[#c8c5d8] leading-relaxed">{vocab.explanation_en}</p>
        {vocab.usage_notes && (
          <p className="text-xs text-[#9b98b0] leading-relaxed mt-3 pt-3 border-t border-white/5">
            💡 <strong className="text-[#e8e6f0]">Usage:</strong> {vocab.usage_notes}
          </p>
        )}
      </div>

      {/* Fun Fact */}
      {vocab.fun_fact && (
        <div className="bg-gradient-to-br from-[#7c6df2]/10 to-[#7c6df2]/5 border border-[#7c6df2]/20 rounded-xl p-4">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#7c6df2] mb-2">Fun Fact</p>
          <p className="text-sm text-[#c8c5d8] leading-relaxed">{vocab.fun_fact}</p>
        </div>
      )}

      {/* Declension table */}
      {isNoun && declRows.length > 0 && (
        <div className="bg-[#1a1830] border border-white/5 rounded-xl p-4">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Declension</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-2 pr-3">Case</th>
                <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-2 pr-3">Singular</th>
                <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0] pb-2">Plural</th>
              </tr>
            </thead>
            <tbody>
              {declRows.map(({ key, sg, pl }) => (
                <tr key={key} className={`border-t border-white/5 ${grammaticalCase === key ? 'bg-[#7c6df2]/8' : ''}`}>
                  <td className={`py-2 pr-3 text-xs font-bold ${grammaticalCase === key ? 'text-[#9b8cf5]' : 'text-[#7c6df2]'}`}>
                    {CASE_LABEL[key]}
                  </td>
                  <td className="py-2 pr-3 text-[#e8e6f0]">{sg || '—'}</td>
                  <td className="py-2 text-[#e8e6f0]">{pl || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Related words */}
      {(vocab.synonyms || vocab.related_words) && (
        <div className="bg-[#1a1830] border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#9b98b0]">Related Words</p>
          {vocab.synonyms && (
            <div>
              <p className="text-xs text-[#9b98b0] mb-1.5">Synonyms</p>
              <div className="flex flex-wrap gap-2">
                {vocab.synonyms.split(',').map(s => (
                  <span key={s} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}
          {vocab.related_words && (
            <div>
              <p className="text-xs text-[#9b98b0] mb-1.5">Related forms</p>
              <div className="flex flex-wrap gap-2">
                {vocab.related_words.split(',').map(r => (
                  <span key={r} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">{r.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Link
        href={`/vocab/${vocab.slug}`}
        className="block text-center text-xs text-[#7c6df2] hover:text-[#9b8cf5] transition-colors pt-1"
      >
        Open full word page for „{vocab.word}" →
      </Link>
    </div>
  )
}

// ─── Review Card View ─────────────────────────────────────────────────────────

function ReviewCardView({
  card,
  cardNumber,
  total,
  mistakes,
  onResult,
}: {
  card: ReviewCard
  cardNumber: number
  total: number
  mistakes: number
  onResult: (wasCorrect: boolean) => void
}) {
  const [input, setInput]       = useState('')
  const [answered, setAnswered] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  // Resolve card-type-specific fields
  const sentence    = card.sentence
  const clozeWord   = sentence.cloze_word
  const sentenceDE  = sentence.sentence_de
  const sentenceEN  = 'sentence_en' in sentence ? sentence.sentence_en : null
  const audioFile   = 'audio_file' in sentence ? sentence.audio_file : null

  // Build cloze parts: split sentence on the cloze word
  const clozeParts = sentenceDE.replace(new RegExp(clozeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '___').split('___')

  const isCorrect =
    normalize(input) === normalize(clozeWord) ||
    input.trim().toLowerCase() === clozeWord.toLowerCase()

  const handleCheck = useCallback(() => {
    if (!input.trim() || answered) return
    setAnswered(true)
  }, [input, answered])

  const handleNext = useCallback(() => {
    onResult(isCorrect)
  }, [isCorrect, onResult])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') answered ? handleNext() : handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answered, handleCheck, handleNext])

  useEffect(() => { setInput(''); setAnswered(false); setShowInfo(false) }, [card.reviewId])

  useEffect(() => {
    if (showInfo && infoRef.current) {
      setTimeout(() => infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [showInfo])

  const wordsLeft = total - (cardNumber - 1)
  const progress  = (cardNumber - 1) / total

  const KASUS_LABELS: Record<string, string> = {
    NOMINATIV: 'Nom', AKKUSATIV: 'Akk', DATIV: 'Dat', GENITIV: 'Gen',
  }

  // No topic label shown above the sentence — it gives away the answer
  const topicLabel = null

  // SRS level badge
  const srsLabel = `SRS ${card.srsLevel}`

  // Highlight a word/phrase inside an English sentence in purple
  function highlightTranslation(sentenceEn: string, target: string) {
    if (!target) return <span>{sentenceEn}</span>
    const idx = sentenceEn.toLowerCase().indexOf(target.toLowerCase())
    if (idx === -1) return <span>{sentenceEn}</span>
    return (
      <>
        {sentenceEn.slice(0, idx)}
        <span className="text-[#7c6df2] font-semibold">{sentenceEn.slice(idx, idx + target.length)}</span>
        {sentenceEn.slice(idx + target.length)}
      </>
    )
  }

  // English hint — always visible; highlights the relevant word in purple
  function renderEN() {
    if (!sentenceEN) return null
    const content =
      card.kind === 'vocab_new'
        ? highlightTranslation(sentenceEN, card.vocab.translation_en)
        : (card.sentence as GrammarSentence).highlight_en
          ? highlightTranslation(sentenceEN, (card.sentence as GrammarSentence).highlight_en!)
          : <span>{sentenceEN}</span>
    return <p className="text-[#9b98b0] text-base sm:text-xl leading-relaxed italic">{content}</p>
  }

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] transition-colors text-sm">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {/* Type badge */}
          {card.kind === 'grammar' && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#7c6df2]/20 text-[#9b8cf5] border border-[#7c6df2]/30">Grammar</span>
          )}
          {card.kind === 'vocab_new' && card.sentence.grammatical_case && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {KASUS_LABELS[card.sentence.grammatical_case] ?? card.sentence.grammatical_case}
            </span>
          )}
          {/* SRS level */}
          <span className="px-2 py-0.5 rounded-md text-xs text-[#6b6880] bg-white/5 border border-white/8">
            {srsLabel}
          </span>
          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="text-[#9b98b0]">□</span>
              <span className="font-bold text-[#e8e6f0]">{wordsLeft}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#4ade80]">✓</span>
              <span className="font-bold text-[#4ade80]">{cardNumber - 1 - mistakes}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#f87171]">✗</span>
              <span className={`font-bold ${mistakes > 0 ? 'text-[#f87171]' : 'text-[#9b98b0]'}`}>{mistakes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full bg-[#7c6df2] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 sm:py-12">
        <div className="max-w-2xl w-full text-center space-y-6">
          {renderEN()}

          {/* German sentence with gap */}
          <p className="text-[#e8e6f0] text-xl sm:text-3xl md:text-4xl leading-relaxed font-light">
            {clozeParts[0]}
            <span className={`inline-block min-w-[120px] border-b-2 px-2 font-bold text-center transition-colors ${
              !answered ? 'border-[#7c6df2] text-[#9b8cf5]'
              : isCorrect ? 'border-[#4ade80] text-[#4ade80]'
              : 'border-[#f87171] text-[#f87171]'
            }`}>
              {answered ? clozeWord : (input || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0')}
            </span>
            {clozeParts[1]}
          </p>

          {answered && !isCorrect && (
            <div className="inline-block px-4 py-2 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm break-words max-w-full">
              You typed: <span className="font-bold">"{input}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: input or feedback */}
      <div className="bg-[#0f0e17] border-t border-white/5">
        {!answered ? (
          <div className="px-5 py-4 flex gap-3 max-w-xl mx-auto w-full">
            <input
              autoFocus type="text" value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type the missing word..."
              className="flex-1 bg-[#1a1830] border border-white/10 rounded-xl px-4 py-3 text-[#e8e6f0] placeholder-[#9b98b0] focus:outline-none focus:border-[#7c6df2] transition-colors text-lg"
            />
            <button
              onClick={handleCheck} disabled={!input.trim()}
              className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg"
            >✓</button>
          </div>
        ) : (
          <div className="px-5 py-4 max-w-xl mx-auto w-full space-y-3">
            {/* Result bar */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isCorrect ? 'bg-[#4ade80]/5 border-[#4ade80]/20' : 'bg-[#f87171]/5 border-[#f87171]/20'
            }`}>
              <AudioButton filename={audioFile} />
              <span className={`flex-1 font-bold text-base ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                {isCorrect ? `✓ ${clozeWord}` : `✗  ${clozeWord}`}
              </span>
              {!isCorrect && (
                <span className="text-xs text-[#9b98b0]">You typed: <span className="font-bold text-[#f87171]">{input}</span></span>
              )}
            </div>
            {/* Action row: More Info + Next */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowInfo(v => !v)}
                className={`flex-none flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors ${
                  showInfo
                    ? 'bg-[#7c6df2]/20 border-[#7c6df2]/40 text-[#9b8cf5]'
                    : 'bg-white/5 border-white/10 text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/10'
                }`}
              >
                ℹ {showInfo ? 'Hide' : 'More Info'}
              </button>
              <button
                onClick={handleNext}
                className={`flex-1 py-3.5 rounded-xl border-2 font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                  isCorrect ? 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/10'
                            : 'border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10'
                }`}
              >
                Next → <span className="text-xs opacity-60">(Enter)</span>
              </button>
            </div>
          </div>
        )}

        {/* Info panel — shown when user clicks More Info */}
        {answered && showInfo && card.kind === 'vocab_new' && (
          <div ref={infoRef}><VocabNewInfoPanel vocab={card.vocab} grammaticalCase={card.sentence.grammatical_case ?? null} /></div>
        )}
        {answered && showInfo && card.kind === 'grammar' && (
          <div ref={infoRef}><GrammarInfoPanel topic={card.topic} sentence={card.sentence} /></div>
        )}
      </div>
    </div>
  )
}

// ─── Completion / Empty screens ───────────────────────────────────────────────

function CompletionScreen({ total, correct }: { total: number; correct: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-[#e8e6f0] mb-2">All reviews done!</h2>
        <p className="text-[#9b98b0] mb-2">{correct}/{total} correct — {pct}%</p>
        <p className="text-[#9b98b0] text-sm mb-8">Your Review Queue has been updated.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors">Dashboard</Link>
          <Link href="/learn" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">Learn More</Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-[#e8e6f0] mb-2">No reviews due!</h2>
        <p className="text-[#9b98b0] mb-8">All done. Learn new words or come back later.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold">Dashboard</Link>
          <Link href="/learn" className="px-6 py-3 rounded-xl bg-white/10 text-[#e8e6f0] font-bold hover:bg-white/15 transition-colors">Learn</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page (inner, uses useSearchParams) ──────────────────────────────────

function ReviewPageInner() {
  const searchParams = useSearchParams()
  const typeFilter   = searchParams.get('type') as 'all' | 'vocab_new' | 'grammar' | null ?? 'all'

  const [loading, setLoading] = useState(true)
  const [cards, setCards]     = useState<ReviewCard[]>([])
  const [index, setIndex]     = useState(0)
  const [done, setDone]       = useState(false)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now = new Date().toISOString()
        const built: ReviewCard[] = []

        // ── Grammar reviews ─────────────────────────────────────────────────────
        if (typeFilter === 'all' || typeFilter === 'grammar') {
          const { data: grammarReviews } = await supabase
            .from('gwc_grammar_reviews')
            .select('*')
            .eq('session_id', sessionId)
            .lte('next_review_at', now)
            .order('next_review_at', { ascending: true })
            .limit(50)

          if (grammarReviews && grammarReviews.length > 0) {
            const topicIds = [...new Set(grammarReviews.map((r: { topic_id: string }) => r.topic_id))]
            const [{ data: topics }, { data: allSentences }] = await Promise.all([
              supabase.from('gwc_grammar_topics').select('*').in('id', topicIds),
              supabase.from('gwc_grammar_sentences').select('*').in('topic_id', topicIds).order('sort_order', { ascending: true }),
            ])

            const topicMap = Object.fromEntries((topics || []).map((t: GrammarTopic) => [t.id, t]))
            const sentsByTopic: Record<string, GrammarSentence[]> = {}
            for (const s of (allSentences as GrammarSentence[] || [])) {
              if (!sentsByTopic[s.topic_id]) sentsByTopic[s.topic_id] = []
              sentsByTopic[s.topic_id].push(s)
            }

            for (const r of grammarReviews) {
              const topic = topicMap[r.topic_id]
              if (!topic) continue
              const sents = sentsByTopic[r.topic_id] || []
              if (sents.length === 0) continue
              const nextIdx = ((r.last_sentence_idx ?? -1) + 1) % sents.length
              const sentence = sents[nextIdx]
              built.push({
                kind: 'grammar' as const,
                reviewId: r.id,
                topic,
                sentence,
                srsLevel: r.repetitions ?? 0,
              })
            }
          }
        }

        // ── Vocab reviews — one card per word, sentences rotate through all cases ──
        if (typeFilter === 'all' || typeFilter === 'vocab_new') {
          const { data: vocabReviews } = await supabase
            .from('gwc_vocab_reviews')
            .select('*')
            .eq('session_id', sessionId)
            .lte('next_review_at', now)
            .order('next_review_at', { ascending: true })
            .limit(50)

          if (vocabReviews && vocabReviews.length > 0) {
            const vocabIds = vocabReviews.map((r: { vocab_id: string }) => r.vocab_id)

            const [{ data: vocabs }, { data: vocabSentences }] = await Promise.all([
              supabase.from('gwc_vocab').select('*').in('id', vocabIds),
              supabase.from('gwc_vocab_sentences').select('*').in('vocab_id', vocabIds).order('sort_order', { ascending: true }),
            ])

            const vocabMap = Object.fromEntries((vocabs || []).map((v: GwcVocab) => [v.id, v]))
            const sentPool: Record<string, GwcVocabSentence[]> = {}
            for (const s of (vocabSentences as GwcVocabSentence[] || [])) {
              if (!sentPool[s.vocab_id]) sentPool[s.vocab_id] = []
              sentPool[s.vocab_id].push(s)
            }

            for (const r of vocabReviews) {
              const vocab = vocabMap[r.vocab_id]
              if (!vocab) continue
              const pool = sentPool[r.vocab_id] || []
              if (pool.length === 0) continue
              const idx = (r.last_sentence_idx ?? 0) % pool.length
              built.push({
                kind: 'vocab_new' as const,
                reviewId: r.id,
                vocab,
                sentence: pool[idx],
                lastSentenceIdx: r.last_sentence_idx ?? 0,
                srsLevel: r.repetitions ?? 0,
              })
            }
          }
        }

        // Shuffle vocab/grammar together for variety
        setCards(built)
      } catch (e) {
        setError('Could not load reviews.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [typeFilter])

  async function handleResult(wasCorrect: boolean) {
    const card = cards[index]
    const sessionId = getOrCreateSessionId()

    const newCorrect  = wasCorrect ? correct + 1 : correct
    const newMistakes = wasCorrect ? mistakes : mistakes + 1

    // Bunpro SRS: pass current SRS level (from repetitions column)
    const srs = calculateNextReview(wasCorrect, card.srsLevel)
    const nextAt = new Date(Date.now() + srs.intervalHours * 3_600_000).toISOString()
    const now = new Date().toISOString()

    if (card.kind === 'grammar') {
      const { data: cur } = await supabase
        .from('gwc_grammar_reviews')
        .select('total_reviews, correct_reviews, correct_streak, last_sentence_idx')
        .eq('id', card.reviewId)
        .single()

      const newStreak = wasCorrect ? (cur?.correct_streak ?? 0) + 1 : 0
      // Advance sentence index
      const { data: sents } = await supabase
        .from('gwc_grammar_sentences')
        .select('id')
        .eq('topic_id', card.topic.id)
        .order('sort_order', { ascending: true })
      const sentCount = sents?.length ?? 1
      const nextSentIdx = ((cur?.last_sentence_idx ?? -1) + 1) % sentCount

      await supabase.from('gwc_grammar_reviews').update({
        reviewed_at:      now,
        next_review_at:   nextAt,
        ease_factor:      2.5,
        interval_days:    Math.ceil(srs.intervalDays),
        repetitions:      srs.newSrsLevel,
        last_sentence_idx: nextSentIdx,
        correct_streak:   newStreak,
        total_reviews:    (cur?.total_reviews ?? 0) + 1,
        correct_reviews:  (cur?.correct_reviews ?? 0) + (wasCorrect ? 1 : 0),
        updated_at:       now,
      }).eq('id', card.reviewId).eq('session_id', sessionId)

    } else if (card.kind === 'vocab_new') {
      const { data: cur } = await supabase
        .from('gwc_vocab_reviews')
        .select('total_reviews, correct_reviews, correct_streak')
        .eq('id', card.reviewId)
        .single()

      await supabase.from('gwc_vocab_reviews').update({
        next_review_at:    nextAt,
        ease_factor:       2.5,
        interval_days:     Math.ceil(srs.intervalDays),
        repetitions:       srs.newSrsLevel,
        last_sentence_idx: card.lastSentenceIdx + 1,  // advance rotation
        correct_streak:    wasCorrect ? ((cur?.correct_streak ?? 0) + 1) : 0,
        total_reviews:     (cur?.total_reviews   ?? 0) + 1,
        correct_reviews:   (cur?.correct_reviews ?? 0) + (wasCorrect ? 1 : 0),
        updated_at:        now,
      }).eq('id', card.reviewId).eq('session_id', sessionId)
    }

    if (wasCorrect) setCorrect(newCorrect); else setMistakes(newMistakes)

    if (index + 1 >= cards.length) {
      const xpGained = newCorrect * XP_CORRECT_REVIEW + newMistakes * XP_WRONG_REVIEW
      await awardXPAndUpdateStreak(sessionId, xpGained)
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9b98b0]">Loading reviews…</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-[#e8e6f0] font-bold mb-2">Could not load reviews</p>
          <p className="text-[#9b98b0] text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#7c6df2] text-white font-bold">Back</Link>
        </div>
      </div>
    )
  }
  if (done)             return <CompletionScreen total={cards.length} correct={correct} />
  if (cards.length === 0) return <EmptyState />

  return (
    <ReviewCardView
      key={cards[index].reviewId}
      card={cards[index]}
      cardNumber={index + 1}
      total={cards.length}
      mistakes={mistakes}
      onResult={handleResult}
    />
  )
}

// ─── Exported Page (wraps inner in Suspense for useSearchParams) ──────────────

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReviewPageInner />
    </Suspense>
  )
}
