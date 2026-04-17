# Prompt: Neuen Vokabel-Eintrag erstellen

Kopiere diesen Prompt und fülle die Felder aus. Dann gib ihn an Claude Code.

---

## Dein Auftrag

Erstelle einen vollständigen Vokabel-Eintrag für das Wort **[WORT]** in der GWC v2 App.

Folge exakt dieser Reihenfolge:

> **Language:** All prompt instructions and Claude's responses are in English. Only the actual learning content uses German where specified (e.g. `sentence_de`, `cloze_word`) — everything else (field names, explanations, questions back to you) stays in English.

---

## Schritt 0 — Bestehende Einträge scannen (IMMER zuerst)

Bevor irgendetwas erstellt wird: alle bestehenden Vocab-Einträge des gleichen Levels abfragen und die `frequency_rank`-Belegung prüfen.

```sql
-- Alle Wörter im Zielniveau, sortiert nach frequency_rank
SELECT word, slug, frequency_rank
FROM gwc_vocab
WHERE level = '[LEVEL]'
ORDER BY frequency_rank ASC;
```

**Ziel:** Den richtigen Platz für das neue Wort finden.
- Wo liegt das neue Wort in der deutschen Frequenzliste?
- Welche Ranks sind schon vergeben, wo sind Lücken?
- Passt `frequency_rank = [RANK]` in die Reihenfolge, oder muss er angepasst werden?

**Falls kein passender Platz frei ist:** Lücke schaffen — bestehende Einträge um +10 verschieben, damit das neue Wort sauber eingereiht werden kann:

```sql
-- Beispiel: Platz für rank 50 schaffen (alle ab 50 nach oben schieben)
UPDATE gwc_vocab
SET frequency_rank = frequency_rank + 10
WHERE level = '[LEVEL]' AND frequency_rank >= 50;
```

Erst danach mit Schritt 1 weitermachen.

---

## Schritt 1 — SQL Migration erstellen

Erstelle die Datei:
`supabase/migrations/YYYYMMDD_vocab_[slug].sql`

### Pflichtfelder (alle müssen ausgefüllt sein):

```
word:            [WORT]                     z.B. Hund
slug:            [slug]                     z.B. hund  (Kleinbuchstaben, Bindestriche statt Leerzeichen)
type:            [TYP]                      NOMEN | VERB | ADJEKTIV | AUSDRUCK | ADVERB | PRÄPOSITION
article:         [ARTIKEL]                  der | die | das  (nur bei NOMEN, sonst NULL)
plural:          [PLURAL]                   z.B. Hunde  (nur bei NOMEN, sonst NULL)
level:           [NIVEAU]                   A1 | A2 | B1 | B2 | C1 | C2
frequency_rank:  [RANK]                     Number, e.g. 450  (lower = more common in German)
translation_en:  [ÜBERSETZUNG EN]           z.B. dog
explanation_en:  [ERKLÄRUNG]               2–4 Sätze auf Englisch
```

### Optional fields:

```
usage_notes:     [USAGE NOTES]         When/how to use it? Formal vs. informal? Traps?
fun_fact:        [FUN FACT]            Cultural, linguistic, or quirky note — 1–3 sentences
synonyms:        [SYNONYMS]            Comma-separated, e.g. "Köter, Hundi, Tier"
related_words:   [RELATED WORDS]       e.g. "hündisch, Hundeleine, Welpe"
resources:       [RESOURCES]           JSON array of YouTube / TikTok / website links, e.g.:
                                       '[{"type":"youtube","url":"https://...","title":"...","description":"..."}]'
                                       type: "youtube" | "tiktok" | "website"
```

### Adjective forms (NUR bei ADJEKTIV):

```
comparative:     [KOMPARATIV]          z.B. "einfacher"         (always fill this for adjectives)
superlative:     [SUPERLATIV]          z.B. "am einfachsten"    (always fill this for adjectives)
```

> Both fields are required for every adjective — even A1 adjectives. They are displayed in a "Forms" table on the detail page alongside the base form.

### Path membership — how it works

Path membership for vocab is **automatic** based on the `level` field. No extra columns needed.

| Field | Controls position in |
|-------|----------------------|
| `frequency_rank` | `vocab-[level]` path **and** `caros-path-[level]` mixed path |

A word with `level = 'A1'` and `frequency_rank = 42` will appear:
- **#42** in the **Vocabulary A1** path (`vocab-a1`)  
- **#42** (vocab section) in **Caro's Path A1** (`caros-path-a1`)

**Assign `frequency_rank` carefully** — it determines how early the word appears in learning:
- Lower number = taught sooner (e.g. `frequenz_rang = 5` → 5th word)
- Use the German word frequency corpus as guide
- Leave a gap between entries (e.g. 10, 20, 30) so new words can be inserted later

**Path overview for all levels:**

| Level | Vocab path | Mixed path |
|-------|-----------|------------|
| A1 | `vocab-a1` | `caros-path-a1` |
| A2 | `vocab-a2` | `caros-path-a2` |
| B1 | `vocab-b1` | `caros-path-b1` |
| B2 | `vocab-b2` | `caros-path-b2` |
| C1 | `vocab-c1` | `caros-path-c1` |
| C2 | `vocab-c2` | `caros-path-c2` |

### Deklination (NUR bei NOMEN):

```
nom_sg:  [ARTIKEL + WORT]    z.B. der Hund
nom_pl:  [ARTIKEL + PLURAL]  z.B. die Hunde
akk_sg:  [AKKUSATIV SG]      z.B. den Hund
akk_pl:  [AKKUSATIV PL]      z.B. die Hunde
dat_sg:  [DATIV SG]          z.B. dem Hund(e)
dat_pl:  [DATIV PL]          z.B. den Hunden
gen_sg:  [GENITIV SG]        z.B. des Hundes
gen_pl:  [GENITIV PL]        z.B. der Hunde
```

---

## Schritt 2 — Sätze erstellen

Sentences must match the **level and type of the word**. The sentence count grows naturally as higher levels introduce more cases, tenses, or grammatical forms — don't force a fixed total.

---

### Sentence complexity by level

| Level | Rules |
|-------|-------|
| A1 | Max 6–8 words. Present tense only. No subordinate clauses. Basic, high-frequency vocabulary only. |
| A2 | Up to 10 words. May use Perfekt, basic coordinating conjunctions (und, aber, oder, denn). |
| B1 | Subordinate clauses (weil, dass, wenn, obwohl). Mixed tenses. Up to 15 words. |
| B2 | Passive voice, Konjunktiv II, relative clauses. More nuanced vocabulary. |
| C1+ | Complex multi-clause sentences, idiomatic usage, register variation. |

---

### Nouns (NOMEN)

Every case gets **both singular and plural sentences**. Sort order alternates SG/PL within each case block:
`sg_1, pl_1, sg_2, pl_2, sg_3, pl_3, ...`

**Distribution by word level — grows naturally:**

| Word level | Cases covered | Sentences |
|------------|--------------|-----------|
| A1 | NOM + AKK | 20 (5 NOM-SG, 5 NOM-PL, 5 AKK-SG, 5 AKK-PL) |
| A2 | + DAT | 30 (+ 5 DAT-SG, 5 DAT-PL) |
| B1 | + GEN | 40 (+ 5 GEN-SG, 5 GEN-PL) |
| B2+ | Same as B1, more varied contexts | 40 |

`min_level` per case: NOMINATIV → A1, AKKUSATIV → A1, DATIV → A2, GENITIV → B1

**Per sentence:**
```
sentence_de:       Full German sentence with the real word — NEVER use blanks (___). The UI creates the blank from cloze_word automatically.
sentence_en:       English translation
cloze_word:        exact form as in sentence — singular OR plural (e.g. "den Hund" / "die Hunde")
grammatical_case:  NOMINATIV | AKKUSATIV | DATIV | GENITIV
min_level:         see table above
sort_order:        follows alternating SG/PL pattern within each case block
audio_file:        null (filled later) — naming: {slug}_{case_short}_{sg|pl}_{n}.mp3
                   e.g. hund_nom_sg_1.mp3, hund_nom_pl_1.mp3, hund_akk_sg_1.mp3
```

---

### Verbs (VERB)

One sentence per tense per pronoun — all 6 pronouns every time: ich, du, er/sie/es, wir, ihr, sie/Sie.
The total sentence count grows as higher levels introduce more tenses.

**Tenses by level:**

| Word level | Tenses | Sentences |
|------------|--------|-----------|
| A1 | Präsens | 6 |
| A2 | + Perfekt | 12 |
| B1 | + Präteritum + Futur I | 24 |
| B2 | + Konjunktiv II + Plusquamperfekt | 36 |
| C1 | + Futur II | 42 |

> **Currently building A1 only** — generate Präsens sentences only for A1 verbs.

**Per sentence:**
```
sentence_de:       Full German sentence with the real word — NEVER use blanks (___). The UI creates the blank from cloze_word automatically.
sentence_en:       English translation
cloze_word:        conjugated verb form as in sentence (e.g. "läuft")
grammatical_case:  NULL
min_level:         level at which that tense is introduced (A1 for Präsens, A2 for Perfekt, etc.)
sort_order:        1–6 per tense, grouped by tense
audio_file:        null — naming: {slug}_{tense_short}_{pronoun_short}.mp3
                   e.g. laufen_praes_ich.mp3, laufen_praes_du.mp3
```

---

### Adjectives (ADJEKTIV)

Sentence rules and count expand at higher levels as new grammatical forms are introduced.

| Word level | Focus | Sentences |
|------------|-------|-----------|
| A1 | Predicative only ("Das ist schön.") | 10 |
| A2 | + Attributive with all genders + plural ("ein schöner Tag", "eine schöne Frau", "ein schönes Kind", "schöne Tage") | 20 |
| B1 | + Komparativ ("schöner als...") | 25 |
| B2 | + Superlativ ("am schönsten", "der schönste Tag") | 30 |
| C1+ | + Complex constructions ("je... desto...", idiomatic, register variation) | 35 |

**Per sentence:**
```
sentence_de:       Full German sentence with the real word — NEVER use blanks (___). The UI creates the blank from cloze_word automatically.
sentence_en:       English translation
cloze_word:        adjective form as in sentence (e.g. "schön" / "schönen" / "schöner")
grammatical_case:  NULL
min_level:         level at which that form is appropriate
sort_order:        running number
audio_file:        null — naming: {slug}_{sort_order}.mp3
```

---

### Expressions / Adverbs / Prepositions (AUSDRUCK / ADVERB / PRÄPOSITION)

10 sentences regardless of level, all rotate. `grammatical_case: NULL`.

```
audio_file naming: {slug}_{sort_order}.mp3
```

---

## Schritt 3 — TypeScript Interface updaten

Stelle sicher, dass `lib/supabase.ts` das `VocabWord` Interface enthält:

```typescript
export interface VocabWord {
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
  audio_file: string | null
  path_a1_vocabulary: number | null
  path_caros_path: number | null
  created_at: string
  // Deklination (nur Nomen)
  nom_sg: string | null; nom_pl: string | null
  akk_sg: string | null; akk_pl: string | null
  dat_sg: string | null; dat_pl: string | null
  gen_sg: string | null; gen_pl: string | null
  // Adjektiv-Formen (nur Adjektive)
  comparative: string | null   // e.g. "einfacher"
  superlative: string | null   // e.g. "am einfachsten"
}

export interface VocabSentence {
  id: string
  vocab_id: string
  sentence_de: string
  sentence_en: string
  cloze_word: string
  grammatical_case: 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV' | null
  min_level: string
  sort_order: number
  audio_file: string | null
}
```

---

## Schritt 4 — Neue Tabellen anlegen (falls noch nicht vorhanden)

Falls `gwc_vocab` und `gwc_vocab_sentences` noch nicht existieren, erstelle zuerst die Migration:
`supabase/migrations/YYYYMMDD_create_vocab_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS gwc_vocab (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  word            text NOT NULL,
  type            text NOT NULL,
  article         text,
  plural          text,
  level           text NOT NULL DEFAULT 'A1',
  frequency_rank  integer,
  translation_en  text NOT NULL,
  explanation_en  text NOT NULL,
  usage_notes     text,
  fun_fact        text,
  synonyms        text,
  related_words   text,
  audio_file      text,
  nom_sg text, nom_pl text, akk_sg text, akk_pl text,
  dat_sg text, dat_pl text, gen_sg text, gen_pl text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gwc_vocab_sentences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vocab_id          uuid NOT NULL REFERENCES gwc_vocab(id) ON DELETE CASCADE,
  sentence_de       text NOT NULL,
  sentence_en       text NOT NULL,
  cloze_word        text NOT NULL,
  grammatical_case  text CHECK (grammatical_case IN ('NOMINATIV','AKKUSATIV','DATIV','GENITIV')),
  min_level         text NOT NULL DEFAULT 'A1',
  sort_order        integer NOT NULL DEFAULT 0,
  audio_file        text,
  created_at        timestamptz DEFAULT now()
);
```

---

## Schritt 5 — Vocab Detail Page prüfen

`app/vocab/[slug]/page.tsx` existiert bereits — **nicht neu erstellen**.

Kurz prüfen ob die Seite für das neue Wort korrekt lädt:
- Slug stimmt überein (Kleinbuchstaben, Umlaute ersetzt)
- Alle Felder (Deklination, Sätze, Fun Fact etc.) werden korrekt angezeigt

---

## SRS Design — concept-level cards with sentence rotation

**Card unit = concept, not sentence.** Sentences rotate within each card for variety.

### Vocab: `gwc_vocab_reviews`
One row per `(session_id, vocab_id, grammatical_case)`.

| Word | Card | Sentences in rotation |
|------|------|-----------------------|
| Hund | NOMINATIV | "Der Hund schläft…", "Mein Hund heißt…", "Der Hund ist groß…" |
| Hund | AKKUSATIV | "Ich habe einen Hund.", "Sie füttert den Hund…", "Wir haben keinen Hund." |
| Hund | DATIV (ab A2) | "Ich gehe mit dem Hund…", "Das gehört dem Hund." |
| Hund | GENITIV (ab B1) | "Das Fell des Hundes…", "Der Name des Hundes…" |

- Verben/Adjektive/Ausdrücke: `grammatical_case = NULL` → 1 Karte, alle Sätze rotieren
- Dativ-Karte wird angelegt wenn User auf A2 wechselt; Genitiv bei B1

### Grammar: `gwc_grammar_reviews`
One row per `(session_id, topic_id)`.

- 1 Karte pro Grammatikpunkt (z.B. "W-Frage: wie?")
- Alle Sätze des Punkts rotieren (last_sentence_idx)
- Getting it wrong → Intervall reset, nächstes Review ein anderer Satz

### Sentence selection (both systems):
```
sentences = ORDER BY sort_order WHERE case = X (or topic = Y)
next_idx  = (last_sentence_idx + 1) % sentences.length
show sentences[next_idx]
after answer → save last_sentence_idx = next_idx
```

### SM-2 (use `lib/srs.ts → calculateNextReview()`):
- Correct → interval wächst, ease_factor nudge up
- Incorrect → interval reset zu 1, ease_factor runter (min 1.3)
- Update: `interval_days`, `ease_factor`, `repetitions`, `next_review_at`, `last_sentence_idx`, stats

### Due cards query (vocab):
```sql
SELECT vr.*, v.word, v.article, v.translation_en,
       vs.sentence_de, vs.sentence_en, vs.cloze_word
FROM gwc_vocab_reviews vr
JOIN gwc_vocab v ON v.id = vr.vocab_id
JOIN gwc_vocab_sentences vs ON
  vs.vocab_id = vr.vocab_id
  AND (vs.grammatical_case = vr.grammatical_case OR (vs.grammatical_case IS NULL AND vr.grammatical_case IS NULL))
  AND vs.sort_order = (
    SELECT sort_order FROM gwc_vocab_sentences
    WHERE vocab_id = vr.vocab_id
      AND (grammatical_case = vr.grammatical_case OR (grammatical_case IS NULL AND vr.grammatical_case IS NULL))
    ORDER BY sort_order
    LIMIT 1 OFFSET ((vr.last_sentence_idx + 1) % sentence_count)
  )
WHERE vr.session_id = $1 AND vr.next_review_at <= now()
ORDER BY vr.next_review_at ASC LIMIT 20
```
(In practice: easier to fetch all sentences client-side and pick by index.)

---

## Learn Queue Logic

### What counts as "learned"?
A word is considered learned (= introduced) as soon as at least one `gwc_vocab_reviews` row exists for it.

**Learn queue query** — words the user hasn't seen yet:
```sql
SELECT v.* FROM gwc_vocab v
WHERE v.level <= [user.german_level]
AND NOT EXISTS (
  SELECT 1 FROM gwc_vocab_reviews vr
  WHERE vr.vocab_id = v.id
  AND vr.session_id = [session_id]
)
ORDER BY v.frequency_rank ASC  -- most common words first
LIMIT [daily_goal]
```

**Review queue** — cards that are due:
```sql
SELECT vr.* FROM gwc_vocab_reviews vr
WHERE vr.session_id = [session_id]
AND vr.next_review_at <= now()
ORDER BY vr.next_review_at ASC
```

### First-time learning a word (Learn session):
1. Show word intro screen (article, translation, explanation, first sentence)
2. User does the cloze exercise
3. On answer → immediately insert **one** `gwc_vocab_reviews` row:
   - Uses the NOMINATIV sentence (or first available sentence)
   - `grammatical_case` = the case of the sentence shown
   - `next_review_at = now()`, SRS defaults
4. Word is marked as learned instantly — disappears from learn queue permanently
5. Appears in the review queue for the next session

> **Note:** Currently one review row is created per learn event (the sentence shown).
> Multi-case rows (AKKUSATIV, DATIV, GENITIV) are not auto-created — they come via
> review rotation as the user advances.

### Same logic for Grammar (`gwc_grammar_reviews`):
- No row for `(session_id, topic_id)` → appears in grammar learn queue
- Row exists → lives in review only
- No case-group complication — one row per topic, always

---

## Schritt 5.5 — Ergebnisse zur Überprüfung vorlegen

Before writing anything to the database or Excel file, present a full summary of all generated content.

Show:

- All word fields: `word`, `slug`, `type`, `level`, `frequency_rank`, `translation_en`, `explanation_en`, `usage_notes`, `fun_fact`, `synonyms`, `related_words`, and full declension table (if noun)
- All sentences as a table: `sentence_de` | `sentence_en` | `cloze_word` | `grammatical_case` | `sort_order` | `audio_filename`

Then ask:

> **What would you like to change before I write to the database and update audio_todo.xlsx?**

Only after explicit confirmation ("looks good", "go ahead", etc.) → execute the SQL migration (Schritt 1) and update `audio_todo.xlsx` (Schritt 6).

> **⚠️ Draft rule:** Every new `gwc_vocab` entry must be inserted with `is_draft = true`. This hides it from all users except the admin account, so it can be tested in the live app before publishing. Only set `is_draft = false` when explicitly told the entry is ready to go live.

---

## Schritt 6 — Audio-Tracking: `audio_todo.xlsx` aktualisieren

Nach dem SQL-Insert: Öffne (oder erstelle) die Datei `audio_todo.xlsx` im Projektroot (`gwc_v2/audio_todo.xlsx`).

**Füge pro Satz eine neue Zeile hinzu** (bestehende Zeilen NIE überschreiben — nur anhängen).

Spalten:

| slug | type | sentence_de | audio_filename | recorded |
|------|------|-------------|---------------|----------|
| hund | vocab | Der Hund schläft auf dem Sofa. | hund_nom_sg_1.mp3 | |

**Regeln für `audio_filename`:**
- Nomen: `{slug}_{kasus_kürzel}_{sg|pl}_{n}.mp3`
  - NOMINATIV → `nom`, AKKUSATIV → `akk`, DATIV → `dat`, GENITIV → `gen`
  - Beispiel: `hund_nom_sg_1.mp3`, `hund_nom_pl_1.mp3`, `hund_akk_sg_2.mp3`
- Verben / Adjektive / Ausdrücke (kein Kasus): `{slug}_{sort_order}.mp3`
  - Beispiel: `laufen_1.mp3`, `schnell_4.mp3`
- `recorded`: leer lassen (wird später manuell angehakt)

**Wichtig:**
- Datei muss im `.xlsx`-Format gespeichert werden (kein CSV)
- Kopfzeile nur einmal ganz oben (nicht bei jedem Append wiederholen)
- Falls die Datei noch nicht existiert → neu erstellen mit Kopfzeile + Zeilen
- Falls sie bereits existiert → Zeilen anhängen, Kopfzeile belassen

---

## Notes

- Always check if `gwc_vocab` / `gwc_vocab_sentences` already exist before running `CREATE TABLE`
- Slug immer aus `word` ableiten: Kleinbuchstaben, Umlaute ersetzen (ü→ue, ä→ae, ö→oe, ß→ss), Leerzeichen → Bindestrich
- Keine Emoji in SQL-Strings (kann Encoding-Probleme machen)
- `rm -rf .next` nach größeren Änderungen nicht vergessen
