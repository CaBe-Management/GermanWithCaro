-- Add resources column to gwc_vocab (same JSONB structure as gwc_grammar_topics)
ALTER TABLE gwc_vocab
  ADD COLUMN IF NOT EXISTS resources jsonb;

-- Add resource for einfach (YouTube Shorts)
UPDATE gwc_vocab
SET resources = '[
  {
    "type": "youtube",
    "url": "https://www.youtube.com/shorts/86SEunbKmbI",
    "title": "einfach — German With Caro",
    "description": "Quick explainer on how to use \"einfach\" in everyday German"
  }
]'::jsonb
WHERE slug = 'einfach';
