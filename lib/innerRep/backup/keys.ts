import type { KV } from '../runtime/v2-runtime';
// Kept tiny and separate so sign-out can clear continuity state without importing the controller (flag-gated, see stores/inner-rep-v2-store.ts).
export const HISTORY_KEY_PREFIX = 'mirar_history_state_v1';
export async function clearHistoryKeys(kv: KV) { try { const keys = await kv.getAllKeys(); await Promise.all(keys.filter((k) => k === HISTORY_KEY_PREFIX || k.startsWith(HISTORY_KEY_PREFIX + ':')).map((k) => kv.removeItem(k))); } catch {} }
