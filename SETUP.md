# Quick Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in project name (e.g., "gwc-v2")
4. Create a strong database password
5. Select a region close to you
6. Wait for project to be ready (2-3 minutes)

## Step 2: Run Database Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase/seed.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Confirm that all tables are created and 20 words are seeded with 60 sentences

## Step 3: Get Your API Credentials

1. In Supabase, go to **Settings** (bottom of left sidebar)
2. Click **API**
3. Copy the **Project URL** (under "Project URL")
4. Copy the **anon public** key (under "Project API keys")
5. Keep these safe — you'll need them next

## Step 4: Configure Your App

1. In your terminal, navigate to the `gwc_v2` folder
2. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
3. Open `.env.local` and paste your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 5: Install Dependencies

```bash
npm install
```

This installs React, Next.js, Tailwind, Supabase client, and all other dependencies.

## Step 6: Run the App

```bash
npm run dev
```

The app will start on **http://localhost:3000**

Open it in your browser and you should see:
- Dashboard with 20 words and 60 sentences ready to learn
- "Learn [60]" button in the navbar
- Recent words listed on the home page

## Testing the App

1. Click **Learn [60]** to start learning
2. You'll see a German sentence with a blank
3. Type the missing word and click **Check**
4. See if you got it right (green) or wrong (red)
5. Click **Next** to continue
6. Complete all 60 cards to unlock **Review** cards tomorrow

## Adding More Words Later

Once you're ready to add more words, you can:

### Via Supabase Dashboard (easiest):
1. Go to Supabase → Tables
2. Click `gwc_words` and insert a new row
3. Click `gwc_sentences` and add 3 example sentences for each word

### Via SQL:
```sql
INSERT INTO gwc_words (word, typ, artikel, plural, level, frequenz_rang)
VALUES ('Apfel', 'NOMEN', 'der', 'Äpfel', 'A1', 21);

WITH w AS (SELECT id FROM gwc_words WHERE word = 'Apfel')
INSERT INTO gwc_sentences (word_id, sentence_de, sentence_en, cloze_word, sort_order)
SELECT w.id, 'Ein Apfel ist rot.', 'An apple is red.', 'Apfel', 1 FROM w
UNION ALL SELECT w.id, 'Ich esse einen Apfel.', 'I eat an apple.', 'Apfel', 2 FROM w
UNION ALL SELECT w.id, 'Der Apfel schmeckt gut.', 'The apple tastes good.', 'Apfel', 3 FROM w;
```

New words appear in the app immediately!

## Building for Production

When you're ready to deploy:

```bash
npm run build
npm run start
```

Then deploy to Vercel, Netlify, or your preferred hosting.

## Troubleshooting

**"Connection refused" error**:
- Check your Supabase URL and key are correct in `.env.local`
- Make sure the Supabase project is running

**"No new cards to learn"**:
- Run the seed.sql script again in Supabase SQL Editor
- Check the `gwc_words` and `gwc_sentences` tables have data

**Cards not loading**:
- Open browser DevTools (F12)
- Check the Console tab for errors
- Make sure your Supabase credentials are correct

**Styles look broken**:
- Run `npm run dev` again
- Clear browser cache (Ctrl+Shift+Delete)
- Check that tailwindcss is installed: `npm list tailwindcss`

## Next Steps

1. Learn all 60 initial cards
2. Come back tomorrow for reviews
3. Add more A2 words as you progress
4. Watch your vocabulary grow!

Good luck! 🎉
