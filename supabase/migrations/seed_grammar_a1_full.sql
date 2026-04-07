-- ─────────────────────────────────────────────────────────────────────────────
-- A1 Grammar: All 50 curriculum topics (skips #2 sein & #3 haben — already in seed_grammar.sql)
-- Also adds B1: ganz and ziemlich as SEPARATE topics (replaces combined ganz-vs-ziemlich)
-- Sort orders 1000–1490 (A1) and 2000–2010 (B1) to sit after existing 10–80 verb drills
-- Run AFTER seed_grammar.sql
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE t UUID;
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PERSONALPRONOMEN + VERBKONJUGATION
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Personal Pronouns & Verb Endings',
  'personalpronomen-verbkonjugation',
  'A1',
  'verb_conjugation',
  'German verbs change their endings depending on the subject (the person doing the action).

**Personal pronouns and their standard endings:**
| Pronoun | Ending | Example (lernen) |
|---------|--------|-----------------|
| ich | **-e** | lern**e** |
| du | **-st** | lern**st** |
| er/sie/es | **-t** | lern**t** |
| wir | **-en** | lern**en** |
| ihr | **-t** | lern**t** |
| sie/Sie | **-en** | lern**en** |

These endings apply to almost all regular German verbs. The stem stays constant.
Note: "er lernt" and "ihr lernt" look the same — context tells them apart.',
  1000
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich lerne jeden Tag Deutsch.','I learn German every day.','lerne','ich','präsens',1),
(t,'Du lernst sehr schnell.','You learn very quickly.','lernst','du','präsens',2),
(t,'Er lernt für die Prüfung.','He studies for the exam.','lernt','er/sie/es','präsens',3),
(t,'Wir lernen zusammen.','We learn together.','lernen','wir','präsens',4),
(t,'Ihr lernt viel in der Schule.','You all learn a lot at school.','lernt','ihr','präsens',5),
(t,'Sie lernen jeden Abend.','They learn every evening.','lernen','sie/Sie','präsens',6),
(t,'Ich höre Musik.','I listen to music.','höre','ich','präsens',7),
(t,'Du spielst Gitarre, oder?','You play guitar, right?','spielst','du','präsens',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. W-FRAGEN (topics 2=sein & 3=haben skipped — already exist)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'W-Questions',
  'w-fragen',
  'A1',
  'sentence_structure',
  'W-questions use a question word at the start, followed by the verb, then the subject.

**Word order:** Question word + Verb + Subject + ...

**Common W-question words:**
| German | English |
|--------|---------|
| **Wer** | Who |
| **Was** | What |
| **Wo** | Where (location) |
| **Woher** | Where from |
| **Wohin** | Where to |
| **Wann** | When |
| **Wie** | How |
| **Warum** | Why |
| **Wie viele** | How many |

Example: **Wo** wohnst du? = Where do you live?',
  1030
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Wo wohnst du?','Where do you live?','Wo',NULL,NULL,1),
(t,'Wie heißt du?','What is your name?','Wie',NULL,NULL,2),
(t,'Wann kommst du nach Hause?','When are you coming home?','Wann',NULL,NULL,3),
(t,'Warum lernst du Deutsch?','Why are you learning German?','Warum',NULL,NULL,4),
(t,'Was machst du am Wochenende?','What do you do at the weekend?','Was',NULL,NULL,5),
(t,'Woher kommst du?','Where do you come from?','Woher',NULL,NULL,6),
(t,'Wie viele Sprachen sprichst du?','How many languages do you speak?','Wie',NULL,NULL,7),
(t,'Wohin gehst du heute?','Where are you going today?','Wohin',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SATZSTELLUNG – AUSSAGESATZ
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Word Order: Statements (Verb in Position 2)',
  'satzstellung-aussagesatz',
  'A1',
  'sentence_structure',
  'In a German statement, the **verb is always in position 2** — no matter what element comes first.

**Normal order:** Subject + **Verb** + ...
- Ich **wohne** in Berlin.

**Inverted order** (when something other than the subject comes first):
- Heute **gehe** ich einkaufen.
- In Berlin **wohne** ich.

The verb slot (position 2) never moves. This is called the **Verbzweitstellung** rule.',
  1040
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich trinke jeden Morgen Kaffee.','I drink coffee every morning.','trinke',NULL,NULL,1),
(t,'Jeden Morgen trinke ich Kaffee.','Every morning I drink coffee.','trinke',NULL,NULL,2),
(t,'Sie wohnt in München.','She lives in Munich.','wohnt',NULL,NULL,3),
(t,'In München wohnt sie.','In Munich she lives.','wohnt',NULL,NULL,4),
(t,'Er arbeitet heute nicht.','He is not working today.','arbeitet',NULL,NULL,5),
(t,'Heute arbeitet er nicht.','Today he is not working.','arbeitet',NULL,NULL,6),
(t,'Wir fahren morgen nach Hamburg.','We are going to Hamburg tomorrow.','fahren',NULL,NULL,7),
(t,'Morgen fahren wir nach Hamburg.','Tomorrow we are going to Hamburg.','fahren',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SATZSTELLUNG – JA/NEIN-FRAGE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Word Order: Yes/No Questions (Verb First)',
  'satzstellung-ja-nein-frage',
  'A1',
  'sentence_structure',
  'Yes/no questions put the **verb in position 1** (before the subject).

**Statement:** Du **kommst** morgen.
**Yes/No question:** **Kommst** du morgen?

There is no equivalent of "do/does" in German — just move the verb to the front.

Answers use **ja** (yes), **nein** (no), or **doch** (yes, contradicting a negative statement).',
  1050
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Kommst du morgen?','Are you coming tomorrow?','Kommst',NULL,NULL,1),
(t,'Wohnst du in Berlin?','Do you live in Berlin?','Wohnst',NULL,NULL,2),
(t,'Sprichst du Deutsch?','Do you speak German?','Sprichst',NULL,NULL,3),
(t,'Hast du Zeit?','Do you have time?','Hast',NULL,NULL,4),
(t,'Ist er zu Hause?','Is he at home?','Ist',NULL,NULL,5),
(t,'Arbeitet sie heute?','Is she working today?','Arbeitet',NULL,NULL,6),
(t,'Habt ihr Hunger?','Are you hungry?','Habt',NULL,NULL,7),
(t,'Lernen Sie Deutsch?','Are you learning German? (formal)','Lernen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. BESTIMMTER ARTIKEL
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Definite Articles: der / die / das',
  'bestimmter-artikel',
  'A1',
  'articles',
  'German has three genders: **masculine** (der), **feminine** (die), and **neuter** (das). The plural is always **die**.

| Gender | Article | Example |
|--------|---------|---------|
| Masculine | **der** | der Mann (the man) |
| Feminine | **die** | die Frau (the woman) |
| Neuter | **das** | das Kind (the child) |
| Plural | **die** | die Kinder (the children) |

The article must agree with the noun''s grammatical gender — which must be memorised.',
  1060
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Der Mann ist sehr groß.','The man is very tall.','Der',NULL,NULL,1),
(t,'Die Frau liest ein Buch.','The woman is reading a book.','Die',NULL,NULL,2),
(t,'Das Kind spielt im Garten.','The child is playing in the garden.','Das',NULL,NULL,3),
(t,'Die Kinder gehen in die Schule.','The children go to school.','Die',NULL,NULL,4),
(t,'Der Hund ist sehr groß.','The dog is very big.','Der',NULL,NULL,5),
(t,'Die Stadt ist sehr schön.','The city is very beautiful.','Die',NULL,NULL,6),
(t,'Das Buch liegt auf dem Tisch.','The book is on the table.','Das',NULL,NULL,7),
(t,'Die Blumen sind wunderschön.','The flowers are beautiful.','Die',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. UNBESTIMMTER ARTIKEL
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Indefinite Articles: ein / eine',
  'unbestimmter-artikel',
  'A1',
  'articles',
  'The indefinite article (a/an) in German depends on gender:

| Gender | Article | Example |
|--------|---------|---------|
| Masculine | **ein** | ein Mann (a man) |
| Feminine | **eine** | eine Frau (a woman) |
| Neuter | **ein** | ein Kind (a child) |
| Plural | — | Kinder (children — no article) |

There is **no plural indefinite article** in German. Plural nouns used generally have no article at all.',
  1070
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe einen Hund.','I have a dog.','einen',NULL,NULL,1),
(t,'Das ist eine gute Idee.','That is a good idea.','eine',NULL,NULL,2),
(t,'Er liest ein Buch.','He is reading a book.','ein',NULL,NULL,3),
(t,'Sie kauft eine Tasche.','She is buying a bag.','eine',NULL,NULL,4),
(t,'Ich brauche einen Stift.','I need a pen.','einen',NULL,NULL,5),
(t,'Das ist ein schönes Haus.','That is a beautiful house.','ein',NULL,NULL,6),
(t,'Wir haben eine Katze.','We have a cat.','eine',NULL,NULL,7),
(t,'Er ist ein guter Freund.','He is a good friend.','ein',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. NEGATIVARTIKEL KEIN/KEINE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Negative Article: kein / keine',
  'negativartikel-kein-keine',
  'A1',
  'articles',
  '**Kein/keine** negates nouns (not the same as "nicht", which negates verbs/adjectives).

Use **kein** like the indefinite article but with a "k-" prefix:

| Gender | Nominative |
|--------|-----------|
| Masculine | **kein** Mann |
| Feminine | **keine** Frau |
| Neuter | **kein** Kind |
| Plural | **keine** Kinder |

Rule: wherever you would use **ein/eine**, use **kein/keine** to negate.
For nouns used with definite articles, kein also works: Ich habe kein Geld.',
  1080
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe kein Geld.','I have no money.','kein',NULL,NULL,1),
(t,'Das ist keine gute Idee.','That is not a good idea.','keine',NULL,NULL,2),
(t,'Ich habe keinen Hunger.','I am not hungry.','keinen',NULL,NULL,3),
(t,'Er hat keine Zeit.','He has no time.','keine',NULL,NULL,4),
(t,'Wir haben kein Auto.','We have no car.','kein',NULL,NULL,5),
(t,'Sie hat keine Geschwister.','She has no siblings.','keine',NULL,NULL,6),
(t,'Ich habe keinen Stift.','I have no pen.','keinen',NULL,NULL,7),
(t,'Das ist kein Problem.','That is not a problem.','kein',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. NOMINATIV VS. AKKUSATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Nominative vs. Accusative Case',
  'nominativ-akkusativ',
  'A1',
  'cases',
  '**Nominative** = the subject (who is doing the action)
**Accusative** = the direct object (what is being affected)

Only the **masculine** article changes in the accusative:

| Case | Masc. | Fem. | Neut. | Plural |
|------|-------|------|-------|--------|
| Nom. | der / ein | die / eine | das / ein | die / — |
| Akk. | **den / einen** | die / eine | das / ein | die / — |

Example: Der Mann sieht **den** Hund. (The man sees **the** dog.)
The man = nominative (subject). The dog = accusative (direct object).',
  1090
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich kaufe den Apfel.','I buy the apple.','den',NULL,NULL,1),
(t,'Er sieht eine Frau.','He sees a woman.','eine',NULL,NULL,2),
(t,'Das Kind hat einen Ball.','The child has a ball.','einen',NULL,NULL,3),
(t,'Ich trinke den Kaffee.','I drink the coffee.','den',NULL,NULL,4),
(t,'Er kauft ein Buch.','He buys a book.','ein',NULL,NULL,5),
(t,'Wir sehen den Film.','We watch the film.','den',NULL,NULL,6),
(t,'Sie findet die Tasche.','She finds the bag.','die',NULL,NULL,7),
(t,'Ich nehme einen Kaffee, bitte.','I''ll take a coffee, please.','einen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. DATIV – ARTIKELTABELLE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Dative Case – Article Table',
  'dativ-artikeltabelle',
  'A1',
  'cases',
  'The **dative case** marks the indirect object (to/for whom something is done).

| Case | Masc. | Fem. | Neut. | Plural |
|------|-------|------|-------|--------|
| Dat. | **dem / einem** | **der / einer** | **dem / einem** | **den (+n) / —** |

Key dative verbs: **geben** (to give), **helfen** (to help), **zeigen** (to show), **schenken** (to give as gift).

In plural dative, nouns add **-n** if they don''t already end in -n: den Kinder**n**, den Männer**n**.',
  1100
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich gebe dem Mann das Buch.','I give the book to the man.','dem',NULL,NULL,1),
(t,'Er hilft der Frau.','He helps the woman.','der',NULL,NULL,2),
(t,'Sie gibt einem Kind Schokolade.','She gives a child chocolate.','einem',NULL,NULL,3),
(t,'Ich zeige den Kindern das Museum.','I show the children the museum.','den',NULL,NULL,4),
(t,'Er dankt dem Lehrer.','He thanks the teacher.','dem',NULL,NULL,5),
(t,'Wir helfen einer alten Dame.','We help an old lady.','einer',NULL,NULL,6),
(t,'Sie schreibt dem Freund eine Karte.','She writes the friend a card.','dem',NULL,NULL,7),
(t,'Ich kaufe meiner Mutter Blumen.','I buy my mother flowers.','meiner',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. POSSESSIVARTIKEL NOM. + AKK.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Possessive Articles (Nominative & Accusative)',
  'possessivartikel-nom-akk',
  'A1',
  'articles',
  'Possessive articles show ownership. They follow the same endings as **kein**:

| | Meaning | Masc. Nom. | Fem. Nom. | Neut. Nom. |
|--|---------|-----------|----------|-----------|
| ich | my | **mein** | **meine** | **mein** |
| du | your | **dein** | **deine** | **dein** |
| er | his | **sein** | **seine** | **sein** |
| sie | her | **ihr** | **ihre** | **ihr** |
| wir | our | **unser** | **unsere** | **unser** |
| ihr | your (pl) | **euer** | **eure** | **euer** |
| sie/Sie | their/your | **ihr/Ihr** | **ihre/Ihre** | **ihr/Ihr** |

In the accusative, masculine changes: mein → **meinen**.',
  1110
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Das ist mein Buch.','That is my book.','mein',NULL,NULL,1),
(t,'Wo ist deine Tasche?','Where is your bag?','deine',NULL,NULL,2),
(t,'Er liebt seinen Hund.','He loves his dog.','seinen',NULL,NULL,3),
(t,'Das ist ihr Auto.','That is her car.','ihr',NULL,NULL,4),
(t,'Wir lieben unser Haus.','We love our house.','unser',NULL,NULL,5),
(t,'Habt ihr eure Bücher?','Do you have your books?','eure',NULL,NULL,6),
(t,'Das sind ihre Kinder.','Those are their children.','ihre',NULL,NULL,7),
(t,'Ich vermisse meinen Vater.','I miss my father.','meinen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. POSSESSIVARTIKEL DATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Possessive Articles in the Dative',
  'possessivartikel-dativ',
  'A1',
  'articles',
  'In the **dative case**, possessive articles take these endings:

| Gender | Ending | Example |
|--------|--------|---------|
| Masculine | **-em** | mein**em** Vater |
| Feminine | **-er** | mein**er** Mutter |
| Neuter | **-em** | mein**em** Kind |
| Plural | **-en** | mein**en** Eltern |

These endings apply to all possessives (mein-, dein-, sein-, ihr-, unser-, euer-, ihr-/Ihr-).',
  1120
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich helfe meinem Vater.','I help my father.','meinem',NULL,NULL,1),
(t,'Er gibt seiner Mutter Blumen.','He gives his mother flowers.','seiner',NULL,NULL,2),
(t,'Sie spielt mit ihrem Kind.','She plays with her child.','ihrem',NULL,NULL,3),
(t,'Wir danken unseren Eltern.','We thank our parents.','unseren',NULL,NULL,4),
(t,'Er schreibt seinem Freund.','He writes to his friend.','seinem',NULL,NULL,5),
(t,'Ich leihe meiner Schwester Geld.','I lend my sister money.','meiner',NULL,NULL,6),
(t,'Sie hilft ihrem Bruder.','She helps her brother.','ihrem',NULL,NULL,7),
(t,'Wir zeigen unseren Kindern die Stadt.','We show our children the city.','unseren',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. DEMONSTRATIVARTIKEL DIESER/WELCHER
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Demonstrative Articles: dieser / welcher',
  'demonstrativartikel-dieser-welcher',
  'A1',
  'articles',
  '**Dieser** (this/these) and **welcher** (which) follow the same endings as **der/die/das**:

| | Masc. | Fem. | Neut. | Plural |
|--|-------|------|-------|--------|
| Nom. | diese**r** | diese | diese**s** | diese |
| Akk. | diese**n** | diese | diese**s** | diese |
| Dat. | diese**m** | diese**r** | diese**m** | diese**n** |

Use **dieser** to point to something specific: Dieser Mann ist mein Lehrer.
Use **welcher** to ask: Welches Buch liest du? (Which book are you reading?)',
  1130
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Dieser Mann ist mein Lehrer.','This man is my teacher.','Dieser',NULL,NULL,1),
(t,'Diese Frau ist sehr nett.','This woman is very nice.','Diese',NULL,NULL,2),
(t,'Welches Buch liest du?','Which book are you reading?','Welches',NULL,NULL,3),
(t,'Ich möchte diesen Apfel.','I would like this apple.','diesen',NULL,NULL,4),
(t,'Welche Farbe gefällt dir?','Which colour do you like?','Welche',NULL,NULL,5),
(t,'Dieses Restaurant ist sehr teuer.','This restaurant is very expensive.','Dieses',NULL,NULL,6),
(t,'Welchen Film siehst du?','Which film are you watching?','Welchen',NULL,NULL,7),
(t,'Diese Schuhe sind zu groß.','These shoes are too big.','Diese',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. PLURALFORMEN DER NOMEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Plural Forms of Nouns',
  'pluralformen-der-nomen',
  'A1',
  'nouns',
  'German noun plurals must be memorised — there is no single rule like English "-s". The five main patterns:

| Type | Pattern | Example |
|------|---------|---------|
| **-e** | add -e | der Tag → die Tag**e** |
| **-er** | add -er (+ umlaut) | das Kind → die Kind**er** |
| **-en/-n** | add -en or -n | die Frau → die Frau**en** |
| **-** | no change (+ umlaut) | der Vater → die V**ä**ter |
| **-s** | add -s | das Auto → die Auto**s** |

Always learn the plural together with the noun: **das Buch, -¨er** = die Bücher.',
  1140
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Die Kinder spielen im Park.','The children play in the park.','Kinder',NULL,NULL,1),
(t,'Die Bücher sind sehr interessant.','The books are very interesting.','Bücher',NULL,NULL,2),
(t,'Die Frauen kommen aus Berlin.','The women come from Berlin.','Frauen',NULL,NULL,3),
(t,'Die Autos stehen auf der Straße.','The cars are on the street.','Autos',NULL,NULL,4),
(t,'Die Männer arbeiten viel.','The men work a lot.','Männer',NULL,NULL,5),
(t,'Die Häuser sind sehr groß.','The houses are very big.','Häuser',NULL,NULL,6),
(t,'Die Städte in Deutschland sind schön.','The cities in Germany are beautiful.','Städte',NULL,NULL,7),
(t,'Die Tage werden kürzer.','The days are getting shorter.','Tage',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. MODALVERBEN: WOLLEN, MÜSSEN, KÖNNEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Modal Verbs: wollen / müssen / können',
  'modalverben-wollen-muessen-koennen',
  'A1',
  'verb_conjugation',
  'Modal verbs modify the main verb. They take **position 2**, and the **infinitive goes to the end**.

**Structure:** Subject + Modal (pos. 2) + ... + Infinitive (end)

| | wollen (want to) | müssen (must) | können (can) |
|--|-----------------|--------------|-------------|
| ich | **will** | **muss** | **kann** |
| du | **willst** | **musst** | **kannst** |
| er/sie/es | **will** | **muss** | **kann** |
| wir | **wollen** | **müssen** | **können** |
| ihr | **wollt** | **müsst** | **könnt** |
| sie/Sie | **wollen** | **müssen** | **können** |',
  1150
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich will Deutsch lernen.','I want to learn German.','will',NULL,NULL,1),
(t,'Du musst jetzt schlafen.','You must sleep now.','musst',NULL,NULL,2),
(t,'Er kann gut schwimmen.','He can swim well.','kann',NULL,NULL,3),
(t,'Wir wollen nach Berlin fahren.','We want to go to Berlin.','wollen',NULL,NULL,4),
(t,'Ihr müsst früher aufstehen.','You all must get up earlier.','müsst',NULL,NULL,5),
(t,'Sie können sehr gut kochen.','They can cook very well.','können',NULL,NULL,6),
(t,'Ich muss heute arbeiten.','I must work today.','muss',NULL,NULL,7),
(t,'Kannst du mir helfen?','Can you help me?','kannst',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. MODALVERBEN: DÜRFEN, SOLLEN, MÖGEN/MÖCHTEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Modal Verbs: dürfen / sollen / mögen',
  'modalverben-duerfen-sollen-moegen',
  'A1',
  'verb_conjugation',
  '| | dürfen (may/allowed to) | sollen (supposed to) | mögen (to like) |
|--|------------------------|---------------------|----------------|
| ich | **darf** | **soll** | **mag** |
| du | **darfst** | **sollst** | **magst** |
| er/sie/es | **darf** | **soll** | **mag** |
| wir | **dürfen** | **sollen** | **mögen** |
| ihr | **dürft** | **sollt** | **mögt** |
| sie/Sie | **dürfen** | **sollen** | **mögen** |

**Möchten** (would like) is used far more often than mögen in everyday speech — it is a polite subjunctive form.',
  1160
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Hier darf man nicht rauchen.','You are not allowed to smoke here.','darf',NULL,NULL,1),
(t,'Du sollst um acht Uhr da sein.','You are supposed to be there at eight.','sollst',NULL,NULL,2),
(t,'Er mag keine Zwiebeln.','He does not like onions.','mag',NULL,NULL,3),
(t,'Darf ich hier parken?','Am I allowed to park here?','Darf',NULL,NULL,4),
(t,'Wir dürfen heute früher gehen.','We are allowed to leave earlier today.','dürfen',NULL,NULL,5),
(t,'Ich mag Schokolade sehr gerne.','I like chocolate a lot.','mag',NULL,NULL,6),
(t,'Er soll das Zimmer aufräumen.','He is supposed to tidy the room.','soll',NULL,NULL,7),
(t,'Dürfen wir das Fenster öffnen?','Are we allowed to open the window?','Dürfen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. KONJUGATION: MÖCHTEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Conjugation: möchten (would like)',
  'konjugation-moechten',
  'A1',
  'verb_conjugation',
  '**Möchten** (would like) is used for polite requests and wishes — the most common way to express desire in everyday German.

| Person | Form |
|--------|------|
| ich | **möchte** |
| du | **möchtest** |
| er/sie/es | **möchte** |
| wir | **möchten** |
| ihr | **möchtet** |
| sie/Sie | **möchten** |

Note: "er/sie/es möchte" has **no -t ending** — because it is a subjunctive form.
Use: Subject + möchte + ... + Infinitive',
  1170
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich möchte einen Kaffee, bitte.','I would like a coffee, please.','möchte','ich',NULL,1),
(t,'Möchtest du etwas essen?','Would you like something to eat?','möchtest','du',NULL,2),
(t,'Er möchte Arzt werden.','He would like to become a doctor.','möchte','er/sie/es',NULL,3),
(t,'Wir möchten in die Stadt gehen.','We would like to go into town.','möchten','wir',NULL,4),
(t,'Möchtet ihr Kaffee oder Tee?','Would you like coffee or tea?','möchtet','ihr',NULL,5),
(t,'Sie möchten das Museum besuchen.','They would like to visit the museum.','möchten','sie/Sie',NULL,6),
(t,'Ich möchte bitte die Rechnung.','I would like the bill, please.','möchte','ich',NULL,7),
(t,'Was möchten Sie trinken?','What would you like to drink?','möchten','sie/Sie',NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. IMPERATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'The Imperative (Commands)',
  'imperativ-du-ihr-sie',
  'A1',
  'verb_conjugation',
  'German has three imperative forms depending on who you address:

| Form | How to form | Example (kommen) |
|------|------------|-----------------|
| **du** | Verb stem (drop -en); -e optional | Komm! / Komme! |
| **ihr** | Same as ihr conjugation | Kommt! |
| **Sie** | Infinitive + Sie | Kommen Sie! |

Strong verbs with **e→i** change keep the change: geben → **Gib!**
Note: the du-imperative often drops the final -e: mach**e** → **Mach!**',
  1180
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Komm sofort her!','Come here immediately!','Komm',NULL,NULL,1),
(t,'Macht bitte die Tür zu!','Please close the door!','Macht',NULL,NULL,2),
(t,'Sprechen Sie bitte langsamer!','Please speak more slowly!','Sprechen',NULL,NULL,3),
(t,'Iss dein Gemüse!','Eat your vegetables!','Iss',NULL,NULL,4),
(t,'Hört mir zu!','Listen to me!','Hört',NULL,NULL,5),
(t,'Geben Sie mir bitte den Schlüssel.','Please give me the key.','Geben',NULL,NULL,6),
(t,'Lern die Vokabeln!','Learn the vocabulary!','Lern',NULL,NULL,7),
(t,'Seien Sie bitte ruhig!','Please be quiet!','Seien',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 20. UNREGELMÄSSIGE VERBEN PRÄSENS (e→i/ie)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Irregular Verbs: Vowel Change e→i / e→ie',
  'unregelmaessige-verben-praesens',
  'A1',
  'verb_conjugation',
  'Some common German verbs change their stem vowel in the **du** and **er/sie/es** forms only.

**e → i:**
| Verb | du | er/sie/es |
|------|----|----------|
| essen (eat) | isst | isst |
| geben (give) | gibst | gibt |
| nehmen (take) | nimmst | nimmt |

**e → ie:**
| Verb | du | er/sie/es |
|------|----|----------|
| lesen (read) | liest | liest |
| sehen (see) | siehst | sieht |

The ich, wir, ihr, sie forms stay regular.',
  1190
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Er isst gerne Pizza.','He likes eating pizza.','isst',NULL,NULL,1),
(t,'Sie liest jeden Abend.','She reads every evening.','liest',NULL,NULL,2),
(t,'Du gibst ihm das Buch.','You give him the book.','gibst',NULL,NULL,3),
(t,'Er sieht den Film nicht.','He is not watching the film.','sieht',NULL,NULL,4),
(t,'Du nimmst den Bus, oder?','You are taking the bus, right?','nimmst',NULL,NULL,5),
(t,'Was isst du zum Frühstück?','What do you eat for breakfast?','isst',NULL,NULL,6),
(t,'Er nimmt zwei Tabletten täglich.','He takes two tablets daily.','nimmt',NULL,NULL,7),
(t,'Du siehst müde aus.','You look tired.','siehst',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 21. TRENNBARE VERBEN + SATZKLAMMER
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Separable Verbs & the Sentence Bracket',
  'trennbare-verben-satzklammer',
  'A1',
  'verb_conjugation',
  '**Separable verbs** have a prefix that splits off and goes to the **end of the sentence**.

**Structure:** Conjugated verb (pos. 2) ... prefix (end)

| Infinitive | Example |
|-----------|---------|
| auf**machen** (open) | Ich mache die Tür **auf**. |
| an**rufen** (call) | Er ruft seine Mutter **an**. |
| ab**fahren** (depart) | Der Zug fährt um 8 Uhr **ab**. |
| mit**kommen** (come along) | Kommst du **mit**? |
| auf**stehen** (get up) | Ich stehe um 7 Uhr **auf**. |

The conjugated verb and prefix form a **Satzklammer** (sentence bracket).',
  1200
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich mache die Tür auf.','I open the door.','auf',NULL,NULL,1),
(t,'Er ruft seine Mutter an.','He calls his mother.','an',NULL,NULL,2),
(t,'Wann fährt der Zug ab?','When does the train depart?','ab',NULL,NULL,3),
(t,'Kommst du mit?','Are you coming along?','mit',NULL,NULL,4),
(t,'Sie räumt ihr Zimmer auf.','She tidies her room.','auf',NULL,NULL,5),
(t,'Ich stehe jeden Morgen um sieben auf.','I get up at seven every morning.','auf',NULL,NULL,6),
(t,'Er macht das Licht an.','He switches the light on.','an',NULL,NULL,7),
(t,'Der Bus kommt um drei Uhr an.','The bus arrives at three o''clock.','an',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 22. NEGATION MIT NICHT
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Negation with nicht',
  'negation-mit-nicht',
  'A1',
  'sentence_structure',
  '**Nicht** negates verbs, adjectives, adverbs, and definite-article nouns.

**Position rules:**
- Before adjectives/adverbs: Das Essen ist **nicht** gut.
- Before a prepositional phrase: Ich gehe **nicht** in die Schule.
- Before a second verb (infinitive/participle): Ich kann **nicht** kommen.
- At the **end** of a simple statement: Ich schlafe **nicht**.

**Nicht vs. Kein:**
- Use **kein** to negate nouns: Ich habe kein Geld.
- Use **nicht** for everything else.',
  1210
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich schlafe nicht.','I am not sleeping.','nicht',NULL,NULL,1),
(t,'Das ist nicht richtig.','That is not correct.','nicht',NULL,NULL,2),
(t,'Er kommt heute nicht.','He is not coming today.','nicht',NULL,NULL,3),
(t,'Sie kann nicht schwimmen.','She cannot swim.','nicht',NULL,NULL,4),
(t,'Ich gehe nicht in die Schule.','I am not going to school.','nicht',NULL,NULL,5),
(t,'Das Essen ist nicht gut.','The food is not good.','nicht',NULL,NULL,6),
(t,'Wir fahren nicht nach Berlin.','We are not going to Berlin.','nicht',NULL,NULL,7),
(t,'Du arbeitest nicht genug.','You are not working enough.','nicht',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 23. NICHT / SEHR / ZU
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Degree Modifiers: nicht / sehr / zu',
  'nicht-sehr-zu',
  'A1',
  'sentence_structure',
  'These three words modify the strength of adjectives and adverbs:

| Word | Meaning | Example |
|------|---------|---------|
| **sehr** | very | Das ist **sehr** gut. |
| **zu** | too (negative excess) | Das ist **zu** teuer. |
| **nicht** | not | Das ist **nicht** gut. |

**Zu** implies it exceeds an acceptable limit: too hot to drink, too expensive to buy.
**Sehr** is neutral positive emphasis with no negative connotation.',
  1220
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Das ist sehr interessant.','That is very interesting.','sehr',NULL,NULL,1),
(t,'Der Kaffee ist zu heiß.','The coffee is too hot.','zu',NULL,NULL,2),
(t,'Das ist nicht richtig.','That is not correct.','nicht',NULL,NULL,3),
(t,'Er ist sehr müde.','He is very tired.','sehr',NULL,NULL,4),
(t,'Die Schuhe sind zu klein.','The shoes are too small.','zu',NULL,NULL,5),
(t,'Das Essen ist nicht gut.','The food is not good.','nicht',NULL,NULL,6),
(t,'Sie ist sehr freundlich.','She is very friendly.','sehr',NULL,NULL,7),
(t,'Das ist zu viel für mich.','That is too much for me.','zu',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 24. PERFEKT MIT HABEN – REGELMÄSSIG
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Perfekt: haben + regular Partizip II',
  'perfekt-haben-regelmaessig',
  'A1',
  'past_tense',
  'The **Perfekt** is the main past tense in spoken German.
**Structure:** Subject + haben (conjugated, pos. 2) + ... + Partizip II (end)

**Regular Partizip II** = **ge- + stem + -t**
- machen → ge**mach**t
- spielen → ge**spiel**t
- kaufen → ge**kauf**t
- kochen → ge**koch**t

Example: Ich habe gestern Fußball **gespielt**. (I played football yesterday.)',
  1230
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe gestern Fußball gespielt.','I played football yesterday.','gespielt',NULL,'perfekt',1),
(t,'Sie hat das Buch gekauft.','She bought the book.','gekauft',NULL,'perfekt',2),
(t,'Wir haben das Zimmer geputzt.','We cleaned the room.','geputzt',NULL,'perfekt',3),
(t,'Du hast sehr gut gekocht.','You cooked very well.','gekocht',NULL,'perfekt',4),
(t,'Ich habe meine Hausaufgaben gemacht.','I did my homework.','gemacht',NULL,'perfekt',5),
(t,'Ihr habt lange geschlafen.','You all slept for a long time.','geschlafen',NULL,'perfekt',6),
(t,'Er hat viel gearbeitet.','He worked a lot.','gearbeitet',NULL,'perfekt',7),
(t,'Sie haben das Essen bestellt.','They ordered the food.','bestellt',NULL,'perfekt',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 25. PERFEKT MIT HABEN – UNREGELMÄSSIG
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Perfekt: haben + irregular Partizip II',
  'perfekt-haben-unregelmaessig',
  'A1',
  'past_tense',
  'Strong (irregular) verbs form their Partizip II with **ge- + changed stem + -en**:

| Infinitive | Partizip II |
|-----------|------------|
| schreiben | ge**schrieb**en |
| trinken | ge**trunk**en |
| essen | ge**gess**en |
| nehmen | ge**nomm**en |
| sehen | ge**seh**en |
| lesen | ge**les**en |

The vowel in the stem often changes. These must be memorised individually.',
  1240
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe das Buch gelesen.','I read the book.','gelesen',NULL,'perfekt',1),
(t,'Er hat viel Wasser getrunken.','He drank a lot of water.','getrunken',NULL,'perfekt',2),
(t,'Sie hat Pizza gegessen.','She ate pizza.','gegessen',NULL,'perfekt',3),
(t,'Wir haben den Film gesehen.','We watched the film.','gesehen',NULL,'perfekt',4),
(t,'Du hast den Brief geschrieben.','You wrote the letter.','geschrieben',NULL,'perfekt',5),
(t,'Er hat das Geld genommen.','He took the money.','genommen',NULL,'perfekt',6),
(t,'Ich habe ihn angerufen.','I called him.','angerufen',NULL,'perfekt',7),
(t,'Sie haben viel gefunden.','They found a lot.','gefunden',NULL,'perfekt',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 26. PERFEKT MIT SEIN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Perfekt with sein (movement & change of state)',
  'perfekt-mit-sein',
  'A1',
  'past_tense',
  'Verbs of **movement** and **change of state** use **sein** (not haben) in the Perfekt.

**Common sein-verbs:**
| Infinitive | Partizip II |
|-----------|------------|
| gehen | ge**gang**en |
| kommen | ge**komm**en |
| fahren | ge**fahr**en |
| laufen | ge**lauf**en |
| bleiben | ge**blieb**en |
| aufstehen | auf**ge**standen |

Structure: Subject + **sein** (conjugated) + ... + Partizip II
Example: Ich **bin** nach Berlin **gefahren**.',
  1250
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich bin nach Berlin gefahren.','I went to Berlin.','bin',NULL,'perfekt',1),
(t,'Er ist gestern gekommen.','He came yesterday.','ist',NULL,'perfekt',2),
(t,'Wir sind ins Kino gegangen.','We went to the cinema.','sind',NULL,'perfekt',3),
(t,'Sie ist früh aufgestanden.','She got up early.','ist',NULL,'perfekt',4),
(t,'Ich bin zu Fuß gelaufen.','I walked on foot.','bin',NULL,'perfekt',5),
(t,'Er ist in Berlin geblieben.','He stayed in Berlin.','ist',NULL,'perfekt',6),
(t,'Die Kinder sind nach Hause gegangen.','The children went home.','sind',NULL,'perfekt',7),
(t,'Ich bin um sieben aufgewacht.','I woke up at seven.','bin',NULL,'perfekt',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 27. PERFEKT – TRENNBARE VERBEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Perfekt: Separable Verbs (ge- between prefix and stem)',
  'perfekt-trennbare-verben',
  'A1',
  'past_tense',
  'For separable verbs, the **ge-** goes **between** the prefix and the stem:

**Prefix + ge + stem + t/en**

| Infinitive | Partizip II |
|-----------|------------|
| aufräumen | auf**ge**räumt |
| anrufen | an**ge**rufen |
| aufmachen | auf**ge**macht |
| einkaufen | ein**ge**kauft |
| aufstehen | auf**ge**standen |

Example: Ich habe das Zimmer **aufgeräumt**. (I tidied the room.)',
  1260
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe mein Zimmer aufgeräumt.','I tidied my room.','aufgeräumt',NULL,'perfekt',1),
(t,'Er hat seine Mutter angerufen.','He called his mother.','angerufen',NULL,'perfekt',2),
(t,'Wir haben gestern eingekauft.','We went shopping yesterday.','eingekauft',NULL,'perfekt',3),
(t,'Der Zug ist um acht abgefahren.','The train departed at eight.','abgefahren',NULL,'perfekt',4),
(t,'Sie hat das Fenster aufgemacht.','She opened the window.','aufgemacht',NULL,'perfekt',5),
(t,'Ich bin früh aufgestanden.','I got up early.','aufgestanden',NULL,'perfekt',6),
(t,'Er hat das Licht ausgemacht.','He switched the light off.','ausgemacht',NULL,'perfekt',7),
(t,'Wir haben mitgemacht.','We joined in.','mitgemacht',NULL,'perfekt',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 28. PERFEKT – UNTRENNBARE VERBEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Perfekt: Inseparable Verbs (no ge-)',
  'perfekt-untrennbare-verben',
  'A1',
  'past_tense',
  'Verbs with inseparable prefixes (**be-, ent-, er-, ver-, ge-, zer-, miss-**) do **NOT** add **ge-** in the Partizip II.

| Infinitive | Partizip II |
|-----------|------------|
| besuchen | besucht |
| bezahlen | bezahlt |
| verstehen | verstanden |
| erzählen | erzählt |
| vergessen | vergessen |
| erklären | erklärt |

How to recognise them: the prefix is unstressed and cannot be separated from the verb.',
  1270
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe meine Oma besucht.','I visited my grandmother.','besucht',NULL,'perfekt',1),
(t,'Er hat die Rechnung bezahlt.','He paid the bill.','bezahlt',NULL,'perfekt',2),
(t,'Hast du alles verstanden?','Did you understand everything?','verstanden',NULL,'perfekt',3),
(t,'Sie hat die Geschichte erzählt.','She told the story.','erzählt',NULL,'perfekt',4),
(t,'Ich habe meinen Schlüssel vergessen.','I forgot my key.','vergessen',NULL,'perfekt',5),
(t,'Er hat die Aufgabe erklärt.','He explained the task.','erklärt',NULL,'perfekt',6),
(t,'Wir haben viel erlebt.','We experienced a lot.','erlebt',NULL,'perfekt',7),
(t,'Sie hat die E-Mail erhalten.','She received the email.','erhalten',NULL,'perfekt',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 29. PARTIZIP II DER -IEREN-VERBEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Partizip II of -ieren Verbs (no ge-)',
  'partizip-ii-ieren-verben',
  'A1',
  'past_tense',
  'Verbs ending in **-ieren** (mostly borrowed from French/Latin) do **NOT** add **ge-** in the Partizip II.

**Pattern:** verb stem + **t** (no ge-)

| Infinitive | Partizip II |
|-----------|------------|
| trainieren | trainiert |
| telefonieren | telefoniert |
| studieren | studiert |
| fotografieren | fotografiert |
| reparieren | repariert |
| reservieren | reserviert |

These are easy to recognise — and easy to form!',
  1280
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe heute trainiert.','I trained today.','trainiert',NULL,'perfekt',1),
(t,'Er hat lange telefoniert.','He was on the phone for a long time.','telefoniert',NULL,'perfekt',2),
(t,'Sie hat in Berlin studiert.','She studied in Berlin.','studiert',NULL,'perfekt',3),
(t,'Ich habe das Auto repariert.','I repaired the car.','repariert',NULL,'perfekt',4),
(t,'Hast du einen Tisch reserviert?','Did you reserve a table?','reserviert',NULL,'perfekt',5),
(t,'Wir haben viel fotografiert.','We took a lot of photos.','fotografiert',NULL,'perfekt',6),
(t,'Er hat das Projekt organisiert.','He organised the project.','organisiert',NULL,'perfekt',7),
(t,'Sie haben gut reagiert.','They reacted well.','reagiert',NULL,'perfekt',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 30. PRÄTERITUM: SEIN/HABEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Simple Past: war (sein) and hatte (haben)',
  'praeteritum-sein-haben',
  'A1',
  'past_tense',
  'In spoken German, **sein** and **haben** commonly use the **Präteritum** (simple past) rather than the Perfekt.

**sein → war:**
| ich | du | er/sie/es | wir | ihr | sie/Sie |
|----|-----|----------|-----|-----|--------|
| war | warst | war | waren | wart | waren |

**haben → hatte:**
| ich | du | er/sie/es | wir | ihr | sie/Sie |
|----|-----|----------|-----|-----|--------|
| hatte | hattest | hatte | hatten | hattet | hatten |

Memorise these immediately — they appear in almost every conversation.',
  1290
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich war gestern sehr müde.','I was very tired yesterday.','war','ich','präteritum',1),
(t,'Du warst zu spät.','You were too late.','warst','du','präteritum',2),
(t,'Er war in Berlin.','He was in Berlin.','war','er/sie/es','präteritum',3),
(t,'Wir waren zu Hause.','We were at home.','waren','wir','präteritum',4),
(t,'Ich hatte keine Zeit.','I had no time.','hatte','ich','präteritum',5),
(t,'Sie hatte Kopfschmerzen.','She had a headache.','hatte','er/sie/es','präteritum',6),
(t,'Wir hatten viel Spaß.','We had a lot of fun.','hatten','wir','präteritum',7),
(t,'Ihr wart sehr laut.','You all were very loud.','wart','ihr','präteritum',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 31. PERSONALPRONOMEN IM AKKUSATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Personal Pronouns in the Accusative',
  'personalpronomen-akkusativ',
  'A1',
  'pronouns',
  'Pronouns change form in the accusative (direct object):

| Nominative | Accusative | Meaning |
|-----------|-----------|---------|
| ich | **mich** | me |
| du | **dich** | you |
| er | **ihn** | him |
| sie | **sie** | her |
| es | **es** | it |
| wir | **uns** | us |
| ihr | **euch** | you (plural) |
| sie/Sie | **sie/Sie** | them/you (formal) |

Example: Er liebt **mich**. / Ich sehe **ihn**.',
  1300
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Er liebt mich.','He loves me.','mich',NULL,NULL,1),
(t,'Ich sehe ihn jeden Tag.','I see him every day.','ihn',NULL,NULL,2),
(t,'Kannst du mich hören?','Can you hear me?','mich',NULL,NULL,3),
(t,'Sie besucht uns morgen.','She is visiting us tomorrow.','uns',NULL,NULL,4),
(t,'Ich rufe dich später an.','I will call you later.','dich',NULL,NULL,5),
(t,'Wir kennen sie gut.','We know her well.','sie',NULL,NULL,6),
(t,'Er versteht euch nicht.','He does not understand you.','euch',NULL,NULL,7),
(t,'Sie mögen ihn sehr.','They like him a lot.','ihn',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 32. PERSONALPRONOMEN IM DATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Personal Pronouns in the Dative',
  'personalpronomen-dativ',
  'A1',
  'pronouns',
  'Pronouns in the dative (indirect object):

| Nominative | Dative | Meaning |
|-----------|-------|---------|
| ich | **mir** | (to) me |
| du | **dir** | (to) you |
| er | **ihm** | (to) him |
| sie | **ihr** | (to) her |
| es | **ihm** | (to) it |
| wir | **uns** | (to) us |
| ihr | **euch** | (to) you (plural) |
| sie/Sie | **ihnen/Ihnen** | (to) them/you |

Example: Kannst du **mir** helfen? (Can you help me?)',
  1310
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Kannst du mir helfen?','Can you help me?','mir',NULL,NULL,1),
(t,'Ich gebe ihm das Buch.','I give him the book.','ihm',NULL,NULL,2),
(t,'Sie dankt ihr für das Geschenk.','She thanks her for the gift.','ihr',NULL,NULL,3),
(t,'Er schreibt uns eine Nachricht.','He writes us a message.','uns',NULL,NULL,4),
(t,'Das gehört mir.','That belongs to me.','mir',NULL,NULL,5),
(t,'Wie geht es dir?','How are you?','dir',NULL,NULL,6),
(t,'Ich kaufe ihnen ein Eis.','I am buying them an ice cream.','ihnen',NULL,NULL,7),
(t,'Das macht mir Spaß.','That is fun for me.','mir',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 33. PRONOMEN MAN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Impersonal Pronoun: man (one / people)',
  'pronomen-man',
  'A1',
  'pronouns',
  '**Man** is an impersonal pronoun meaning "one / you / people in general". It always uses the **er/sie/es** verb form.

Uses:
- General rules: Man muss hier warten. (You have to wait here.)
- Polite instructions: Hier kann man parken. (One can park here.)
- General statements: In Deutschland trinkt man viel Bier.

Note: **man** ≠ **Mann** (man = the noun "man/husband"). They look similar but are different words.',
  1320
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Hier kann man parken.','You can park here.','man',NULL,NULL,1),
(t,'Man darf hier nicht rauchen.','You are not allowed to smoke here.','man',NULL,NULL,2),
(t,'In Deutschland isst man viel Brot.','In Germany people eat a lot of bread.','man',NULL,NULL,3),
(t,'Man lernt nie aus.','You are never done learning.','man',NULL,NULL,4),
(t,'Man muss früh aufstehen.','One has to get up early.','man',NULL,NULL,5),
(t,'Was kann man hier machen?','What can one do here?','man',NULL,NULL,6),
(t,'Man sagt, Berlin ist toll.','They say Berlin is great.','man',NULL,NULL,7),
(t,'Man sollte mehr schlafen.','One should sleep more.','man',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 34. GENITIV-S (EIGENNAMEN)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Genitive -s with Proper Names',
  'genitiv-s-eigennamen',
  'A1',
  'cases',
  'With **proper names**, German adds **-s** directly to show possession — like English ''s but **without an apostrophe**:

- **Pauls** Auto (Paul''s car)
- **Marias** Buch (Maria''s book)
- **Berlins** Mitte (the centre of Berlin)

If the name already ends in **-s, -z, or -x**, add an apostrophe only:
- **Klaus''** Freund (Klaus''s friend)

This is the main genitive form at A1 level.',
  1330
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Das ist Pauls Auto.','That is Paul''s car.','Pauls',NULL,NULL,1),
(t,'Marias Buch ist sehr interessant.','Maria''s book is very interesting.','Marias',NULL,NULL,2),
(t,'Das ist Annas Jacke.','That is Anna''s jacket.','Annas',NULL,NULL,3),
(t,'Berlins Museen sind weltbekannt.','Berlin''s museums are world-famous.','Berlins',NULL,NULL,4),
(t,'Das ist Toms Fahrrad.','That is Tom''s bicycle.','Toms',NULL,NULL,5),
(t,'Lisas Mutter ist Ärztin.','Lisa''s mother is a doctor.','Lisas',NULL,NULL,6),
(t,'Das ist Peters Zimmer.','That is Peter''s room.','Peters',NULL,NULL,7),
(t,'Deutschlands Hauptstadt ist Berlin.','Germany''s capital is Berlin.','Deutschlands',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 35. PRÄPOSITIONEN MIT DATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Prepositions Always Taking the Dative',
  'praepositionen-mit-dativ',
  'A1',
  'prepositions',
  'These prepositions **always** take the dative case:

| Preposition | Meaning | Example |
|------------|---------|---------|
| **aus** | from / out of | aus der Schweiz |
| **bei** | at / near / with | bei meiner Mutter |
| **mit** | with | mit dem Bus |
| **nach** | to (cities/countries) / after | nach Berlin |
| **seit** | since / for (time) | seit einem Jahr |
| **von** | from / of / by | von der Arbeit |
| **zu** | to (people/places) | zum Arzt |
| **gegenüber** | opposite | gegenüber dem Bahnhof |

Memory aid: **aus, bei, mit, nach, seit, von, zu** — learn these seven by heart.',
  1340
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich komme aus der Schweiz.','I come from Switzerland.','aus',NULL,NULL,1),
(t,'Ich fahre mit dem Bus.','I am going by bus.','mit',NULL,NULL,2),
(t,'Wir essen nach dem Film.','We eat after the film.','nach',NULL,NULL,3),
(t,'Ich lerne seit einem Jahr Deutsch.','I have been learning German for one year.','seit',NULL,NULL,4),
(t,'Er kommt von der Arbeit.','He is coming from work.','von',NULL,NULL,5),
(t,'Ich bin bei meiner Mutter.','I am at my mother''s.','bei',NULL,NULL,6),
(t,'Ich gehe zum Arzt.','I am going to the doctor.','zum',NULL,NULL,7),
(t,'Das Café ist gegenüber dem Bahnhof.','The café is opposite the train station.','gegenüber',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 36. ARTIKELVERSCHMELZUNGEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Contracted Articles (Verschmelzungen)',
  'artikelverschmelzungen',
  'A1',
  'prepositions',
  'Certain prepositions contract with the definite article **dem** and **das**:

| Full form | Contraction |
|-----------|------------|
| an + dem | **am** |
| an + das | **ans** |
| bei + dem | **beim** |
| in + dem | **im** |
| in + das | **ins** |
| von + dem | **vom** |
| zu + dem | **zum** |
| zu + der | **zur** |

These contractions are standard and mandatory in everyday German.
Example: Ich gehe **ins** Kino. (NOT: in das Kino)',
  1350
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich gehe ins Kino.','I am going to the cinema.','ins',NULL,NULL,1),
(t,'Er ist beim Arzt.','He is at the doctor''s.','beim',NULL,NULL,2),
(t,'Wir treffen uns am Bahnhof.','We are meeting at the train station.','am',NULL,NULL,3),
(t,'Ich fahre zum Supermarkt.','I am going to the supermarket.','zum',NULL,NULL,4),
(t,'Sie geht zur Schule.','She is going to school.','zur',NULL,NULL,5),
(t,'Er kommt vom Sport.','He is coming from the gym.','vom',NULL,NULL,6),
(t,'Wir sind im Park.','We are in the park.','im',NULL,NULL,7),
(t,'Das Kind geht ans Fenster.','The child goes to the window.','ans',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 37. LOKALE PRÄPOSITIONEN + DATIV (WO?)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Location Prepositions with Dative (Wo? — Where?)',
  'lokale-praepositionen-dativ-wo',
  'A1',
  'prepositions',
  'To describe **where something is** (Wo?), these two-way prepositions use the **dative**:

| Preposition | With dative (Wo?) | Example |
|------------|------------------|---------|
| **in** | im (in + dem) | im Zimmer |
| **an** | am (an + dem) | am Fenster |
| **auf** | auf dem | auf dem Tisch |
| **unter** | unter dem | unter dem Bett |
| **über** | über dem | über dem Tisch |
| **vor** | vor der/dem | vor der Tür |
| **hinter** | hinter dem | hinter dem Haus |
| **neben** | neben dem | neben dem Stuhl |
| **zwischen** | zwischen den | zwischen den Stühlen |',
  1360
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Das Buch liegt auf dem Tisch.','The book is on the table.','auf',NULL,NULL,1),
(t,'Die Katze sitzt unter dem Stuhl.','The cat is sitting under the chair.','unter',NULL,NULL,2),
(t,'Er steht vor der Tür.','He is standing in front of the door.','vor',NULL,NULL,3),
(t,'Das Bild hängt über dem Sofa.','The picture is hanging above the sofa.','über',NULL,NULL,4),
(t,'Die Schlüssel liegen neben der Tasche.','The keys are next to the bag.','neben',NULL,NULL,5),
(t,'Die Kinder spielen im Garten.','The children are playing in the garden.','im',NULL,NULL,6),
(t,'Der Hund schläft hinter dem Haus.','The dog sleeps behind the house.','hinter',NULL,NULL,7),
(t,'Das Café ist zwischen dem Park und dem Bahnhof.','The café is between the park and the station.','zwischen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 38. PRÄPOSITIONEN MIT AKKUSATIV (OHNE/FÜR/DURCH/GEGEN/UM)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Prepositions Always Taking the Accusative',
  'praepositionen-mit-akkusativ',
  'A1',
  'prepositions',
  'These prepositions **always** take the accusative case:

| Preposition | Meaning | Example |
|------------|---------|---------|
| **durch** | through | durch den Park |
| **für** | for | für meinen Freund |
| **gegen** | against / around (approx. time) | gegen den Wind |
| **ohne** | without | ohne das Auto |
| **um** | around / at (clock time) | um den See |

Memory tip: **durch, für, gegen, ohne, um** — always accusative.',
  1370
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich kaufe das Geschenk für meinen Vater.','I am buying the gift for my father.','für',NULL,NULL,1),
(t,'Er geht durch den Park.','He walks through the park.','durch',NULL,NULL,2),
(t,'Ich gehe ohne mein Handy aus.','I go out without my mobile phone.','ohne',NULL,NULL,3),
(t,'Wir laufen um den See.','We run around the lake.','um',NULL,NULL,4),
(t,'Das Medikament hilft gegen den Schmerz.','The medicine helps against the pain.','gegen',NULL,NULL,5),
(t,'Das ist ein Geschenk für dich.','That is a gift for you.','für',NULL,NULL,6),
(t,'Ich kann nicht ohne dich leben.','I cannot live without you.','ohne',NULL,NULL,7),
(t,'Wir fahren durch die Stadt.','We drive through the city.','durch',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 39. WOHIN? PRÄPOSITIONEN + AKKUSATIV
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Direction Prepositions with Accusative (Wohin? — Where to?)',
  'wohin-praepositionen-akkusativ',
  'A1',
  'prepositions',
  'To describe **where you are going** (Wohin?), two-way prepositions use the **accusative**:

| Preposition | With accusative (Wohin?) | Example |
|------------|------------------------|---------|
| **in** | in + den/die/das | in die Stadt |
| **an** | an + den/die/das | ans Meer |
| **auf** | auf + den/die/das | auf den Tisch |

Key: **nach** is used for cities and most countries (nach Berlin, nach Deutschland).
**In die** is used for feminine/plural countries: in die Türkei, in die USA.',
  1380
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich gehe in die Stadt.','I am going into town.','in',NULL,NULL,1),
(t,'Wir fahren nach Berlin.','We are going to Berlin.','nach',NULL,NULL,2),
(t,'Er legt das Buch auf den Tisch.','He puts the book on the table.','auf',NULL,NULL,3),
(t,'Sie fährt in die Türkei.','She is going to Turkey.','in',NULL,NULL,4),
(t,'Die Kinder laufen in den Garten.','The children run into the garden.','in',NULL,NULL,5),
(t,'Ich gehe ans Meer.','I am going to the sea.','ans',NULL,NULL,6),
(t,'Er stellt das Glas auf den Tisch.','He puts the glass on the table.','auf',NULL,NULL,7),
(t,'Wir gehen in den Supermarkt.','We are going into the supermarket.','in',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 40. LOKALE PRÄPOSITIONEN WO? VS. WOHIN?
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Wo? vs. Wohin? — Dative vs. Accusative with Two-Way Prepositions',
  'lokale-praepositionen-wo-wohin',
  'A1',
  'prepositions',
  'Two-way prepositions (in, an, auf, unter, über, vor, hinter, neben, zwischen) use **two different cases**:

| Question | Case | Example |
|---------|------|---------|
| **Wo?** (where?) | **Dative** | Das Buch liegt **auf dem** Tisch. |
| **Wohin?** (where to?) | **Accusative** | Ich lege das Buch **auf den** Tisch. |

Simple rule: **Dative = static (sitting/lying/being); Accusative = movement into a position**.',
  1390
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Das Buch liegt auf dem Tisch.','The book is on the table (location).','dem',NULL,NULL,1),
(t,'Ich lege das Buch auf den Tisch.','I put the book onto the table (direction).','den',NULL,NULL,2),
(t,'Die Katze sitzt in der Küche.','The cat is sitting in the kitchen.','der',NULL,NULL,3),
(t,'Die Katze geht in die Küche.','The cat goes into the kitchen.','die',NULL,NULL,4),
(t,'Er hängt das Bild an die Wand.','He hangs the picture on the wall.','die',NULL,NULL,5),
(t,'Das Bild hängt an der Wand.','The picture is hanging on the wall.','der',NULL,NULL,6),
(t,'Wir sitzen im Garten.','We are sitting in the garden.','im',NULL,NULL,7),
(t,'Wir gehen in den Garten.','We go into the garden.','den',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 41. ZEITPRÄPOSITIONEN AM/IM/UM
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Time Prepositions: am / im / um',
  'zeitpraepositionen-am-im-um',
  'A1',
  'prepositions',
  'Use different prepositions for different time expressions:

| Preposition | Used for | Example |
|------------|---------|---------|
| **um** | exact clock times | **um** 9 Uhr |
| **am** | days and parts of day | **am** Montag, **am** Abend |
| **im** | months and seasons | **im** Juni, **im** Winter |

More time phrases:
- **am Wochenende** (at the weekend)
- **um Mitternacht** (at midnight)
- **im Moment** (at the moment)',
  1400
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Der Zug kommt um 9 Uhr an.','The train arrives at 9 o''clock.','um',NULL,NULL,1),
(t,'Ich arbeite am Montag.','I work on Monday.','am',NULL,NULL,2),
(t,'Im Sommer fahren wir ans Meer.','In summer we go to the sea.','Im',NULL,NULL,3),
(t,'Am Wochenende schlafe ich lange.','At the weekend I sleep in.','Am',NULL,NULL,4),
(t,'Der Kurs beginnt im September.','The course begins in September.','im',NULL,NULL,5),
(t,'Wir treffen uns um halb drei.','We are meeting at half past two.','um',NULL,NULL,6),
(t,'Am Abend gehe ich spazieren.','In the evening I go for a walk.','Am',NULL,NULL,7),
(t,'Im Frühling blühen die Blumen.','In spring the flowers bloom.','Im',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 42. VERBEN MIT DATIVOBJEKT
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Verbs that Take a Dative Object',
  'verben-mit-dativobjekt',
  'A1',
  'verb_usage',
  'Some German verbs always take their object in the **dative** (not accusative):

| Verb | Meaning | Example |
|------|---------|---------|
| **helfen** | to help | Ich helfe **dem** Mann. |
| **gefallen** | to please / to like | Das gefällt **mir**. |
| **passen** | to fit / suit | Das passt **dir** gut. |
| **gehören** | to belong to | Das gehört **mir**. |
| **danken** | to thank | Er dankt **ihr**. |
| **fehlen** | to be missing / to miss | Du fehlst **mir**. |

Tip: you cannot "translate" these directly from English — just learn which verbs take dative.',
  1410
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich helfe meiner Mutter.','I help my mother.','meiner',NULL,NULL,1),
(t,'Das gefällt mir sehr gut.','I like that very much.','mir',NULL,NULL,2),
(t,'Diese Jacke passt mir nicht.','This jacket does not fit me.','mir',NULL,NULL,3),
(t,'Das Buch gehört ihm.','The book belongs to him.','ihm',NULL,NULL,4),
(t,'Er dankt ihr für das Geschenk.','He thanks her for the gift.','ihr',NULL,NULL,5),
(t,'Du fehlst mir sehr.','I miss you a lot.','mir',NULL,NULL,6),
(t,'Antworte dem Lehrer!','Answer the teacher!','dem',NULL,NULL,7),
(t,'Wie gefällt es Ihnen hier?','How do you like it here? (formal)','Ihnen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 43. KONJUNKTIONEN UND/ODER/ABER/DENN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Coordinating Conjunctions: und / oder / aber / denn',
  'konjunktionen-und-oder-aber-denn',
  'A1',
  'sentence_structure',
  'These conjunctions connect two main clauses. The **verb stays in position 2** in each clause.

| Conjunction | Meaning | Example |
|------------|---------|---------|
| **und** | and | Ich lerne Deutsch **und** ich lese viel. |
| **oder** | or | Möchtest du Kaffee **oder** Tee? |
| **aber** | but | Er ist müde, **aber** er arbeitet. |
| **denn** | because | Ich lerne, **denn** es ist wichtig. |

Note: **denn** does NOT send the verb to the end (unlike **weil**). Both mean "because" but **denn** is coordinating.',
  1420
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich lerne Deutsch und ich höre Musik.','I learn German and I listen to music.','und',NULL,NULL,1),
(t,'Möchtest du Kaffee oder Tee?','Would you like coffee or tea?','oder',NULL,NULL,2),
(t,'Er ist müde, aber er arbeitet.','He is tired but he works.','aber',NULL,NULL,3),
(t,'Ich lerne viel, denn die Prüfung ist morgen.','I study a lot because the exam is tomorrow.','denn',NULL,NULL,4),
(t,'Sie kommt nicht, denn sie ist krank.','She is not coming because she is ill.','denn',NULL,NULL,5),
(t,'Ich mag Sommer und Winter.','I like summer and winter.','und',NULL,NULL,6),
(t,'Kommst du mit oder bleibst du hier?','Are you coming along or staying here?','oder',NULL,NULL,7),
(t,'Das Essen ist gut, aber zu teuer.','The food is good but too expensive.','aber',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 44. JEDE/JEDER/JEDES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Every / Each: jede / jeder / jedes',
  'jede-jeder-jedes',
  'A1',
  'articles',
  '**Jede/jeder/jedes** means "every / each". It follows the same endings as **dieser/diese/dieses**:

| Gender | Nominative | Accusative |
|--------|-----------|-----------|
| Masculine | jede**r** | jede**n** |
| Feminine | jede | jede |
| Neuter | jede**s** | jede**s** |

Common expressions:
- **jeden Tag** (every day) — masculine accusative
- **jede Woche** (every week) — feminine
- **jedes Jahr** (every year) — neuter
- **jeden Morgen / Abend** — masculine accusative',
  1430
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich lerne jeden Tag Deutsch.','I study German every day.','jeden',NULL,NULL,1),
(t,'Sie geht jede Woche ins Fitnessstudio.','She goes to the gym every week.','jede',NULL,NULL,2),
(t,'Jedes Kind braucht Liebe.','Every child needs love.','Jedes',NULL,NULL,3),
(t,'Er trinkt jeden Morgen Kaffee.','He drinks coffee every morning.','jeden',NULL,NULL,4),
(t,'Jede Minute zählt.','Every minute counts.','Jede',NULL,NULL,5),
(t,'Wir feiern jedes Jahr Weihnachten.','We celebrate Christmas every year.','jedes',NULL,NULL,6),
(t,'Jeder Mensch macht Fehler.','Every person makes mistakes.','Jeder',NULL,NULL,7),
(t,'Ich dusche jeden Abend.','I shower every evening.','jeden',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 45. VERGLEICHE: SO...WIE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Comparisons: so ... wie (as ... as)',
  'vergleiche-so-wie',
  'A1',
  'adjectives',
  'To say two things are **equal**, use: **so + adjective + wie**

- Er ist **so** groß **wie** ich. (He is as tall as I am.)
- Das Buch ist **so** gut **wie** der Film. (The book is as good as the film.)

For **inequality**, use the comparative + **als**:
- Er ist **größer als** ich. (He is taller than I am.)

Note: the adjective between **so** and **wie** stays in its **base form**.',
  1440
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Er ist so groß wie ich.','He is as tall as I am.','wie',NULL,NULL,1),
(t,'Das Buch ist so interessant wie der Film.','The book is as interesting as the film.','wie',NULL,NULL,2),
(t,'Sie läuft so schnell wie er.','She runs as fast as he does.','wie',NULL,NULL,3),
(t,'Mein Bruder ist so alt wie du.','My brother is as old as you.','wie',NULL,NULL,4),
(t,'Die Suppe ist so heiß wie Feuer.','The soup is as hot as fire.','wie',NULL,NULL,5),
(t,'Deutsch ist nicht so schwer wie man denkt.','German is not as hard as people think.','wie',NULL,NULL,6),
(t,'Das Hotel ist so teuer wie das andere.','The hotel is as expensive as the other one.','wie',NULL,NULL,7),
(t,'Er singt so schön wie ein Profi.','He sings as beautifully as a professional.','wie',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 46. DATUMSANGABEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Dates (Datumsangaben)',
  'datumsangaben',
  'A1',
  'numbers',
  'German dates use ordinal numbers:

**Saying the date (nominative):**
- Es ist der **erste** Juni. (It is the 1st of June.)

**With "am" (dative — on a date):**
- Am **ersten** Juni. / Am **dritten** März.

**Writing:** 1. Juni, 3. März (the dot replaces the ordinal ending)

**Common ordinals:**
- 1st–2nd: erst-, zweit-
- 3rd: dritt-
- 4th–19th: add -t- (viert-, fünft-, sechst-...)
- 20th+: add -st- (zwanzigst-, dreißigst-...)',
  1450
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich habe am ersten Januar Geburtstag.','My birthday is on the first of January.','ersten',NULL,NULL,1),
(t,'Heute ist der dritte März.','Today is the third of March.','dritte',NULL,NULL,2),
(t,'Der Kurs beginnt am zwanzigsten September.','The course starts on the twentieth of September.','zwanzigsten',NULL,NULL,3),
(t,'Wir treffen uns am fünften Mai.','We are meeting on the fifth of May.','fünften',NULL,NULL,4),
(t,'Heute ist der zweite April.','Today is the second of April.','zweite',NULL,NULL,5),
(t,'Am dreißigsten April ist das Konzert.','The concert is on the thirtieth of April.','dreißigsten',NULL,NULL,6),
(t,'Welches Datum ist heute?','What is today''s date?','Datum',NULL,NULL,7),
(t,'Am zwölften Dezember feiern wir.','We are celebrating on the twelfth of December.','zwölften',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 47. FRAGEWÖRTER: WER/WEN/WEM
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Case Question Words: wer / wen / wem',
  'fragewörter-wer-wen-wem',
  'A1',
  'cases',
  '**Wer** (who) declines according to case:

| Case | Form | Use |
|------|------|-----|
| Nominative | **wer** | Wer ist das? (Who is that?) |
| Accusative | **wen** | Wen siehst du? (Who do you see?) |
| Dative | **wem** | Wem gibst du das? (Who are you giving that to?) |
| Genitive | **wessen** | Wessen Buch ist das? (Whose book is that?) |

The case depends on the verb:
- sehen → accusative → **wen**
- helfen → dative → **wem**',
  1460
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Wer ist das?','Who is that?','Wer',NULL,NULL,1),
(t,'Wen liebst du?','Who do you love?','Wen',NULL,NULL,2),
(t,'Wem gibst du das Geschenk?','Who are you giving the gift to?','Wem',NULL,NULL,3),
(t,'Wer kommt heute?','Who is coming today?','Wer',NULL,NULL,4),
(t,'Wen rufst du an?','Who are you calling?','Wen',NULL,NULL,5),
(t,'Wem hilfst du?','Who are you helping?','Wem',NULL,NULL,6),
(t,'Wer hat mein Buch?','Who has my book?','Wer',NULL,NULL,7),
(t,'Wen hast du getroffen?','Who did you meet?','Wen',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 48. NEBENSATZ MIT WEIL
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Subordinate Clauses with weil (because)',
  'nebensatz-mit-weil',
  'A1',
  'sentence_structure',
  '**Weil** (because) introduces a subordinate clause. The **verb moves to the end** of the weil-clause.

**Structure:** Main clause + , + weil + ... + **Verb (end)**
- Ich lerne Deutsch, **weil** es schön **ist**.
- Er kommt nicht, **weil** er krank **ist**.

Compare with **denn** (also "because"):
- denn = verb stays in position 2 (coordinating conjunction)
- weil = verb goes to the end (subordinating conjunction)

If weil-clause comes **first**: Weil er krank ist, **kommt** er nicht.',
  1470
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich lerne Deutsch, weil es schön ist.','I learn German because it is beautiful.','weil',NULL,NULL,1),
(t,'Er kommt nicht, weil er krank ist.','He is not coming because he is ill.','weil',NULL,NULL,2),
(t,'Sie bleibt zu Hause, weil das Wetter schlecht ist.','She stays home because the weather is bad.','weil',NULL,NULL,3),
(t,'Ich esse kein Fleisch, weil ich Vegetarier bin.','I don''t eat meat because I am vegetarian.','weil',NULL,NULL,4),
(t,'Wir fahren mit dem Zug, weil das Auto kaputt ist.','We are taking the train because the car is broken.','weil',NULL,NULL,5),
(t,'Er lernt viel, weil er die Prüfung bestehen möchte.','He studies a lot because he wants to pass the exam.','weil',NULL,NULL,6),
(t,'Ich mag Berlin, weil die Stadt so vielfältig ist.','I like Berlin because the city is so diverse.','weil',NULL,NULL,7),
(t,'Weil es regnet, bleiben wir drinnen.','Because it is raining, we stay inside.','weil',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 49. REFLEXIVPRONOMEN: SICH
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Reflexive Pronouns: sich',
  'reflexivpronomen-sich',
  'A1',
  'pronouns',
  'Reflexive verbs use a **reflexive pronoun** referring back to the subject.

| Person | Reflexive pronoun |
|--------|-----------------|
| ich | **mich** |
| du | **dich** |
| er/sie/es | **sich** |
| wir | **uns** |
| ihr | **euch** |
| sie/Sie | **sich** |

**Common reflexive verbs:**
- sich **anmelden** (to register): Ich melde **mich** an.
- sich **vorstellen** (to introduce oneself): Ich stelle **mich** vor.
- sich **fühlen** (to feel): Er fühlt **sich** gut.
- sich **freuen** (to be pleased): Wir freuen **uns**.',
  1480
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich melde mich für den Kurs an.','I am registering for the course.','mich',NULL,NULL,1),
(t,'Darf ich mich vorstellen?','May I introduce myself?','mich',NULL,NULL,2),
(t,'Er fühlt sich heute nicht gut.','He is not feeling well today.','sich',NULL,NULL,3),
(t,'Wir freuen uns auf den Urlaub.','We are looking forward to the holiday.','uns',NULL,NULL,4),
(t,'Du wäschst dich jeden Morgen.','You wash yourself every morning.','dich',NULL,NULL,5),
(t,'Sie setzt sich ans Fenster.','She sits down at the window.','sich',NULL,NULL,6),
(t,'Ich ärgere mich über den Stau.','I am annoyed about the traffic jam.','mich',NULL,NULL,7),
(t,'Wir unterhalten uns gut.','We have a good conversation.','uns',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 50. VERB WERDEN
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Verb: werden (to become / future auxiliary)',
  'verb-werden',
  'A1',
  'verb_conjugation',
  '"Werden" means **to become** and has an irregular conjugation with a vowel change in du/er:

| Person | Form |
|--------|------|
| ich | **werde** |
| du | **wirst** |
| er/sie/es | **wird** |
| wir | **werden** |
| ihr | **werdet** |
| sie/Sie | **werden** |

**Key uses:**
1. To become: Ich werde Ärztin. (I am becoming a doctor.)
2. Future tense (+ infinitive): Ich **werde** morgen kommen. (I will come tomorrow.)
3. Note: "es wird kalt" — the weather / state is becoming cold.',
  1490
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Ich werde Ärztin.','I am becoming a doctor.','werde','ich','präsens',1),
(t,'Du wirst immer besser.','You are getting better and better.','wirst','du','präsens',2),
(t,'Er wird morgen 30 Jahre alt.','He is turning 30 tomorrow.','wird','er/sie/es','präsens',3),
(t,'Wir werden das schaffen!','We will manage it!','werden','wir','präsens',4),
(t,'Ihr werdet das bereuen.','You will regret that.','werdet','ihr','präsens',5),
(t,'Was wirst du einmal?','What will you become one day?','wirst','du','präsens',6),
(t,'Es wird bald Frühling.','It is soon becoming spring.','wird','er/sie/es','präsens',7),
(t,'Sie werden sehr erfolgreich sein.','They will be very successful.','werden','sie/Sie','präsens',8);

-- ─────────────────────────────────────────────────────────────────────────────
-- B1: GANZ (separate topic)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'ganz — context-dependent intensifier',
  'ganz',
  'B1',
  'adverbs',
  '"Ganz" is tricky because its effect **depends on the adjective** it modifies:

**1. With non-laudatory positives (gut, schön, ordentlich) when unstressed → WEAKENS:**
- Das war ganz gut. = "That was pretty good / not bad." (weaker than just "gut")

**2. With negative adjectives (schlimm, schlecht, schrecklich) → STRENGTHENS:**
- Das war ganz schlimm. = "That was really terrible."

**3. With strong laudatory adjectives (wunderschön, toll, fantastisch) → STRENGTHENS:**
- Sie ist ganz wunderschön. = "She is absolutely beautiful."

**Rule of thumb:** When in doubt, use **ziemlich** — it is always safe and neutral.',
  2000
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Der Film war ganz gut.','The film was pretty good (not amazing).','ganz',NULL,NULL,1),
(t,'Das war ganz schlimm!','That was really terrible!','ganz',NULL,NULL,2),
(t,'Die Stadt ist ganz wunderschön.','The city is absolutely beautiful.','ganz',NULL,NULL,3),
(t,'Das Essen war ganz ordentlich.','The food was decent enough.','ganz',NULL,NULL,4),
(t,'Die Situation ist ganz schlecht.','The situation is really bad.','ganz',NULL,NULL,5),
(t,'Das Konzert war ganz fantastisch!','The concert was absolutely fantastic!','ganz',NULL,NULL,6),
(t,'Das war ganz okay, aber nicht toll.','That was okay but not great.','ganz',NULL,NULL,7),
(t,'Das Wetter war ganz schrecklich.','The weather was really dreadful.','ganz',NULL,NULL,8);

-- ─────────────────────────────────────────────────────────────────────────────
-- B1: ZIEMLICH (separate topic)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'ziemlich — neutral intensifier (quite / fairly)',
  'ziemlich',
  'B1',
  'adverbs',
  '"Ziemlich" means **quite / fairly / rather** — it is always a safe, neutral moderate-to-high degree intensifier. Unlike **ganz**, it never weakens or unexpectedly strengthens.

- Das Buch ist **ziemlich** interessant. (The book is quite interesting.)
- Er ist **ziemlich** müde. (He is fairly tired.)
- Das war **ziemlich** teuer. (That was rather expensive.)

**Ziemlich vs. ganz:**
→ When in doubt, always use **ziemlich**. The meaning is always predictable.',
  2010
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
(t,'Der Test war ziemlich schwierig.','The test was quite difficult.','ziemlich',NULL,NULL,1),
(t,'Er ist ziemlich müde nach der langen Reise.','He is fairly tired after the long journey.','ziemlich',NULL,NULL,2),
(t,'Das Restaurant ist ziemlich teuer.','The restaurant is rather expensive.','ziemlich',NULL,NULL,3),
(t,'Sie ist ziemlich gut in Mathe.','She is quite good at maths.','ziemlich',NULL,NULL,4),
(t,'Das Wetter ist heute ziemlich schlecht.','The weather is rather bad today.','ziemlich',NULL,NULL,5),
(t,'Der Film war ziemlich langweilig.','The film was quite boring.','ziemlich',NULL,NULL,6),
(t,'Ich bin ziemlich sicher, dass er kommt.','I am fairly sure that he is coming.','ziemlich',NULL,NULL,7),
(t,'Das ist ziemlich interessant.','That is quite interesting.','ziemlich',NULL,NULL,8);

END;
$$;
