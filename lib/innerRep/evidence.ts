import { CATALOG_BY_ID } from './catalog';
import { Capacity, Insight, RepOption, RepRecord } from './types';
import { ENGINE_CONFIG, EVIDENCE_CONFIG } from './config';

// ─── Honest Mirror, v1: evidence rules (spec §12–17) ──────────────────────────
// Counts what the user actually selected. No causal claims, no diagnosis, no
// personality model. Silence is a valid output: if the evidence doesn't clear
// the bar, return null and the UI simply says "Done for today."
const E = EVIDENCE_CONFIG;
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
  // Say it once, when the run reaches the threshold — not again every day after.
  const runLen = (() => { let n = 0; for (const r of sorted) { if (r.answer.unknown) n++; else break; } return n; })();
  if (runLen === E.unknownRun) {
    return {
      kind: 'observation',
      text: `That's ${E.unknownRun} "I don't know"s in a row. That's allowed — nothing to force.`,
      evidence: { count: E.unknownRun, of: E.unknownRun, windowDays: E.windowDays },
    };
  }
  if (newest.answer.unknown) return null;

  const cutoff = now.getTime() - E.windowDays * DAY_MS;
  const inWindow = sorted.filter((r) => new Date(r.completedAt).getTime() >= cutoff);

  for (const opt of chosenOptions(newest)) {
    if (!opt.key || !opt.tag) continue;
    if (opt.tag === 'nothing' || opt.tag === 'none') continue; // not a thing to count up
    // comparable reps = those whose answer includes this key
    const comparable = inWindow.filter((r) => chosenOptions(r).some((o) => o.key === opt.key));
    const same = comparable.filter((r) => chosenOptions(r).some((o) => o.key === opt.key && o.tag === opt.tag));
    const of = comparable.length, count = same.length;

    if (of >= E.pattern.minComparable && count >= E.pattern.minCount && count / of >= E.pattern.minShare) {
      return {
        kind: 'pattern',
        text: `"${opt.label}" has come up in ${count} of your last ${of} reps like this one.`,
        evidence: { count, of, windowDays: E.windowDays },
      };
    }
    if (of >= E.early.minComparable && count === of && of < E.pattern.minComparable) {
      return {
        kind: 'unknown',
        text: `You've chosen "${opt.label}" ${count === 2 ? 'twice' : `${count} times`} now. Too early to call it a pattern.`,
        evidence: { count, of, windowDays: E.windowDays },
      };
    }
  }
  return null;
}

/** One quiet line for Home, only if the history supports it. */
export function continuityCue(history: RepRecord[], now: Date = new Date()): string | null {
  const sorted = [...history].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  if (sorted.length === 0) return null;

  const open = sorted.find((r) => r.exerciseId === ENGINE_CONFIG.followThrough.exerciseId);
  if (open && open.answer.primary && ENGINE_CONFIG.followThrough.openAnswerIds.includes(open.answer.primary)) {
    const days = Math.floor((now.getTime() - new Date(open.completedAt).getTime()) / DAY_MS);
    if (days >= 1 && days <= ENGINE_CONFIG.followThrough.cueMaxAgeDays) return 'Last time you said something was still undone.';
  }
  const recent = sorted.slice(0, E.cue.recentLookback);
  const counts = new Map<Capacity, number>();
  for (const r of recent) counts.set(r.capacity, (counts.get(r.capacity) ?? 0) + 1);
  for (const [cap, c] of counts) {
    if (recent.length >= E.cue.minRecent && c >= E.cue.minSameCapacity) return `${CAPACITY_NAME[cap]} has appeared in several recent reps.`;
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
