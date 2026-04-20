/**
 * Dev-only seeding utilities — never imported in production code.
 *
 * Seed strategy (avoids the process-checkin hang):
 *   1. Batch-upsert all N responses using a JWT-scoped Supabase client.
 *   2. Call compute-stage-scores once per stage — pure DB aggregation, no Anthropic.
 *
 * We create a one-off Supabase client with the JWT explicitly in the Authorization
 * header (same pattern as server-side edge functions). This guarantees auth.uid()
 * resolves correctly for RLS — no reliance on the singleton's internal session state.
 */
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const EDGE_TIMEOUT_MS = 20_000;

/**
 * Returns a guaranteed-fresh JWT and ensures the Supabase client's internal
 * state is updated (so subsequent supabase.from() DB calls also use the fresh token).
 *
 * Logic:
 *  - Read session from localStorage (no network).
 *  - If token is valid and not expiring within 60s → use it directly (fast path).
 *  - If token is expired or near expiry → call refreshSession() ONE TIME (network).
 *  - After refresh, the client internal state is updated so DB calls also pass RLS.
 */
async function getFreshToken(): Promise<{ token: string | null; error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { token: null, error: 'No active session — please log out and back in.' };
  }

  // Check if the access token expires within the next 60 seconds
  const expiresAt = session.expires_at ?? 0; // Unix epoch seconds
  const isExpiredOrExpiring = Date.now() / 1000 > expiresAt - 60;

  if (!isExpiredOrExpiring) {
    // Token is fresh — use it. The client internal state already has this token,
    // so direct supabase.from() calls will pass RLS.
    return { token: session.access_token, error: null };
  }

  // Token expired — refresh once. This also updates the client's internal state
  // so the next supabase.from() DB call uses the new access_token for RLS.
  const { data, error } = await supabase.auth.refreshSession();
  if (!error && data?.session?.access_token) {
    return { token: data.session.access_token, error: null };
  }

  return { token: null, error: 'Session expired — please log out and back in.' };
}

async function callEdgeFunction(name: string, body: object, token: string): Promise<{ error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text();
      return { error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { error: null };
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === 'AbortError') return { error: `Timed out after ${EDGE_TIMEOUT_MS / 1000}s` };
    return { error: e?.message ?? 'fetch failed' };
  }
}

export type SeedPattern = 'realistic' | 'aligned' | 'under_load' | 'mixed';
interface SeedResult { seeded: number; errors: string[] }

export async function seedCheckIns(
  userId: string,
  cycleId: string,
  days: number,
  pattern: SeedPattern = 'realistic',
  startDay = 1,
): Promise<SeedResult> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { token, error: tokenError } = await getFreshToken();
  if (!token) return { seeded: 0, errors: [tokenError ?? 'Auth failed'] };

  // ── Load questions with option points ────────────────────────────────────
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, stage, options(id, option_number, theme_1_level, theme_2_level)')
    .eq('active', true)
    .limit(60);

  if (qErr || !questions?.length) {
    return { seeded: 0, errors: ['Could not load questions: ' + (qErr?.message ?? 'empty')] };
  }

  // ── Build response rows + track stages ───────────────────────────────────
  const rows: object[] = [];
  const stagesCovered = new Set<number>();

  for (let i = 0; i < days; i++) {
    const dayNumber = startDay + i;
    if (dayNumber > 28) break;

    const stage = dayNumber <= 7 ? 1 : dayNumber <= 14 ? 2 : dayNumber <= 21 ? 3 : 4;
    stagesCovered.add(stage);

    const pool = questions.filter((q: any) => q.stage === stage || q.stage === 0);
    const q = (pool.length ? pool : questions)[Math.floor(Math.random() * (pool.length || questions.length))] as any;
    if (!q) continue;

    const opts = (q.options ?? []).sort((a: any, b: any) => a.option_number - b.option_number);
    if (!opts.length) continue;

    let opt: any;
    switch (pattern) {
      case 'aligned':    opt = opts.find((o: any) => o.theme_1_level === 'High') ?? opts[opts.length - 1]; break;
      case 'under_load': opt = opts.find((o: any) => o.theme_1_level === 'Low') ?? opts[0]; break;
      case 'mixed':      opt = i % 2 === 0 ? opts[0] : opts[opts.length - 1]; break;
      default:           opt = opts[Math.floor(Math.random() * opts.length)];
    }

    rows.push({ user_id: userId, cycle_id: cycleId, question_id: q.id, option_id: opt.id, day_number: dayNumber, journal_text: null });
  }

  if (!rows.length) return { seeded: 0, errors: ['No valid question/option combinations found'] };

  // ── Batch insert — use a JWT-scoped client so auth.uid() resolves for RLS ─
  // The singleton `supabase` client's internal session may not attach the JWT
  // to PostgREST headers reliably. Explicitly scoping the client guarantees it.
  const authedDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: insertErr } = await authedDb
    .from('responses')
    .upsert(rows as any, { onConflict: 'user_id,cycle_id,day_number', ignoreDuplicates: true });

  if (insertErr) return { seeded: 0, errors: [`Insert failed: ${insertErr.message}`] };

  // ── Compute stage scores (no Anthropic, pure DB aggregation) ────────────
  const stageList = Array.from(stagesCovered);
  const scoreResults = await Promise.all(
    stageList.map((stage) =>
      callEdgeFunction('compute-stage-scores', { user_id: userId, cycle_id: cycleId, stage }, token)
    )
  );

  const errors: string[] = scoreResults
    .map((r, idx) => r.error ? `Stage ${stageList[idx]} scores: ${r.error}` : null)
    .filter(Boolean) as string[];

  return { seeded: rows.length, errors };
}

export async function resetCycle(userId: string, _cycleId: string): Promise<{ error: string | null }> {
  const tables = ['alignment_scores', 'theme_scores', 'question_history', 'reports', 'responses'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) return { error: `${table}: ${error.message}` };
  }
  return { error: null };
}

export async function forceGenerateReport(userId: string, cycleId: string, stage: number): Promise<{ error: string | null }> {
  const { token, error: tokenError } = await getFreshToken();
  if (!token) return { error: tokenError ?? 'Auth failed' };
  return callEdgeFunction('generate-report', { user_id: userId, cycle_id: cycleId, stage }, token);
}
