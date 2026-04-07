# German With Caro (GWC v2)

A modern German vocabulary learning app built with Next.js 15 and Supabase. Learn German word-by-word with cloze deletion cards and spaced repetition.

## Features

- **Cloze Deletion Cards**: Learn German by filling in missing words in sentences
- **Spaced Repetition (SRS)**: SM-2 algorithm for optimal review scheduling
- **Anonymous Learning**: No authentication needed — just start learning
- **Dark Theme**: Beautiful dark purple/violet interface inspired by Bunpro
- **Real-time Sync**: Cards sync from Supabase instantly
- **Progress Tracking**: Dashboard shows stats and recent words

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for data management
- **React 18** for components

## Getting Started

### 1. Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL editor, run the contents of `supabase/seed.sql` to create tables and seed the first 20 A1 words
3. Copy your project URL and anon key from Settings → API

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can use `.env.local.example` as a template.

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding Words and Sentences

Caroline can add words and sentences directly to Supabase. The app fetches data from:

- **gwc_words**: Contains word definitions, parts of speech, articles, and plurals
- **gwc_sentences**: Contains example sentences with cloze deletion words
- **gwc_user_reviews**: Tracks learning progress and review schedules

### Example: Add a new word

In Supabase SQL editor:

```sql
INSERT INTO gwc_words (word, typ, artikel, plural, level, frequenz_rang)
VALUES ('Apfel', 'NOMEN', 'der', 'Äpfel', 'A1', 21);

-- Then add 3 example sentences
WITH w AS (SELECT id FROM gwc_words WHERE word = 'Apfel' AND level = 'A1')
INSERT INTO gwc_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ein Apfel ist rot.', 'An apple is red.', 'Apfel', 1 FROM w
UNION ALL SELECT w.id, 'Der Apfel schmeckt gut.', 'The apple tastes good.', 'Apfel', 2 FROM w
UNION ALL SELECT w.id, 'Ich esse einen Apfel.', 'I eat an apple.', 'Apfel', 3 FROM w;
```

## How It Works

### Learn Page (`/learn`)

- Shows all unreviewed sentences
- Displays a cloze card with a sentence and blank word
- User types the answer and checks it
- On correct: shows green confirmation and English translation
- On incorrect: shows red error and the correct answer
- After all cards: completion screen

### Review Page (`/review`)

- Shows sentences due for review (based on SM-2 scheduling)
- Same cloze card interface
- Updates spaced repetition intervals on each review
- Correct answers extend the review interval; wrong answers reset it

### Dashboard (`/`)

- Welcome message and quick stats
- Action buttons to Learn or Review
- Recent words list
- Easy navigation to learning paths

## Styling

The app uses a dark purple/violet color scheme:

- **Background**: `#0f0e17` (very dark)
- **Cards**: `#252340` (dark purple)
- **Primary Accent**: `#7c6df2` (purple)
- **Secondary Accent**: `#9b8cf5` (lighter violet)
- **Success**: `#4ade80` (green)
- **Error**: `#f87171` (red)

All colors are defined in `tailwind.config.ts`.

## Project Structure

```
gwc_v2/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles
│   ├── page.tsx            # Dashboard
│   ├── learn/
│   │   └── page.tsx        # Learning interface
│   └── review/
│       └── page.tsx        # Review interface
├── components/
│   ├── Navbar.tsx          # Top navigation
│   ├── ClozeCard.tsx       # Main learning card
│   └── WordCard.tsx        # Word info display
├── lib/
│   ├── supabase.ts         # Supabase client & types
│   ├── srs.ts              # SM-2 algorithm
│   └── session.ts          # Anonymous session management
├── supabase/
│   └── seed.sql            # Database schema & seed data
└── tailwind.config.ts      # Tailwind configuration
```

## Features for Future Development

- A2, B1+ word levels (already structurally supported)
- Audio pronunciation (using Web Audio API)
- Analytics and learning statistics
- Spaced repetition customization
- Word categories/tags
- Image associations for words
- Keyboard shortcuts
- Mobile app version

## Notes

- The app uses anonymous sessions stored in `localStorage`
- No user authentication is required for the MVP
- All data is stored in Supabase and syncs in real-time
- The SM-2 algorithm adjusts difficulty based on user performance
- Sentences can be added at any time and appear immediately

## Troubleshooting

**"No new cards to learn"**: Make sure you've run the seed.sql script in Supabase to populate the database with words and sentences.

**Reviews not showing**: The app only shows reviews that are due (next_review_at <= now()). Check the `gwc_user_reviews` table in Supabase to verify review schedules.

**Cards not loading**: Check browser console for errors and verify your Supabase URL and key are correct in `.env.local`.

## License

Built with ❤️ for German language learning.
