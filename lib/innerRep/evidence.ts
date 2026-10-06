import { CATALOG_BY_ID } from './catalog';
import { Capacity, Insight, RepOption, RepRecord } from './types';

// ─── Honest Mirror, v1: evidence rules (spec §12–17) ──────────────────────────
// Counts what the user actually selected. No causal claims, no diagnosis, no
// personality model. Silence is a valid output: if the evidence doesn't clear
// the bar, return null and the UI simply says "Done for today."
export const PATTERN_MIN_OF = 4;       // need this many comparable reps…
export const PATTERN_MIN_COUNT = 3;    // …with this many the same…
export const PATTERN_MIN_SHARE = 0.6;  // …and at least this share
export const WINDOW_DAYS = 28;
const DAY_MS = 86400000;

const CAPACITY_NAME: Record<Capacity, string> = {
  direction: 'Direction', energy: 'Energy', focus: 'Focus',
  relationships: 'Relationships', growth: 'Growth', action: 'Action',
};
export const capacityName = (c: Capacity) => CAPACITY_NAME[c];

function chosenOptions(rec: RepRecord): RepOption[] {
  const ex = CATALOG_BY_ID[rec.exerciseId];
  if (!ex) return [];
  const all = [...(ex.options ?? []), ...(ex.statements ?? []), ...(ex.follow_up?.options ?? [])];
  const ids = [rec.answer.primary, rec.answer.followUp].filter(Boolean) as string[];
  return all.filter((o) => ids.includes(o.id));
}

export function buildInsight(history: RepRecord[], now: Date = new Date()): Insight | null {
  const sorted = [...history].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  const newest = sorted[0];
  if (!newest) return null;

  // "I don't know" three times running — name it, don't push.
  if (sorted.length >= 3 && sorted.slice(0, 3).every((r) => r.answer.unknown)) {
    return {
      kind: 'observation',
      text: "That's three \"I don't know\"s in a row. That's allowed — nothing to force.",
      evidence: { count: 3, of: 3, windowDays: WINDOW_DAYS },
    };
  }
  if (newest.answer.unknown) return null;

  const cutoff = now.getTime() - WINDOW_DAYS * DAY_MS;
  const inWindow = sorted.filter((r) => new Date(r.completedAt).getTime() >= cutoff);

  for (const opt of chosenOptions(newest)) {
    if (!opt.key || !opt.tag) continue;
    if (opt.tag === 'nothing' || opt.tag === 'none') continue; // not a thing to count up
    // comparable reps = those whose answer includes this key
    const comparable = inWindow.filter((r) => chosenOptions(r).some((o) => o.key === opt.key));
    const same = comparable.filter((r) => chosenOptions(r).some((o) => o.key === opt.key && o.tag === opt.tag));
    const of = comparable.length, count = same.length;

    if (of >= PATTERN_MIN_OF && count >= PATTERN_MIN_COUNT && count / of >= PATTERN_MIN_SHARE) {
      return {
        kind: 'pattern',
        text: `"${opt.label}" has come up in ${count} of your last ${of} reps like this one.`,
        evidence: { count, of, windowDays: WINDOW_DAYS },
      };
    }
    if (of >= 2 && count === of && of < PATTERN_MIN_OF) {
      return {
        kind: 'unknown',
        text: `You've chosen "${opt.label}" ${count === 2 ? 'twice' : `${count} times`} now. Too early to call it a pattern.`,
        evidence: { count, of, windowDays: WINDOW_DAYS },
      };
    }
  }
  return null;
}

/** One quiet line for Home, only if the history supports it. */
export function continuityCue(history: RepRecord[], now: Date = new Date()): string | null {
  const sorted = [...history].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  if (sorted.length === 0) return null;

  const open = sorted.find((r) => r.exerciseId === 'act_followthrough');
  if (open && open.answer.primary === 'yes') {
    const days = Math.floor((now.getTime() - new Date(open.completedAt).getTime()) / DAY_MS);
    if (days >= 1) return 'Last time you said something was still undone.';
  }
  const recent = sorted.slice(0, 5);
  const counts = new Map<Capacity, number>();
  for (const r of recent) counts.set(r.capacity, (counts.get(r.capacity) ?? 0) + 1);
  for (const [cap, c] of counts) {
    if (recent.length >= 4 && c >= 3) return `${CAPACITY_NAME[cap]} has appeared in several recent reps.`;
  }
  return null;
}

/** Distinct days of practice in the calendar month of `now` (no streak, no shame). */
export function practiceDaysThisMonth(history: RepRecord[], now: Date = new Date()): number {
  const set = new Set<string>();
  for (const r of history) {
    const d = new Date(r.completedAt);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }
  return set.size;
}
