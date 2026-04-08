/**
 * Path definitions — all learn paths organized by type and level.
 * Path IDs are stored as TEXT in gwc_user_active_paths.path_id.
 *
 * filterByLevel: true  → path is built by querying gwc_words / gwc_grammar_topics /
 *                         gwc_verbs filtered by the `level` column, ordered by
 *                         frequenz_rang / sort_order / frequency_rank respectively.
 * filterByLevel: false → path uses explicit path_* position columns in the DB.
 */

export interface PathDef {
  id: string          // stored in DB
  name: string        // display name (without level — shown as "name · level" in UI)
  level: string       // 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  icon: string        // emoji
  description: string
  type: 'mixed' | 'grammar' | 'vocab' | 'verb'
  badge: string       // short label shown on card
  filterByLevel: boolean
}

// ─── Caro's Mixed Paths (vocab + grammar + verbs interleaved, per level) ───────

export const CAROS_PATHS: PathDef[] = [
  {
    id: 'caros-path-a1',
    name: "Caro's Path",
    level: 'A1',
    icon: '⭐',
    description: 'A curated mix of A1 vocabulary, grammar topics, and verb conjugation — the recommended starting point.',
    type: 'mixed',
    badge: 'Mixed',
    filterByLevel: true,
  },
  {
    id: 'caros-path-a2',
    name: "Caro's Path",
    level: 'A2',
    icon: '⭐',
    description: 'A curated mix of A2 vocabulary, grammar topics, and verb conjugation — build on your A1 foundation.',
    type: 'mixed',
    badge: 'Mixed',
    filterByLevel: true,
  },
  {
    id: 'caros-path-b1',
    name: "Caro's Path",
    level: 'B1',
    icon: '⭐',
    description: 'A curated mix of B1 vocabulary, grammar topics, and verb conjugation — reach conversational fluency.',
    type: 'mixed',
    badge: 'Mixed',
    filterByLevel: true,
  },
  {
    id: 'caros-path-b2',
    name: "Caro's Path",
    level: 'B2',
    icon: '⭐',
    description: 'A curated mix of B2 vocabulary, grammar topics, and verb conjugation — upper intermediate mastery.',
    type: 'mixed',
    badge: 'Mixed',
    filterByLevel: true,
  },
  {
    id: 'caros-path-c1',
    name: "Caro's Path",
    level: 'C1',
    icon: '⭐',
    description: 'A curated mix of C1 vocabulary, grammar topics, and verb conjugation — advanced proficiency.',
    type: 'mixed',
    badge: 'Mixed',
    filterByLevel: true,
  },
  {
    id: 'caros-path-c2',
    name: "Caro's Path",
    level: 'C2',
    icon: '⭐',
    description: 'A curated mix of C2 vocabulary, grammar topics, and verb conjugation — master-level German.',
    type: 'mixed',
    badge: 'Mixed',
    filterByLevel: true,
  },
]

// ─── Grammar Paths (all grammar topics for a level, by sort_order) ────────────

export const GRAMMAR_PATHS: PathDef[] = [
  {
    id: 'grammar-a1',
    name: 'Grammar',
    level: 'A1',
    icon: '📝',
    description: 'All A1 grammar topics in teaching order: verb conjugation, question words, cases, and more.',
    type: 'grammar',
    badge: 'Grammar',
    filterByLevel: true,
  },
  {
    id: 'grammar-a2',
    name: 'Grammar',
    level: 'A2',
    icon: '📝',
    description: 'All A2 grammar topics: past tense, adjective endings, two-way prepositions, and more.',
    type: 'grammar',
    badge: 'Grammar',
    filterByLevel: true,
  },
  {
    id: 'grammar-b1',
    name: 'Grammar',
    level: 'B1',
    icon: '📝',
    description: 'All B1 grammar topics: subjunctive, relative clauses, passive voice, and more.',
    type: 'grammar',
    badge: 'Grammar',
    filterByLevel: true,
  },
  {
    id: 'grammar-b2',
    name: 'Grammar',
    level: 'B2',
    icon: '📝',
    description: 'All B2 grammar topics: Konjunktiv I, advanced subordination, and nuanced structures.',
    type: 'grammar',
    badge: 'Grammar',
    filterByLevel: true,
  },
  {
    id: 'grammar-c1',
    name: 'Grammar',
    level: 'C1',
    icon: '📝',
    description: 'All C1 grammar topics: extended attributes, complex clause structures, and more.',
    type: 'grammar',
    badge: 'Grammar',
    filterByLevel: true,
  },
  {
    id: 'grammar-c2',
    name: 'Grammar',
    level: 'C2',
    icon: '📝',
    description: 'All C2 grammar topics: rare forms, stylistic nuance, and complete mastery.',
    type: 'grammar',
    badge: 'Grammar',
    filterByLevel: true,
  },
]

// ─── Vocab Paths (gwc_words filtered by level, ordered by frequenz_rang) ──────

export const VOCAB_PATHS: PathDef[] = [
  {
    id: 'vocab-a1',
    name: 'Vocabulary',
    level: 'A1',
    icon: '📚',
    description: 'All A1 vocabulary words ordered by frequency — the most common words first.',
    type: 'vocab',
    badge: 'Vocab',
    filterByLevel: true,
  },
  {
    id: 'vocab-a2',
    name: 'Vocabulary',
    level: 'A2',
    icon: '📚',
    description: 'All A2 vocabulary words ordered by frequency — essential everyday language.',
    type: 'vocab',
    badge: 'Vocab',
    filterByLevel: true,
  },
  {
    id: 'vocab-b1',
    name: 'Vocabulary',
    level: 'B1',
    icon: '📚',
    description: 'All B1 vocabulary words ordered by frequency — expand your active vocabulary.',
    type: 'vocab',
    badge: 'Vocab',
    filterByLevel: true,
  },
  {
    id: 'vocab-b2',
    name: 'Vocabulary',
    level: 'B2',
    icon: '📚',
    description: 'All B2 vocabulary words ordered by frequency — upper-intermediate expression.',
    type: 'vocab',
    badge: 'Vocab',
    filterByLevel: true,
  },
  {
    id: 'vocab-c1',
    name: 'Vocabulary',
    level: 'C1',
    icon: '📚',
    description: 'All C1 vocabulary words ordered by frequency — sophisticated and precise language.',
    type: 'vocab',
    badge: 'Vocab',
    filterByLevel: true,
  },
  {
    id: 'vocab-c2',
    name: 'Vocabulary',
    level: 'C2',
    icon: '📚',
    description: 'All C2 vocabulary words ordered by frequency — complete mastery of German vocabulary.',
    type: 'vocab',
    badge: 'Vocab',
    filterByLevel: true,
  },
]

// ─── Verb Paths (gwc_verbs filtered by level, ordered by frequency_rank) ──────

export const VERB_PATHS: PathDef[] = [
  {
    id: 'verbs-a1',
    name: 'Verb Conjugation',
    level: 'A1',
    icon: '🔤',
    description: 'Master A1 verbs across all tenses. Tenses unlock as your level grows.',
    type: 'verb',
    badge: 'Verbs',
    filterByLevel: true,
  },
  {
    id: 'verbs-a2',
    name: 'Verb Conjugation',
    level: 'A2',
    icon: '🔤',
    description: 'Master A2 verbs: Perfekt, separable verbs, and modal constructions.',
    type: 'verb',
    badge: 'Verbs',
    filterByLevel: true,
  },
  {
    id: 'verbs-b1',
    name: 'Verb Conjugation',
    level: 'B1',
    icon: '🔤',
    description: 'Master B1 verbs: Präteritum, Futur I, and complex conjugation patterns.',
    type: 'verb',
    badge: 'Verbs',
    filterByLevel: true,
  },
  {
    id: 'verbs-b2',
    name: 'Verb Conjugation',
    level: 'B2',
    icon: '🔤',
    description: 'Master B2 verbs: Konjunktiv II, Plusquamperfekt, and advanced tenses.',
    type: 'verb',
    badge: 'Verbs',
    filterByLevel: true,
  },
  {
    id: 'verbs-c1',
    name: 'Verb Conjugation',
    level: 'C1',
    icon: '🔤',
    description: 'Master C1 verbs: Futur II, rare tenses, and nuanced verb usage.',
    type: 'verb',
    badge: 'Verbs',
    filterByLevel: true,
  },
  {
    id: 'verbs-c2',
    name: 'Verb Conjugation',
    level: 'C2',
    icon: '🔤',
    description: 'Master C2 verbs: complete conjugation mastery across all tenses and forms.',
    type: 'verb',
    badge: 'Verbs',
    filterByLevel: true,
  },
]

// ─── ALL_PATHS (flat list — used for lookup, navbar, path detail page) ─────────

export const ALL_PATHS: PathDef[] = [
  ...CAROS_PATHS,
  ...GRAMMAR_PATHS,
  ...VOCAB_PATHS,
  ...VERB_PATHS,
]

// Legacy aliases — kept so existing gwc_user_active_paths rows still resolve.
// These IDs might be stored in the DB for existing users.
const LEGACY_PATHS: PathDef[] = [
  { id: 'a1-grammar',    name: 'A1 Grammar',          level: 'A1', icon: '📝', type: 'grammar', badge: 'Grammar', filterByLevel: true,
    description: 'All A1 grammar topics in teaching order.' },
  { id: 'a1-vocabulary', name: 'A1 Vocabulary',        level: 'A1', icon: '📚', type: 'vocab',   badge: 'Vocab',   filterByLevel: true,
    description: 'All A1 vocabulary words ordered by frequency.' },
  { id: 'a1-verbs',      name: 'A1 Verb Conjugation',  level: 'A1', icon: '🔤', type: 'verb',    badge: 'Verbs',   filterByLevel: true,
    description: 'Master A1 verb conjugation across all tenses.' },
]

export const ALL_PATHS_WITH_LEGACY: PathDef[] = [...ALL_PATHS, ...LEGACY_PATHS]

/** Look up a path definition by its ID string (searches all paths including legacy) */
export function getPathById(id: string): PathDef | undefined {
  return ALL_PATHS_WITH_LEGACY.find(p => p.id === id)
}

// ─── Level helpers ─────────────────────────────────────────────────────────────

export const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type Level = typeof ALL_LEVELS[number]

/** Color scheme for each level */
export const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; pill: string }> = {
  A1: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', pill: 'bg-emerald-500' },
  A2: { bg: 'bg-teal-500/20',    text: 'text-teal-300',    border: 'border-teal-500/30',    pill: 'bg-teal-500' },
  B1: { bg: 'bg-blue-500/20',    text: 'text-blue-300',    border: 'border-blue-500/30',    pill: 'bg-blue-500' },
  B2: { bg: 'bg-violet-500/20',  text: 'text-violet-300',  border: 'border-violet-500/30',  pill: 'bg-violet-500' },
  C1: { bg: 'bg-orange-500/20',  text: 'text-orange-300',  border: 'border-orange-500/30',  pill: 'bg-orange-500' },
  C2: { bg: 'bg-rose-500/20',    text: 'text-rose-300',    border: 'border-rose-500/30',    pill: 'bg-rose-500' },
}

/** Color scheme for each type */
export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  mixed:   { bg: 'bg-[#7c6df2]/20',  text: 'text-[#9b8cf5]' },
  grammar: { bg: 'bg-blue-500/15',   text: 'text-blue-300' },
  vocab:   { bg: 'bg-teal-500/15',   text: 'text-teal-300' },
  verb:    { bg: 'bg-orange-500/15', text: 'text-orange-300' },
}

/**
 * For the "mixed" Caro's Path, we interleave vocab and grammar.
 * This function returns a merged array alternating 3 vocab items
 * then 1 grammar item (then 3 vocab, etc.).
 */
export function interleaveItems<V, G>(
  vocabItems: V[],
  grammarItems: G[],
  vocabPerGrammar = 3
): Array<{ type: 'vocab'; item: V } | { type: 'grammar'; item: G }> {
  const result: Array<{ type: 'vocab'; item: V } | { type: 'grammar'; item: G }> = []
  let vi = 0
  let gi = 0

  while (vi < vocabItems.length || gi < grammarItems.length) {
    // Add up to vocabPerGrammar vocab items
    for (let i = 0; i < vocabPerGrammar && vi < vocabItems.length; i++, vi++) {
      result.push({ type: 'vocab', item: vocabItems[vi] })
    }
    // Add 1 grammar item
    if (gi < grammarItems.length) {
      result.push({ type: 'grammar', item: grammarItems[gi] })
      gi++
    }
  }

  return result
}
