import { CATALOG, CATALOG_BY_ID } from './catalog';
import { Exercise, RepRecord } from './types';

// ─── Exercise selection engine (spec §10–11) ──────────────────────────────────
// Not "random question of the day": scores every eligible exercise against what
// the user has recently exercised, how heavy it's been, what's unresolved, and
// avoids repetition fatigue. Pure + deterministic for a given (history, day) so
// reopening the app the same day shows the same rep. It prefers rest over
// escalation: after a heavy rep it offers a light, positive-compatible one.

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAY_MS = 86400000;

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

/** Did this completed rep involve an option marked as a burden? */
export function repHadBurden(rec: RepRecord): boolean {
  const ex = CATALOG_BY_ID[rec.exerciseId];
  if (!ex) return false;
  const opts = [...(ex.options ?? []), ...(ex.statements ?? []), ...(ex.follow_up?.options ?? [])];
  const chosen = [rec.answer.primary, rec.answer.followUp].filter(Boolean) as string[];
  return opts.some((o) => o.burden && chosen.includes(o.id));
}

export interface Selection {
  exercise: Exercise;
  score: number;
  reasons: string[];
}

export function selectExercise(history: RepRecord[], now: Date = new Date(), catalog: Exercise[] = CATALOG): Selection {
  const sorted = [...history].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1)); // newest first
  const n = sorted.length;
  const last = sorted[0];
  const today = dayKey(now);

  const lastIndexOf = (pred: (r: RepRecord) => boolean) => sorted.findIndex(pred);
  const ageDays = (r: RepRecord) => Math.floor((now.getTime() - new Date(r.completedAt).getTime()) / DAY_MS);

  const lastHeavy = !!last && repHadBurden(last);
  const lastTwoUnknown = sorted.slice(0, 2).length === 2 && sorted.slice(0, 2).every((r) => r.answer.unknown);
  const needsEase = lastHeavy || lastTwoUnknown;

  // An open commitment named ≥3 days ago and not revisited since.
  const openCommit = sorted.find((r) => r.exerciseId === 'act_followthrough' && r.answer.primary === 'yes');
  const revisitedSince = openCommit
    ? sorted.slice(0, sorted.indexOf(openCommit)).some((r) => r.exerciseId === 'act_followthrough')
    : false;
  const wantsFollowUp = !!openCommit && !revisitedSince && ageDays(openCommit) >= 3;

  const score = (ex: Exercise) => {
    const reasons: string[] = [];
    let s = 0;

    // capacity recency — never the same capacity twice in a row
    const capPos = lastIndexOf((r) => r.capacity === ex.capacity);
    if (capPos === -1) { s += 4; reasons.push('capacity not yet exercised'); }
    else if (capPos === 0) { s -= 6; reasons.push('same capacity as last rep'); }
    else if (capPos === 1) { s += 0; }
    else if (capPos === 2) { s += 1; }
    else { s += 2; reasons.push('capacity rested'); }

    // interaction variety / repetition fatigue
    if (last && last.interactionType === ex.interaction_type) { s -= 3; reasons.push('same format as last rep'); }
    else if (sorted[1] && sorted[1].interactionType === ex.interaction_type) s -= 1;
    if (sorted.slice(0, 4).filter((r) => r.interactionType === ex.interaction_type).length >= 3) s -= 2;

    // intensity: don't keep escalating
    const recentHeavier = sorted.slice(0, 2).filter((r) => r.intensity !== 'light').length;
    if (recentHeavier >= 1 && ex.intensity === 'light') { s += 2; reasons.push('lighter after a heavier rep'); }
    if (recentHeavier === 0 && ex.intensity === 'medium') s += 1;
    if (ex.intensity === 'deep' && n < 10) s -= 10;

    // ease: after a burden or two "I don't know"s, offer something gentle
    if (needsEase) {
      if (ex.positive_state_compatible && ex.intensity === 'light') { s += 3; reasons.push('gentle after a heavy day'); }
      if (ex.sensitivity !== 'low') s -= 2;
      if (ex.action_oriented && !wantsFollowUp) s -= 1;
    }

    // keep a regular share of positive / neutral reps
    const recentPositive = sorted.slice(0, 5).some((r) => (CATALOG_BY_ID[r.exerciseId]?.tags ?? []).includes('positive'));
    if (!recentPositive && ex.tags.includes('positive')) { s += 2; reasons.push('keeps positives in the mix'); }

    // unresolved commitment, revisited after a few days
    if (wantsFollowUp && ex.id === 'act_followthrough') { s += 5; reasons.push('revisit an open commitment'); }

    // cold start: a light, concrete first rep
    if (n === 0 && ex.id === 'foc_attention') s += 3;
    if (n < 3 && ex.id === 'neutral_nothing') s -= 4; // not a first impression

    // deterministic daily jitter (<0.1) so ties break the same way all day
    s += hash01(today + ex.id) / 10;
    return { s, reasons };
  };

  const inWindow = (ex: Exercise) => {
    const pos = lastIndexOf((r) => r.exerciseId === ex.id);
    if (pos === -1 || pos >= ex.repetition_window) return false;
    // an open commitment may return before its window ends
    if (ex.id === 'act_followthrough' && wantsFollowUp) return false;
    return true;
  };

  let pool = catalog.filter((ex) => ex.minimum_history <= n && !inWindow(ex));
  if (pool.length === 0) pool = catalog.filter((ex) => ex.minimum_history <= n); // tiny catalog fallback
  if (pool.length === 0) pool = catalog;

  const ranked = pool.map((ex) => ({ ex, ...score(ex) })).sort((a, b) => b.s - a.s);
  const top = ranked[0];
  return { exercise: top.ex, score: Math.round(top.s * 100) / 100, reasons: top.reasons };
}
