/** Proposed frontend boundary, not an approved service/API or persistence implementation. */
export type ContinuityPhase = 'device' | 'ready' | 'paused' | 'syncing' | 'offline' | 'conflict' | 'recoverable' | 'recovering' | 'empty' | 'unavailable' | 'deleting' | 'deleted' | 'error' | 'reconsent' | 'kept_local' | 'account_removed' | 'device_cleared' | 'restored';
/** BackupView actions plus owner-supplied host capabilities. Missing capabilities must be false. */
export interface ContinuityActions {
 turnOn:boolean; turnOff:boolean; deleteBackedUp:boolean; exportFile:boolean; importFile:boolean;
 reviewDropped:boolean; chooseHistory:boolean; recover:boolean; clearDevice:boolean; retry:boolean; signOut:boolean;
}
export interface ContinuitySnapshot {
  consent: 'off' | 'declined' | 'on' | 'paused' | 'needs_reconsent';
  mayOfferCard: boolean;
  consentVersion?: string; // Version of the displayed disclosure; required to submit opt-in.
  actions: ContinuityActions;
  dropped?: { day:string; reason:'day_already_recorded'|'history_changed'|'account_chosen'|'unspecified' }[];
  droppedCount?: number;
  phase: ContinuityPhase;
  requestPending?: boolean;
  deviceSummary?: { events:number; throughDay?:string };
  accountSummary?: { events:number; throughDay?:string };
  enabled: boolean;
  accountCopy: 'none' | 'verified' | 'unknown';
  pending: number;
  lastConfirmedDay?: string; // Calendar day supplied by service, never invented by UI.
  scope: 'engine_only'; // Approved first scope; pilots remain device-local.
  fileTransferVerified: false; // No export/import action until implementation and verification are complete.
  deletionDisclosure?: string; // Qualified, verified provider retention wording. Required for release.
}
export type ContinuityIntent = 'enable' | 'disable' | 'retry' | 'recover' | 'keep_account' | 'keep_device' | 'export_then_account' | 'delete' | 'clear_device' | 'decline' | 'sign_out';
export interface ContinuityPort {
  snapshot: ContinuitySnapshot;
  request: (intent: ContinuityIntent, context?: {consentVersion:string}) => void; // An intent, never proof of success. Owner publishes next snapshot.
}
export const statusTitle: Record<ContinuityPhase,string> = {
  device:'Only on this device', ready:'Backed up to my account', paused:'Backup is off · account copy kept',
  syncing:'Backing up changes', offline:'Changes waiting on this device', conflict:'Two histories need your choice',
  recoverable:'An account copy is available', recovering:'Bringing back your practice', empty:'Backup on · no history yet',
  unavailable:'Backup cannot be checked', deleting:'Removing practice history', deleted:'Account history removed', error:'That change was not completed', reconsent:'Review backup consent', kept_local:'Some entries stay on this device', account_removed:'Account copy removed · backup off', device_cleared:'Device history cleared', restored:'Account practice restored',
};
export const statusDetail: Record<ContinuityPhase,string> = {
  device:'Practice stays here. Backup is optional; you can use Mirar without it.',
  ready:'Confirmed choices can be brought back when you sign in again.',
  paused:'New choices stay on this device. The earlier account copy is still there until you delete it.',
  syncing:'These changes are not confirmed in your account yet.',
  offline:'You can keep practising. Waiting changes are not yet confirmed in your account.',
  conflict:'Nothing has been replaced. Review both copies before choosing which history to use.',
  recoverable:'Nothing has been restored yet. Choose whether to bring the account history onto this device.',
  recovering:'Please wait for confirmation before relying on this device’s Mirror.',
  empty:'There are no confirmed practice records in your account yet.',
  unavailable:'We cannot confirm what is in your account. Your device copy has not been replaced.',
  deleting:'Deletion is not confirmed yet. Do not assume the account copy has gone.',
  deleted:'The account copy was removed. Backup is off. This device’s practice has been kept.',
  reconsent:'The backup disclosure has changed. New uploads are stopped until you choose again.',
  kept_local:'Some entries were not added to account history. They remain on this device; nothing is being silently discarded.',
  account_removed:'Backup is off. This device’s practice has been kept and will not be uploaded unless you choose to turn backup on again.',
  device_cleared:'Practice on this device has been cleared. This action did not delete account history.',
  restored:'Your supported account history is available on this device. Optional words and pilot practice were not restored.',
  error:'The requested change was not confirmed. You can check again when you are ready.',
};
