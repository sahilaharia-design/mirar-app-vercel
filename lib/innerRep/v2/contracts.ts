import { Domain, Frame, Option, Orientation, Template } from './types';
import { DOMAIN_PHRASE, LENS_OPTIONS, LENS_PROMPT } from './templates';
import { V2 } from './config';

// ─── Response / interaction contracts ─────────────────────────────────────────
// The engine is the brain, the UI is a dumb renderer. The engine serves a
// RepPayload, then the UI loops: render `nextStep(...)`, collect a StepAnswer,
// repeat until it returns null, then submit everything. The UI never decides
// what to ask, never infers anything, and never stores raw text.

export interface StepOption { id: string; label: string }

export type Step =
  | { id: 'primary' | 'follow_up'; type: 'choice'; prompt: string; layout: 'list' | 'compare'; options: StepOption[]; allowUnknown: true }
  | { id: 'words'; type: 'words'; prompt: string; maxChars: number; optional: true; saved: false; safetyCheck: true }
  | { id: 'capture_domain'; type: 'domain_chips'; prompt: string; domains: Domain[]; optional: true }
  /** DISABLED in the MVP: never emitted while V2.orientation.enabled is false. Safe for the UI to ignore. */
  | { id: 'capture_orientation'; type: 'orientation_chips'; prompt: string; orientations: Orientation[]; optional: true }
  | { id: 'timeframe'; type: 'timeframe'; prompt: string; options: ('today' | 'tomorrow' | 'this_week' | 'pick_date' | 'none')[]; optional: true }
  | { id: 'thread_offer'; type: 'yes_no'; prompt: string; domain: Domain; optional: true };

export type StepAnswer =
  | { stepId: string; kind: 'option'; optionId: string }
  | { stepId: string; kind: 'unknown' }          // "I don't know" — always available on a choice step
  | { stepId: string; kind: 'skip' }             // any optional step can be skipped
  | { stepId: string; kind: 'domain'; domain: Domain }
  | { stepId: string; kind: 'orientation'; orientation: Orientation }
  | { stepId: string; kind: 'timeframe'; timeframe: 'today' | 'tomorrow' | 'this_week' | 'specific_date' | 'none'; inDays?: number }
  | { stepId: string; kind: 'yes' | 'no' }
  | { stepId: string; kind: 'words' };            // text itself is deliberately NOT part of the contract

export interface RepPayload {
  instanceId: number;
  templateId: string;
  frame: Frame;
  bound?: Domain;
  capacityLabel: string;
  intensity: 'light' | 'medium';
  estimatedSeconds: number;
  /** the user can always leave without answering */
  dismissible: true;
}

export const DOMAIN_CHIP_LABEL: Record<Domain, string> = {
  work: 'Work', partner: 'Partner', family: 'Family', friends: 'Friends', self: 'Myself', body_health: 'Body or health',
  money: 'Money', time: 'Time', technology: 'Technology', rest: 'Rest', other: 'Something else', unknown: 'Not sure',
};

/** Options for the primary step of a given frame (the single source of truth for the UI and the simulator). */
export function primaryOptions(t: Template, frame: Frame, bound?: Domain, variant = 0): { prompt: string; options: Option[]; layout: 'list' | 'compare' } {
  if (frame === 'lens' && bound) return { prompt: LENS_PROMPT[t.capacity](DOMAIN_PHRASE[bound]), options: LENS_OPTIONS(bound), layout: 'list' };
  if (frame === 'thread_check' && bound) return { prompt: `Is ${DOMAIN_PHRASE[bound]} still weighing on you?`, options: t.options.map((x) => ({ ...x, domain: bound })), layout: 'list' };
  if (frame === 'resolution' && bound) return {
    prompt: `Does the thing about ${DOMAIN_PHRASE[bound]} feel settled?`,
    options: [{ id: 'settled', label: 'Yes, it feels settled', domain: bound, polarity: 'absent', kind: 'nothing' }, { id: 'mostly', label: 'Mostly', domain: bound, polarity: 'absent' }, { id: 'not_yet', label: 'Not yet', domain: bound, polarity: 'present' }],
    layout: 'list',
  };
  if (frame === 'event_check' && bound) return { prompt: t.prompt, options: t.options.map((x) => ({ ...x, domain: bound })), layout: 'list' };
  const prompt = t.promptVariants && t.promptVariants.length ? t.promptVariants[variant % t.promptVariants.length] : t.prompt;
  return { prompt, options: t.options, layout: t.interaction === 'compare' ? 'compare' : 'list' };
}

export interface FlowContext {
  template: Template;
  frame: Frame;
  bound?: Domain;
  /** which wording of the question to show (engine-chosen; the UI never picks) */
  variant?: number;
  /** engine-provided facts the flow needs (no UI logic) */
  captureCooledDown: boolean;
  openThreadDomains: Domain[];
  threadDeclinedDomains: Domain[];
}

export function chosenOption(ctx: FlowContext, answers: StepAnswer[]): Option | 'unknown' | null {
  const a = answers.find((x) => x.stepId === 'primary');
  if (!a) return null;
  if (a.kind === 'unknown' || a.kind === 'skip') return 'unknown';
  if (a.kind !== 'option') return null;
  return primaryOptions(ctx.template, ctx.frame, ctx.bound, ctx.variant).options.find((x) => x.id === a.optionId) ?? null;
}

/** Deterministic step machine. Returns null when the rep is complete. */
export function nextStep(ctx: FlowContext, answers: StepAnswer[]): Step | null {
  const t = ctx.template;
  const has = (id: string) => answers.some((a) => a.stepId === id);
  const answered = (id: string) => answers.find((a) => a.stepId === id);
  const prim = primaryOptions(t, ctx.frame, ctx.bound, ctx.variant);

  if (!has('primary')) return { id: 'primary', type: 'choice', prompt: prim.prompt, layout: prim.layout, options: prim.options.map(({ id, label }) => ({ id, label })), allowUnknown: true };
  const chosen = chosenOption(ctx, answers);
  if (chosen === 'unknown' || chosen === null) return null; // "I don't know" ends the rep: nothing else is asked

  const isBase = ctx.frame === 'base';
  const absent = chosen.polarity === 'absent';

  if (isBase && t.words && !absent && !has('words')) return { id: 'words', type: 'words', prompt: t.words.prompt, maxChars: t.words.maxChars, optional: true, saved: false, safetyCheck: true };

  if (isBase && t.followUp && !absent && !has('follow_up'))
    return { id: 'follow_up', type: 'choice', prompt: t.followUp.prompt, layout: 'list', options: t.followUp.options.map(({ id, label }) => ({ id, label })), allowUnknown: true };

  // Domain capture: only when the exercise supports it, the answer warrants it, the option didn't already name a domain, and not asked recently.
  const needsDomain = !chosen.domain || chosen.domain === 'unknown';
  const wantsDomain = t.capture.domain === 'if_burden' ? !!chosen.burden : t.capture.domain === 'if_present' ? !absent : false;
  const eventFlag = !!chosen.flagEvent;
  if (isBase && (eventFlag || (wantsDomain && needsDomain)) && ctx.captureCooledDown && !has('capture_domain'))
    return { id: 'capture_domain', type: 'domain_chips', prompt: "What's this mostly connected to?", domains: ['work', 'partner', 'family', 'friends', 'self', 'body_health', 'money', 'time', 'technology', 'other'], optional: true };

  const domainNow = chosen.domain && chosen.domain !== 'unknown' ? chosen.domain : (() => { const d = answered('capture_domain'); return d && d.kind === 'domain' ? d.domain : undefined; })();
  const orientationOn = V2.orientation.enabled; // MVP: off — never asked
  const wantsOrientation = orientationOn && t.capture.orientation === 'if_burden' ? !!chosen.burden : t.capture.orientation === 'if_present' ? !absent : false;
  if (isBase && wantsOrientation && !chosen.orientation && (domainNow || t.role === 'probe') && (ctx.captureCooledDown || has('capture_domain')) && !has('capture_orientation'))
    return { id: 'capture_orientation', type: 'orientation_chips', prompt: 'Is it more about…', orientations: ['past', 'present', 'future', 'uncertainty', 'none'], optional: true };

  if (isBase && chosen.creates === 'commitment' && !has('timeframe'))
    return { id: 'timeframe', type: 'timeframe', prompt: 'When would you like to do it?', options: ['today', 'tomorrow', 'this_week', 'pick_date', 'none'], optional: true };
  if (ctx.frame === 'commitment_check' && chosen.id === 'not_yet' && !has('timeframe'))
    return { id: 'timeframe', type: 'timeframe', prompt: 'When should I ask again?', options: ['tomorrow', 'this_week', 'pick_date', 'none'], optional: true };

  // Thread offer: the user raised a domain themselves (open chips/probe) and it carries weight.
  const introduced = !!answered('capture_domain') || t.role === 'probe';
  const weighty = !!chosen.burden || eventFlag || t.role === 'probe';
  const offerDomain = ctx.frame === 'lens' ? (chosen.id === 'a_lot' ? ctx.bound : undefined) : domainNow;
  const offerOk = ctx.frame === 'lens' ? !!offerDomain : (isBase && introduced && weighty && !absent && !eventFlag && !!offerDomain);
  if (offerOk && offerDomain && !ctx.openThreadDomains.includes(offerDomain) && !ctx.threadDeclinedDomains.includes(offerDomain) && !has('thread_offer'))
    return { id: 'thread_offer', type: 'yes_no', prompt: 'Want Mirar to check in on this now and then? You can stop any time.', domain: offerDomain, optional: true };
  // When the user agrees to a check-in, ask once which way it points (thread-level orientation: past / present / future / uncertainty).
  const offer = answered('thread_offer');
  if (orientationOn && offer && offer.kind === 'yes' && !chosen.orientation && !has('capture_orientation'))
    return { id: 'capture_orientation', type: 'orientation_chips', prompt: 'Is it more about…', orientations: ['past', 'present', 'future', 'uncertainty', 'none'], optional: true };
  void V2;
  return null;
}
