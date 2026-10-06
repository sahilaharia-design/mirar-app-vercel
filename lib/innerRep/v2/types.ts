// ─── Inner Rep v2: types ──────────────────────────────────────────────────────
// Pure data types. No React Native, no Supabase: the engine runs anywhere.
export type Capacity = 'direction' | 'energy' | 'focus' | 'relationships' | 'growth' | 'action';
export const CAPACITIES: Capacity[] = ['direction', 'energy', 'focus', 'relationships', 'growth', 'action'];

// DOMAIN: what part of life. ORIENTATION: where the issue points. Independent axes.
export const DOMAINS = ['work', 'partner', 'family', 'friends', 'self', 'body_health', 'money', 'time', 'technology', 'rest', 'other', 'unknown'] as const;
export type Domain = (typeof DOMAINS)[number];
export const ORIENTATIONS = ['past', 'present', 'future', 'uncertainty', 'none', 'unknown'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

/** 'issue' domains are evidence about what's weighing; 'resource' domains (what helped) are NOT. */
export type DomainRole = 'issue' | 'resource' | 'none';

export type Mechanism =
  | 'recognition' | 'inventory' | 'contrast' | 'attribution' | 'appreciation' | 'acknowledgment'
  | 'micro_commit' | 'reappraisal' | 'probe' | 'commitment_check' | 'thread_check' | 'event_check';

/** Who set the topic. Governs how much a domain observation can prove. */
export type Origin = 'prompted_choice' | 'prompted_text' | 'user_introduced' | 'thread_continuation' | 'commitment' | 'correction';

export type CommitKind = 'reach_out' | 'start' | 'finish' | 'decide' | 'rest' | 'other';

export interface Option {
  id: string;
  label: string;
  domain?: Domain;
  orientation?: Orientation;
  signal?: string;
  burden?: boolean;
  /** absent = an honest "not this / nothing" answer: counter-evidence, not missing data */
  polarity?: 'present' | 'absent';
  kind?: 'not_this' | 'nothing';
  stance?: { key: string; side: string; durable?: boolean };
  creates?: 'commitment';
  commitKind?: CommitKind;
  flagEvent?: boolean;
}

export type CaptureDomain = 'never' | 'if_burden' | 'if_present';
export type CaptureOrientation = 'never' | 'if_burden' | 'if_present';

export interface Template {
  id: string;
  version: 1;
  capacity: Capacity;
  sub_capacity: string;
  mechanism: Mechanism;
  interaction: 'choice' | 'compare' | 'words' | 'acknowledge' | 'probe' | 'check';
  role: 'training' | 'continuity' | 'probe' | 'presence';
  intensity: 'light' | 'medium';
  sensitivity: 'low' | 'medium';
  positiveCompatible: boolean;
  seconds: number;
  domainRole: DomainRole;
  prompt: string;
  options: Option[];
  followUp?: { prompt: string; options: Option[] };
  capture: { domain: CaptureDomain; orientation: CaptureOrientation };
  /** this template can host the capacity "lens" frame (a domain-bound test) */
  hasLens?: boolean;
  /** optional free-text step (never stored in this build) */
  words?: { prompt: string; maxChars: number };
  /** alternative wordings of the same question; chosen deterministically per user, never repeating back-to-back */
  promptVariants?: string[];
  tags: string[];
}

export type Frame = 'base' | 'lens' | 'thread_check' | 'resolution' | 'event_check' | 'commitment_check';

// ─── State ────────────────────────────────────────────────────────────────────
export interface Observation {
  id: number;
  day: number;
  instanceId: number;
  templateId: string;
  capacity: Capacity;
  mechanism: Mechanism;
  step: 'primary' | 'follow_up' | 'capture';
  optionId?: string;
  domain?: Domain;
  domainSource?: 'option' | 'user_tapped' | 'binding';
  domainOrigin?: Origin;
  orientation?: Orientation;
  signal?: string;
  polarity: 'present' | 'absent' | 'unknown';
  burden: boolean;
  unknown: boolean;
  domainRole: DomainRole;
  offeredDomains: Domain[];
  closedSet: boolean;
  stance?: { key: string; side: string; durable?: boolean };
  threadId?: number;
  isLens: boolean;
}

export interface Thread {
  id: number;
  kind: 'ongoing' | 'event';
  domain: Domain;
  orientation?: Orientation;
  state: 'candidate' | 'open' | 'resting' | 'dormant' | 'resolved';
  stateSource: 'engine' | 'user';
  openedDay: number;
  openedVia: 'user_introduced' | 'user_confirmed' | 'engine_candidate';
  lastConfirmedDay?: number;
  lastCheckDay?: number;
  checkDays: number[];
  negStreak: number;
  unknownStreak: number;
  restUntilDay?: number;
  restReason?: string;
  expiresDay?: number;
  eventAsks: number;
  resolutionOffered: boolean;
  cadenceMultiplier: number;
}

export type CommitStatus = 'open' | 'done' | 'partly_done' | 'postponed' | 'changed_mind' | 'dropped_on_purpose' | 'unconfirmed';
export type Timeframe = 'today' | 'tomorrow' | 'this_week' | 'specific_date' | 'none';
export interface Commitment {
  id: number;
  kind: CommitKind;
  domain?: Domain;
  timeframe: Timeframe;
  createdDay: number;
  dueDay?: number;
  status: CommitStatus;
  statusSource: 'user' | 'system';
  postponedUntil?: number;
  asks: number;
  lastAskDay?: number;
  noneRevisits: number;
  events: { day: number; from: CommitStatus | null; to: CommitStatus; by: 'user' | 'system' }[];
}

export type EvidenceKind =
  | 'repeated_signal' | 'cross_capacity_convergence' | 'change' | 'contradiction'
  | 'unresolved_thread' | 'follow_through' | 'resolution' | 'one_off_event';

export interface Evidence {
  key: string;
  kind: EvidenceKind;
  subject: string;
  independentN: number;
  promptedN: number;
  introducedN: number;
  continuationN: number;
  negativeN: number;
  unknownN: number;
  offeredN: number;
  presentOfferedN: number;
  capacities: Capacity[];
  days: number[];
  support: 'tentative' | 'supported';
  /** 'withheld' = evidence exists but must not be shown (e.g. user disagreed, no new evidence) */
  status: 'active' | 'withheld' | 'retired';
  note?: string;
}

export interface Refusal { kind: EvidenceKind; subject: string; reason: string }

export interface InsightRecord {
  id: number;
  day: number;
  evidenceKey: string;
  kind: EvidenceKind;
  tier: 'supported' | 'tentative' | 'hedged';
  text: string;
  snapshot: { independentN: number; introducedN: number; promptedN: number };
  feedback?: { day: number; value: 'accurate' | 'partly' | 'no' | 'unsure' };
}

export interface FeedbackMemory { key: string; noDay?: number; partlyDay?: number; unsureDay?: number; independentAtNo?: number }

export interface DomainState {
  negStreak: number;
  restUntilDay?: number;
  restReason?: string;
  lastLensDay: Partial<Record<Capacity, number>>;
  threadDeclinedUntil?: number;
  /** the user closed this domain; only what they say AFTER this day can make it active again */
  quietSince?: number;
}

export type Layer = 'continuity' | 'context' | 'training' | 'probe' | 'rest';

export interface Candidate {
  templateId: string;
  frame: Frame;
  bound?: Domain;
  layer: Layer;
  intent: string;
}

export interface TraceRejection { what: string; why: string }
export interface Trace {
  day: number;
  selected: string;
  layer: Layer;
  primaryReason: string;
  secondaryReasons: string[];
  constraints: { name: string; effect: string; overrode?: string }[];
  rejected: TraceRejection[];
  letRest: string[];
  domain?: Domain;
  orientation?: Orientation;
  openThreads: string[];
  dueCommitments: string[];
  activeDomains: string[];
  budget: { used: number; cap: number };
  restCheck?: string;
}

export interface Instance {
  id: number;
  day: number;
  templateId: string;
  frame: Frame;
  bound?: Domain;
  capacity: Capacity;
  mechanism: Mechanism;
  intensity: 'light' | 'medium';
  layer: Layer;
  intent: string;
  intentRef?: number;
  trace: Trace;
  variant?: number;
  completed: boolean;
  unknownPrimary: boolean;
  burden: boolean;
  skippedAll: boolean;
}

export interface State {
  day: number;
  instances: Instance[];
  observations: Observation[];
  threads: Thread[];
  commitments: Commitment[];
  insights: InsightRecord[];
  feedbackMem: Record<string, FeedbackMemory>;
  domainState: Partial<Record<Domain, DomainState>>;
  restDays: number[];
  lastProbeInstance?: number;
  lastCaptureDay?: number;
  /** stable per-user number; makes tie-breaks and wording rotation differ between users but never within one */
  userSeed: number;
  seq: { obs: number; inst: number; thread: number; commit: number; insight: number };
}
