'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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
  min_level: string; sort_order: number
}

type Tab = 'details' | 'conjugation' | 'sentences'
type GermanLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

const LEVEL_ORDER: GermanLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const ALL_TENSES = [
  'PRÄSENS',
  'PERFEKT',
  'PRÄTERITUM',
  'FUTUR I',
  'KONJUNKTIV II',
  'PLUSQUAMPERFEKT',
  'FUTUR II',
] as const

const TENSE_MIN_LEVEL: Record<string, GermanLevel> = {
  'PRÄSENS':       'A1',
  'PERFEKT':       'A2',
  'PRÄTERITUM':    'B1',
  'FUTUR I':       'B1',
  'KONJUNKTIV II': 'B2',
  'PLUSQUAMPERFEKT':'B2',
  'FUTUR II':      'C1',
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

const TENSE_COLORS: Record<string, string> = {
  'PRÄSENS':        'bg-[#7c6df2]/15 text-[#9b8cf5] border-[#7c6df2]/20',
  'PERFEKT':        'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  'PRÄTERITUM':     'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  'FUTUR I':        'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20',
  'KONJUNKTIV II':  'bg-[#ec4899]/10 text-[#f472b6] border-[#ec4899]/20',
  'PLUSQUAMPERFEKT':'bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20',
  'FUTUR II':       'bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/20',
}

const CAT_LABELS: Record<string, string> = {
  regular: 'Regular', irregular: 'Irregular', modal: 'Modal',
  separable: 'Separable', reflexive: 'Reflexive',
}

function levelGte(a: GermanLevel, b: GermanLevel) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b)
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

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        active ? 'bg-[#7c6df2] text-white' : 'text-[#9b98b0] hover:text-[#e8e6f0]'
      }`}
    >
      {label}
    </button>
  )
}

function TenseBadge({ tense }: { tense: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${TENSE_COLORS[tense] ?? 'bg-white/5 text-[#9b98b0] border-white/10'}`}>
      {TENSE_LABEL[tense] ?? tense}
    </span>
  )
}

function LevelGate({ minLevel }: { minLevel: GermanLevel }) {
  return (
    <span className="text-[0.68rem] font-bold tracking-widest uppercase text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded">
      Unlocks at {minLevel}
    </span>
  )
}

function ConjTable({ rows, locked }: {
  rows: { person: string; form: string | null }[]
  locked: boolean
}) {
  return (
    <table className={`w-full ${locked ? 'opacity-60' : ''}`}>
      <tbody>
        {rows.map(({ person, form }) => (
          <tr key={person} className="border-t border-white/5 first:border-0">
            <td className="py-3 px-5 text-[#9b98b0] text-sm w-32">{person}</td>
            <td className="py-3 px-5 text-[#e8e6f0] font-semibold">{form ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function VerbDetailPage() {
  const params   = useParams()
  const slug     = params.slug as string

  const [verb, setVerb]           = useState<VerbWord | null>(null)
  const [sentences, setSentences] = useState<VerbSentence[]>([])
  const [tab, setTab]             = useState<Tab>('details')
  const [loading, setLoading]     = useState(true)
  const [userLevel, setUserLevel] = useState<GermanLevel>('A1')

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('gwc_user_profiles')
        .select('german_level')
        .single()
      if (profile?.german_level) setUserLevel(profile.german_level as GermanLevel)

      const { data: verbData } = await supabase
        .from('gwc_verbs')
        .select('*')
        .eq('slug', slug)
        .single()
      if (!verbData) { setLoading(false); return }
      setVerb(verbData as VerbWord)

      const { data: sentData } = await supabase
        .from('gwc_verb_sentences')
        .select('*')
        .eq('verb_id', verbData.id)
        .order('sort_order', { ascending: true })
      setSentences((sentData || []) as VerbSentence[])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!verb) return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#9b98b0] mb-4">Verb not found.</p>
        <Link href="/verbs" className="text-[#7c6df2] hover:underline">← Back to Verbs</Link>
      </div>
    </div>
  )

  const sentencesByTense = ALL_TENSES.reduce<Record<string, VerbSentence[]>>((acc, t) => {
    acc[t] = sentences.filter(s => s.tense === t)
    return acc
  }, {})

  // Conjugation rows
  const praesRows = [
    { person: 'ich',       form: verb.praes_ich },
    { person: 'du',        form: verb.praes_du  },
    { person: 'er/sie/es', form: verb.praes_er  },
    { person: 'wir',       form: verb.praes_wir },
    { person: 'ihr',       form: verb.praes_ihr },
    { person: 'sie/Sie',   form: verb.praes_sie },
  ]
  const praetRows = [
    { person: 'ich',       form: verb.praet_ich },
    { person: 'du',        form: verb.praet_du  },
    { person: 'er/sie/es', form: verb.praet_er  },
    { person: 'wir',       form: verb.praet_wir },
    { person: 'ihr',       form: verb.praet_ihr },
    { person: 'sie/Sie',   form: verb.praet_sie },
  ]
  const konj2Rows = [
    { person: 'ich',       form: verb.konj2_ich },
    { person: 'du',        form: verb.konj2_du  },
    { person: 'er/sie/es', form: verb.konj2_er  },
    { person: 'wir',       form: verb.konj2_wir },
    { person: 'ihr',       form: verb.konj2_ihr },
    { person: 'sie/Sie',   form: verb.konj2_sie },
  ]
  // FUTUR I, Plusquamperfekt and Futur II are derived
  const futI_aux = ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden']
  const persons  = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']
  const futIRows = persons.map((p, i) => ({
    person: p,
    form:   `${futI_aux[i]} ${verb.word}`,
  }))
  // Plusquamperfekt: praet(auxiliary) + partizip_ii
  const plusqAux = verb.auxiliary === 'sein'
    ? ['war', 'warst', 'war', 'waren', 'wart', 'waren']
    : ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten']
  const plusqRows = persons.map((p, i) => ({
    person: p,
    form:   `${plusqAux[i]} ${verb.partizip_ii ?? '…'}`,
  }))
  // Futur II: werden (conj) + partizip_ii + auxiliary-infinitive
  const futII_auxInf = verb.auxiliary ?? 'haben'
  const futIIRows = persons.map((p, i) => ({
    person: p,
    form:   `${futI_aux[i]} ${verb.partizip_ii ?? '…'} ${futII_auxInf}`,
  }))

  const hasPraet = praetRows.some(r => r.form)
  const hasKonj2 = konj2Rows.some(r => r.form)

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Back */}
        <Link href="/verbs" className="text-[#9b98b0] hover:text-[#e8e6f0] text-sm transition-colors mb-6 inline-block">
          ← Verbs
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-[#7c6df2] mb-1">{verb.word}</h1>
              <p className="text-[#9b98b0] text-lg italic">{verb.translation_en}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#7c6df2]/10 text-[#9b8cf5] border border-[#7c6df2]/20">
                {CAT_LABELS[verb.category] ?? verb.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 text-[#9b98b0] border border-white/10">
                {verb.level}
              </span>
              {verb.auxiliary && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                  {verb.auxiliary} + {verb.partizip_ii}
                </span>
              )}
            </div>
          </div>
          <div className="mt-5">
            <Link
              href={`/verbs/${slug}/learn`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c6df2] text-white font-semibold hover:bg-[#9b8cf5] transition-colors text-sm"
            >
              Learn this verb →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1a1830] p-1 rounded-2xl mb-6">
          <TabBtn label="Details"     active={tab === 'details'}     onClick={() => setTab('details')} />
          <TabBtn label="Conjugation" active={tab === 'conjugation'} onClick={() => setTab('conjugation')} />
          <TabBtn label="Sentences"   active={tab === 'sentences'}   onClick={() => setTab('sentences')} />
        </div>

        {/* ════════ DETAILS ══════════════════════════════════════════ */}
        {tab === 'details' && (
          <div className="space-y-4">
            <div className="bg-[#1a1830] border border-white/5 rounded-2xl px-5 py-4">
              <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-2">About</p>
              <p className="text-[#e8e6f0] text-sm leading-relaxed">{verb.explanation_en}</p>
              {verb.usage_notes && (
                <p className="text-[#9b98b0] text-sm leading-relaxed mt-3 pt-3 border-t border-white/5">{verb.usage_notes}</p>
              )}
            </div>
            {verb.fun_fact && (
              <div className="bg-[#1a1830] border border-[#7c6df2]/15 rounded-2xl px-5 py-4">
                <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-2">✨ Fun Fact</p>
                <p className="text-[#e8e6f0] text-sm leading-relaxed">{verb.fun_fact}</p>
              </div>
            )}
            {(verb.synonyms || verb.related_words) && (
              <div className="bg-[#1a1830] border border-white/5 rounded-2xl px-5 py-4 space-y-3">
                {verb.synonyms && (
                  <div>
                    <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-1.5">Synonyms</p>
                    <div className="flex flex-wrap gap-2">
                      {verb.synonyms.split(',').map(s => (
                        <span key={s.trim()} className="px-2.5 py-1 bg-[#7c6df2]/10 text-[#9b8cf5] rounded-lg text-xs font-medium">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {verb.related_words && (
                  <div>
                    <p className="text-[#9b98b0] text-xs font-bold uppercase tracking-wider mb-1.5">Related</p>
                    <div className="flex flex-wrap gap-2">
                      {verb.related_words.split(',').map(s => (
                        <span key={s.trim()} className="px-2.5 py-1 bg-white/5 text-[#9b98b0] rounded-lg text-xs font-medium">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════ CONJUGATION ══════════════════════════════════════ */}
        {tab === 'conjugation' && (
          <div className="space-y-4">

            {/* A1 — Präsens */}
            <ConjBlock tense="PRÄSENS" userLevel={userLevel}>
              <ConjTable rows={praesRows} locked={false} />
            </ConjBlock>

            {/* A2 — Perfekt */}
            {verb.auxiliary && verb.partizip_ii && (
              <ConjBlock tense="PERFEKT" userLevel={userLevel}>
                <div className="px-5 py-3">
                  <p className="text-[#9b98b0] text-xs mb-1">Formation</p>
                  <p className="text-[#e8e6f0] font-semibold">{verb.auxiliary} + {verb.partizip_ii}</p>
                  <p className="text-[#9b98b0] text-xs mt-2">
                    ich {verb.auxiliary === 'haben' ? 'habe' : 'bin'} {verb.partizip_ii} · du {verb.auxiliary === 'haben' ? 'hast' : 'bist'} {verb.partizip_ii} · …
                  </p>
                </div>
              </ConjBlock>
            )}

            {/* B1 — Präteritum */}
            {hasPraet && (
              <ConjBlock tense="PRÄTERITUM" userLevel={userLevel}>
                <ConjTable rows={praetRows.filter(r => r.form)} locked={!levelGte(userLevel, 'B1')} />
              </ConjBlock>
            )}

            {/* B1 — Futur I */}
            <ConjBlock tense="FUTUR I" userLevel={userLevel}>
              <ConjTable rows={futIRows} locked={!levelGte(userLevel, 'B1')} />
            </ConjBlock>

            {/* B2 — Konjunktiv II */}
            {hasKonj2 ? (
              <ConjBlock tense="KONJUNKTIV II" userLevel={userLevel}>
                <ConjTable rows={konj2Rows} locked={!levelGte(userLevel, 'B2')} />
              </ConjBlock>
            ) : (
              <ConjBlock tense="KONJUNKTIV II" userLevel={userLevel}>
                <div className="px-5 py-3">
                  <p className="text-[#9b98b0] text-xs">würde + {verb.word}</p>
                  <p className="text-[#9b98b0] text-xs mt-1">ich würde {verb.word} · du würdest {verb.word} · …</p>
                </div>
              </ConjBlock>
            )}

            {/* B2 — Plusquamperfekt */}
            {verb.partizip_ii && (
              <ConjBlock tense="PLUSQUAMPERFEKT" userLevel={userLevel}>
                <ConjTable rows={plusqRows} locked={!levelGte(userLevel, 'B2')} />
              </ConjBlock>
            )}

            {/* C1 — Futur II */}
            {verb.partizip_ii && (
              <ConjBlock tense="FUTUR II" userLevel={userLevel}>
                <ConjTable rows={futIIRows} locked={!levelGte(userLevel, 'C1')} />
              </ConjBlock>
            )}

          </div>
        )}

        {/* ════════ SENTENCES ════════════════════════════════════════ */}
        {tab === 'sentences' && (
          <div className="space-y-6">
            {ALL_TENSES.map(tense => {
              const tenseSents = sentencesByTense[tense]
              if (!tenseSents || tenseSents.length === 0) return null
              const minLevel = TENSE_MIN_LEVEL[tense] as GermanLevel
              const unlocked = levelGte(userLevel, minLevel)
              return (
                <div key={tense} className={!unlocked ? 'opacity-50' : ''}>
                  <div className="flex items-center gap-3 mb-3">
                    <TenseBadge tense={tense} />
                    <div className="flex-1 h-px bg-white/6" />
                    {!unlocked ? <LevelGate minLevel={minLevel} /> : (
                      <span className="text-[0.68rem] font-bold tracking-widest uppercase text-[#9b98b0]">{minLevel}</span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {tenseSents.map(s => (
                      <div key={s.id} className="bg-[#1a1830] border border-white/5 rounded-2xl px-5 py-4">
                        <p className="text-[#6b6880] text-xs font-bold mb-1.5">{s.person}</p>
                        <p className="text-[#e8e6f0] text-[0.95rem] font-medium leading-snug">
                          {highlightCloze(s.sentence_de, s.cloze_word)}
                        </p>
                        <p className="text-[#9b98b0] text-[0.8rem] mt-1">{s.sentence_en}</p>
                      </div>
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

// ── Helper: conjugation section wrapper ──────────────────────────────────────
function ConjBlock({
  tense, userLevel, children,
}: {
  tense: string
  userLevel: GermanLevel
  children: React.ReactNode
}) {
  const minLevel = TENSE_MIN_LEVEL[tense] as GermanLevel
  const locked   = !levelGte(userLevel, minLevel)
  return (
    <div className={`bg-[#1a1830] border border-white/5 rounded-2xl overflow-hidden ${locked ? 'opacity-50' : ''}`}>
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <TenseBadge tense={tense} />
        {locked
          ? <LevelGate minLevel={minLevel} />
          : <span className="text-xs text-[#6b6880]">{minLevel}</span>
        }
      </div>
      {children}
    </div>
  )
}
