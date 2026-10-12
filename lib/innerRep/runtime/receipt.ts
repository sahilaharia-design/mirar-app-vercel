import { DOMAIN_PHRASE } from '../v2/templates';
import { State, Timeframe } from '../v2/types';
import { resolveSteps } from './step-resolver';

/**
 * TODAY'S RECEIPT — read model.
 *
 * The exact response the user gave in today's rep, rebuilt from structured state that is already stored (observations and
 * commitments). It exists so the receipt survives a reload without any new persistence and without the UI reading stored
 * blobs. Exact authored labels only. Never contains free text (none is stored), never an interpretation or insight.
 */
export interface ReceiptStep { prompt: string; choice: { kind: 'option'; label: string } | { kind: 'unknown' } | { kind: 'domain'; label: string } }
export interface Receipt {
  instanceId: number;
  /** ISO calendar date of the rep */
  date: string;
  templateId: string;
  steps: ReceiptStep[];
  /** present only when the user's chosen option created a commitment */
  commitment?: { label: string; timeframe: Timeframe; date?: string };
  trace: { instanceId: number; observationIds: number[]; commitmentId?: number };
}

const iso = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);

export function buildReceipt(s: State, today: number): Receipt | null {
  const inst = [...s.instances].reverse().find((i) => i.completed && !i.skippedAll && i.day === today);
  if (!inst) return null;
  const resolved = resolveSteps(s, inst, s.observations);
  const steps: ReceiptStep[] = resolved.map((r) => ({ prompt: r.prompt, choice: r.choice.kind === 'domain' ? { kind: 'domain', label: DOMAIN_PHRASE[r.choice.domain as keyof typeof DOMAIN_PHRASE] ?? r.choice.domain } : r.choice }));
  if (!steps.length) return null;
  const c = [...s.commitments].reverse().find((x) => x.createdDay === inst.day && !!x.label && x.events[0]?.by === 'user');
  return {
    instanceId: inst.id, date: iso(inst.day), templateId: inst.templateId, steps,
    ...(c ? { commitment: { label: c.label as string, timeframe: c.timeframe, ...(c.dueDate && c.timeframe === 'specific_date' ? { date: c.dueDate } : {}) } } : {}),
    trace: { instanceId: inst.id, observationIds: resolved.map((r) => r.observationId), ...(c ? { commitmentId: c.id } : {}) },
  };
}
