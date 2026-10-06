import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/with-timeout';
import { selectExercise, dayKey } from '../lib/innerRep/engine';
import { buildInsight, continuityCue, practiceDaysThisMonth } from '../lib/innerRep/evidence';
import { containsCrisisLanguage } from '../lib/innerRep/safety';
import { CATALOG_BY_ID } from '../lib/innerRep/catalog';
import { Exercise, Insight, RepAnswer, RepRecord } from '../lib/innerRep/types';

// History is the source of truth in Supabase (`inner_rep_responses`). A local
// copy (AsyncStorage) keeps Home working offline and holds any rep that failed
// to sync; pending reps are retried on the next load. One rep per calendar day.
// Keyed per user: a shared device must never show, or sync, someone else's reps.
const localKey = (userId: string) => `mirar_inner_reps_v1:${userId}`;

interface InnerRepState {
  history: RepRecord[];
  isLoaded: boolean;
  today: Exercise | null;
  doneToday: boolean;
  lastRecord: RepRecord | null;
  insight: Insight | null;
  practiceDays: number;
  cue: string | null;
  load: (userId: string) => Promise<void>;
  /** Returns { safety: true } and stores nothing if the free text trips the crisis check. */
  complete: (userId: string, answer: RepAnswer, durationMs?: number) => Promise<{ safety: boolean }>;
  giveFeedback: (userId: string, feedback: 'accurate' | 'partly' | 'no' | 'unsure') => Promise<void>;
}

const rowToRecord = (r: any): RepRecord => ({
  id: r.id,
  exerciseId: r.exercise_id,
  capacity: r.capacity,
  subCapacity: r.sub_capacity,
  interactionType: r.interaction_type,
  intensity: r.intensity,
  answer: r.answer ?? { unknown: true },
  completedAt: r.completed_at,
  safetyShown: r.safety_shown,
  insight: r.insight ?? null,
  insightFeedback: r.insight_feedback ?? null,
});

const recordToRow = (userId: string, r: RepRecord, durationMs?: number) => ({
  user_id: userId,
  exercise_id: r.exerciseId,
  capacity: r.capacity,
  sub_capacity: r.subCapacity,
  interaction_type: r.interactionType,
  intensity: r.intensity,
  answer: r.answer,
  safety_shown: !!r.safetyShown,
  duration_ms: durationMs ?? null,
  completed_at: r.completedAt,
  insight: r.insight ?? null,
});

async function readLocal(userId: string): Promise<{ records: RepRecord[]; pending: string[] }> {
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { records: [], pending: [] };
}
async function writeLocal(userId: string, records: RepRecord[], pending: string[]) {
  // records are newest-first: keep the newest 200
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify({ records: records.slice(0, 200), pending })); } catch {}
}

function derive(history: RepRecord[], now = new Date()) {
  const todayKey = dayKey(now);
  const todays = history.find((r) => dayKey(new Date(r.completedAt)) === todayKey) ?? null;
  const prior = history.filter((r) => r !== todays);
  return {
    doneToday: !!todays,
    lastRecord: todays,
    today: todays ? CATALOG_BY_ID[todays.exerciseId] ?? null : selectExercise(prior, now).exercise,
    insight: todays?.insight ?? null,
    practiceDays: practiceDaysThisMonth(history, now),
    cue: continuityCue(prior, now),
  };
}

export const useInnerRepStore = create<InnerRepState>((set, get) => ({
  history: [], isLoaded: false, today: null, doneToday: false, lastRecord: null, insight: null, practiceDays: 0, cue: null,

  load: async (userId) => {
    const local = await readLocal(userId);
    let remote: RepRecord[] = [];
    let remoteOk = false;
    try {
      const { data, error } = await withTimeout(
        supabase.from('inner_rep_responses').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(200)
      );
      if (!error && data) { remote = data.map(rowToRecord); remoteOk = true; }
    } catch {}

    // Retry reps that never synced.
    let pending = local.pending;
    if (remoteOk && pending.length) {
      const stillPending: string[] = [];
      for (const at of pending) {
        const rec = local.records.find((r) => r.completedAt === at);
        if (!rec || remote.some((r) => r.completedAt === at)) continue;
        try {
          const { error } = await withTimeout(supabase.from('inner_rep_responses').insert(recordToRow(userId, rec)));
          if (error) stillPending.push(at); else remote.push(rec);
        } catch { stillPending.push(at); }
      }
      pending = stillPending;
    }

    const merged = remoteOk
      ? [...remote, ...local.records.filter((l) => pending.includes(l.completedAt))]
      : [...local.records];
    merged.sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
    await writeLocal(userId, merged, pending);
    set({ history: merged, isLoaded: true, ...derive(merged) });
  },

  complete: async (userId, answer, durationMs) => {
    const { today, history } = get();
    if (!today || get().doneToday) return { safety: false };

    // Safety first: free text that trips the check is never stored.
    let safe = answer;
    let safety = false;
    if (answer.words && containsCrisisLanguage(answer.words)) {
      safe = { unknown: false };
      safety = true;
    }

    const now = new Date();
    const base: RepRecord = {
      exerciseId: today.id, capacity: today.capacity, subCapacity: today.sub_capacity,
      interactionType: today.interaction_type, intensity: today.intensity,
      answer: safe, completedAt: now.toISOString(), safetyShown: safety,
    };
    const insight = safety ? null : buildInsight([base, ...history], now);
    const record: RepRecord = { ...base, insight };

    const next = [record, ...history];
    let pending = (await readLocal(userId)).pending;
    try {
      const { data, error } = await withTimeout(
        supabase.from('inner_rep_responses').insert(recordToRow(userId, record, durationMs)).select('id').single()
      );
      if (error) throw error;
      record.id = (data as any)?.id;
    } catch {
      pending = [...pending, record.completedAt];
    }
    await writeLocal(userId, next, pending);
    set({ history: next, ...derive(next, now), lastRecord: record, insight });
    return { safety };
  },

  giveFeedback: async (userId, feedback) => {
    const { lastRecord, history } = get();
    if (!lastRecord) return;
    const updated = { ...lastRecord, insightFeedback: feedback };
    const next = history.map((r) => (r.completedAt === lastRecord.completedAt ? updated : r));
    set({ history: next, lastRecord: updated });
    await writeLocal(userId, next, (await readLocal(userId)).pending);
    if (lastRecord.id) {
      try { await withTimeout(supabase.from('inner_rep_responses').update({ insight_feedback: feedback }).eq('id', lastRecord.id).eq('user_id', userId)); } catch {}
    }
  },
}));
