// Writes review states to /tmp/mirar-scenarios.json (see review-builder.ts).
import * as fs from 'fs';
import { WANTS, build } from './review-builder';
(async () => { const out: any = {}; for (const w of WANTS) { const s = await build(w); out[w.name] = s; console.log(w.name.padEnd(18), s ? `${s.profile}#${s.seed} −${s.startOffsetDays}d → ${s.templateId}/${s.frame}${s.bound ? '[' + s.bound + ']' : ''}${(s as any).insightText ? '  INSIGHT: ' + (s as any).insightText.slice(0, 70) : ''}` : 'NOT FOUND'); } fs.writeFileSync('/tmp/mirar-scenarios.json', JSON.stringify(out)); })();
