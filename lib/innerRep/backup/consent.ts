import { CONSENT_VERSION } from './events';

// ─── Consent state machine for "Back up my practice" (pure; the host renders it) ─────────────────────────────────────────────
// Off by default. Sync is possible only in state 'on', which is reachable only by an explicit accept of the CURRENT consent text.
export type ConsentState =
  | { s: 'off' }                                                       // never turned on (default)
  | { s: 'declined'; until: string }                                   // said "Not now": not asked again before this day
  | { s: 'on'; version: string; since: string }
  | { s: 'paused'; version: string }                                   // turned off by the person; server data kept
  | { s: 'needs_reconsent'; version: string };                         // the consent wording changed since they accepted
export type ConsentAction =
  | { a: 'accept'; version: string; day: string } | { a: 'decline'; day: string } | { a: 'turn_off' } | { a: 'turn_on'; version: string; day: string }
  | { a: 'delete_data' } | { a: 'server_copy_removed' } | { a: 'consent_text_changed' } | { a: 'sign_out' };
export const DECLINE_QUIET_DAYS = 30;
const plusDays = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };

export function consentReduce(st: ConsentState, x: ConsentAction): ConsentState {
  switch (x.a) {
    case 'accept': return x.version === CONSENT_VERSION ? { s: 'on', version: x.version, since: x.day } : st;       // acceptance of any other wording is not consent
    case 'decline': return st.s === 'on' ? st : { s: 'declined', until: plusDays(x.day, DECLINE_QUIET_DAYS) };
    case 'turn_off': return st.s === 'on' ? { s: 'paused', version: st.version } : st;
    case 'turn_on': return (st.s === 'paused' || st.s === 'needs_reconsent') && x.version === CONSENT_VERSION ? { s: 'on', version: x.version, since: x.day } : st;
    case 'consent_text_changed': return st.s === 'on' || st.s === 'paused' ? (st.version === CONSENT_VERSION ? st : { s: 'needs_reconsent', version: st.version }) : st;
    case 'delete_data': case 'server_copy_removed': case 'sign_out': return { s: 'off' };
  }
}
export const canSync = (st: ConsentState) => st.s === 'on' && st.version === CONSENT_VERSION;
/** May the app show the one-time, dismissible "Back up my practice?" card? Never while on or paused; never within the quiet period after "Not now". */
export const mayOffer = (st: ConsentState, today: string) => st.s === 'off' || (st.s === 'declined' && today >= st.until);
/** What the person is told when they delete: two different acts with different consequences. */
export const DELETE_COPY = { turnOff: 'Turn off backup stops new copies. What is already backed up stays until you delete it.', delete: 'Delete my backed-up practice removes it from your account for good. It cannot be undone. Copies in the provider’s backups may remain for a limited time [period to be confirmed before release].' } as const;
