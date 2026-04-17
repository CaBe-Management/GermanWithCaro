# Prompt: Neuen Grammatik-Eintrag erstellen

Kopiere diesen Prompt und fülle die Felder aus. Dann gib ihn an Claude Code.

---

## Your task

Create a complete grammar entry for the topic **[TOPIC]** in the GWC v2 app.

Follow this order exactly:

> **Language:** All prompt instructions and Claude's responses are in English. Only the actual learning content uses German where specified (e.g. `sentence_de`, `cloze_word`) — everything else (field names, explanations, questions back to you) stays in English.

---

## Step 0 — Scan existing entries (ALWAYS first)

Before creating anything: query all existing grammar topics for the target level and check current path positions.

```sql
-- All topics at target level, sorted by sort_order
SELECT title, slug, sort_order, path_a1_grammar, path_caros_path
FROM gwc_grammar_topics
WHERE level = '[LEVEL]'
ORDER BY sort_order ASC;
```

**Goal:** Find the right teaching position for the new topic.
- Where does this topic fit in the logical teaching progression?
- Which `sort_order` values and path positions are already taken?
- Does the new topic belong before or after existing ones (e.g. W-Fragen before cases)?

**If no suitable gap exists:** shift existing entries to make room:

```sql
-- Example: make room at sort_order 30 (shift everything from 30 upward)
UPDATE gwc_grammar_topics
SET sort_order        = sort_order + 10,
    path_a1_grammar   = CASE WHEN path_a1_grammar  >= 30 THEN path_a1_grammar  + 10 ELSE path_a1_grammar  END,
    path_caros_path   = CASE WHEN path_caros_path  >= 30 THEN path_caros_path  + 10 ELSE path_caros_path  END
WHERE level = '[LEVEL]' AND sort_order >= 30;
```

Only then continue with Step 1.

---

## Step 1 — SQL Migration

Create the file:
`supabase/migrations/YYYYMMDD_grammar_[slug].sql`

### Required fields:

```
title:            [TITLE]           e.g. "W-Frage: wie?"
slug:             [SLUG]            e.g. "w-frage-wie"  (lowercase, hyphens, no special chars)
level:            [LEVEL]           A1 | A2 | B1 | B2 | C1 | C2
category:         [CATEGORY]        e.g. question_words | verb_conjugation | cases | adjectives | modal_verbs | word_order | negation
translation_en:   [TRANSLATION]     e.g. "How? (question word)"
explanation_en:   [EXPLANATION]     3–5 sentences in English, clear and natural
structure:        [STRUCTURE]       e.g. "Wie + verb + subject + ...?"
```

### Optional fields:

```
register_formal:   0–3   (0 = never used formally, 3 = very common formally)
register_standard: 0–3   (everyday speech)
register_casual:   0–3   (informal/colloquial)
fun_fact:          [FUN FACT]       Cultural, linguistic, or quirky note — 1–2 sentences
synonyms:          [SYNONYMS]       Comma-separated alternative forms
related_forms:     [RELATED]        e.g. "wo, wann, warum, wer, was" for W-Frage
resources:         [RESOURCES]      JSON array — see format below
```

### Path membership — how it works

Path membership for grammar topics uses two columns on `gwc_grammar_topics`:
- `path_a1_grammar` — position in the pure grammar path (e.g. `grammar-a1`)
- `path_caros_path` — position in the mixed path (e.g. `caros-path-a1`)

These columns require migration `20260407_grammar_add_paths.sql` to be run first (already done).

Set both values in the INSERT. `NULL` = not in that path.

| Field | Controls position in |
|-------|----------------------|
| `path_a1_grammar` | `grammar-[level]` path |
| `path_caros_path` | `caros-path-[level]` mixed path |

A topic with `path_a1_grammar = 5` and `path_caros_path = 5` will appear:
- **#5** in the **Grammar A1** path (`grammar-a1`)
- **#5** (grammar section) in **Caro's Path A1** (`caros-path-a1`)

**Assign `sort_order` carefully** — it determines the teaching order:
- Lower number = taught earlier
- Use logical teaching progression (e.g. W-Fragen before cases before subordinate clauses)
- Leave gaps (e.g. 10, 20, 30) so new topics can be inserted later
- Look at what topics already exist and pick a number that fits in the right teaching position

**Path overview for all levels:**

| Level | Grammar path | Mixed path |
|-------|-------------|------------|
| A1 | `grammar-a1` | `caros-path-a1` |
| A2 | `grammar-a2` | `caros-path-a2` |
| B1 | `grammar-b1` | `caros-path-b1` |
| B2 | `grammar-b2` | `caros-path-b2` |
| C1 | `grammar-c1` | `caros-path-c1` |
| C2 | `grammar-c2` | `caros-path-c2` |

### Resources format (JSONB):

Always set `resources = NULL`. Only add links when real content exists (own TikToks, YouTube videos, etc.).

When adding links later, the format is:
```json
[
  { "type": "youtube", "url": "https://...", "title": "...", "description": "..." },
  { "type": "tiktok",  "url": "https://...", "title": "..." },
  { "type": "website", "url": "https://...", "title": "..." }
]
```

---

## Step 2 — Sentences (10 total, rotating)

Grammar uses **one SRS card per topic** — all sentences rotate.
No case distinction. All sentences test the same grammar point.

Aim for **10 sentences** as the base. More is fine — e.g. add dialogue-style sentences on top of standalone ones to vary context.

**Rules:**
- `cloze_word` = the exact grammar form being tested (e.g. "Wie")
- Sentences must match the topic's level in vocabulary and complexity
- Vary the context: questions, responses, different subjects
- All 10 sentences should feel naturally different, not repetitive
- `sort_order`: 1–10

**Per sentence:**
```
sentence_de:    [GERMAN SENTENCE]
sentence_en:    [ENGLISH TRANSLATION]
cloze_word:     [EXACT WORD FORM IN SENTENCE]
highlight_en:   [EXACT ENGLISH WORD OR PHRASE TO HIGHLIGHT IN PURPLE]
sort_order:     [1–10]
audio_file:     NULL   (leave empty until recorded)
```

### `highlight_en` — purple highlight in English translation

The learn card shows the English translation below the German sentence.
One word or short phrase is highlighted in **purple** to help learners connect the cloze word to its English equivalent.

**Set `highlight_en` per sentence — not per topic.**

- It must be the **exact substring** of `sentence_en` (case-sensitive match)
- Choose the word(s) that directly correspond to the `cloze_word` in context
- If no single word is a clean match (e.g. the German has no direct 1:1 translation), pick the closest meaningful word

**Examples:**

| sentence_de | sentence_en | cloze_word | highlight_en |
|-------------|-------------|------------|--------------|
| Wie heißt du? | What is your name? | Wie | What |
| Wie alt bist du? | How old are you? | Wie | How old |
| Das schmeckt wie Schokolade. | That tastes like chocolate. | wie | like |
| Er arbeitet wie ein Profi. | He works like a pro. | wie | like |

> ⚠️ `highlight_en` is sentence-specific. Do not assume the same word works for all sentences —
> "Wie" means "How" in questions but "like/as" in comparisons.

---

### Grey placeholder in the cloze blank

The input blank shows **grey italic placeholder text** while empty.
This is derived automatically from the topic's `category` field:

| category value | placeholder shown |
|---------------|-------------------|
| `question_words` / title contains `W-Frage` | `question-word` |
| `verb_conjugation` | `verb form` |
| `article` / `artikel` | `article` |
| `adjectives` | `adjective` |
| `prepositions` | `preposition` |
| `modal_verbs` | `modal verb` |
| `pronouns` | `pronoun` |
| anything else | `answer` |

Make sure the `category` field is set correctly — it controls what the learner sees as a hint in the blank.

---

## Step 3 — TypeScript: update GrammarTopic interface

Ensure `lib/supabase.ts` includes these fields in `GrammarTopic`:

```typescript
export interface GrammarTopic {
  id: string
  title: string
  slug: string
  level: string
  category: string
  sort_order: number
  created_at: string
  translation_en: string | null
  explanation_en: string
  explanation_de: string | null
  structure: string | null
  register_formal: number | null
  register_standard: number | null
  register_casual: number | null
  fun_fact: string | null
  synonyms: string | null
  related_forms: string | null
  resources: GrammarResource[] | null
  audio_file: string | null
  // Path membership (NULL = not in path, number = position)
  path_a1_grammar: number | null
  path_caros_path: number | null
}
```

---

## SRS & Learn Queue Logic

### "Learned" = a `gwc_grammar_reviews` row exists for this topic.

**Learn queue** (new topics the user hasn't seen):
```sql
SELECT t.* FROM gwc_grammar_topics t
WHERE t.level <= [user.german_level]
AND NOT EXISTS (
  SELECT 1 FROM gwc_grammar_reviews gr
  WHERE gr.topic_id = t.id AND gr.session_id = [session_id]
)
ORDER BY t.sort_order ASC
LIMIT [daily_goal]
```

**Review queue** (due cards):
```sql
SELECT * FROM gwc_grammar_reviews
WHERE session_id = [session_id] AND next_review_at <= now()
ORDER BY next_review_at ASC
```

### First-time learning:
1. Show explanation slide (title, structure, register, explanation, fun fact)
2. First cloze sentence (sort_order = 1)
3. On completion → INSERT into `gwc_grammar_reviews`:
   - `last_sentence_idx = 0`, `next_review_at = now()`, SM-2 defaults
4. Topic disappears from learn queue permanently

### Each review:
1. Load all sentences for topic: `ORDER BY sort_order`
2. `next_idx = (last_sentence_idx + 1) % count`
3. Show sentences[next_idx] as cloze
4. Save: update `last_sentence_idx`, recalculate SM-2 fields

### SM-2 via `lib/srs.ts → calculateNextReview()`:
- Correct → interval grows, ease_factor nudge up
- Incorrect → interval resets to 1, ease_factor down (min 1.3)

---

## Step 3.5 — Present results for review

Before writing anything to the database or Excel file, present a full summary of all generated content.

Show:

- All topic fields: `title`, `slug`, `level`, `category`, `translation_en`, `explanation_en`, `structure`, `register_formal/standard/casual`, `fun_fact`, `synonyms`, `related_forms`, `path_a1_grammar`, `path_caros_path`
- All 10 sentences as a table: `sentence_de` | `sentence_en` | `cloze_word` | `highlight_en` | `sort_order` | `audio_filename`

Then ask:

> **What would you like to change before I write to the database and update audio_todo.xlsx?**

Only after explicit confirmation ("looks good", "go ahead", etc.) → execute the SQL migration (Step 1) and update `audio_todo.xlsx` (Step 4).

> **⚠️ Draft rule:** Every new `gwc_grammar_topics` entry must be inserted with `is_draft = true`. This hides it from all users except the admin account, so it can be tested in the live app before publishing. Only set `is_draft = false` when explicitly told the entry is ready to go live.

---

## Step 4 — Audio Tracking: update `audio_todo.xlsx`

After the SQL insert: open (or create) the file `audio_todo.xlsx` in the project root (`gwc_v2/audio_todo.xlsx`).

**Add one new row per sentence** (never overwrite existing rows — append only).

Columns:

| slug | type | sentence_de | audio_filename | recorded |
|------|------|-------------|---------------|----------|
| w-frage-wie | grammar | Wie heißt du? | w-frage-wie_1.mp3 | |

**Rules for `audio_filename`:**
- Grammar (no case distinction): `{slug}_{sort_order}.mp3`
- Example: `w-frage-wie_1.mp3`, `w-frage-wie_7.mp3`
- `recorded`: leave empty (will be checked off manually later)

**Important:**
- File must be saved in `.xlsx` format (not CSV)
- Header row only once at the top (do not repeat on each append)
- If the file does not exist yet → create it with header + rows
- If it already exists → append rows, keep existing header and data intact

---

## Notes

- Slug: lowercase, replace Umlauts (ü→ue, ä→ae, ö→oe, ß→ss), spaces → hyphens, remove `?!/`
- No emoji in SQL strings
- Check if `gwc_grammar_topics` / `gwc_grammar_sentences` exist before any CREATE TABLE
- Run `rm -rf .next` after schema changes
- The `path_a1_grammar` and `path_caros_path` migration (`20260407_grammar_add_paths.sql`) is already applied — columns exist
