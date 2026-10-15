/** Proposed frontend boundary, not an approved service/API or persistence implementation. */
export type ContinuityPhase = 'device' | 'ready' | 'paused' | 'syncing' | 'offline' | 'conflict' | 'recoverable' | 'recovering' | 'empty' | 'unavailable' | 'deleting' | 'deleted' | 'error';
export interface ContinuitySnapshot {
  phase: ContinuityPhase;
  requestPending?: boolean;
  deviceSummary?: { completedReps:number; throughDay:string };
  accountSummary?: { completedReps:number; throughDay:string };
  enabled: boolean;
  accountCopy: 'none' | 'verified' | 'unknown';
  pending: number;
  lastConfirmedDay?: string; // Calendar day supplied by service, never invented by UI.
  scope: 'engine_only' | 'engine_and_pilots';
  canExport: boolean;
  deletionDisclosure?: string; // Qualified, verified provider retention wording. Required for release.
}
export type ContinuityIntent = 'enable' | 'disable' | 'retry' | 'recover' | 'keep_account' | 'keep_device' | 'export_then_account' | 'delete' | 'sign_out';
export interface ContinuityPort {
  snapshot: ContinuitySnapshot;
  request: (intent: ContinuityIntent) => void; // An intent, never proof of success. Owner publishes next snapshot.
}
export const statusTitle: Record<ContinuityPhase,string> = {
  device:'Only on this device', ready:'Backed up to my account', paused:'Backup is off · account copy kept',
  syncing:'Backing up changes', offline:'Changes waiting on this device', conflict:'Two histories need your choice',
  recoverable:'An account copy is available', recovering:'Bringing back your practice', empty:'Backup on · no history yet',
  unavailable:'Backup cannot be checked', deleting:'Removing practice history', deleted:'History removed', error:'That change was not completed',
};
export const statusDetail: Record<ContinuityPhase,string> = {
  device:'Practice stays here. Backup is optional; you can use Mirar without it.',
  ready:'Confirmed choices can be brought back when you sign in again.',
  paused:'New choices stay on this device. The earlier account copy is still there until you delete it.',
  syncing:'These changes are not confirmed in your account yet.',
  offline:'You can keep practising. Waiting changes have not reached your account.',
  conflict:'Nothing has been replaced. Review both copies before choosing which history to use.',
  recoverable:'Nothing has been restored yet. Choose whether to bring the account history onto this device.',
  recovering:'Please wait for confirmation before relying on this device’s Mirror.',
  empty:'There are no confirmed practice records in your account yet.',
  unavailable:'We cannot confirm what is in your account. Your device copy has not been replaced.',
  deleting:'Deletion is not confirmed yet. Do not assume the account copy has gone.',
  deleted:'The requested account history and this device’s copy have been removed.',
  error:'Your previous choice still applies. Try again when you are ready.',
};
