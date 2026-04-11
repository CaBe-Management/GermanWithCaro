-- ─────────────────────────────────────────────────────────────────────────────
-- Clear empty placeholder resources from all grammar topics.
-- Resources should be NULL until real links (own TikToks, YouTube, etc.) exist.
-- The empty JSON array placeholder '[{"type":"tiktok","url":"","title":"","description":""}]'
-- was added by early migrations and should not be shown in the UI.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE gwc_grammar_topics
SET resources = NULL
WHERE resources IS NOT NULL;
