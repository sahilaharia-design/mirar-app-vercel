import { PROFILES } from './profiles';
import { runProfile } from './runner';
const id = process.argv[2] ?? 'work_stress';
const res = runProfile(PROFILES.find((p) => p.id === id)!);
for (const l of res.logs) {
  if (!l.engaged) { console.log(`d${l.day} —`); continue; }
  const t = l.decision!.trace;
  console.log(`d${l.day} ${t.layer.padEnd(10)} ${t.selected.padEnd(34)} ${l.answers.map((a) => (a as any).optionId ?? (a as any).domain ?? (a as any).orientation ?? (a as any).timeframe ?? a.kind).join('>').padEnd(30)} ${l.insight ? '[INSIGHT] ' + l.insight.text.slice(0, 90) : ''}`);
}
