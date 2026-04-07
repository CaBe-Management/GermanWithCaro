/**
 * Path definitions — the 3 predefined learn paths.
 * Path IDs are stored as TEXT in gwc_user_active_paths.path_id.
 * All item-fetching logic uses these IDs to determine what to serve.
 */

export interface PathDef {
  id: string          // stored in DB
  name: string        // display name
  level: string       // 'A1', 'A2', etc.
  icon: string        // emoji
  description: string
  type: 'mixed' | 'grammar' | 'vocab' | 'verb'
  badge: string       // short label shown next to level in dashboard
}

// The 3 predefined paths users can choose from (max 2 active at once)
export const ALL_PATHS: PathDef[] = [
  {
    id: 'caros-path-a1',
    name: "Caro's Path",
    level: 'A1',
    icon: '⭐',
    description: 'Recommended for beginners. Curated mix of essential A1 vocab and grammar in a logical teaching order.',
    type: 'mixed',
    badge: '[Mixed]',
  },
  {
    id: 'a1-grammar',
    name: 'A1 Grammar',
    level: 'A1',
    icon: '📝',
    description: 'All A1 grammar topics in order: verb conjugations, case system, and more.',
    type: 'grammar',
    badge: '[Grammar]',
  },
  {
    id: 'a1-vocabulary',
    name: 'A1 Vocabulary',
    level: 'A1',
    icon: '📚',
    description: 'All A1 vocabulary words ordered by frequency (most common words first).',
    type: 'vocab',
    badge: '[Vocab]',
  },
  {
    id: 'a1-verbs',
    name: 'A1 Verb Conjugation',
    level: 'A1',
    icon: '🔤',
    description: 'Master German verb conjugation across all tenses. Each verb is its own SRS card — tenses unlock as your level grows.',
    type: 'verb',
    badge: '[Verbs]',
  },
]

/** Look up a path definition by its ID string */
export function getPathById(id: string): PathDef | undefined {
  return ALL_PATHS.find(p => p.id === id)
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
