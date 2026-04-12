'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { VocabWord, VocabSentence, GrammarResource } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { SrsProgressCard } from '@/components/SrsProgressCard'
import type { SrsReviewData } from '@/components/SrsProgressCard'
import AudioButton from '@/components/AudioButton'

type Tab = 'details' | 'sentences' | 'resources'
type GrammaticalCase = 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// ─── Sub-components ───────────────────────────────────────────────────────────


function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-[#7c6df2] text-white' : 'text-[#9b98b0] hover:text-[#e8e6f0]'
      }`}
    >
      {label}
    </button>
  )
}

function CaseBadge({ cas }: { cas: GrammaticalCase }) {
  const styles: Record<GrammaticalCase, string> = {
    NOMINATIV: 'bg-[#7c6df2]/15 text-[#9b8cf5]',
    AKKUSATIV: 'bg-[#3bd395]/10 text-[#3bd395]',
    DATIV:     'bg-[#ffa550]/10 text-[#ffa550]',
    GENITIV:   'bg-[#ffc850]/10 text-[#ffc850]',
  }
  const labels: Record<GrammaticalCase, string> = {
    NOMINATIV: 'Nominative',
    AKKUSATIV: 'Accusative',
    DATIV:     'Dative',
    GENITIV:   'Genitive',
  }
  return (
    <span className={`text-[0.68rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${styles[cas]}`}>
      {labels[cas]}
    </span>
  )
}

function highlightCloze(sentence: string, cloze: string) {
  const idx = sentence.toLowerCase().indexOf(cloze.toLowerCase())
  if (idx === -1) return <span>{sentence}</span>
  return (
    <>
      {sentence.slice(0, idx)}
      <span className="text-[#c084fc] font-bold">{sentence.slice(idx, idx + cloze.length)}</span>
      {sentence.slice(idx + cloze.length)}
    </>
  )
}

function SentenceCard({ sentence }: { sentence: VocabSentence }) {
  return (
    <div className="bg-[#1a1830] border border-white/5 rounded-2xl px-5 py-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[#e8e6f0] text-[0.95rem] font-medium leading-snug">
          {highlightCloze(sentence.sentence_de, sentence.cloze_word)}
        </p>
        <p className="text-[#9b98b0] text-[0.8rem] mt-1">{sentence.sentence_en}</p>
      </div>
      <AudioButton filename={sentence.audio_file} size="sm" />
    </div>
  )
}

// ─── Resource helpers ─────────────────────────────────────────────────────────

function parseResources(raw: GrammarResource[] | null | undefined): GrammarResource[] {
  if (!raw) return []
  return raw
}

function ResourceCard({ resource }: { resource: GrammarResource }) {
  const icons:      Record<string, string> = { youtube: '▶', tiktok: '♪', website: '🔗' }
  const colors:     Record<string, string> = {
    youtube: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40',
    tiktok:  'bg-[#9b8cf5]/10 border-[#9b8cf5]/20 hover:border-[#9b8cf5]/40',
    website: 'bg-white/5 border-white/10 hover:border-white/20',
  }
  const iconColors: Record<string, string> = {
    youtube: 'text-red-400 bg-red-500/15',
    tiktok:  'text-[#9b8cf5] bg-[#9b8cf5]/15',
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

export default function VocabDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [word, setWord]           = useState<VocabWord | null>(null)
  const [sentences, setSentences] = useState<VocabSentence[]>([])
  const [tab, setTab]             = useState<Tab>('details')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [srsData, setSrsData]     = useState<SrsReviewData | null>(null)
  const [addState, setAddState]   = useState<'idle' | 'adding' | 'added'>('idle')

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()

        // Load word
        const { data: wordData, error: wErr } = await supabase
          .from('gwc_vocab')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()
        if (wErr) throw wErr
        if (!wordData) { setError('Word not found.'); setLoading(false); return }
        setWord(wordData as VocabWord)

        // Load sentences — only up to the word's own level
        // (A1 noun → A1 sentences only; no user-level gating needed)
        const wordLevelIdx = LEVEL_ORDER.indexOf(wordData.level ?? 'C2')
        const allowedLevels = LEVEL_ORDER.slice(0, wordLevelIdx + 1)
        const { data: sentData } = await supabase
          .from('gwc_vocab_sentences')
          .select('*')
          .eq('vocab_id', wordData.id)
          .in('min_level', allowedLevels)
          .order('sort_order', { ascending: true })
        setSentences((sentData || []) as VocabSentence[])

        // Load SRS review data
        const { data: reviewData } = await supabase
          .from('gwc_vocab_reviews')
          .select('repetitions, next_review_at, created_at, total_reviews, correct_reviews')
          .eq('session_id', sessionId)
          .eq('vocab_id', wordData.id)
          .maybeSingle()
        if (reviewData) setSrsData(reviewData as SrsReviewData)

      } catch (e) {
        console.error(e)
        setError('Could not load this word.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  async function handleAddToReviews() {
    if (!word || srsData) return
    setAddState('adding')
    const sessionId = getOrCreateSessionId()
    const now = new Date().toISOString()
    await supabase.from('gwc_vocab_reviews').upsert({
      session_id:       sessionId,
      vocab_id:         word.id,
      repetitions:      0,
      interval_days:    1,
      ease_factor:      2.5,
      next_review_at:   now,
      last_sentence_idx: 0,
      correct_streak:   0,
      total_reviews:    0,
      correct_reviews:  0,
    }, { onConflict: 'session_id,vocab_id', ignoreDuplicates: true })
    setSrsData({ repetitions: 0, next_review_at: now, created_at: now, total_reviews: 0, correct_reviews: 0 })
    setAddState('added')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !word) return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-[#e8e6f0] font-bold text-lg mb-2">{error || 'Word not found'}</p>
        <Link href="/vocab" className="text-[#7c6df2] text-sm hover:text-[#9b8cf5]">← Back to vocabulary</Link>
      </div>
    </div>
  )

  const isNoun = word.type === 'NOMEN'

  // Group sentences by case (or all together for non-nouns)
  const sentencesByCase = isNoun
    ? (['NOMINATIV', 'AKKUSATIV', 'DATIV', 'GENITIV'] as GrammaticalCase[]).reduce((acc, cas) => {
        acc[cas] = sentences.filter(s => s.grammatical_case === cas)
        return acc
      }, {} as Record<GrammaticalCase, VocabSentence[]>)
    : null

  const allSentences = sentences // for non-nouns

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-2xl mx-auto px-5 py-8 pb-20">

        {/* ── Back ─────────────────────────────────────────────────── */}
        <Link href="/vocab" className="inline-flex items-center gap-1.5 text-[#9b98b0] text-sm hover:text-[#e8e6f0] transition-colors mb-6">
          ← Vocabulary
        </Link>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            {word.article && (
              <p className="text-[#7c6df2] text-sm font-bold uppercase tracking-widest mb-1">
                {word.article} · {word.type === 'NOMEN' ? 'Noun' : word.type.charAt(0) + word.type.slice(1).toLowerCase()}
              </p>
            )}
            <h1 className="text-[2.2rem] font-extrabold text-[#e8e6f0] leading-tight">{word.word}</h1>
            {word.plural && (
              <p className="text-[#9b98b0] text-sm mt-1">Plural: <span className="text-[#e8e6f0]">die {word.plural}</span></p>
            )}
            <p className="text-[#9b98b0] text-base mt-2">🇬🇧 {word.translation_en}</p>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <span className="text-[0.72rem] font-bold tracking-widest uppercase bg-[#7c6df2]/15 text-[#9b8cf5] px-3 py-1 rounded-full">
                {word.level}
              </span>
              {word.frequency_rank && (
                <span className="text-[0.72rem] font-bold tracking-widest uppercase bg-[#3bd395]/10 text-[#3bd395] px-3 py-1 rounded-full">
                  ⚡ Rank #{word.frequency_rank}
                </span>
              )}
            </div>
          </div>
          <AudioButton filename={word.audio_file} size="lg" />
        </div>

        {/* ── Add to Reviews button ────────────────────────────────── */}
        <div className="mb-6">
          <button
            onClick={handleAddToReviews}
            disabled={!!srsData || addState === 'adding'}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              srsData
                ? 'bg-[#3bd395]/10 text-[#3bd395] border border-[#3bd395]/20 cursor-default'
                : addState === 'adding'
                ? 'bg-[#7c6df2]/50 text-white cursor-wait'
                : 'bg-[#7c6df2] text-white hover:bg-[#9b8cf5] shadow-lg shadow-[#7c6df2]/25'
            }`}
          >
            {srsData ? '✓ In Reviews' : addState === 'adding' ? 'Adding…' : '+ Add to Reviews'}
          </button>
        </div>

        {/* ── SRS Progress ─────────────────────────────────────────── */}
        {srsData && (
          <div className="mb-6">
            <SrsProgressCard data={srsData} />
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-[#1a1830] p-1 rounded-2xl mb-6">
          <TabBtn label="Details"   active={tab === 'details'}   onClick={() => setTab('details')} />
          <TabBtn label="Sentences" active={tab === 'sentences'} onClick={() => setTab('sentences')} />
          {parseResources(word.resources).length > 0 && (
            <TabBtn
              label={`Resources (${parseResources(word.resources).length})`}
              active={tab === 'resources'}
              onClick={() => setTab('resources')}
            />
          )}
        </div>

        {/* ════════ DETAILS TAB ════════════════════════════════════ */}
        {tab === 'details' && (
          <div className="space-y-4">

            {/* Explanation */}
            <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
              <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-3">Meaning & Explanation</p>
              <p className="text-[#e8e6f0] text-sm leading-relaxed">{word.explanation_en}</p>
              {word.usage_notes && (
                <p className="text-[#9b98b0] text-xs leading-relaxed mt-3 pt-3 border-t border-white/5">
                  💡 <strong className="text-[#e8e6f0]">Usage:</strong> {word.usage_notes}
                </p>
              )}
            </div>

            {/* ── Noun: declension table + article overview ── */}
            {isNoun && (
              <>
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
                      {([
                        { label: 'Nominative', sg: word.nom_sg, pl: word.nom_pl },
                        { label: 'Accusative', sg: word.akk_sg, pl: word.akk_pl },
                        { label: 'Dative',     sg: word.dat_sg, pl: word.dat_pl },
                        { label: 'Genitive',   sg: word.gen_sg, pl: word.gen_pl },
                      ]).filter(r => r.sg || r.pl).map(({ label, sg, pl }) => (
                        <tr key={label} className="border-t border-white/5">
                          <td className="py-3 pr-4 font-bold text-[#c084fc] text-xs whitespace-nowrap">{label}</td>
                          <td className="py-3 pr-4 text-[#e8e6f0]">{sg || '—'}</td>
                          <td className="py-3 text-[#e8e6f0]">{pl || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                  <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-4">Articles</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[#9b98b0] pb-2 pr-3 w-10"></th>
                        <th className="text-left text-[#9b98b0] pb-2 pr-3">Definite</th>
                        <th className="text-left text-[#9b98b0] pb-2 pr-3">Indefinite</th>
                        <th className="text-left text-[#9b98b0] pb-2">Negation</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#e8e6f0]">
                      {word.nom_sg && <tr className="border-t border-white/5"><td className="py-2 pr-3 text-[#9b98b0] font-bold">Nom.</td><td className="py-2 pr-3">{word.nom_sg}</td><td className="py-2 pr-3">{word.nom_sg.replace(/^(der|die|das) /, 'ein ')}</td><td className="py-2">{word.nom_sg.replace(/^(der|die|das) /, 'kein ')}</td></tr>}
                      {word.akk_sg && <tr className="border-t border-white/5"><td className="py-2 pr-3 text-[#9b98b0] font-bold">Akk.</td><td className="py-2 pr-3">{word.akk_sg}</td><td className="py-2 pr-3">{word.akk_sg.replace(/^(den|die|das) /, 'einen ')}</td><td className="py-2">{word.akk_sg.replace(/^(den|die|das) /, 'keinen ')}</td></tr>}
                      {word.dat_sg && <tr className="border-t border-white/5"><td className="py-2 pr-3 text-[#9b98b0] font-bold">Dat.</td><td className="py-2 pr-3">{word.dat_sg}</td><td className="py-2 pr-3">{word.dat_sg.replace(/^(dem|der) /, 'einem ')}</td><td className="py-2">{word.dat_sg.replace(/^(dem|der) /, 'keinem ')}</td></tr>}
                      {word.gen_sg && <tr className="border-t border-white/5"><td className="py-2 pr-3 text-[#9b98b0] font-bold">Gen.</td><td className="py-2 pr-3">{word.gen_sg}</td><td className="py-2 pr-3">{word.gen_sg.replace(/^(des|der) /, 'eines ')}</td><td className="py-2">{word.gen_sg.replace(/^(des|der) /, 'keines ')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Adjective: comparative + superlative ── */}
            {word.type === 'ADJEKTIV' && (word.comparative || word.superlative) && (
              <div className="bg-[#1a1830] border border-white/5 rounded-2xl p-5">
                <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#9b98b0] mb-4">Forms</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#9b98b0] mb-1">Positive</p>
                    <p className="text-[#e8e6f0] font-semibold">{word.word}</p>
                  </div>
                  {word.comparative && (
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#9b98b0] mb-1">Comparative</p>
                      <p className="text-[#e8e6f0] font-semibold">{word.comparative}</p>
                    </div>
                  )}
                  {word.superlative && (
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#9b98b0] mb-1">Superlative</p>
                      <p className="text-[#e8e6f0] font-semibold">{word.superlative}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fun Fact */}
            {word.fun_fact && (
              <div className="bg-gradient-to-br from-[#7c6df2]/10 to-[#7c6df2]/5 border border-[#7c6df2]/20 rounded-2xl p-5">
                <p className="text-[0.7rem] font-bold tracking-widest uppercase text-[#7c6df2] mb-2">Fun Fact</p>
                <p className="text-[#c8c5d8] text-sm leading-relaxed">{word.fun_fact}</p>
              </div>
            )}

            {/* Related Words */}
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
          </div>
        )}

        {/* ════════ RESOURCES TAB ══════════════════════════════════ */}
        {tab === 'resources' && (
          <div className="space-y-3">
            {parseResources(word.resources).map((r, i) => (
              <ResourceCard key={i} resource={r} />
            ))}
          </div>
        )}

        {/* ════════ SENTENCES TAB ══════════════════════════════════ */}
        {tab === 'sentences' && (
          <div className="space-y-6">
            {isNoun && sentencesByCase ? (
              (['NOMINATIV', 'AKKUSATIV', 'DATIV', 'GENITIV'] as GrammaticalCase[]).map(cas => {
                const caseSentences = sentencesByCase[cas]
                if (!caseSentences || caseSentences.length === 0) return null
                return (
                  <div key={cas}>
                    <div className="flex items-center gap-3 mb-3">
                      <CaseBadge cas={cas} />
                      <div className="flex-1 h-px bg-white/6" />
                    </div>
                    <div className="space-y-2.5">
                      {caseSentences.map(s => <SentenceCard key={s.id} sentence={s} />)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="space-y-2.5">
                {allSentences.map(s => <SentenceCard key={s.id} sentence={s} />)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
