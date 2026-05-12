export const GUIDE_CARDS = [
  {
    title: 'What is Mirar?',
    body: 'Mirar is a 2-minute daily mirror for your inner state. Each day, it asks one simple question and reflects back a small signal.',
  },
  {
    title: 'What is a daily mirror?',
    body: 'A daily mirror is a small pause where you choose what feels closest today. You do not need to write, explain, or fix anything.',
  },
  {
    title: 'What is a signal?',
    body: 'A signal is a small reflection based on your answer. It is not a score, diagnosis, or advice.',
  },
  {
    title: 'What is a pattern?',
    body: 'A pattern is what starts to repeat across your signals. One answer shows a moment. Repeated answers can show what has been quietly building.',
  },
  {
    title: 'Why one question a day?',
    body: 'Because Mirar is designed to be light enough to return to. The value is not in answering more. The value is in noticing a little, consistently.',
  },
  {
    title: 'Is this therapy?',
    body: 'No. Mirar is not therapy, diagnosis, or mental health treatment. It is a reflection system that helps you notice your internal patterns.',
  },
  {
    title: 'What happens if I miss a day?',
    body: 'Nothing breaks. There are no streaks to protect and no days to catch up. When you return, Mirar continues from where you left off.',
  },
  {
    title: 'How should I read my summary?',
    body: 'Read it as a mirror, not a verdict. Your summary reflects what your recent answers have been pointing toward.',
  },
  {
    title: 'How does Mirar help over time?',
    body: 'Mirar helps you notice the states you keep returning to: where you feel steady, where you feel stretched, where you feel unclear, and where something may be asking for attention.',
  },
];

export const GUIDANCE_TOOLTIPS = {
  signal: 'A signal is a small reflection based on your answer. It is not a score or diagnosis.',
  pattern: 'A pattern is what starts to repeat across your signals over time.',
  reflectionSummary: 'A summary reflects what your recent answers have been pointing toward. Read it as a mirror, not a verdict.',
  todaysMirror: 'Today’s mirror is one simple question, one answer, and one small signal.',
  underLoad: 'Under Load means your answers may be pointing to pressure, effort, or emotional weight. It does not mean something is wrong.',
  steady: 'Steady means your answers suggest enough clarity or balance to continue.',
  drifting: 'Drifting means your answers may be pointing to movement without full clarity or connection.',
  aligned: 'Aligned means today’s answer points toward clarity, steadiness, or inner agreement.',
  stillForming: 'Mirar needs a few reflections before it can show a useful pattern.',
  recentReflections: 'Recent reflections are your latest daily mirrors. They help Mirar notice what is repeating.',
  whatsShowingUp: 'What’s been showing up is a simple read of your recent signals, not a performance dashboard.',
};

export function signalHelpForStatus(status: string | null | undefined): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized.includes('load')) return GUIDANCE_TOOLTIPS.underLoad;
  if (normalized.includes('steady')) return GUIDANCE_TOOLTIPS.steady;
  if (normalized.includes('aligned')) return GUIDANCE_TOOLTIPS.aligned;
  if (normalized.includes('forming')) return GUIDANCE_TOOLTIPS.stillForming;
  if (normalized.includes('drift')) return GUIDANCE_TOOLTIPS.drifting;
  if (normalized.includes('settling') || normalized.includes('stabil')) {
    return 'Settling means today’s answer points toward movement that is becoming clearer, but may not feel fully steady yet.';
  }
  return GUIDANCE_TOOLTIPS.signal;
}

export function mirrorSignalLabel(status: string | null | undefined): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized.includes('load')) return 'Under Load';
  if (normalized.includes('aligned')) return 'Aligned';
  if (normalized.includes('steady')) return 'Steady';
  if (normalized.includes('stabil')) return 'Settling';
  if (normalized.includes('forming')) return 'Still forming';
  if (normalized.includes('drift')) return 'Drifting';
  return status || 'Still forming';
}
