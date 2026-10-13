// FIXTURES for review and staging only. Builds a synthetic pilot history by running the REAL pilot sessions with a seeded
// answerer, so the records are exactly the shape a person would produce. They are labelled as fixtures in the UI and are
// never read from, or written to, any production path. This module is required behind the staging gate (see app/pilots.tsx).
import { PilotSession } from '../../lib/innerRep/pilots/session';
import { PILOT_CAPS, PAnswer, PilotId, PilotRecord, PStep } from '../../lib/innerRep/pilots/types';

const addDays = (iso: string, n: number) => { const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n)); return d.toISOString().slice(0, 10); };

export function buildFixtures(today: string, seed = 11): PilotRecord[] {
  let s = seed; const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const answer = (st: PStep): PAnswer => {
    if (st.type === 'choice') return { stepId: st.id, kind: 'option', optionId: pick(st.options.filter((o) => !o.disabled)).id };
    if (st.type === 'multi') { const ids = [...st.options].sort(() => rnd() - 0.5).slice(0, Math.floor(rnd() * Math.min(3, st.max) + 1)).map((o) => o.id); return { stepId: st.id, kind: 'options', optionIds: ids }; }
    if (st.type === 'words') return rnd() < 0.25 ? { stepId: st.id, kind: 'skip' } : { stepId: st.id, kind: 'words', chars: 30 };
    return { stepId: st.id, kind: 'hold_end' };
  };
  const plan: [number, PilotId][] = [[-13, 'attend'], [-12, 'look_again'], [-10, 'attend'], [-9, 'look_again'], [-7, 'attend'], [-6, 'look_again'], [-4, 'attend'], [-3, 'look_again'], [-2, 'attend']];
  const out: PilotRecord[] = [];
  for (const [off, pilot] of plan) {
    const date = addDays(today, off); const sess = new PilotSession(pilot, { today: date, caps: PILOT_CAPS, prior: out });
    for (let i = 0; i < 40 && sess.step(); i++) sess.answer(answer(sess.step()!));
    const rec = sess.record(out.length + 1); if (rec) out.push(rec);
  }
  return out;
}
