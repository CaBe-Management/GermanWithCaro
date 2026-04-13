-- Add YouTube resource to "Verbs that Take a Dative Object" (helfen etc.)
UPDATE gwc_grammar_topics
SET resources = '[{"type":"youtube","url":"https://youtube.com/shorts/jszKyV66RrU?feature=share","title":"helfen + Dativ — German With Caro","description":"How to use helfen and other dative verbs in everyday German"}]'::jsonb
WHERE slug = 'verben-mit-dativobjekt';
