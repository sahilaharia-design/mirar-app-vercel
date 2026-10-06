import * as fs from 'fs';
import * as path from 'path';
import { PROFILES } from './profiles';
import { metrics, profileDoc } from './report';
import { runProfile } from './runner';

const out = path.join(__dirname, '../../docs/sim');
fs.mkdirSync(out, { recursive: true });
const all = PROFILES.map((p) => runProfile(p));
for (const r of all) fs.writeFileSync(path.join(out, `${r.profile.id}.md`), profileDoc(r));
const ms = all.map(metrics);
fs.writeFileSync(path.join(out, '_metrics.json'), JSON.stringify(ms, null, 1));
console.log('id'.padEnd(24), 'reps rest ctx% maxCtxRun maxThr tmpl repeat1 mechFat insights');
for (const m of ms) console.log(m.id.padEnd(24), String(m.reps).padStart(4), String(m.rest).padStart(4), String(Math.round(100 * ((m.layers.context ?? 0) + (m.layers.continuity ?? 0)) / Math.max(1, m.reps))).padStart(4), String(m.maxConsecutiveContext).padStart(8), String(m.maxThreadReps).padStart(6), String(m.templatesUsed).padStart(4), String(m.earliestExactRepeat ?? '-').padStart(7), String(m.earliestMechanismFatigue ?? '-').padStart(6), String(m.insights).padStart(7), JSON.stringify(m.commitments));
