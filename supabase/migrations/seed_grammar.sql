-- ─────────────────────────────────────────────────────────────────────────────
-- Grammar Seed Data
-- A1: 8 verb topics × 6 persons × 10 sentences = 480 sentences
-- B1: ganz vs. ziemlich (10 sentences)
-- Run AFTER add_grammar.sql
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE t UUID;
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRÄSENS: SEIN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: sein',
  'prasens-sein',
  'A1',
  'verb_conjugation',
  '"Sein" (to be) is one of the most irregular and important verbs in German.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **bin** |
| du | **bist** |
| er/sie/es | **ist** |
| wir | **sind** |
| ihr | **seid** |
| sie/Sie | **sind** |

Use "sein" to describe:
- **Identities:** Ich bin Lehrerin. (I am a teacher.)
- **Locations:** Wir sind in Berlin. (We are in Berlin.)
- **States:** Er ist müde. (He is tired.)

Note: "wir sind" and "sie/Sie sind" use the same form **sind**.',
  10
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich bin (1–10)
(t,'Ich bin Lehrer.','I am a teacher.','bin','ich','präsens',1),
(t,'Ich bin sehr müde.','I am very tired.','bin','ich','präsens',2),
(t,'Ich bin in Berlin.','I am in Berlin.','bin','ich','präsens',3),
(t,'Ich bin Student.','I am a student.','bin','ich','präsens',4),
(t,'Ich bin glücklich.','I am happy.','bin','ich','präsens',5),
(t,'Ich bin 25 Jahre alt.','I am 25 years old.','bin','ich','präsens',6),
(t,'Ich bin dein Freund.','I am your friend.','bin','ich','präsens',7),
(t,'Ich bin fertig.','I am done.','bin','ich','präsens',8),
(t,'Ich bin krank heute.','I am sick today.','bin','ich','präsens',9),
(t,'Ich bin aus Wien.','I am from Vienna.','bin','ich','präsens',10),
-- du bist (11–20)
(t,'Du bist sehr freundlich.','You are very friendly.','bist','du','präsens',11),
(t,'Du bist mein bester Freund.','You are my best friend.','bist','du','präsens',12),
(t,'Du bist heute früh hier.','You are here early today.','bist','du','präsens',13),
(t,'Du bist sehr kreativ.','You are very creative.','bist','du','präsens',14),
(t,'Du bist in der falschen Klasse.','You are in the wrong class.','bist','du','präsens',15),
(t,'Du bist nicht allein.','You are not alone.','bist','du','präsens',16),
(t,'Du bist wirklich lustig.','You are really funny.','bist','du','präsens',17),
(t,'Du bist zu früh.','You are too early.','bist','du','präsens',18),
(t,'Du bist die Beste!','You are the best!','bist','du','präsens',19),
(t,'Du bist sehr ruhig heute.','You are very quiet today.','bist','du','präsens',20),
-- er/sie/es ist (21–30)
(t,'Er ist mein Bruder.','He is my brother.','ist','er/sie/es','präsens',21),
(t,'Sie ist sehr schön.','She is very beautiful.','ist','er/sie/es','präsens',22),
(t,'Es ist kalt draußen.','It is cold outside.','ist','er/sie/es','präsens',23),
(t,'Er ist Arzt von Beruf.','He is a doctor by profession.','ist','er/sie/es','präsens',24),
(t,'Sie ist meine Lehrerin.','She is my teacher.','ist','er/sie/es','präsens',25),
(t,'Es ist schon spät.','It is already late.','ist','er/sie/es','präsens',26),
(t,'Er ist gerade nicht hier.','He is not here right now.','ist','er/sie/es','präsens',27),
(t,'Das Buch ist sehr interessant.','The book is very interesting.','ist','er/sie/es','präsens',28),
(t,'Die Stadt ist sehr groß.','The city is very big.','ist','er/sie/es','präsens',29),
(t,'Das Wetter ist heute schön.','The weather is nice today.','ist','er/sie/es','präsens',30),
-- wir sind (31–40)
(t,'Wir sind in Berlin.','We are in Berlin.','sind','wir','präsens',31),
(t,'Wir sind sehr müde.','We are very tired.','sind','wir','präsens',32),
(t,'Wir sind gute Freunde.','We are good friends.','sind','wir','präsens',33),
(t,'Wir sind eine große Familie.','We are a big family.','sind','wir','präsens',34),
(t,'Wir sind heute zu Hause.','We are home today.','sind','wir','präsens',35),
(t,'Wir sind bereit!','We are ready!','sind','wir','präsens',36),
(t,'Wir sind Studenten.','We are students.','sind','wir','präsens',37),
(t,'Wir sind glücklich zusammen.','We are happy together.','sind','wir','präsens',38),
(t,'Wir sind verloren.','We are lost.','sind','wir','präsens',39),
(t,'Wir sind nicht weit von hier.','We are not far from here.','sind','wir','präsens',40),
-- ihr seid (41–50)
(t,'Ihr seid die Besten!','You all are the best!','seid','ihr','präsens',41),
(t,'Ihr seid zu spät.','You are too late.','seid','ihr','präsens',42),
(t,'Ihr seid sehr laut.','You are very loud.','seid','ihr','präsens',43),
(t,'Ihr seid herzlich willkommen!','You are heartily welcome!','seid','ihr','präsens',44),
(t,'Ihr seid eine tolle Gruppe.','You are a great group.','seid','ihr','präsens',45),
(t,'Ihr seid heute sehr fleißig.','You are very diligent today.','seid','ihr','präsens',46),
(t,'Ihr seid auf dem richtigen Weg.','You are on the right track.','seid','ihr','präsens',47),
(t,'Ihr seid alle eingeladen.','You are all invited.','seid','ihr','präsens',48),
(t,'Ihr seid bereit für den Test?','Are you ready for the test?','seid','ihr','präsens',49),
(t,'Ihr seid meine Lieblingsschüler.','You are my favorite students.','seid','ihr','präsens',50),
-- sie/Sie sind (51–60)
(t,'Sie sind Studenten aus Deutschland.','They are students from Germany.','sind','sie/Sie','präsens',51),
(t,'Die Kinder sind draußen.','The children are outside.','sind','sie/Sie','präsens',52),
(t,'Die Äpfel sind jetzt reif.','The apples are ripe now.','sind','sie/Sie','präsens',53),
(t,'Sie sind beide krank.','They are both sick.','sind','sie/Sie','präsens',54),
(t,'Die Eltern sind sehr stolz.','The parents are very proud.','sind','sie/Sie','präsens',55),
(t,'Meine Schwestern sind in München.','My sisters are in Munich.','sind','sie/Sie','präsens',56),
(t,'Die Hunde sind sehr groß.','The dogs are very big.','sind','sie/Sie','präsens',57),
(t,'Sie sind herzlich willkommen!','You are most welcome!','sind','sie/Sie','präsens',58),
(t,'Die Blumen sind sehr schön.','The flowers are very beautiful.','sind','sie/Sie','präsens',59),
(t,'Sie sind alle sehr nett.','They are all very nice.','sind','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PRÄSENS: HABEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: haben',
  'prasens-haben',
  'A1',
  'verb_conjugation',
  '"Haben" (to have) is an irregular verb used as both a main verb and an auxiliary verb for past tenses.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **habe** |
| du | **hast** |
| er/sie/es | **hat** |
| wir | **haben** |
| ihr | **habt** |
| sie/Sie | **haben** |

Note: "du hast" (you have) sounds identical to "du hasst" (you hate) — only context tells them apart!',
  20
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich habe (1–10)
(t,'Ich habe einen Hund.','I have a dog.','habe','ich','präsens',1),
(t,'Ich habe Hunger.','I am hungry.','habe','ich','präsens',2),
(t,'Ich habe keine Zeit.','I have no time.','habe','ich','präsens',3),
(t,'Ich habe eine Frage.','I have a question.','habe','ich','präsens',4),
(t,'Ich habe Kopfschmerzen.','I have a headache.','habe','ich','präsens',5),
(t,'Ich habe ein neues Auto.','I have a new car.','habe','ich','präsens',6),
(t,'Ich habe Angst.','I am afraid.','habe','ich','präsens',7),
(t,'Ich habe viele Freunde.','I have many friends.','habe','ich','präsens',8),
(t,'Ich habe Glück.','I am lucky.','habe','ich','präsens',9),
(t,'Ich habe eine gute Idee.','I have a good idea.','habe','ich','präsens',10),
-- du hast (11–20)
(t,'Du hast schöne Augen.','You have beautiful eyes.','hast','du','präsens',11),
(t,'Du hast Recht.','You are right.','hast','du','präsens',12),
(t,'Du hast ein Talent für Musik.','You have a talent for music.','hast','du','präsens',13),
(t,'Du hast einen Brief.','You have a letter.','hast','du','präsens',14),
(t,'Du hast viel Zeit heute.','You have a lot of time today.','hast','du','präsens',15),
(t,'Du hast keine Ahnung.','You have no idea.','hast','du','präsens',16),
(t,'Du hast immer gute Ideen.','You always have good ideas.','hast','du','präsens',17),
(t,'Du hast Fieber.','You have a fever.','hast','du','präsens',18),
(t,'Du hast ein schönes Haus.','You have a beautiful house.','hast','du','präsens',19),
(t,'Du hast viel Geduld.','You have a lot of patience.','hast','du','präsens',20),
-- er/sie/es hat (21–30)
(t,'Er hat viel Geld.','He has a lot of money.','hat','er/sie/es','präsens',21),
(t,'Sie hat keine Zeit.','She has no time.','hat','er/sie/es','präsens',22),
(t,'Das Auto hat vier Türen.','The car has four doors.','hat','er/sie/es','präsens',23),
(t,'Er hat einen Bruder.','He has a brother.','hat','er/sie/es','präsens',24),
(t,'Sie hat lange Haare.','She has long hair.','hat','er/sie/es','präsens',25),
(t,'Das Restaurant hat viele Gäste.','The restaurant has many guests.','hat','er/sie/es','präsens',26),
(t,'Er hat ein Problem.','He has a problem.','hat','er/sie/es','präsens',27),
(t,'Die Katze hat drei Kätzchen.','The cat has three kittens.','hat','er/sie/es','präsens',28),
(t,'Das Buch hat 300 Seiten.','The book has 300 pages.','hat','er/sie/es','präsens',29),
(t,'Sie hat viel Erfahrung.','She has a lot of experience.','hat','er/sie/es','präsens',30),
-- wir haben (31–40)
(t,'Wir haben morgen einen Test.','We have a test tomorrow.','haben','wir','präsens',31),
(t,'Wir haben viel Spaß.','We have a lot of fun.','haben','wir','präsens',32),
(t,'Wir haben keine Wahl.','We have no choice.','haben','wir','präsens',33),
(t,'Wir haben ein großes Haus.','We have a big house.','haben','wir','präsens',34),
(t,'Wir haben einen guten Plan.','We have a good plan.','haben','wir','präsens',35),
(t,'Wir haben Hunger.','We are hungry.','haben','wir','präsens',36),
(t,'Wir haben viele Aufgaben.','We have many tasks.','haben','wir','präsens',37),
(t,'Wir haben Zeit für einen Kaffee.','We have time for a coffee.','haben','wir','präsens',38),
(t,'Wir haben keine Karten mehr.','We have no more tickets.','haben','wir','präsens',39),
(t,'Wir haben ein gutes Team.','We have a good team.','haben','wir','präsens',40),
-- ihr habt (41–50)
(t,'Ihr habt Hunger, oder?','You are hungry, right?','habt','ihr','präsens',41),
(t,'Ihr habt die Antwort.','You have the answer.','habt','ihr','präsens',42),
(t,'Ihr habt sehr viel Glück.','You are very lucky.','habt','ihr','präsens',43),
(t,'Ihr habt keine Zeit zu verlieren.','You have no time to lose.','habt','ihr','präsens',44),
(t,'Ihr habt viele Fragen.','You have many questions.','habt','ihr','präsens',45),
(t,'Ihr habt heute keine Hausaufgaben.','You have no homework today.','habt','ihr','präsens',46),
(t,'Ihr habt meine Erlaubnis.','You have my permission.','habt','ihr','präsens',47),
(t,'Ihr habt immer Recht!','You are always right!','habt','ihr','präsens',48),
(t,'Ihr habt viel Arbeit vor euch.','You have a lot of work ahead.','habt','ihr','präsens',49),
(t,'Ihr habt ein schönes Zimmer.','You have a nice room.','habt','ihr','präsens',50),
-- sie/Sie haben (51–60)
(t,'Die Kinder haben viele Spielzeuge.','The children have many toys.','haben','sie/Sie','präsens',51),
(t,'Sie haben Recht.','They are right.','haben','sie/Sie','präsens',52),
(t,'Meine Eltern haben ein Haus in Bayern.','My parents have a house in Bavaria.','haben','sie/Sie','präsens',53),
(t,'Die Gäste haben Hunger.','The guests are hungry.','haben','sie/Sie','präsens',54),
(t,'Die Schüler haben ihre Hefte.','The students have their notebooks.','haben','sie/Sie','präsens',55),
(t,'Sie haben einen Termin.','They have an appointment.','haben','sie/Sie','präsens',56),
(t,'Die Studenten haben einen langen Tag.','The students have a long day.','haben','sie/Sie','präsens',57),
(t,'Die Bücher haben schöne Cover.','The books have beautiful covers.','haben','sie/Sie','präsens',58),
(t,'Sie haben viel Erfahrung.','They have a lot of experience.','haben','sie/Sie','präsens',59),
(t,'Die Hunde haben großen Hunger.','The dogs are very hungry.','haben','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRÄSENS: KOMMEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: kommen',
  'prasens-kommen',
  'A1',
  'verb_conjugation',
  '"Kommen" (to come) is a regular verb. The stem is "komm-" — add the standard present tense endings.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **komme** |
| du | **kommst** |
| er/sie/es | **kommt** |
| wir | **kommen** |
| ihr | **kommt** |
| sie/Sie | **kommen** |

Key phrase: "Woher kommst du?" = "Where are you from?"
Note: "er kommt" and "ihr kommt" look the same — context tells them apart.',
  30
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich komme (1–10)
(t,'Ich komme aus Deutschland.','I come from Germany.','komme','ich','präsens',1),
(t,'Ich komme gleich!','I am coming right now!','komme','ich','präsens',2),
(t,'Ich komme zu spät.','I am coming too late.','komme','ich','präsens',3),
(t,'Ich komme aus einer kleinen Stadt.','I come from a small town.','komme','ich','präsens',4),
(t,'Ich komme jeden Tag hierher.','I come here every day.','komme','ich','präsens',5),
(t,'Ich komme mit!','I am coming along!','komme','ich','präsens',6),
(t,'Ich komme aus der Schweiz.','I come from Switzerland.','komme','ich','präsens',7),
(t,'Ich komme pünktlich.','I am coming on time.','komme','ich','präsens',8),
(t,'Ich komme aus einer großen Familie.','I come from a big family.','komme','ich','präsens',9),
(t,'Ich komme später nach Hause.','I am coming home later.','komme','ich','präsens',10),
-- du kommst (11–20)
(t,'Woher kommst du?','Where do you come from?','kommst','du','präsens',11),
(t,'Du kommst immer zu spät.','You are always late.','kommst','du','präsens',12),
(t,'Kommst du aus Berlin?','Are you from Berlin?','kommst','du','präsens',13),
(t,'Du kommst morgen, oder?','You are coming tomorrow, right?','kommst','du','präsens',14),
(t,'Wann kommst du nach Hause?','When are you coming home?','kommst','du','präsens',15),
(t,'Du kommst aus welcher Stadt?','Which city do you come from?','kommst','du','präsens',16),
(t,'Du kommst mit uns, oder?','You are coming with us, right?','kommst','du','präsens',17),
(t,'Wie oft kommst du hierher?','How often do you come here?','kommst','du','präsens',18),
(t,'Du kommst aus Österreich.','You come from Austria.','kommst','du','präsens',19),
(t,'Du kommst zu früh.','You are coming too early.','kommst','du','präsens',20),
-- er/sie/es kommt (21–30)
(t,'Er kommt morgen nach Hause.','He is coming home tomorrow.','kommt','er/sie/es','präsens',21),
(t,'Der Bus kommt um acht Uhr.','The bus comes at eight o''clock.','kommt','er/sie/es','präsens',22),
(t,'Meine Mutter kommt aus Wien.','My mother comes from Vienna.','kommt','er/sie/es','präsens',23),
(t,'Er kommt immer pünktlich.','He always comes on time.','kommt','er/sie/es','präsens',24),
(t,'Sie kommt aus Frankreich.','She comes from France.','kommt','er/sie/es','präsens',25),
(t,'Der Zug kommt um 15 Uhr an.','The train arrives at 3 p.m.','kommt','er/sie/es','präsens',26),
(t,'Es kommt auf das Wetter an.','It depends on the weather.','kommt','er/sie/es','präsens',27),
(t,'Er kommt zu spät zur Schule.','He comes to school too late.','kommt','er/sie/es','präsens',28),
(t,'Sie kommt nicht zur Party.','She is not coming to the party.','kommt','er/sie/es','präsens',29),
(t,'Das Paket kommt morgen.','The package is coming tomorrow.','kommt','er/sie/es','präsens',30),
-- wir kommen (31–40)
(t,'Wir kommen gleich!','We are coming right now!','kommen','wir','präsens',31),
(t,'Wir kommen aus Berlin.','We come from Berlin.','kommen','wir','präsens',32),
(t,'Wir kommen zu spät.','We are coming too late.','kommen','wir','präsens',33),
(t,'Wir kommen morgen Abend.','We are coming tomorrow evening.','kommen','wir','präsens',34),
(t,'Wir kommen mit dem Zug.','We are coming by train.','kommen','wir','präsens',35),
(t,'Wir kommen aus verschiedenen Ländern.','We come from different countries.','kommen','wir','präsens',36),
(t,'Wir kommen pünktlich.','We are coming on time.','kommen','wir','präsens',37),
(t,'Wir kommen jedes Jahr hierher.','We come here every year.','kommen','wir','präsens',38),
(t,'Wir kommen gerne.','We are happy to come.','kommen','wir','präsens',39),
(t,'Wir kommen nach der Schule.','We are coming after school.','kommen','wir','präsens',40),
-- ihr kommt (41–50)
(t,'Ihr kommt zu spät.','You are coming too late.','kommt','ihr','präsens',41),
(t,'Wann kommt ihr?','When are you coming?','kommt','ihr','präsens',42),
(t,'Ihr kommt aus Bayern, oder?','You are from Bavaria, right?','kommt','ihr','präsens',43),
(t,'Ihr kommt morgen, oder?','You are coming tomorrow, right?','kommt','ihr','präsens',44),
(t,'Woher kommt ihr alle?','Where do you all come from?','kommt','ihr','präsens',45),
(t,'Ihr kommt mit dem Auto.','You are coming by car.','kommt','ihr','präsens',46),
(t,'Ihr kommt immer zu spät.','You are always late.','kommt','ihr','präsens',47),
(t,'Kommt ihr auch zur Party?','Are you coming to the party too?','kommt','ihr','präsens',48),
(t,'Ihr kommt aus der gleichen Stadt.','You come from the same city.','kommt','ihr','präsens',49),
(t,'Ihr kommt alle zu mir.','You are all coming to me.','kommt','ihr','präsens',50),
-- sie/Sie kommen (51–60)
(t,'Die Gäste kommen um sieben Uhr.','The guests come at seven o''clock.','kommen','sie/Sie','präsens',51),
(t,'Sie kommen alle aus Europa.','They all come from Europe.','kommen','sie/Sie','präsens',52),
(t,'Meine Eltern kommen nächste Woche.','My parents are coming next week.','kommen','sie/Sie','präsens',53),
(t,'Die Touristen kommen im Sommer.','The tourists come in summer.','kommen','sie/Sie','präsens',54),
(t,'Sie kommen mit dem Flugzeug.','They are coming by plane.','kommen','sie/Sie','präsens',55),
(t,'Die Studenten kommen aus aller Welt.','The students come from all over the world.','kommen','sie/Sie','präsens',56),
(t,'Sie kommen morgen früh.','They are coming tomorrow morning.','kommen','sie/Sie','präsens',57),
(t,'Die Kinder kommen um 15 Uhr.','The children come at 3 p.m.','kommen','sie/Sie','präsens',58),
(t,'Sie kommen sehr gerne.','They are very happy to come.','kommen','sie/Sie','präsens',59),
(t,'Die Pakete kommen heute an.','The packages arrive today.','kommen','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PRÄSENS: GEHEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: gehen',
  'prasens-gehen',
  'A1',
  'verb_conjugation',
  '"Gehen" (to go / to walk) is a regular verb in the present tense.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **gehe** |
| du | **gehst** |
| er/sie/es | **geht** |
| wir | **gehen** |
| ihr | **geht** |
| sie/Sie | **gehen** |

Key phrase: **"Wie geht es dir?"** = "How are you?" (literally: "How does it go for you?")
Note: "er geht" and "ihr geht" use the same form.',
  40
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich gehe (1–10)
(t,'Ich gehe jeden Tag in die Schule.','I go to school every day.','gehe','ich','präsens',1),
(t,'Ich gehe jetzt schlafen.','I am going to sleep now.','gehe','ich','präsens',2),
(t,'Ich gehe morgen ins Kino.','I am going to the cinema tomorrow.','gehe','ich','präsens',3),
(t,'Ich gehe gerne spazieren.','I like going for a walk.','gehe','ich','präsens',4),
(t,'Ich gehe um acht Uhr zur Arbeit.','I go to work at eight o''clock.','gehe','ich','präsens',5),
(t,'Ich gehe in die Bibliothek.','I am going to the library.','gehe','ich','präsens',6),
(t,'Ich gehe heute einkaufen.','I am going shopping today.','gehe','ich','präsens',7),
(t,'Ich gehe mit meinen Freunden aus.','I am going out with my friends.','gehe','ich','präsens',8),
(t,'Ich gehe zum Arzt.','I am going to the doctor.','gehe','ich','präsens',9),
(t,'Ich gehe schnell nach Hause.','I am going home quickly.','gehe','ich','präsens',10),
-- du gehst (11–20)
(t,'Du gehst heute einkaufen, oder?','You are going shopping today, right?','gehst','du','präsens',11),
(t,'Wohin gehst du?','Where are you going?','gehst','du','präsens',12),
(t,'Du gehst immer zu früh.','You always leave too early.','gehst','du','präsens',13),
(t,'Wann gehst du zur Schule?','When do you go to school?','gehst','du','präsens',14),
(t,'Du gehst heute Abend aus?','Are you going out tonight?','gehst','du','präsens',15),
(t,'Du gehst in die richtige Richtung.','You are going in the right direction.','gehst','du','präsens',16),
(t,'Wie oft gehst du ins Fitnessstudio?','How often do you go to the gym?','gehst','du','präsens',17),
(t,'Du gehst sehr schnell.','You are walking very fast.','gehst','du','präsens',18),
(t,'Wann gehst du schlafen?','When do you go to sleep?','gehst','du','präsens',19),
(t,'Du gehst zum falschen Ausgang.','You are going to the wrong exit.','gehst','du','präsens',20),
-- er/sie/es geht (21–30)
(t,'Er geht schnell nach Hause.','He goes home quickly.','geht','er/sie/es','präsens',21),
(t,'Wie geht es dir?','How are you?','geht','er/sie/es','präsens',22),
(t,'Das Konzert geht um acht Uhr los.','The concert starts at eight.','geht','er/sie/es','präsens',23),
(t,'Sie geht jeden Morgen joggen.','She goes jogging every morning.','geht','er/sie/es','präsens',24),
(t,'Er geht zur Schule.','He goes to school.','geht','er/sie/es','präsens',25),
(t,'Es geht mir gut.','I am doing well.','geht','er/sie/es','präsens',26),
(t,'Sie geht in den Supermarkt.','She is going to the supermarket.','geht','er/sie/es','präsens',27),
(t,'Er geht zu Fuß zur Arbeit.','He walks to work.','geht','er/sie/es','präsens',28),
(t,'Das geht nicht.','That is not possible.','geht','er/sie/es','präsens',29),
(t,'Es geht dir gut, oder?','You are doing well, right?','geht','er/sie/es','präsens',30),
-- wir gehen (31–40)
(t,'Wir gehen zusammen spazieren.','We go for a walk together.','gehen','wir','präsens',31),
(t,'Wir gehen morgen ins Theater.','We are going to the theatre tomorrow.','gehen','wir','präsens',32),
(t,'Wir gehen einkaufen.','We are going shopping.','gehen','wir','präsens',33),
(t,'Wir gehen jeden Abend spazieren.','We go for a walk every evening.','gehen','wir','präsens',34),
(t,'Wir gehen zu Fuß.','We are walking.','gehen','wir','präsens',35),
(t,'Wir gehen in ein Restaurant.','We are going to a restaurant.','gehen','wir','präsens',36),
(t,'Wir gehen schwimmen.','We are going swimming.','gehen','wir','präsens',37),
(t,'Wir gehen früh schlafen.','We go to bed early.','gehen','wir','präsens',38),
(t,'Wir gehen in die Stadtmitte.','We are going to the city centre.','gehen','wir','präsens',39),
(t,'Wir gehen dieselbe Schule.','We go to the same school.','gehen','wir','präsens',40),
-- ihr geht (41–50)
(t,'Ihr geht in die falsche Richtung.','You are going the wrong way.','geht','ihr','präsens',41),
(t,'Wann geht ihr nach Hause?','When are you going home?','geht','ihr','präsens',42),
(t,'Ihr geht heute ins Kino, oder?','You are going to the cinema today, right?','geht','ihr','präsens',43),
(t,'Ihr geht zu schnell.','You are going too fast.','geht','ihr','präsens',44),
(t,'Wohin geht ihr?','Where are you going?','geht','ihr','präsens',45),
(t,'Ihr geht jeden Tag zur Schule.','You go to school every day.','geht','ihr','präsens',46),
(t,'Ihr geht durch den Park.','You are going through the park.','geht','ihr','präsens',47),
(t,'Geht ihr auch mit?','Are you coming along too?','geht','ihr','präsens',48),
(t,'Ihr geht zu weit.','You are going too far.','geht','ihr','präsens',49),
(t,'Ihr geht in die richtige Richtung.','You are going in the right direction.','geht','ihr','präsens',50),
-- sie/Sie gehen (51–60)
(t,'Die Kinder gehen gern ins Kino.','The children like going to the cinema.','gehen','sie/Sie','präsens',51),
(t,'Sie gehen jeden Morgen spazieren.','They go for a walk every morning.','gehen','sie/Sie','präsens',52),
(t,'Die Studenten gehen in die Bibliothek.','The students go to the library.','gehen','sie/Sie','präsens',53),
(t,'Sie gehen ins Restaurant.','They are going to the restaurant.','gehen','sie/Sie','präsens',54),
(t,'Meine Eltern gehen oft wandern.','My parents often go hiking.','gehen','sie/Sie','präsens',55),
(t,'Die Schüler gehen nach Hause.','The students go home.','gehen','sie/Sie','präsens',56),
(t,'Sie gehen in den Park.','They are going to the park.','gehen','sie/Sie','präsens',57),
(t,'Die Touristen gehen ins Museum.','The tourists go to the museum.','gehen','sie/Sie','präsens',58),
(t,'Sie gehen zu Fuß.','They are walking.','gehen','sie/Sie','präsens',59),
(t,'Wohin gehen Sie?','Where are you going? (formal)','gehen','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PRÄSENS: MACHEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: machen',
  'prasens-machen',
  'A1',
  'verb_conjugation',
  '"Machen" (to make / to do) is a fully regular verb — one of the most versatile in German.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **mache** |
| du | **machst** |
| er/sie/es | **macht** |
| wir | **machen** |
| ihr | **macht** |
| sie/Sie | **machen** |

Key phrase: **"Was machst du?"** = "What are you doing?" — one of the most common questions.',
  50
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich mache (1–10)
(t,'Ich mache meine Hausaufgaben.','I am doing my homework.','mache','ich','präsens',1),
(t,'Ich mache jeden Morgen Sport.','I exercise every morning.','mache','ich','präsens',2),
(t,'Ich mache eine Pause.','I am taking a break.','mache','ich','präsens',3),
(t,'Ich mache das Fenster auf.','I am opening the window.','mache','ich','präsens',4),
(t,'Ich mache heute Abend Abendessen.','I am making dinner tonight.','mache','ich','präsens',5),
(t,'Ich mache einen Fehler.','I am making a mistake.','mache','ich','präsens',6),
(t,'Ich mache ein Foto.','I am taking a photo.','mache','ich','präsens',7),
(t,'Ich mache mir Sorgen.','I am worried.','mache','ich','präsens',8),
(t,'Ich mache das Licht an.','I am turning the light on.','mache','ich','präsens',9),
(t,'Ich mache einen Kurs.','I am taking a course.','mache','ich','präsens',10),
-- du machst (11–20)
(t,'Du machst das sehr gut.','You do that very well.','machst','du','präsens',11),
(t,'Was machst du heute Abend?','What are you doing tonight?','machst','du','präsens',12),
(t,'Du machst immer viel Lärm.','You always make a lot of noise.','machst','du','präsens',13),
(t,'Machst du Sport?','Do you exercise?','machst','du','präsens',14),
(t,'Du machst gute Fortschritte.','You are making good progress.','machst','du','präsens',15),
(t,'Was machst du beruflich?','What do you do for work?','machst','du','präsens',16),
(t,'Du machst einen Fehler.','You are making a mistake.','machst','du','präsens',17),
(t,'Du machst das Richtige.','You are doing the right thing.','machst','du','präsens',18),
(t,'Wann machst du eine Pause?','When are you taking a break?','machst','du','präsens',19),
(t,'Du machst das Beste daraus.','You are making the best of it.','machst','du','präsens',20),
-- er/sie/es macht (21–30)
(t,'Er macht jeden Morgen Sport.','He exercises every morning.','macht','er/sie/es','präsens',21),
(t,'Was machst du heute Abend?','What are you doing tonight?','macht','er/sie/es','präsens',22),
(t,'Sie macht immer ihr Bett.','She always makes her bed.','macht','er/sie/es','präsens',23),
(t,'Das macht Sinn.','That makes sense.','macht','er/sie/es','präsens',24),
(t,'Er macht seine Hausaufgaben.','He is doing his homework.','macht','er/sie/es','präsens',25),
(t,'Das macht Spaß!','That is fun!','macht','er/sie/es','präsens',26),
(t,'Sie macht eine Pause.','She is taking a break.','macht','er/sie/es','präsens',27),
(t,'Das Wetter macht uns glücklich.','The weather makes us happy.','macht','er/sie/es','präsens',28),
(t,'Er macht einen guten Eindruck.','He makes a good impression.','macht','er/sie/es','präsens',29),
(t,'Das macht nichts.','That does not matter.','macht','er/sie/es','präsens',30),
-- wir machen (31–40)
(t,'Wir machen ein Picknick im Park.','We are having a picnic in the park.','machen','wir','präsens',31),
(t,'Wir machen eine Reise nach Italien.','We are going on a trip to Italy.','machen','wir','präsens',32),
(t,'Wir machen viel zusammen.','We do a lot together.','machen','wir','präsens',33),
(t,'Wir machen das Beste daraus.','We are making the best of it.','machen','wir','präsens',34),
(t,'Wir machen eine Pause.','We are taking a break.','machen','wir','präsens',35),
(t,'Wir machen Fehler und lernen daraus.','We make mistakes and learn from them.','machen','wir','präsens',36),
(t,'Wir machen Sport zusammen.','We exercise together.','machen','wir','präsens',37),
(t,'Wir machen heute Abend Abendessen.','We are making dinner tonight.','machen','wir','präsens',38),
(t,'Wir machen gute Fortschritte.','We are making good progress.','machen','wir','präsens',39),
(t,'Wir machen einen Spaziergang.','We are going for a walk.','machen','wir','präsens',40),
-- ihr macht (41–50)
(t,'Ihr macht zu viel Lärm.','You are making too much noise.','macht','ihr','präsens',41),
(t,'Was macht ihr am Wochenende?','What are you doing on the weekend?','macht','ihr','präsens',42),
(t,'Ihr macht gute Arbeit.','You are doing good work.','macht','ihr','präsens',43),
(t,'Ihr macht das falsch.','You are doing that wrong.','macht','ihr','präsens',44),
(t,'Ihr macht eine lange Pause.','You are taking a long break.','macht','ihr','präsens',45),
(t,'Ihr macht Fortschritte.','You are making progress.','macht','ihr','präsens',46),
(t,'Was macht ihr da?','What are you doing there?','macht','ihr','präsens',47),
(t,'Ihr macht das sehr gut.','You are doing that very well.','macht','ihr','präsens',48),
(t,'Ihr macht viel Sport.','You do a lot of sport.','macht','ihr','präsens',49),
(t,'Ihr macht einen großen Fehler.','You are making a big mistake.','macht','ihr','präsens',50),
-- sie/Sie machen (51–60)
(t,'Die Studenten machen eine Pause.','The students are taking a break.','machen','sie/Sie','präsens',51),
(t,'Sie machen viel Sport.','They do a lot of sport.','machen','sie/Sie','präsens',52),
(t,'Die Kinder machen Lärm.','The children are making noise.','machen','sie/Sie','präsens',53),
(t,'Sie machen gute Fortschritte.','They are making good progress.','machen','sie/Sie','präsens',54),
(t,'Meine Eltern machen eine Reise.','My parents are going on a trip.','machen','sie/Sie','präsens',55),
(t,'Die Schüler machen ihre Aufgaben.','The students are doing their tasks.','machen','sie/Sie','präsens',56),
(t,'Sie machen das Beste daraus.','They are making the best of it.','machen','sie/Sie','präsens',57),
(t,'Die Touristen machen viele Fotos.','The tourists are taking many photos.','machen','sie/Sie','präsens',58),
(t,'Sie machen immer Fehler.','They always make mistakes.','machen','sie/Sie','präsens',59),
(t,'Was machen Sie beruflich?','What do you do for work? (formal)','machen','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PRÄSENS: HEIẞEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: heißen',
  'prasens-heissen',
  'A1',
  'verb_conjugation',
  '"Heißen" (to be called) is used to give the name of a person, place, or thing.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **heiße** |
| du | **heißt** |
| er/sie/es | **heißt** |
| wir | **heißen** |
| ihr | **heißt** |
| sie/Sie | **heißen** |

Key phrase: **"Wie heißt du?"** = "What is your name?" — the first question in any German class.
Note: "du heißt", "er/sie/es heißt", and "ihr heißt" all look the same — context tells them apart.',
  60
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich heiße (1–10)
(t,'Ich heiße Thomas.','My name is Thomas.','heiße','ich','präsens',1),
(t,'Ich heiße Maria Schmidt.','My name is Maria Schmidt.','heiße','ich','präsens',2),
(t,'Ich heiße Anna.','My name is Anna.','heiße','ich','präsens',3),
(t,'Ich heiße Peter Müller.','My name is Peter Müller.','heiße','ich','präsens',4),
(t,'Ich heiße Lena.','My name is Lena.','heiße','ich','präsens',5),
(t,'Hallo, ich heiße Max.','Hello, my name is Max.','heiße','ich','präsens',6),
(t,'Ich heiße Sophie Wagner.','My name is Sophie Wagner.','heiße','ich','präsens',7),
(t,'Guten Tag, ich heiße Herr Schmidt.','Good day, my name is Mr. Schmidt.','heiße','ich','präsens',8),
(t,'Ich heiße Klaus.','My name is Klaus.','heiße','ich','präsens',9),
(t,'Ich heiße Lukas Bauer.','My name is Lukas Bauer.','heiße','ich','präsens',10),
-- du heißt (11–20)
(t,'Wie heißt du?','What is your name?','heißt','du','präsens',11),
(t,'Du heißt doch Thomas, oder?','Your name is Thomas, right?','heißt','du','präsens',12),
(t,'Wie heißt du mit Nachnamen?','What is your last name?','heißt','du','präsens',13),
(t,'Du heißt wie dein Vater.','You are named after your father.','heißt','du','präsens',14),
(t,'Du heißt Anna, stimmt?','Your name is Anna, right?','heißt','du','präsens',15),
(t,'Wie heißt du noch mal?','What is your name again?','heißt','du','präsens',16),
(t,'Du heißt wirklich so?','Is that really your name?','heißt','du','präsens',17),
(t,'Wie heißt du auf Englisch?','What is your name in English?','heißt','du','präsens',18),
(t,'Du heißt Maria, richtig?','Your name is Maria, correct?','heißt','du','präsens',19),
(t,'Wie heißt du mit Vornamen?','What is your first name?','heißt','du','präsens',20),
-- er/sie/es heißt (21–30)
(t,'Er heißt Markus.','His name is Markus.','heißt','er/sie/es','präsens',21),
(t,'Die Stadt heißt Berlin.','The city is called Berlin.','heißt','er/sie/es','präsens',22),
(t,'Sie heißt Maria.','Her name is Maria.','heißt','er/sie/es','präsens',23),
(t,'Das Tier heißt Hund.','The animal is called a dog.','heißt','er/sie/es','präsens',24),
(t,'Das Gebäude heißt Reichstag.','The building is called the Reichstag.','heißt','er/sie/es','präsens',25),
(t,'Er heißt Johann, nicht Johannes.','His name is Johann, not Johannes.','heißt','er/sie/es','präsens',26),
(t,'Das Buch heißt "Faust".','The book is called "Faust".','heißt','er/sie/es','präsens',27),
(t,'Der Fluss heißt Rhein.','The river is called the Rhine.','heißt','er/sie/es','präsens',28),
(t,'Sie heißt Frau Bauer.','Her name is Mrs. Bauer.','heißt','er/sie/es','präsens',29),
(t,'Das Restaurant heißt "Zur Linde".','The restaurant is called "Zur Linde".','heißt','er/sie/es','präsens',30),
-- wir heißen (31–40)
(t,'Wir heißen die Müller Familie.','Our family name is Müller.','heißen','wir','präsens',31),
(t,'Wir heißen beide Maria.','We are both called Maria.','heißen','wir','präsens',32),
(t,'Wir heißen Thomas und Anna.','Our names are Thomas and Anna.','heißen','wir','präsens',33),
(t,'Wie heißen wir auf Englisch?','What are we called in English?','heißen','wir','präsens',34),
(t,'Wir heißen die Berliner.','We are called Berliners.','heißen','wir','präsens',35),
(t,'Wir heißen Schmidt, nicht Schmitt.','Our name is Schmidt, not Schmitt.','heißen','wir','präsens',36),
(t,'Wir heißen alle gleich.','We all have the same name.','heißen','wir','präsens',37),
(t,'Wir heißen die neuen Schüler.','We are called the new students.','heißen','wir','präsens',38),
(t,'Wir heißen Max und Moritz.','Our names are Max and Moritz.','heißen','wir','präsens',39),
(t,'Wir heißen die Gruppe Drei.','We are called Group Three.','heißen','wir','präsens',40),
-- ihr heißt (41–50)
(t,'Wie heißt ihr?','What are your names?','heißt','ihr','präsens',41),
(t,'Ihr heißt alle gleich?','Do you all have the same name?','heißt','ihr','präsens',42),
(t,'Wie heißt ihr mit Nachnamen?','What is your last name?','heißt','ihr','präsens',43),
(t,'Ihr heißt Thomas und Maria?','Your names are Thomas and Maria?','heißt','ihr','präsens',44),
(t,'Wie heißt ihr auf Englisch?','What are your names in English?','heißt','ihr','präsens',45),
(t,'Ihr heißt die Gruppe A?','Are you called Group A?','heißt','ihr','präsens',46),
(t,'Wie heißt ihr alle?','What are all your names?','heißt','ihr','präsens',47),
(t,'Ihr heißt wirklich so?','Are those really your names?','heißt','ihr','präsens',48),
(t,'Ihr heißt Max, Moritz und Klaus.','Your names are Max, Moritz and Klaus.','heißt','ihr','präsens',49),
(t,'Wie heißt ihr noch mal?','What are your names again?','heißt','ihr','präsens',50),
-- sie/Sie heißen (51–60)
(t,'Die Straße heißt Hauptstraße.','The street is called Hauptstraße.','heißen','sie/Sie','präsens',51),
(t,'Sie heißen alle Schmidt.','They are all called Schmidt.','heißen','sie/Sie','präsens',52),
(t,'Wie heißen die Kinder?','What are the children''s names?','heißen','sie/Sie','präsens',53),
(t,'Die Berge heißen die Alpen.','The mountains are called the Alps.','heißen','sie/Sie','präsens',54),
(t,'Sie heißen Peter und Paula.','Their names are Peter and Paula.','heißen','sie/Sie','präsens',55),
(t,'Wie heißen die Straßen hier?','What are the streets called here?','heißen','sie/Sie','präsens',56),
(t,'Die Länder heißen Deutschland und Österreich.','The countries are called Germany and Austria.','heißen','sie/Sie','präsens',57),
(t,'Wie heißen Sie?','What is your name? (formal)','heißen','sie/Sie','präsens',58),
(t,'Die Schüler heißen Max und Anna.','The students are called Max and Anna.','heißen','sie/Sie','präsens',59),
(t,'Wie heißen die Vögel?','What are the birds called?','heißen','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PRÄSENS: WOHNEN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: wohnen',
  'prasens-wohnen',
  'A1',
  'verb_conjugation',
  '"Wohnen" (to live / to reside) is a fully regular verb describing permanent residence.

**Conjugation table:**
| Person | Form |
|--------|------|
| ich | **wohne** |
| du | **wohnst** |
| er/sie/es | **wohnt** |
| wir | **wohnen** |
| ihr | **wohnt** |
| sie/Sie | **wohnen** |

Key phrase: **"Wo wohnst du?"** = "Where do you live?"
Note: "er wohnt" and "ihr wohnt" look identical — context tells them apart.',
  70
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich wohne (1–10)
(t,'Ich wohne in München.','I live in Munich.','wohne','ich','präsens',1),
(t,'Ich wohne in einer kleinen Wohnung.','I live in a small apartment.','wohne','ich','präsens',2),
(t,'Ich wohne allein.','I live alone.','wohne','ich','präsens',3),
(t,'Ich wohne in der Nähe des Bahnhofs.','I live near the train station.','wohne','ich','präsens',4),
(t,'Ich wohne seit drei Jahren hier.','I have lived here for three years.','wohne','ich','präsens',5),
(t,'Ich wohne im dritten Stock.','I live on the third floor.','wohne','ich','präsens',6),
(t,'Ich wohne mit meiner Familie zusammen.','I live together with my family.','wohne','ich','präsens',7),
(t,'Ich wohne in einer WG.','I live in a shared apartment.','wohne','ich','präsens',8),
(t,'Ich wohne auf dem Land.','I live in the countryside.','wohne','ich','präsens',9),
(t,'Ich wohne in der Stadtmitte.','I live in the city centre.','wohne','ich','präsens',10),
-- du wohnst (11–20)
(t,'Wo wohnst du?','Where do you live?','wohnst','du','präsens',11),
(t,'Du wohnst in Berlin, oder?','You live in Berlin, right?','wohnst','du','präsens',12),
(t,'Seit wann wohnst du hier?','Since when do you live here?','wohnst','du','präsens',13),
(t,'Du wohnst sehr weit von hier.','You live very far from here.','wohnst','du','präsens',14),
(t,'Du wohnst allein?','You live alone?','wohnst','du','präsens',15),
(t,'Wo wohnst du genau?','Where exactly do you live?','wohnst','du','präsens',16),
(t,'Du wohnst in der Nähe?','You live nearby?','wohnst','du','präsens',17),
(t,'Wie lange wohnst du schon hier?','How long have you lived here?','wohnst','du','präsens',18),
(t,'Du wohnst in einem schönen Viertel.','You live in a nice neighbourhood.','wohnst','du','präsens',19),
(t,'Du wohnst noch bei deinen Eltern?','Do you still live with your parents?','wohnst','du','präsens',20),
-- er/sie/es wohnt (21–30)
(t,'Er wohnt in einer kleinen Wohnung.','He lives in a small apartment.','wohnt','er/sie/es','präsens',21),
(t,'Meine Familie wohnt auf dem Land.','My family lives in the countryside.','wohnt','er/sie/es','präsens',22),
(t,'Sie wohnt im fünften Stock.','She lives on the fifth floor.','wohnt','er/sie/es','präsens',23),
(t,'Er wohnt allein.','He lives alone.','wohnt','er/sie/es','präsens',24),
(t,'Das Tier wohnt im Wald.','The animal lives in the forest.','wohnt','er/sie/es','präsens',25),
(t,'Sie wohnt in der Nähe des Parks.','She lives near the park.','wohnt','er/sie/es','präsens',26),
(t,'Er wohnt seit einem Jahr in Berlin.','He has lived in Berlin for one year.','wohnt','er/sie/es','präsens',27),
(t,'Mein Bruder wohnt in Hamburg.','My brother lives in Hamburg.','wohnt','er/sie/es','präsens',28),
(t,'Sie wohnt bei ihrer Tante.','She lives with her aunt.','wohnt','er/sie/es','präsens',29),
(t,'Er wohnt weit von der Schule.','He lives far from the school.','wohnt','er/sie/es','präsens',30),
-- wir wohnen (31–40)
(t,'Wir wohnen seit drei Jahren hier.','We have lived here for three years.','wohnen','wir','präsens',31),
(t,'Wir wohnen in einer großen Stadt.','We live in a big city.','wohnen','wir','präsens',32),
(t,'Wir wohnen zusammen in einer WG.','We live together in a shared apartment.','wohnen','wir','präsens',33),
(t,'Wir wohnen auf dem Land.','We live in the countryside.','wohnen','wir','präsens',34),
(t,'Wir wohnen in der Nähe des Zentrums.','We live near the centre.','wohnen','wir','präsens',35),
(t,'Wir wohnen im zweiten Stock.','We live on the second floor.','wohnen','wir','präsens',36),
(t,'Wir wohnen nicht weit von hier.','We do not live far from here.','wohnen','wir','präsens',37),
(t,'Wir wohnen beide in München.','We both live in Munich.','wohnen','wir','präsens',38),
(t,'Wir wohnen in einem ruhigen Viertel.','We live in a quiet neighbourhood.','wohnen','wir','präsens',39),
(t,'Wir wohnen gegenüber vom Park.','We live across from the park.','wohnen','wir','präsens',40),
-- ihr wohnt (41–50)
(t,'Ihr wohnt in einem schönen Haus.','You live in a beautiful house.','wohnt','ihr','präsens',41),
(t,'Wo wohnt ihr?','Where do you live?','wohnt','ihr','präsens',42),
(t,'Ihr wohnt alle in Berlin?','You all live in Berlin?','wohnt','ihr','präsens',43),
(t,'Wie lange wohnt ihr schon hier?','How long have you lived here?','wohnt','ihr','präsens',44),
(t,'Ihr wohnt sehr weit weg.','You live very far away.','wohnt','ihr','präsens',45),
(t,'Ihr wohnt zusammen in einer WG?','You live together in a shared apartment?','wohnt','ihr','präsens',46),
(t,'Ihr wohnt in der Stadtmitte.','You live in the city centre.','wohnt','ihr','präsens',47),
(t,'Seit wann wohnt ihr in Deutschland?','Since when do you live in Germany?','wohnt','ihr','präsens',48),
(t,'Ihr wohnt in einem ruhigen Viertel.','You live in a quiet neighbourhood.','wohnt','ihr','präsens',49),
(t,'Ihr wohnt noch bei euren Eltern?','Do you still live with your parents?','wohnt','ihr','präsens',50),
-- sie/Sie wohnen (51–60)
(t,'Viele Studenten wohnen in WGs.','Many students live in shared apartments.','wohnen','sie/Sie','präsens',51),
(t,'Wo wohnen Sie in Berlin?','Where do you live in Berlin? (formal)','wohnen','sie/Sie','präsens',52),
(t,'Meine Eltern wohnen auf dem Land.','My parents live in the countryside.','wohnen','sie/Sie','präsens',53),
(t,'Die Familien wohnen in Häusern.','The families live in houses.','wohnen','sie/Sie','präsens',54),
(t,'Sie wohnen alle in derselben Straße.','They all live in the same street.','wohnen','sie/Sie','präsens',55),
(t,'Die Studenten wohnen in Wohnheimen.','The students live in dormitories.','wohnen','sie/Sie','präsens',56),
(t,'Sie wohnen seit Jahren hier.','They have lived here for years.','wohnen','sie/Sie','präsens',57),
(t,'Meine Schwestern wohnen in Wien.','My sisters live in Vienna.','wohnen','sie/Sie','präsens',58),
(t,'Die Kinder wohnen bei den Großeltern.','The children live with their grandparents.','wohnen','sie/Sie','präsens',59),
(t,'Viele Leute wohnen hier sehr gerne.','Many people love living here.','wohnen','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. PRÄSENS: SPRECHEN (strong verb, e→i change)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'Präsens: sprechen',
  'prasens-sprechen',
  'A1',
  'verb_conjugation',
  '"Sprechen" (to speak) is a **strong verb** with a vowel change: **e → i** in the 2nd and 3rd person singular.

**Conjugation table:**
| Person | Form | Note |
|--------|------|------|
| ich | **spreche** | regular e |
| du | **sprichst** | ← e→i change! |
| er/sie/es | **spricht** | ← e→i change! |
| wir | **sprechen** | regular e |
| ihr | **sprecht** | regular e |
| sie/Sie | **sprechen** | regular e |

This **e→i vowel change** also appears in: **geben** (to give), **nehmen** (to take), **vergessen** (to forget).',
  80
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ich spreche (1–10)
(t,'Ich spreche Deutsch und Englisch.','I speak German and English.','spreche','ich','präsens',1),
(t,'Ich spreche ein bisschen Spanisch.','I speak a little Spanish.','spreche','ich','präsens',2),
(t,'Ich spreche langsam auf Deutsch.','I speak slowly in German.','spreche','ich','präsens',3),
(t,'Ich spreche mit meiner Mutter.','I am speaking with my mother.','spreche','ich','präsens',4),
(t,'Ich spreche drei Sprachen.','I speak three languages.','spreche','ich','präsens',5),
(t,'Ich spreche gerne auf Deutsch.','I like speaking in German.','spreche','ich','präsens',6),
(t,'Ich spreche sehr leise.','I speak very quietly.','spreche','ich','präsens',7),
(t,'Ich spreche kein Chinesisch.','I do not speak Chinese.','spreche','ich','präsens',8),
(t,'Ich spreche mit dem Lehrer.','I am speaking with the teacher.','spreche','ich','präsens',9),
(t,'Ich spreche fast kein Russisch.','I speak almost no Russian.','spreche','ich','präsens',10),
-- du sprichst (11–20)
(t,'Du sprichst sehr gut Spanisch.','You speak Spanish very well.','sprichst','du','präsens',11),
(t,'Wie viele Sprachen sprichst du?','How many languages do you speak?','sprichst','du','präsens',12),
(t,'Du sprichst zu schnell.','You are speaking too fast.','sprichst','du','präsens',13),
(t,'Sprichst du Deutsch?','Do you speak German?','sprichst','du','präsens',14),
(t,'Du sprichst mit wem?','Who are you speaking with?','sprichst','du','präsens',15),
(t,'Du sprichst sehr leise.','You are speaking very quietly.','sprichst','du','präsens',16),
(t,'Sprichst du auch Französisch?','Do you also speak French?','sprichst','du','präsens',17),
(t,'Du sprichst fließend Englisch.','You speak English fluently.','sprichst','du','präsens',18),
(t,'Du sprichst so gut Deutsch!','You speak such good German!','sprichst','du','präsens',19),
(t,'Mit wem sprichst du gerade?','Who are you talking to right now?','sprichst','du','präsens',20),
-- er/sie/es spricht (21–30)
(t,'Er spricht mit dem Chef.','He is speaking with the boss.','spricht','er/sie/es','präsens',21),
(t,'Sie spricht zu laut.','She speaks too loudly.','spricht','er/sie/es','präsens',22),
(t,'Er spricht fließend Chinesisch.','He speaks Chinese fluently.','spricht','er/sie/es','präsens',23),
(t,'Mein Lehrer spricht sehr langsam.','My teacher speaks very slowly.','spricht','er/sie/es','präsens',24),
(t,'Sie spricht kein Deutsch.','She does not speak German.','spricht','er/sie/es','präsens',25),
(t,'Er spricht vier Sprachen.','He speaks four languages.','spricht','er/sie/es','präsens',26),
(t,'Das Baby spricht noch nicht.','The baby does not speak yet.','spricht','er/sie/es','präsens',27),
(t,'Er spricht gerade am Telefon.','He is currently talking on the phone.','spricht','er/sie/es','präsens',28),
(t,'Sie spricht sehr gut Englisch.','She speaks very good English.','spricht','er/sie/es','präsens',29),
(t,'Er spricht immer Hochdeutsch.','He always speaks standard German.','spricht','er/sie/es','präsens',30),
-- wir sprechen (31–40)
(t,'Wir sprechen über das Wetter.','We are talking about the weather.','sprechen','wir','präsens',31),
(t,'Wir sprechen Deutsch miteinander.','We speak German with each other.','sprechen','wir','präsens',32),
(t,'Wir sprechen drei Sprachen.','We speak three languages.','sprechen','wir','präsens',33),
(t,'Wir sprechen gerade über Sie.','We are currently talking about you.','sprechen','wir','präsens',34),
(t,'Wir sprechen zu laut.','We are speaking too loudly.','sprechen','wir','präsens',35),
(t,'Wir sprechen kein Japanisch.','We do not speak Japanese.','sprechen','wir','präsens',36),
(t,'Wir sprechen sehr langsam auf Deutsch.','We speak very slowly in German.','sprechen','wir','präsens',37),
(t,'Wir sprechen miteinander.','We are talking to each other.','sprechen','wir','präsens',38),
(t,'Wir sprechen viel über Politik.','We talk a lot about politics.','sprechen','wir','präsens',39),
(t,'Wir sprechen das morgen durch.','We will discuss that tomorrow.','sprechen','wir','präsens',40),
-- ihr sprecht (41–50)
(t,'Ihr sprecht zu schnell.','You all speak too fast.','sprecht','ihr','präsens',41),
(t,'Ihr sprecht sehr laut.','You are speaking very loudly.','sprecht','ihr','präsens',42),
(t,'Sprecht ihr alle Deutsch?','Do you all speak German?','sprecht','ihr','präsens',43),
(t,'Ihr sprecht fließend Englisch.','You all speak English fluently.','sprecht','ihr','präsens',44),
(t,'Ihr sprecht kein Russisch.','You all do not speak Russian.','sprecht','ihr','präsens',45),
(t,'Ihr sprecht immer zu leise.','You always speak too quietly.','sprecht','ihr','präsens',46),
(t,'Wie viele Sprachen sprecht ihr?','How many languages do you speak?','sprecht','ihr','präsens',47),
(t,'Ihr sprecht gutes Deutsch!','You speak good German!','sprecht','ihr','präsens',48),
(t,'Ihr sprecht gleichzeitig.','You are speaking at the same time.','sprecht','ihr','präsens',49),
(t,'Ihr sprecht alle so verschieden.','You all speak so differently.','sprecht','ihr','präsens',50),
-- sie/Sie sprechen (51–60)
(t,'Die Kinder sprechen drei Sprachen.','The children speak three languages.','sprechen','sie/Sie','präsens',51),
(t,'Sie sprechen fließend Deutsch.','They speak German fluently.','sprechen','sie/Sie','präsens',52),
(t,'Meine Eltern sprechen kein Englisch.','My parents do not speak English.','sprechen','sie/Sie','präsens',53),
(t,'Die Touristen sprechen Spanisch.','The tourists speak Spanish.','sprechen','sie/Sie','präsens',54),
(t,'Sie sprechen zu leise.','They are speaking too quietly.','sprechen','sie/Sie','präsens',55),
(t,'Sprechen Sie Deutsch?','Do you speak German? (formal)','sprechen','sie/Sie','präsens',56),
(t,'Die Schüler sprechen gut Englisch.','The students speak English well.','sprechen','sie/Sie','präsens',57),
(t,'Viele Menschen sprechen zwei Sprachen.','Many people speak two languages.','sprechen','sie/Sie','präsens',58),
(t,'Sie sprechen gerade miteinander.','They are currently talking to each other.','sprechen','sie/Sie','präsens',59),
(t,'Wie viele Sprachen sprechen Sie?','How many languages do you speak? (formal)','sprechen','sie/Sie','präsens',60);

-- ─────────────────────────────────────────────────────────────────────────────
-- B1: GANZ VS. ZIEMLICH
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gwc_grammar_topics (title, slug, level, category, explanation_en, sort_order)
VALUES (
  'ganz vs. ziemlich',
  'ganz-vs-ziemlich',
  'B1',
  'adjective_usage',
  '"Ganz" and "ziemlich" both translate roughly as "quite" or "fairly" in English — but they work very differently.

**ziemlich** — always a neutral moderate-to-high degree:
- Das Buch ist ziemlich interessant. (The book is quite interesting.)
- Er ist ziemlich müde. (He is fairly tired.)

**ganz** — the effect depends on the adjective:

1. **Non-laudatory positives** (gut, schön, ordentlich) when unstressed → **WEAKENS**
   - ganz gut = "not bad" / "pretty good" (weaker than "gut" alone)

2. **Negative adjectives** (schlimm, schlecht) → **STRENGTHENS**
   - ganz schlimm = "really terrible"

3. **Laudatory positives** (wunderschön, toll, fantastisch) → **STRENGTHENS**
   - ganz wunderschön = "absolutely beautiful"

**Rule of thumb:** When unsure, use **ziemlich** — it is always safe and neutral.',
  10
) RETURNING id INTO t;

INSERT INTO gwc_grammar_sentences (topic_id, sentence_de, sentence_en, cloze_word, person, tense, sort_order) VALUES
-- ganz (weakening with non-laudatory positives)
(t,'Der Film war ganz gut, aber nicht großartig.','The film was pretty good, but not great.','ganz',NULL,NULL,1),
(t,'Das Essen war ganz ordentlich.','The food was decent enough.','ganz',NULL,NULL,2),
(t,'Der Test war ganz okay.','The test was okay.','ganz',NULL,NULL,3),
(t,'Das Wetter ist ganz schön heute.','The weather is sort of nice today.','ganz',NULL,NULL,4),
-- ganz (strengthening with negative adjectives)
(t,'Das war ganz schlimm!','That was really terrible!','ganz',NULL,NULL,5),
(t,'Die Situation ist ganz schlecht.','The situation is really bad.','ganz',NULL,NULL,6),
-- ganz (strengthening with laudatory positives)
(t,'Sie ist ganz wunderschön.','She is absolutely beautiful.','ganz',NULL,NULL,7),
(t,'Das Konzert war ganz fantastisch!','The concert was absolutely fantastic!','ganz',NULL,NULL,8),
-- ziemlich (neutral moderate-to-high degree)
(t,'Der Test war ziemlich schwierig.','The test was quite difficult.','ziemlich',NULL,NULL,9),
(t,'Er ist ziemlich müde nach der langen Reise.','He is fairly tired after the long journey.','ziemlich',NULL,NULL,10);

END;
$$;
