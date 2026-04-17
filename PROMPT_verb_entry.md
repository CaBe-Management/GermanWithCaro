# Prompt: Neuen Verb-Eintrag erstellen

Kopiere diesen Prompt und fülle die Felder aus. Dann gib ihn an Claude Code.

---

## Dein Auftrag

Erstelle einen vollständigen Verb-Eintrag für das Wort **[VERB]** in der GWC v2 App.

Folge exakt dieser Reihenfolge:

---

## Schritt 1 — SQL Migration erstellen

Erstelle die Datei:
`supabase/migrations/YYYYMMDD_verb_[slug].sql`

### Pflichtfelder:

```
word:            [INFINITIV]            z.B. machen
slug:            [slug]                 z.B. machen  (Kleinbuchstaben, Umlaute ersetzen)
level:           [NIVEAU]               A1 | A2 | B1 | B2 | C1 | C2
frequency_rank:  [RANK]                 Number, z.B. 12  (niedriger = häufiger)
translation_en:  [ÜBERSETZUNG]          z.B. "to make / to do"
explanation_en:  [ERKLÄRUNG]           2–4 Sätze auf Englisch
category:        [KATEGORIE]            regular | irregular | modal | separable | reflexive
```

### Optional:

```
usage_notes:     [USAGE NOTES]         Wann/wie benutzt man es? Fallen? Formell vs. informell?
fun_fact:        [FUN FACT]            Kulturelles, linguistisches, oder interessantes Detail
synonyms:        [SYNONYME]            Kommagetrennt, z.B. "tun, anfertigen"
related_words:   [VERWANDTE WÖRTER]    z.B. "die Mache, gemacht, ummachen"
```

### Perfekt:

```
auxiliary:       haben | sein           z.B. "haben"
partizip_ii:     [PARTIZIP II]          z.B. "gemacht"
```

### Präsens-Konjugation (alle 6 Formen — immer ausfüllen):

```
praes_ich:   [FORM]    z.B. "mache"
praes_du:    [FORM]    z.B. "machst"
praes_er:    [FORM]    z.B. "macht"      (er/sie/es)
praes_wir:   [FORM]    z.B. "machen"
praes_ihr:   [FORM]    z.B. "macht"
praes_sie:   [FORM]    z.B. "machen"    (sie/Sie)
```

### Präteritum (nur bei irregular/modal — sonst weglassen):

```
praet_ich:   [FORM]    z.B. "war"
praet_du:    [FORM]    z.B. "warst"
praet_er:    [FORM]    z.B. "war"
praet_wir:   [FORM]    z.B. "waren"
praet_ihr:   [FORM]    z.B. "wart"
praet_sie:   [FORM]    z.B. "waren"
```

### Konjunktiv II (ausfüllen wenn unregelmäßig — bei regular = "würde + Infinitiv", dann weglassen):

```
konj2_ich:   [FORM]    z.B. "wäre"     (nur nötig wenn NICHT "würde + Infinitiv")
konj2_du:    [FORM]    z.B. "wärst"
konj2_er:    [FORM]    z.B. "wäre"
konj2_wir:   [FORM]    z.B. "wären"
konj2_ihr:   [FORM]    z.B. "wärt"
konj2_sie:   [FORM]    z.B. "wären"
```

### Path membership — how it works

Path membership for verbs is **automatic** based on the `level` field. No extra path columns needed.

| Field | Controls position in |
|-------|----------------------|
| `frequency_rank` | `verbs-[level]` path **and** `caros-path-[level]` mixed path |

Ein Verb mit `level = 'A1'` und `frequency_rank = 12` erscheint:
- **#12** im **Verb Conjugation A1** path (`verbs-a1`)
- **#12** (Verb-Section) in **Caro's Path A1** (`caros-path-a1`)

**`frequency_rank` sorgfältig vergeben:**
- Niedrigere Zahl = früher im Lernpfad (z.B. `frequency_rank = 1` → erstes Verb)
- Referenz: Deutsche Frequenzliste für Verben
- Lücken lassen (z.B. 10, 20, 30) damit neue Verben eingefügt werden können

**Path-Übersicht aller Level:**

| Level | Verb path | Mixed path |
|-------|-----------|------------|
| A1 | `verbs-a1` | `caros-path-a1` |
| A2 | `verbs-a2` | `caros-path-a2` |
| B1 | `verbs-b1` | `caros-path-b1` |
| B2 | `verbs-b2` | `caros-path-b2` |
| C1 | `verbs-c1` | `caros-path-c1` |
| C2 | `verbs-c2` | `caros-path-c2` |

---

## Schritt 2 — Sätze erstellen

**SRS-Karte = 1 pro Tense.** Jede Tense hat genau **6 Sätze — einen pro Pronomen** (ich / du / er/sie/es / wir / ihr / sie/Sie). Die Sätze rotieren innerhalb der Karte.

**Tense-Freischaltung nach User-Level:**

| Tense           | min_level | Wann erstellen?              |
|-----------------|-----------|------------------------------|
| PRÄSENS         | A1        | immer                        |
| PERFEKT         | A2        | immer                        |
| PRÄTERITUM      | B1        | nur bei irregular/modal      |
| FUTUR I         | B1        | immer                        |
| KONJUNKTIV II   | B2        | immer                        |
| PLUSQUAMPERFEKT | B2        | immer                        |
| FUTUR II        | C1        | immer                        |

**sort_order Konvention (innerhalb einer Tense):**
```
1 = ich
2 = du
3 = er/sie/es
4 = wir
5 = ihr
6 = sie/Sie
```

**Pflichtfelder pro Satz:**
```
sentence_de:   [DEUTSCHER SATZ]
sentence_en:   [ENGLISCHE ÜBERSETZUNG]
cloze_word:    [KONJUGIERTE FORM IM SATZ]    exakt wie im Satz (Groß/Kleinschreibung!)
tense:         PRÄSENS | PERFEKT | PRÄTERITUM | FUTUR I | KONJUNKTIV II | PLUSQUAMPERFEKT | FUTUR II
person:        ich | du | er/sie/es | wir | ihr | sie/Sie
min_level:     A1 | A2 | B1 | B2 | C1  (siehe Tabelle oben)
sort_order:    1–6
audio_file:    '[slug]_{tense_kürzel}_{person_kürzel}.mp3'  (sofort setzen, nicht NULL!)
```

**Welche Form wird als cloze_word getestet?**
- PRÄSENS: konjugierte Form des Verbs (z.B. "mache", "machst")
- PERFEKT: konjugierte Hilfsverbform (z.B. "habe", "bist")
- PRÄTERITUM: konjugierte Präteritum-Form (z.B. "machte", "war")
- FUTUR I: konjugierte Form von "werden" (z.B. "werde", "wirst", "wird")
- KONJUNKTIV II: bei "würde + Inf." → "würde/würdest/…"; bei nativer Form → "wäre/hätte/…"
- PLUSQUAMPERFEKT: Präteritum des Hilfsverbs (z.B. "hatte", "war")
- FUTUR II: konjugierte Form von "werden" (z.B. "werde", "wirst")

---

## ⚠️ ZWEI-LÜCKEN-CLOZE — Pflichtregeln für zusammengesetzte Zeiten

Das Learn-System zeigt für zusammengesetzte Zeiten **zwei separate Lücken** im Satz — eine für das Hilfsverb (Position 2) und eine für das Partizip/Infinitiv (Satzende). Der Lernende tippt die vollständige Antwort in ein Feld.

**Betroffene Zeiten:** PERFEKT · PLUSQUAMPERFEKT · FUTUR I · FUTUR II · KONJUNKTIV II mit "würde"

### Zwingend erforderliche Satzstruktur:

| Tense           | Hilfsverb (Position 2) | Satzende                          | Antwort (zum Tippen)          |
|-----------------|------------------------|-----------------------------------|-------------------------------|
| PERFEKT         | haben/sein (konj.)     | Partizip II                       | "habe gemacht" / "bin gegangen" |
| PLUSQUAMPERFEKT | hatte/war (konj.)      | Partizip II                       | "hatte gemacht" / "war gegangen" |
| FUTUR I         | werden (konj.)         | Infinitiv                         | "werde machen"                |
| FUTUR II        | werden (konj.)         | Partizip II + Hilfsverb           | "werde gemacht haben"         |
| KONJUNKTIV II (würde) | würde/würdest/… | Infinitiv                         | "würde machen"                |

### Regeln:

1. **Hilfsverb steht immer an Position 2** (Verb-Zweitstellung im Aussagesatz).
2. **Partizip II / Infinitiv steht immer am Satzende** (nach allen anderen Satzteilen).
3. **Mindestens 1–2 Wörter müssen zwischen den beiden Verbteilen stehen** — sonst macht die Zwei-Lücken-Darstellung keinen Sinn.
   - ✅ RICHTIG: "Ich werde das morgen **machen**." → Lücken: "Ich ___ das morgen ___."
   - ❌ FALSCH: "Ich werde **machen**." → zu kurz, kein Kontext zwischen den Lücken
4. **Das Partizip II / der Infinitiv darf nur EINMAL im Satz vorkommen** und nur am Ende — sonst erwischt der Strip-Algorithmus die falsche Stelle.
   - ❌ FALSCH: "Sein Hund hat ihn gebissen." für Verb "sein" — "sein" erscheint am Anfang als Adjektiv
   - ✅ RICHTIG: "Er hat ihn gebissen." für Verb "beißen" mit partizip_ii "gebissen"
5. **Das Wort in partizip_ii / word muss EXAKT so im Satz stehen** (Groß/Kleinschreibung egal, aber identische Schreibweise).
6. **Satzanfang nie mit dem Infinitiv/Partizip beginnen** — das würde Position 2 für das Hilfsverb blockieren.

### Beispiele — RICHTIG ✅

```sql
-- PERFEKT: "haben" → Lücken: "Ich ___ das Buch schon ___."
(v_id, 'Ich habe das Buch schon gelesen.', 'I have already read the book.', 'habe', 'PERFEKT', 'ich', 'A2', 1, 'lesen_perf_ich.mp3'),

-- FUTUR I: "werden" → Lücken: "Ich ___ das morgen ___."
(v_id, 'Ich werde das morgen machen.', 'I will do that tomorrow.', 'werde', 'FUTUR I', 'ich', 'B1', 1, 'machen_fut1_ich.mp3'),

-- KONJUNKTIV II (würde): → Lücken: "Ich ___ das anders ___."
(v_id, 'Ich würde das anders machen.', 'I would do that differently.', 'würde', 'KONJUNKTIV II', 'ich', 'B2', 1, 'machen_konj2_ich.mp3'),

-- KONJUNKTIV II (nativ, kein Strip): → eine Lücke: "Ich ___ gerne dabei."
(v_id, 'Ich wäre gerne dabei.', 'I would like to be there.', 'wäre', 'KONJUNKTIV II', 'ich', 'B2', 1, 'sein_konj2_ich.mp3'),

-- PLUSQUAMPERFEKT: → Lücken: "Ich ___ das schon ___."
(v_id, 'Ich hatte das schon gemacht.', 'I had already done that.', 'hatte', 'PLUSQUAMPERFEKT', 'ich', 'B2', 1, 'machen_plusq_ich.mp3'),

-- FUTUR II: → Lücken: "Bis dann ___ ich das ___."
(v_id, 'Bis dann werde ich das gemacht haben.', 'By then I will have done that.', 'werde', 'FUTUR II', 'ich', 'C1', 1, 'machen_fut2_ich.mp3'),
```

### Beispiele — FALSCH ❌

```sql
-- FALSCH: Infinitiv steht nicht am Ende
(v_id, 'Ich werde machen das morgen.', ...) -- ungrammatisch

-- FALSCH: zu kurz, kein Kontext zwischen den Lücken
(v_id, 'Ich werde machen.', ...) -- "Ich ___ ___." ist nichtssagend

-- FALSCH: Verb erscheint anderswo im Satz
(v_id, 'Sein Traum ist wahr geworden, weil er wurde Arzt.', ...) -- "sein" taucht als Pronomen auf

-- FALSCH: cloze_word nicht das Hilfsverb
(v_id, 'Ich werde das morgen machen.', ..., 'machen', ...) -- cloze_word muss "werde" sein, nicht "machen"
```

---

**Beispiel für `machen`, PRÄSENS:**
```sql
(v_id, 'Ich mache Hausaufgaben.', 'I am doing homework.', 'mache', 'PRÄSENS', 'ich', 'A1', 1, 'machen_praes_ich.mp3'),
(v_id, 'Was machst du heute?', 'What are you doing today?', 'machst', 'PRÄSENS', 'du', 'A1', 2, 'machen_praes_du.mp3'),
(v_id, 'Er macht die Tür auf.', 'He opens the door.', 'macht', 'PRÄSENS', 'er/sie/es', 'A1', 3, 'machen_praes_er.mp3'),
(v_id, 'Wir machen einen Spaziergang.', 'We are going for a walk.', 'machen', 'PRÄSENS', 'wir', 'A1', 4, 'machen_praes_wir.mp3'),
(v_id, 'Ihr macht das zusammen.', 'You (all) are doing that together.', 'macht', 'PRÄSENS', 'ihr', 'A1', 5, 'machen_praes_ihr.mp3'),
(v_id, 'Sie machen die Hausarbeit.', 'They are doing the housework.', 'machen', 'PRÄSENS', 'sie/Sie', 'A1', 6, 'machen_praes_sie.mp3'),
```

**Beispiel für `machen`, FUTUR I** — zwei Lücken: "Ich ___ das morgen ___."
```sql
(v_id, 'Ich werde das morgen machen.', 'I will do that tomorrow.', 'werde', 'FUTUR I', 'ich', 'B1', 1, 'machen_fut1_ich.mp3'),
(v_id, 'Du wirst das sicher gut machen.', 'You will surely do that well.', 'wirst', 'FUTUR I', 'du', 'B1', 2, 'machen_fut1_du.mp3'),
-- usw.
```

**Beispiel für `machen`, KONJUNKTIV II** — zwei Lücken (würde-Form): "Ich ___ das anders ___."
```sql
(v_id, 'Ich würde das anders machen.', 'I would do that differently.', 'würde', 'KONJUNKTIV II', 'ich', 'B2', 1, 'machen_konj2_ich.mp3'),
```

**Beispiel für `machen`, PLUSQUAMPERFEKT** — zwei Lücken: "Ich ___ das schon ___."
```sql
(v_id, 'Ich hatte das schon gemacht.', 'I had already done that.', 'hatte', 'PLUSQUAMPERFEKT', 'ich', 'B2', 1, 'machen_plusq_ich.mp3'),
```

**Beispiel für `machen`, FUTUR II** — zwei Lücken: "Bis dann ___ ich das ___ ___."
```sql
(v_id, 'Bis dann werde ich das gemacht haben.', 'By then I will have done that.', 'werde', 'FUTUR II', 'ich', 'C1', 1, 'machen_fut2_ich.mp3'),
```

---

## Tense-Kürzel für audio_filename

| Tense           | Kürzel |
|-----------------|--------|
| PRÄSENS         | praes  |
| PERFEKT         | perf   |
| PRÄTERITUM      | praet  |
| FUTUR I         | fut1   |
| KONJUNKTIV II   | konj2  |
| PLUSQUAMPERFEKT | plusq  |
| FUTUR II        | fut2   |

**Person-Kürzel:** ich → `ich` · du → `du` · er/sie/es → `er` · wir → `wir` · ihr → `ihr` · sie/Sie → `sie`

**Beispiele:** `machen_praes_ich.mp3` · `sein_konj2_wir.mp3` · `gehen_plusq_du.mp3`

---

## Schritt 3 — TypeScript Interface prüfen

Stelle sicher, dass `lib/supabase.ts` folgende Interfaces enthält (inkl. konj2-Felder):

```typescript
export interface VerbWord {
  id: string; slug: string; word: string; translation_en: string
  level: string; frequency_rank: number | null; category: string
  explanation_en: string; usage_notes: string | null
  fun_fact: string | null; synonyms: string | null; related_words: string | null
  auxiliary: string | null; partizip_ii: string | null
  praes_ich: string | null; praes_du: string | null; praes_er: string | null
  praes_wir: string | null; praes_ihr: string | null; praes_sie: string | null
  praet_ich: string | null; praet_du: string | null; praet_er: string | null
  praet_wir: string | null; praet_ihr: string | null; praet_sie: string | null
  konj2_ich: string | null; konj2_du: string | null; konj2_er: string | null
  konj2_wir: string | null; konj2_ihr: string | null; konj2_sie: string | null
  path_a1_verbs: number | null; path_caros_path: number | null
  audio_file: string | null; created_at: string
}

export interface VerbSentence {
  id: string; verb_id: string; sentence_de: string; sentence_en: string
  cloze_word: string
  tense: 'PRÄSENS' | 'PERFEKT' | 'PRÄTERITUM' | 'FUTUR I' | 'KONJUNKTIV II' | 'PLUSQUAMPERFEKT' | 'FUTUR II'
  person: 'ich' | 'du' | 'er/sie/es' | 'wir' | 'ihr' | 'sie/Sie'
  min_level: string; sort_order: number; audio_file: string | null
}
```

---

## Schritt 4 — Tabellen anlegen (falls noch nicht vorhanden)

Falls `gwc_verbs`, `gwc_verb_sentences`, `gwc_verb_reviews` noch nicht existieren:
`supabase/migrations/20260407_create_verb_tables.sql` ausführen.

---

## Schritt 5 — Audio-Tracking: `audio_todo.xlsx` aktualisieren

Nach dem SQL-Insert: Öffne `audio_todo.xlsx` im Projektroot (`gwc_v2/audio_todo.xlsx`).

**Füge pro Satz eine neue Zeile hinzu** (NIE überschreiben — nur anhängen).

Spalten: `slug` | `type` | `sentence_de` | `audio_filename` | `recorded`

- `type`: immer `verb`
- `audio_filename`: exakt das gleiche wie das `audio_file`-Feld im SQL
- `recorded`: leer lassen

**Wichtig:** `.xlsx`-Format, Kopfzeile nur einmal, immer nur anhängen.

---

## SRS Design

### Karte = (verb × tense)
Eine `gwc_verb_reviews`-Zeile pro `(session_id, verb_id, tense)`.

| Verb   | Tense           | Freigeschaltet bei |
|--------|-----------------|--------------------|
| machen | PRÄSENS         | A1                 |
| machen | PERFEKT         | A2                 |
| machen | FUTUR I         | B1                 |
| machen | KONJUNKTIV II   | B2                 |
| machen | PLUSQUAMPERFEKT | B2                 |
| machen | FUTUR II        | C1                 |
| sein   | PRÄTERITUM      | B1 (irregular)     |

### Hint im Learn-Flow (Cloze-Phase):
- Große Box: `translation_en` ("to make / to do") — immer sichtbar
- Header Badge 1: Tense ("Futur I")
- Header Badge 2: Person rotiert mit dem Satz ("du", "er/sie/es", …)

### SM-2 via `lib/srs.ts → calculateNextReview()`:
- Richtig → Intervall wächst, ease_factor hoch
- Falsch → Intervall reset zu 1, ease_factor runter (min 1.3)

---

## Notes

- Slug: Kleinbuchstaben, Umlaute ersetzen (ü→ue, ä→ae, ö→oe, ß→ss), Leerzeichen → Bindestrich
- Trennbare Verben: slug mit Präfix: `aufmachen` → slug `aufmachen`
- Keine Emoji in SQL-Strings
- `rm -rf .next` nach größeren Änderungen
