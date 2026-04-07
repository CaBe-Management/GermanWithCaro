-- Seed: 3 A1 reading stories for Reading Practice
-- Run add_stories.sql and add_story_translation.sql first

INSERT INTO gwc_stories (title, content, content_en, level, sort_order) VALUES

(
  'Der Morgen',
  'Tom wacht um sieben Uhr auf. Er geht ins Bad und putzt die Zähne. Dann macht er Kaffee.

Er trinkt den Kaffee am Tisch. Er isst Brot mit Butter. Das Brot ist frisch und lecker.

Um acht Uhr geht Tom zur Arbeit. Er geht zu Fuß. Das Wetter ist heute schön.',
  'Tom wakes up at seven o''clock. He goes to the bathroom and brushes his teeth. Then he makes coffee.

He drinks the coffee at the table. He eats bread with butter. The bread is fresh and delicious.

At eight o''clock, Tom goes to work. He walks. The weather is nice today.',
  'A1',
  1
),

(
  'Im Supermarkt',
  'Maria braucht Lebensmittel. Sie geht in den Supermarkt. Sie nimmt einen Einkaufswagen.

Sie kauft Milch, Brot und Äpfel. Die Äpfel sind rot und groß. Die Milch ist kalt.

An der Kasse bezahlt Maria. Es kostet neun Euro. Sie sagt „Danke" und geht nach Hause.',
  'Maria needs groceries. She goes to the supermarket. She takes a shopping cart.

She buys milk, bread and apples. The apples are red and large. The milk is cold.

At the checkout, Maria pays. It costs nine euros. She says "Thank you" and goes home.',
  'A1',
  2
),

(
  'Ein Hund namens Max',
  'Lisa hat einen Hund. Der Hund heißt Max. Max ist klein und braun.

Jeden Tag geht Lisa mit Max in den Park. Max läuft schnell und spielt gern. Er ist sehr glücklich.

Abends schläft Max auf dem Sofa. Er ist müde. Lisa lacht und sagt: „Gute Nacht, Max!"',
  'Lisa has a dog. The dog''s name is Max. Max is small and brown.

Every day, Lisa goes to the park with Max. Max runs fast and loves to play. He is very happy.

In the evening, Max sleeps on the sofa. He is tired. Lisa laughs and says: "Good night, Max!"',
  'A1',
  3
);
