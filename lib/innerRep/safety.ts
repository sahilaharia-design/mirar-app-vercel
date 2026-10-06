// ─── Safety (must exist before any free text is collected) ───────────────────
// A best-effort language check on anything the user types. It is NOT a clinical
// tool and will miss things; its job is to never respond to acute-risk language
// with an exercise. On a hit the UI stops the rep, shows resources, and the text
// is NOT stored. It is NOT validated: it misses paraphrase, misspellings, and
// non-Roman scripts (Devanagari/Gujarati), and has false positives on idioms
// (docs/ENGINE_REVIEW.md §9). Wording + helpline list need founder/clinician sign-off before
// production (flagged in docs/EMOTIONAL_FITNESS_AUDIT.md).
const PATTERNS: RegExp[] = [
  /\bkill(ing)?\s+my\s*self\b/i,
  /\bend(ing)?\s+(it\s+all|my\s+(own\s+)?life)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want(ed)?\s+to|wanna|gonna|going\s+to)\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(be\s+here|live|exist)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\b(hurt|harm|cut)(ting)?\s+my\s*self\b/i,
  /\b(hurt|harm|cutt)ing\s+my\s*self\b/i,
  /\bself[-\s]?harm\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  // Hinglish (Roman script), common phrasings
  /\bmarna\s+chah(ta|ti|iye)\b/i,
  /\bjeena\s+nahi\s+(chah|hai|hota)/i,
  /\bmar\s+jaun(ga|gi)\b/i,
  /\bmar\s+jaana\s+chah/i,
  /\bzindagi\s+khatam\b/i,
  /\bkhud\s+ko\s+(khatam|maar)/i,
  /\bapni\s+jaan\s+de/i,
  /\batmahatya\b/i,
];

export function containsCrisisLanguage(text: string): boolean {
  const t = (text ?? '').trim();
  return t.length > 0 && PATTERNS.some((re) => re.test(t));
}

export const SAFETY_RESOURCES = {
  headline: 'That sounds really heavy. Mirar can\'t help with this — a person can.',
  body: 'If you might act on these thoughts, or you\'re in danger right now, please contact emergency services or a crisis line. You don\'t have to be sure it\'s "serious enough" to call.',
  lines: [
    { label: 'Emergency (India)', value: '112' },
    { label: 'Tele-MANAS — free, 24x7 (India)', value: '14416' },
    { label: 'Elsewhere', value: 'Call your local emergency number' },
  ],
  note: 'Mirar is not therapy or crisis support.',
} as const;
