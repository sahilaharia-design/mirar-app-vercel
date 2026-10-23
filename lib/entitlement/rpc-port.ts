import type { Ent, EntServerPort, EntState, Reply } from './client';

// Maps the two Supabase RPCs of docs/proposed/entitlement/001_entitlement.sql to the client's EntServerPort.
// `rpc` is injected (supabase.rpc bound by the store) so this file has no SDK import and is testable in Node.
// The server returns ISO timestamps; the client works in epoch milliseconds. Neither RPC takes arguments.
export type RpcResult = { data: unknown; error: { message?: string; code?: string; status?: number } | null };
export type Rpc = (fn: 'entitlement_get' | 'entitlement_first_rep_completed') => Promise<RpcResult>;

const STATES: EntState[] = ['new', 'trialing', 'trial_expired', 'comped'];
const ms = (v: unknown): number | null => { if (v == null) return null; const t = Date.parse(String(v)); return Number.isFinite(t) ? t : NaN; };

export function parseEntitlement(x: unknown): Ent | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (!STATES.includes(o.state as EntState)) return null;
  const start = ms(o.trial_started_at), end = ms(o.trial_ends_at), now = ms(o.server_now);
  if ((start !== null && Number.isNaN(start)) || (end !== null && Number.isNaN(end)) || now === null || Number.isNaN(now)) return null;
  const version = Number(o.version); if (!Number.isFinite(version)) return null;
  return { state: o.state as EntState, trial_started_at: start, trial_ends_at: end, server_now: now, version };
}

const classify = (e: NonNullable<RpcResult['error']> | unknown): 'offline' | 'unavailable' | 'unauthenticated' => {
  const err = (e ?? {}) as { message?: string; code?: string; status?: number };
  const m = String(err.message ?? '').toLowerCase();
  if (err.code === '28000' || err.status === 401 || err.status === 403 || m.includes('not authenticated') || m.includes('jwt')) return 'unauthenticated';
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to load') || m.includes('timeout') || m.includes('timed out') || err.status === 0) return 'offline';
  return 'unavailable';
};

export function createRpcPort(rpc: Rpc): EntServerPort {
  const call = async (fn: 'entitlement_get' | 'entitlement_first_rep_completed'): Promise<Reply> => {
    let r: RpcResult;
    try { r = await rpc(fn); } catch (e) { return { ok: false, kind: classify(e) === 'unauthenticated' ? 'unauthenticated' : 'offline' }; }   // a thrown call is a transport failure
    if (r.error) return { ok: false, kind: classify(r.error) };
    const ent = parseEntitlement(r.data);
    return ent ? { ok: true, ent } : { ok: false, kind: 'unavailable' };                                                                         // never trust a malformed reply
  };
  return { get: () => call('entitlement_get'), firstRep: () => call('entitlement_first_rep_completed') };
}
