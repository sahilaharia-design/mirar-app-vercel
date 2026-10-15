import { ConsentState, mayOffer } from './consent';

// ─── What the interface may say about backup: a typed, text-free read model (for Codex's presentation) ───────────────────────
// PURE. The presentation owns wording and layout within docs/experience/BACKUP_EXPERIENCE_BRIEF.md; this model only states FACTS
// about the current situation, so no screen can claim more than is true (for example "backed up" while events are waiting).
export type BackupHealth =
  | 'not_running'            // consent is not on: nothing is being copied
  | 'up_to_date'             // on, nothing waiting, nothing needs the person
  | 'waiting'                // on, N events not yet copied (normal for a moment; also the state after being offline)
  | 'offline'                // on, the last attempt could not reach the server; nothing lost, it will retry
  | 'needs_attention'        // on, some events were not kept because another device got there first; the person can see and export them
  | 'decision_required'      // this device and the account hold different histories; NOTHING has been changed until the person chooses
  | 'server_copy_removed';   // the account copy was deleted (here or on another device); backup is off until the person turns it on again
export interface ClientFacts { enabled: boolean; waiting: number; dropped: number; lastBackedUpDay: string | null; offline: boolean; pendingDecision: boolean; serverCopyRemoved: boolean }
export interface BackupView {
  consent: ConsentState['s'];
  health: BackupHealth;
  /** Whether the one-time, dismissible "Back up my practice?" card may be shown right now. */
  mayOfferCard: boolean;
  waiting: number; dropped: number;
  /** The last calendar day everything up to was copied; null when nothing has been. Never shown unless health is up_to_date. */
  lastBackedUpDay: string | null;
  /** Controls that are meaningful in this state (the presentation must not offer others). */
  actions: { turnOn: boolean; turnOff: boolean; deleteBackedUp: boolean; exportFile: boolean; importFile: boolean; reviewDropped: boolean; chooseHistory: boolean };
  /** What is true about storage, always shown with the controls. */
  disclosure: { storesText: false; storesTimeOfDay: false; deviceLocalWhenOff: true; deletionIsSeparateFromTurningOff: true };
}
export function backupView(consent: ConsentState, f: ClientFacts, today: string): BackupView {
  const on = consent.s === 'on';
  const health: BackupHealth = !on ? (f.serverCopyRemoved ? 'server_copy_removed' : 'not_running')
    : f.pendingDecision ? 'decision_required' : f.offline ? 'offline' : f.dropped > 0 ? 'needs_attention' : f.waiting > 0 ? 'waiting' : 'up_to_date';
  return {
    consent: consent.s, health, mayOfferCard: mayOffer(consent, today) && !f.serverCopyRemoved,
    waiting: on ? f.waiting : 0, dropped: f.dropped,
    lastBackedUpDay: health === 'up_to_date' ? f.lastBackedUpDay : null,
    actions: {
      turnOn: consent.s === 'off' || consent.s === 'declined' || consent.s === 'paused' || consent.s === 'needs_reconsent',
      turnOff: on, deleteBackedUp: on || consent.s === 'paused', exportFile: true, importFile: !on || health === 'decision_required',
      reviewDropped: f.dropped > 0, chooseHistory: health === 'decision_required',
    },
    disclosure: { storesText: false, storesTimeOfDay: false, deviceLocalWhenOff: true, deletionIsSeparateFromTurningOff: true },
  };
}
