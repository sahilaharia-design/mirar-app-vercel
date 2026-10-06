import { Domain, InsightRecord, Orientation } from '../../lib/innerRep/v2/types';
import { Rng } from './rng';

// Synthetic users. Each has a hidden "latent" life (what is really going on) and
// behavioural traits. The engine never sees the latent — only the answers.
export interface Latent { domains: Partial<Record<Domain, number>>; burden: number; orientation?: Orientation }
export interface Traits {
  unknownRate: number; skipRate: number; tapProb: number; orientTap: number; threadYes: number; abandon: number; notThisBias: number;
  commit: { done: number; partly: number; not_yet: number; changed_mind: number; dropped: number; unknown: number };
  timeframe: Record<'today' | 'tomorrow' | 'this_week' | 'specific_date' | 'none', number>;
  stanceBurden: number; acquiesce?: Domain; probeNothing?: boolean; commitBias?: number;
}
export type FB = 'accurate' | 'partly' | 'no' | 'unsure';
export interface Profile {
  id: string; name: string; days: number; seed: number; blurb: string;
  engage: (d: number, r: Rng) => boolean;
  latent: (d: number) => Latent;
  traits?: Partial<Traits>;
  eventDay?: number;
  settleDay?: number;          // day the user says a thread/event is settled
  feedback?: (i: InsightRecord, r: Rng) => FB | null;
}
export const DEFAULT_TRAITS: Traits = {
  unknownRate: 0.04, skipRate: 0.15, tapProb: 0.7, orientTap: 0.5, threadYes: 0.7, abandon: 0.02, notThisBias: 0.5,
  commit: { done: 0.5, partly: 0.15, not_yet: 0.15, changed_mind: 0.1, dropped: 0.05, unknown: 0.05 },
  timeframe: { today: 0.2, tomorrow: 0.3, this_week: 0.3, specific_date: 0.1, none: 0.1 },
  stanceBurden: 0.3,
};
const daily = () => true;
const calm: Latent = { domains: {}, burden: 0.05 };

export const PROFILES: Profile[] = [
  { id: 'stable', name: 'Stable and positive', days: 30, seed: 1, blurb: 'Energetic, connected, clear. No meaningful friction.', engage: daily, latent: () => calm, traits: { probeNothing: true } },
  { id: 'work_stress', name: 'Repeated work stress (work + future)', days: 30, seed: 2, blurb: 'Work is the real issue, pointed at the future.', engage: daily, latent: () => ({ domains: { work: 0.8 }, burden: 0.5, orientation: 'future' }), traits: { tapProb: 0.8 } },
  { id: 'relationship_conflict', name: 'Relationship conflict (partner + present)', days: 30, seed: 3, blurb: 'A fight on day 4 flagged as significant; settles around day 20.', engage: daily, eventDay: 4, settleDay: 20,
    latent: (d) => (d < 3 ? { domains: {}, burden: 0.1 } : d <= 18 ? { domains: { partner: 0.85 }, burden: 0.6, orientation: 'present' } : { domains: { partner: 0.1 }, burden: 0.1 }), traits: { tapProb: 0.9, threadYes: 0.9 } },
  { id: 'introspective_inactive', name: 'Introspective but inactive (self + uncertainty)', days: 30, seed: 4, blurb: 'Reflects a lot, rarely acts, often changes their mind.', engage: daily, latent: () => ({ domains: { self: 0.7 }, burden: 0.35, orientation: 'uncertainty' }),
    traits: { commit: { done: 0.08, partly: 0.1, not_yet: 0.3, changed_mind: 0.32, dropped: 0.1, unknown: 0.1 }, stanceBurden: 0.75 } },
  { id: 'family_past', name: 'Family + past', days: 30, seed: 5, blurb: 'Something from the past with family is still weighing.', engage: daily, latent: () => ({ domains: { family: 0.7 }, burden: 0.4, orientation: 'past' }) },
  { id: 'money_future', name: 'Money + future', days: 30, seed: 6, blurb: 'Money worry pointed at the future.', engage: daily, latent: () => ({ domains: { money: 0.75 }, burden: 0.45, orientation: 'future' }) },
  { id: 'body_present', name: 'Body/health + present', days: 30, seed: 7, blurb: 'Low energy; the body is the issue, right now.', engage: daily, latent: () => ({ domains: { body_health: 0.8 }, burden: 0.5, orientation: 'present' }) },
  { id: 'high_burden', name: 'High-burden period with a major event', days: 30, seed: 8, blurb: 'Days 6–16 are heavy: conflict, money and work at once, plus a flagged event.', engage: daily, eventDay: 6,
    latent: (d) => (d >= 6 && d <= 16 ? { domains: { work: 0.55, partner: 0.6, money: 0.4 }, burden: 0.9, orientation: 'present' } : { domains: {}, burden: 0.15 }), traits: { tapProb: 0.85 } },
  { id: 'dont_know', name: 'Frequently "I don\'t know"', days: 30, seed: 9, blurb: 'Answers "I don\'t know" or skips most of the time.', engage: daily, latent: () => ({ domains: { work: 0.5 }, burden: 0.3 }), traits: { unknownRate: 0.6, skipRate: 0.6, abandon: 0.1 } },
  { id: 'disagrees', name: 'Disagrees with Mirar', days: 30, seed: 10, blurb: 'Work is real, but answers "No" to every insight.', engage: daily, latent: () => ({ domains: { work: 0.75 }, burden: 0.5 }), feedback: () => 'no' },
  { id: 'every_2_3_days', name: 'Uses it every 2–3 days', days: 30, seed: 11, blurb: 'Irregular but steady use.', engage: (d) => d % 3 !== 1 && d % 5 !== 0, latent: (d) => (d < 15 ? { domains: { work: 0.7 }, burden: 0.5, orientation: 'future' } : { domains: {}, burden: 0.1 }) },
  { id: 'absence_week', name: 'One-week absence (days 10–16)', days: 30, seed: 12, blurb: 'Work thread, then a week away.', engage: (d) => d < 10 || d > 16, latent: () => ({ domains: { work: 0.7 }, burden: 0.5 }) },
  { id: 'sel_bias_A', name: 'Selection bias A: Focus served, Partner is the real issue', days: 30, seed: 13, blurb: 'Mirar starts with Focus; the real context is Partner.', engage: daily, latent: () => ({ domains: { partner: 0.9 }, burden: 0.6, orientation: 'present' }), traits: { tapProb: 0.95 } },
  { id: 'sel_bias_B', name: 'Selection bias B: asked about Work, says "not this"', days: 30, seed: 14, blurb: 'Work is touched on at the start; it is not what is on their mind.', engage: daily, latent: (d) => (d < 2 ? { domains: { work: 0.5 }, burden: 0.3 } : { domains: {}, burden: 0.15 }), traits: { notThisBias: 1 } },
  { id: 'sel_bias_C', name: 'Selection bias C: prompted Family answers only', days: 30, seed: 15, blurb: 'Picks Family whenever it is listed; never raises it, never taps chips.', engage: daily, latent: () => ({ domains: {}, burden: 0.3 }), traits: { acquiesce: 'family', tapProb: 0, probeNothing: true } },
  { id: 'committer', name: 'Makes many commitments (several due at once)', days: 30, seed: 26, blurb: 'Keeps naming small intentions, mostly for today or tomorrow, so several come due together.', engage: daily, latent: () => ({ domains: {}, burden: 0.15 }), traits: { commitBias: 8, probeNothing: true, timeframe: { today: 0.35, tomorrow: 0.4, this_week: 0.2, specific_date: 0.05, none: 0 }, commit: { done: 0.2, partly: 0.1, not_yet: 0.35, changed_mind: 0.15, dropped: 0.05, unknown: 0.15 } } },
  // ── 60-day
  { id: 'stable_60', name: 'Stable (60 days)', days: 60, seed: 21, blurb: 'Rest-frequency and catalog fatigue.', engage: daily, latent: () => calm, traits: { probeNothing: true } },
  { id: 'stable_blip', name: 'Stable, one passing worry', days: 30, seed: 25, blurb: 'Stable, but days 9–11 a work worry passes. Does Mirar build a thread out of a blip?', engage: daily, latent: (d) => (d >= 9 && d <= 11 ? { domains: { work: 0.7 }, burden: 0.4, orientation: 'present' } : calm), traits: { tapProb: 0.9, threadYes: 1 } },
  { id: 'work_stress_60', name: 'Work stress (60 days, eases from day 35)', days: 60, seed: 22, blurb: 'Long thread: does continuity become obsession?', engage: daily, latent: (d) => (d < 35 ? { domains: { work: 0.8 }, burden: 0.5, orientation: 'future' } : { domains: { work: 0.1 }, burden: 0.1 }) },
  { id: 'conflict_60', name: 'Relationship conflict (60 days)', days: 60, seed: 23, blurb: 'Conflict, repair, recurrence.', engage: daily, eventDay: 4, settleDay: 22,
    latent: (d) => (d < 3 ? { domains: {}, burden: 0.1 } : d <= 20 ? { domains: { partner: 0.85 }, burden: 0.6, orientation: 'present' } : d < 40 ? { domains: {}, burden: 0.1 } : d <= 50 ? { domains: { partner: 0.7 }, burden: 0.5, orientation: 'present' } : { domains: {}, burden: 0.1 }), traits: { tapProb: 0.9 } },
  { id: 'absence_month_60', name: 'One-month absence (days 15–48)', days: 60, seed: 24, blurb: 'A thread that mattered, then a month away.', engage: (d) => d < 15 || d > 48, latent: (d) => (d < 15 ? { domains: { partner: 0.85 }, burden: 0.6 } : { domains: {}, burden: 0.15 }), traits: { tapProb: 0.9 } },
];
