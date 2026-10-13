import type { KV } from '../runtime/v2-runtime';
// Kept separate from the pilot store so sign-out can clear pilot data without bundling any pilot content into builds where pilots are off.
export const PILOT_KEY_PREFIX = 'mirar_pilots_v1';
export async function clearPilotKeys(kv: KV) {
  try { const keys = await kv.getAllKeys(); await Promise.all(keys.filter((k) => k === PILOT_KEY_PREFIX || k.startsWith(PILOT_KEY_PREFIX + ':')).map((k) => kv.removeItem(k))); } catch {}
}
