/**
 * Simple profanity filter for display names.
 * Covers common English, German, and French offensive words.
 * Not exhaustive — intended as a first-pass deterrent.
 */

const BLOCKED: string[] = [
  // English
  'fuck','shit','ass','asshole','bitch','cunt','dick','cock','pussy','whore',
  'nigger','nigga','faggot','fag','retard','slut','bastard','prick','twat',
  'wanker','motherfucker','fucker','bullshit','crap',
  // German
  'scheiße','scheisse','arsch','arschloch','fick','wichser','hurensohn',
  'nutte','fotze','schwuchtel','vollidiot','idiot','depp','trottel',
  'wichse','kacke','pisser','schlampe','hure',
  // French
  'merde','putain','connard','connasse','salope','enculé','encule',
  'batard','bordel','cul','foutre','nique','pute',
]

// Normalise: lowercase, remove spaces/dots/underscores used to evade filter
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, '')  // strip non-alphanumeric (incl. separators)
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
}

export function containsProfanity(name: string): boolean {
  const norm = normalise(name)
  return BLOCKED.some(word => norm.includes(normalise(word)))
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 2)  return 'Name must be at least 2 characters.'
  if (trimmed.length > 30) return 'Name must be 30 characters or less.'
  if (!/^[\p{L}\p{N} '_.\-]+$/u.test(trimmed))
    return 'Only letters, numbers, spaces, and _ . - \' are allowed.'
  if (containsProfanity(trimmed)) return 'That name isn\'t allowed.'
  return null // valid
}
