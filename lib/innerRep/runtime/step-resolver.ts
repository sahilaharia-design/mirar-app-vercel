import { nextStep, StepAnswer } from '../v2/contracts';
import { V2 } from '../v2/config';
import { flowContext } from '../v2/state';
import { Instance, Observation, State } from '../v2/types';

/**
 * Resolves what the user was actually shown and chose for a stored instance, using the engine's own `nextStep`.
 * This is how exact prompts and labels are recovered for frames with their own option sets (lens, thread check,
 * resolution, commitment check) and for per-user prompt variants, instead of guessing from the base template.
 * Structured state only; no text exists to read.
 */
export interface ResolvedStep {
  observationId: number;
  prompt: string;
  choice: { kind: 'option'; label: string } | { kind: 'unknown' } | { kind: 'domain'; domain: string };
}

export function resolveSteps(s: State, inst: Instance, obs: Observation[]): ResolvedStep[] {
  const mine = obs.filter((o) => o.instanceId === inst.id);
  const ctx = { ...flowContext(s, inst.day, inst.templateId, inst.frame, inst.bound, V2, inst.variant ?? 0, inst.intentRef), captureCooledDown: true };
  const answers: StepAnswer[] = [];
  const out: ResolvedStep[] = [];
  for (let guard = 0; guard < 10; guard++) {
    const step = nextStep(ctx, answers); if (!step) break;
    const want = step.id === 'primary' ? 'primary' : step.id === 'follow_up' ? 'follow_up' : step.id === 'capture_domain' ? 'capture' : null;
    const o = want ? mine.find((x) => x.step === want) : undefined;
    if (step.type === 'choice' && o) {
      if (o.unknown) { out.push({ observationId: o.id, prompt: step.prompt, choice: { kind: 'unknown' } }); answers.push({ stepId: step.id, kind: 'unknown' } as StepAnswer); continue; }
      const op = step.options.find((x) => x.id === o.optionId);
      if (!op) break;
      out.push({ observationId: o.id, prompt: step.prompt, choice: { kind: 'option', label: op.label } });
      answers.push({ stepId: step.id, kind: 'option', optionId: op.id } as StepAnswer); continue;
    }
    if (step.id === 'capture_domain' && o?.domain && !o.unknown) {
      out.push({ observationId: o.id, prompt: step.prompt, choice: { kind: 'domain', domain: o.domain } });
      answers.push({ stepId: step.id, kind: 'domain', domain: o.domain } as StepAnswer); continue;
    }
    answers.push({ stepId: step.id, kind: 'skip' } as StepAnswer); // optional/unrecorded step: move on
  }
  return out;
}
