'use client'

import Link from 'next/link'

// Shared vocab type used in both learn and review pages
export interface VocabInfoData {
  id: string
  slug: string
  word: string
  type: string
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
  comparative: string | null
  superlative: string | null
}

const CASE_LABEL: Record<string, string> = {
  NOMINATIV: 'Nominative',
  AKKUSATIV: 'Accusative',
  DATIV:     'Dative',
  GENITIV:   'Genitive',
}
const CASE_COLOR: Record<string, string> = {
  NOMINATIV: 'bg-gwc-accent/15 border-gwc-accent/30 text-gwc-accent-soft',
  AKKUSATIV: 'bg-[#3bd395]/10 border-[#3bd395]/30 text-[#3bd395]',
  DATIV:     'bg-[#ffa550]/10 border-[#ffa550]/30 text-[#ffa550]',
  GENITIV:   'bg-[#ffc850]/10 border-[#ffc850]/30 text-[#ffc850]',
}

export function VocabInfoBody({
  vocab,
  grammaticalCase,
  showLink = true,
}: {
  vocab: VocabInfoData
  grammaticalCase?: string | null
  showLink?: boolean
}) {
  const isNoun = vocab.article != null
  const isAdj  = vocab.type === 'ADJEKTIV'

  const declRows = isNoun ? [
    { key: 'NOMINATIV', sg: vocab.nom_sg, pl: vocab.nom_pl },
    { key: 'AKKUSATIV', sg: vocab.akk_sg, pl: vocab.akk_pl },
    { key: 'DATIV',     sg: vocab.dat_sg, pl: vocab.dat_pl },
    { key: 'GENITIV',   sg: vocab.gen_sg, pl: vocab.gen_pl },
  ].filter(r => r.sg || r.pl) : []

  return (
    <div className="space-y-4">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        {vocab.article && (
          <p className="text-gwc-accent text-xs font-bold uppercase tracking-widest mb-1">
            {vocab.article} · Noun
          </p>
        )}
        <p className="text-2xl font-extrabold text-gwc-text">
          {vocab.article
            ? <><span className="text-gwc-muted font-normal">{vocab.article} </span>{vocab.word}</>
            : vocab.word
          }
        </p>
        {vocab.plural && (
          <p className="text-gwc-muted text-xs mt-0.5">
            Plural: <span className="text-[#c8c5d8]">die {vocab.plural}</span>
          </p>
        )}
        <p className="text-sm text-gwc-muted mt-1">🇬🇧 {vocab.translation_en}</p>

        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-gwc-accent/15 text-gwc-accent-soft px-2.5 py-1 rounded-full">
            {vocab.level}
          </span>
          {vocab.type && (
            <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-white/5 text-gwc-muted px-2.5 py-1 rounded-full capitalize">
              {vocab.type.charAt(0) + vocab.type.slice(1).toLowerCase()}
            </span>
          )}
          {vocab.frequency_rank && (
            <span className="text-[0.65rem] font-bold tracking-widest uppercase bg-[#3bd395]/10 text-[#3bd395] px-2.5 py-1 rounded-full">
              ⚡ Rank #{vocab.frequency_rank}
            </span>
          )}
          {grammaticalCase && (
            <span className={`text-[0.65rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${CASE_COLOR[grammaticalCase] ?? 'bg-white/5 border-white/10 text-gwc-muted'}`}>
              {CASE_LABEL[grammaticalCase] ?? grammaticalCase}
            </span>
          )}
        </div>
      </div>

      {/* ── Explanation + Usage Notes ─────────────────────────────────── */}
      <div className="bg-gwc-panel border border-white/5 rounded-2xl p-5">
        <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-2">
          Meaning & Explanation
        </p>
        <p className="text-sm text-[#c8c5d8] leading-relaxed">{vocab.explanation_en}</p>
        {vocab.usage_notes && (
          <p className="text-xs text-gwc-muted leading-relaxed mt-3 pt-3 border-t border-white/5">
            💡 <strong className="text-gwc-text">Usage:</strong> {vocab.usage_notes}
          </p>
        )}
      </div>

      {/* ── Fun Fact ──────────────────────────────────────────────────── */}
      {vocab.fun_fact && (
        <div className="bg-gradient-to-br from-gwc-accent/10 to-gwc-accent/5 border border-gwc-accent/20 rounded-2xl p-5">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-accent mb-2">Fun Fact</p>
          <p className="text-sm text-[#c8c5d8] leading-relaxed">{vocab.fun_fact}</p>
        </div>
      )}

      {/* ── Declension table (Nouns) ──────────────────────────────────── */}
      {isNoun && declRows.length > 0 && (
        <div className="bg-gwc-panel border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted">Declension</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted py-2 px-5">Case</th>
                <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted py-2 px-5">Singular</th>
                <th className="text-left text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted py-2 px-5">Plural</th>
              </tr>
            </thead>
            <tbody>
              {declRows.map(({ key, sg, pl }) => (
                <tr key={key} className={`border-t border-white/5 ${grammaticalCase === key ? 'bg-gwc-accent/8' : ''}`}>
                  <td className={`py-2.5 px-5 text-xs font-bold ${grammaticalCase === key ? 'text-gwc-accent-soft' : 'text-[#c084fc]'}`}>
                    {CASE_LABEL[key]}
                  </td>
                  <td className="py-2.5 px-5 text-gwc-text font-medium">{sg ?? '—'}</td>
                  <td className="py-2.5 px-5 text-gwc-text">{pl ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Adjective forms (Comparative / Superlative) ───────────────── */}
      {isAdj && (vocab.comparative || vocab.superlative) && (
        <div className="bg-gwc-panel border border-white/5 rounded-2xl p-5">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted mb-4">Forms</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[0.65rem] text-gwc-muted uppercase tracking-wider mb-1">Positive</p>
              <p className="text-gwc-text font-semibold text-sm">{vocab.word}</p>
            </div>
            {vocab.comparative && (
              <div>
                <p className="text-[0.65rem] text-gwc-muted uppercase tracking-wider mb-1">Comparative</p>
                <p className="text-gwc-text font-semibold text-sm">{vocab.comparative}</p>
              </div>
            )}
            {vocab.superlative && (
              <div>
                <p className="text-[0.65rem] text-gwc-muted uppercase tracking-wider mb-1">Superlative</p>
                <p className="text-gwc-text font-semibold text-sm">{vocab.superlative}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Synonyms + Related words ──────────────────────────────────── */}
      {(vocab.synonyms || vocab.related_words) && (
        <div className="bg-gwc-panel border border-white/5 rounded-2xl p-5 space-y-3">
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-gwc-muted">Related Words</p>
          {vocab.synonyms && (
            <div>
              <p className="text-xs text-gwc-muted mb-1.5">Synonyms</p>
              <div className="flex flex-wrap gap-2">
                {vocab.synonyms.split(',').map(s => (
                  <span key={s} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {vocab.related_words && (
            <div>
              <p className="text-xs text-gwc-muted mb-1.5">Related forms</p>
              <div className="flex flex-wrap gap-2">
                {vocab.related_words.split(',').map(r => (
                  <span key={r} className="bg-white/5 border border-white/8 text-[#c8c5d8] text-xs px-3 py-1.5 rounded-lg">
                    {r.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Link to full page ─────────────────────────────────────────── */}
      {showLink && (
        <Link
          href={`/vocab/${vocab.slug}`}
          className="block text-center text-xs text-gwc-accent hover:text-gwc-accent-soft transition-colors pt-1"
        >
          Open full word page for „{vocab.word}" →
        </Link>
      )}
    </div>
  )
}
