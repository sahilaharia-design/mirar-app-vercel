import { carryCandidates, CARRY_WINDOW_DAYS, PULLS, WHEN_LABEL } from './attend';
import { PILOT_TITLES, valueOf } from './session';
import { MAX_RECORDS, RETENTION_DAYS } from './store';
import type { AttendRecord, LookAgainRecord, PilotId, PilotRecord, RepValue } from './types';
import { PILOT_CAPS } from './types';

// ─── Read models for Today / receipt / Mirror (pure functions of stored pilot records) ───────────────────────────────
// Nothing here infers. It selects, counts and phrases what the person chose, with the ids it came from.
// Never produced: scores, levels, rankings, traits, "you tend to", "improved", reasons for anything, or any reference to
// what was typed (nothing typed exists in a record).

export interface PilotReceipt { recordId: number; pilot: PilotId; title: string; date: string; status: 'completed' | 'left'; value: RepValue; trace: { pilotRecordId: number } }
export function pilotReceipt(rec: PilotRecord): PilotReceipt {
  return { recordId: rec.id, pilot: rec.pilot, title: PILOT_TITLES[rec.pilot], date: rec.date, status: rec.status, value: valueOf(rec), trace: { pilotRecordId: rec.id } };
}

export type PilotMirrorFacts =
  | { kind: 'pilot_practised'; pilot: PilotId; completed: number; left: number }
  | { kind: 'pilot_latest'; pilot: PilotId; lines: string[] }
  | { kind: 'pilot_reweigh'; n: number; less: number; same: number; more: number; cantTell: number }
  | { kind: 'pilot_pull'; pull: string; label: string; sessions: number; of: number; attended: number; setAside: number; open: number; letBe: number; unknown: number }
  | { kind: 'pilot_set_aside'; pull: string; label: string; when: string; date: string }
  | { kind: 'pilot_sparse'; completed: number; needed: number }
  | { kind: 'pilot_unknown' };
export interface PilotMirrorStatement {
  id: string;
  section: 'practised' | 'said' | 'come_up' | 'carrying' | 'unknown';
  source: 'user_said' | 'observed' | 'unknown';
  text: string; facts: PilotMirrorFacts; trace: { pilotRecordIds: number[] }; provenance: 'exact'; date?: string;
}
export interface PilotMirror {
  state: 'empty' | 'sparse' | 'populated';
  statements: PilotMirrorStatement[];
  retention: { days: number; maxRecords: number; deviceOnly: true; synced: false };
  /** capabilities that are NOT active, so a renderer never implies them */
  inactive: string[];
}
export const SPARSE_MIN = 3;

const dayNumber = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

export function buildPilotMirror(records: PilotRecord[], today: string): PilotMirror {
  const statements: PilotMirrorStatement[] = [];
  const retention = { days: RETENTION_DAYS, maxRecords: MAX_RECORDS, deviceOnly: true as const, synced: false as const };
  const inactive = ['Reminders and due dates (nothing set aside is tracked as a task)', 'Account-level history (practice stays on this device and is not synced)', ...(!PILOT_CAPS.commitments ? ['Turning an exercise into a commitment'] : [])];
  if (!records.length) return { state: 'empty', statements, retention, inactive };

  const done = (p: PilotId) => records.filter((r) => r.pilot === p && r.status === 'completed');
  const leftN = (p: PilotId) => records.filter((r) => r.pilot === p && r.status === 'left').length;
  const totalDone = records.filter((r) => r.status === 'completed').length;

  for (const p of ['look_again', 'attend'] as PilotId[]) {
    const d = done(p), l = leftN(p); if (!d.length && !l) continue;
    statements.push({ id: `practised:${p}`, section: 'practised', source: 'observed', text: `${PILOT_TITLES[p]}: completed ${plural(d.length, 'time')}${l ? `, and left early ${times(l)}` : ''}.`, facts: { kind: 'pilot_practised', pilot: p, completed: d.length, left: l }, trace: { pilotRecordIds: records.filter((r) => r.pilot === p).map((r) => r.id) }, provenance: 'exact', date: records.filter((r) => r.pilot === p).slice(-1)[0].date });
    const latest = d[d.length - 1];
    if (latest) statements.push({ id: `latest:${p}`, section: 'said', source: 'user_said', text: `Your latest ${PILOT_TITLES[p]} (${latest.date}): ${valueOf(latest).established.join(' ')}`, facts: { kind: 'pilot_latest', pilot: p, lines: valueOf(latest).established }, trace: { pilotRecordIds: [latest.id] }, provenance: 'exact', date: latest.date });
  }

  // Counts across sessions only from SPARSE_MIN completed sessions of the same exercise, and always with numerator and denominator.
  const la = done('look_again') as LookAgainRecord[];
  const rw = la.filter((r) => r.facts.reweigh && r.facts.reweigh !== 'unknown' && r.facts.alternativesOffered > 0);
  if (rw.length >= SPARSE_MIN) {
    const c = (k: string) => rw.filter((r) => r.facts.reweigh === k).length;
    const f = { n: rw.length, less: c('less_certain'), same: c('same'), more: c('more_certain'), cantTell: c('cant_tell') };
    statements.push({ id: 'reweigh', section: 'come_up', source: 'observed', text: `After setting other readings beside your own, you said your first reading felt less certain ${times(f.less)}, about the same ${times(f.same)}, more certain ${times(f.more)}, and that you could not tell ${times(f.cantTell)} (${f.n} sessions).`, facts: { kind: 'pilot_reweigh', ...f }, trace: { pilotRecordIds: rw.map((r) => r.id) }, provenance: 'exact', date: rw[rw.length - 1].date });
  }
  const at = (done('attend') as AttendRecord[]).filter((r) => r.facts.outcome === 'arranged');
  for (const pull of PULLS) {
    const s = at.filter((r) => r.facts.pulls.includes(pull.id)); if (s.length < SPARSE_MIN) continue;
    const cnt = (d: string) => s.filter((r) => r.facts.dispositions.find((x) => x.pull === pull.id)?.disposition === d).length;
    const f = { pull: pull.id, label: pull.label, sessions: s.length, of: at.length, attended: cnt('attend_now'), setAside: cnt('set_aside'), open: cnt('leave_open'), letBe: cnt('let_be'), unknown: cnt('unknown') };
    statements.push({ id: `pull:${pull.id}`, section: 'come_up', source: 'observed', text: `“${pull.label}” was among what you named in ${f.sessions} of your ${f.of} Attend sessions. You attended to it ${times(f.attended)}, set it aside ${times(f.setAside)}, left it open ${times(f.open)}, and did nothing with it ${times(f.letBe)}.`, facts: { kind: 'pilot_pull', ...f }, trace: { pilotRecordIds: s.map((r) => r.id) }, provenance: 'exact', date: s[s.length - 1].date });
  }

  // Carrying: things the person set aside within the window and has not been asked about again. Never "overdue", never a task.
  const offered = new Set<string>(); for (const r of at) for (const c of r.facts.carriedIn) offered.add(`${c.fromRecord}:${c.pull}`);
  const seen = new Set<string>();
  for (const r of [...at].reverse()) { if (dayNumber(today) - dayNumber(r.date) > CARRY_WINDOW_DAYS) continue; for (const d of r.facts.dispositions) { if (d.disposition !== 'set_aside' || seen.has(d.pull) || offered.has(`${r.id}:${d.pull}`)) continue; seen.add(d.pull); const label = PULLS.find((x) => x.id === d.pull)?.label ?? d.pull; const when = WHEN_LABEL[d.when ?? 'no_time_set'];
    statements.push({ id: `set_aside:${r.id}:${d.pull}`, section: 'carrying', source: 'user_said', text: `You set aside “${label}” (${when.toLowerCase()}) on ${r.date}. It is not a task; it can be offered back once if you practise Attend again within ${CARRY_WINDOW_DAYS} days.`, facts: { kind: 'pilot_set_aside', pull: d.pull, label, when, date: r.date }, trace: { pilotRecordIds: [r.id] }, provenance: 'exact', date: r.date }); } }

  if (totalDone < SPARSE_MIN) statements.push({ id: 'sparse', section: 'unknown', source: 'unknown', text: `Counts across sessions start once you have completed ${SPARSE_MIN} sessions of the same exercise. Until then, only your own latest answers are shown.`, facts: { kind: 'pilot_sparse', completed: totalDone, needed: SPARSE_MIN }, trace: { pilotRecordIds: [] }, provenance: 'exact' });
  statements.push({ id: 'unknown', section: 'unknown', source: 'unknown', text: 'Mirar has not been told why any of this came up, or how it turned out afterwards.', facts: { kind: 'pilot_unknown' }, trace: { pilotRecordIds: [] }, provenance: 'exact' });
  return { state: totalDone >= SPARSE_MIN ? 'populated' : 'sparse', statements, retention, inactive };
}

/** Today integration: pilots are an optional second practice chosen by the person. The engine's one rep per day is untouched. */
export interface PilotOffer { pilot: PilotId; title: string; line: string; resume: boolean; carried: number }
export function pilotOffers(records: PilotRecord[], today: string, resume: PilotId | null): PilotOffer[] {
  const ctx = { today, caps: PILOT_CAPS, prior: records };
  const carried = carryCandidates(ctx).length;
  return [
    { pilot: 'look_again', title: PILOT_TITLES.look_again, line: 'Separate what happened from how you read it, then look at other possibilities. Leave the reason open if you like.', resume: resume === 'look_again', carried: 0 },
    { pilot: 'attend', title: PILOT_TITLES.attend, line: 'Decide where each pull on your attention goes. Doing nothing with something is a valid place.', resume: resume === 'attend', carried },
  ];
}
